import { inject, Injectable } from "@angular/core";

import { HostsApiService } from "./api/hosts-api.service";
import { NodesApiService } from "./api/nodes-api.service";
import { ConfigProfilesApiService } from "./api/config-profiles-api.service";
import { DnsService } from "./dns.service";
import { LogEntry } from "../components/log-viewer/log-viewer.component";

// ---------------------------------------------------------------------------
// XRay config types (for parsing the untyped `config` field)
// ---------------------------------------------------------------------------

export interface XRayConfig {
    outbounds?: XRayOutbound[];
    routing?: { rules?: XRayRoutingRule[] };
}

export interface XRayOutbound {
    tag?: string;
    protocol?: string;
    settings?: {
        vnext?: {
            address: string;
            port: number;
            users?: { id: string }[];
        }[];
        servers?: { address: string; port: number }[];
    };
}

export interface XRayRoutingRule {
    type?: string;
    outboundTag?: string;
    inboundTag?: string[];
    user?: string[];
}

// ---------------------------------------------------------------------------
// Chain detection result types
// ---------------------------------------------------------------------------

export interface ChainHost {
    uuid: string;
    remark: string;
    address: string;
    port: number;
    vlessRouteId: number;
}

export interface ChainOutbound {
    tag: string;
    protocol: string;
    address: string;
    port: number;
}

export interface ChainNodeHop {
    uuid: string;
    name: string;
    address: string;
    countryCode: string;
    outbound: ChainOutbound | null;
}

export interface ProxyChain {
    id: string;
    host: ChainHost;
    hops: ChainNodeHop[];
}

export interface ChainDetectionResult {
    chains: ProxyChain[];
    warnings: string[];
    logs: LogEntry[];
}

// ---------------------------------------------------------------------------
// Internal helper types (subset of API response fields we actually use)
// ---------------------------------------------------------------------------

interface HostData {
    uuid: string;
    remark: string;
    address: string;
    port: number;
    vlessRouteId: number | null;
    nodes: string[];
    inbound: {
        configProfileUuid: string | null;
        configProfileInboundUuid: string | null;
    };
}

interface NodeData {
    uuid: string;
    name: string;
    address: string;
    countryCode: string;
    configProfile: {
        activeConfigProfileUuid: string | null;
    };
}

interface ConfigData {
    uuid: string;
    name: string;
    config?: unknown;
}

// ---------------------------------------------------------------------------
// Protocols that never form chain links
// ---------------------------------------------------------------------------

const SKIP_PROTOCOLS = new Set(["freedom", "blackhole", "dns"]);

// ---------------------------------------------------------------------------
// Simple log collector
// ---------------------------------------------------------------------------

class LogCollector {
    readonly entries: LogEntry[] = [];

    info(msg: string): void {
        this.entries.push({ level: "info", message: msg });
    }
    debug(msg: string): void {
        this.entries.push({ level: "debug", message: msg });
    }
    warn(msg: string): void {
        this.entries.push({ level: "warn", message: msg });
    }
    error(msg: string): void {
        this.entries.push({ level: "error", message: msg });
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable({ providedIn: "root" })
export class ProxyChainService {
    private hostsApi = inject(HostsApiService);
    private nodesApi = inject(NodesApiService);
    private configProfilesApi = inject(ConfigProfilesApiService);
    private dns = inject(DnsService);

    async detectChains(
        onStatus?: (status: string) => void
    ): Promise<ChainDetectionResult> {
        const warnings: string[] = [];
        const log = new LogCollector();

        // ---- 1. Fetch all data in parallel --------------------------------
        onStatus?.("Fetching hosts, nodes, and config profiles\u2026");
        log.info("Fetching hosts, nodes, and config profiles\u2026");

        const [hostsRes, nodesRes, configsRes] = await Promise.all([
            this.hostsApi.getAll(),
            this.nodesApi.getAll(),
            this.configProfilesApi.getAll(),
        ]);

        const hosts: HostData[] = hostsRes.response;
        const nodes: NodeData[] = nodesRes.response;
        const configs: ConfigData[] =
            configsRes.response.configProfiles;

        log.info(
            `Fetched ${hosts.length} hosts, ${nodes.length} nodes, ${configs.length} config profiles.`
        );

        // ---- 2. Filter hosts that participate in chaining -----------------
        const chainHosts = hosts.filter(
            (h) => h.vlessRouteId != null
        );
        log.info(
            `${chainHosts.length} of ${hosts.length} hosts have a VLESS route ID.`
        );

        if (chainHosts.length === 0) {
            log.warn("No hosts with a VLESS route ID — nothing to detect.");
            return {
                chains: [],
                warnings: [
                    "No hosts with a VLESS route ID were found.",
                ],
                logs: log.entries,
            };
        }

        for (const h of chainHosts) {
            log.debug(
                `Host "${h.remark}" address=${h.address} port=${h.port} vlessRouteId=${h.vlessRouteId}`
            );
        }

        // ---- 3. Fetch computed configs for each profile --------------------
        const profileUuids = new Set<string>();
        for (const n of nodes) {
            const id = n.configProfile?.activeConfigProfileUuid;
            if (id) profileUuids.add(id);
        }

        log.info(
            `${profileUuids.size} unique config profile(s) in use by nodes. Fetching computed configs\u2026`
        );
        onStatus?.("Fetching computed config profiles\u2026");

        const configMap = new Map<string, XRayConfig>();
        const configNameMap = new Map<string, string>();
        for (const c of configs) {
            configNameMap.set(c.uuid, c.name);
        }

        const computedResults = await Promise.allSettled(
            [...profileUuids].map(async (uuid) => {
                const res =
                    await this.configProfilesApi.getComputedByUuid(
                        uuid
                    );
                return { uuid, profile: res.response };
            })
        );

        for (const r of computedResults) {
            if (r.status === "fulfilled") {
                const { uuid, profile } = r.value;
                const xray = profile.config as
                    | XRayConfig
                    | null;
                const name =
                    configNameMap.get(uuid) ?? profile.name ?? uuid;
                if (xray) {
                    configMap.set(uuid, xray);
                    const obAddrs =
                        this.collectOutboundAddresses(xray);
                    log.debug(
                        `Computed config "${name}" (${uuid}): ${xray.outbounds?.length ?? 0} outbounds, ${xray.routing?.rules?.length ?? 0} routing rules, ${obAddrs.length} outbound server addresses.`
                    );
                } else {
                    log.debug(
                        `Computed config "${name}" (${uuid}): empty config body.`
                    );
                }
            } else {
                log.warn(
                    `Failed to fetch computed config for profile ${r.reason}`
                );
            }
        }

        // ---- 4. Collect domains & resolve DNS -----------------------------
        onStatus?.("Resolving domain addresses\u2026");

        const domainsToResolve = new Set<string>();
        for (const h of chainHosts) domainsToResolve.add(h.address);
        for (const n of nodes) domainsToResolve.add(n.address);
        for (const xray of configMap.values()) {
            for (const addr of this.collectOutboundAddresses(xray)) {
                domainsToResolve.add(addr.address);
            }
        }

        log.info(
            `Resolving ${domainsToResolve.size} unique domain(s)\u2026`
        );

        const dnsMap = await this.dns.resolveAll([
            ...domainsToResolve,
        ]);

        for (const [domain, ips] of dnsMap) {
            if (ips.length > 0) {
                log.debug(`DNS ${domain} \u2192 ${ips.join(", ")}`);
            } else {
                log.debug(`DNS ${domain} \u2192 (no A records)`);
            }
        }

        // ---- 5. Build lookup maps -----------------------------------------
        const nodeByUuid = new Map<string, NodeData>();
        const nodesByIp = new Map<string, NodeData[]>();

        for (const node of nodes) {
            nodeByUuid.set(node.uuid, node);
            const hostname = this.dns.extractHostname(node.address);
            const ips = this.dns.isIpAddress(hostname)
                ? [hostname]
                : (dnsMap.get(hostname) ?? []);
            for (const ip of ips) {
                const bucket = nodesByIp.get(ip) ?? [];
                bucket.push(node);
                nodesByIp.set(ip, bucket);
            }
        }

        log.info(
            `Built IP lookup with ${nodesByIp.size} unique IP(s) mapping to nodes.`
        );

        // ---- 6. Build chains ----------------------------------------------
        onStatus?.("Analyzing proxy chains\u2026");
        log.info("--- Starting chain analysis ---");
        const chains: ProxyChain[] = [];

        for (const host of chainHosts) {
            log.info(
                `\u25B6 Processing host "${host.remark}" (${host.address}:${host.port}, routeId=${host.vlessRouteId})`
            );

            const entryNode = this.findEntryNode(
                host,
                nodeByUuid,
                nodesByIp,
                dnsMap,
                log
            );

            if (!entryNode) {
                const msg =
                    `Host "${host.remark}" (${host.address}): ` +
                    "could not match to any node.";
                warnings.push(msg);
                log.warn(msg);
                continue;
            }

            log.info(
                `  Entry node: "${entryNode.name}" (${entryNode.address})`
            );

            const hops: ChainNodeHop[] = [];
            const visited = new Set<string>();
            let current: NodeData | undefined = entryNode;

            while (current && !visited.has(current.uuid)) {
                visited.add(current.uuid);

                const cfgUuid =
                    current.configProfile?.activeConfigProfileUuid;
                const config = cfgUuid
                    ? configMap.get(cfgUuid)
                    : null;

                if (cfgUuid) {
                    log.debug(
                        `  Node "${current.name}": active config profile = ${cfgUuid}`
                    );
                } else {
                    log.debug(
                        `  Node "${current.name}": no active config profile.`
                    );
                }

                let matchedOutbound: ChainOutbound | null = null;
                let nextNode: NodeData | undefined;

                if (config) {
                    const hop = this.findNextHop(
                        config,
                        host.vlessRouteId!,
                        current.name,
                        nodesByIp,
                        dnsMap,
                        visited,
                        log
                    );
                    if (hop) {
                        matchedOutbound = hop.outbound;
                        nextNode = hop.node;
                    }
                }

                hops.push({
                    uuid: current.uuid,
                    name: current.name,
                    address: current.address,
                    countryCode: current.countryCode,
                    outbound: matchedOutbound,
                });

                current = nextNode;
            }

            if (hops.length >= 2) {
                chains.push({
                    id: `chain-${host.uuid}`,
                    host: {
                        uuid: host.uuid,
                        remark: host.remark,
                        address: host.address,
                        port: host.port,
                        vlessRouteId: host.vlessRouteId!,
                    },
                    hops,
                });
                const path = hops
                    .map((h) => `"${h.name}"`)
                    .join(" \u2192 ");
                log.info(`  \u2714 Chain built: ${path}`);
            } else if (hops.length === 1 && hops[0].outbound) {
                const msg =
                    `Host "${host.remark}": outbound ` +
                    `"${hops[0].outbound.address}" found but ` +
                    "could not resolve to a known node.";
                warnings.push(msg);
                log.warn(`  ${msg}`);
            } else {
                log.debug(
                    `  Host "${host.remark}": only 1 hop, no outbound \u2014 not a chain.`
                );
            }
        }

        log.info(
            `--- Done. ${chains.length} chain(s) detected, ${warnings.length} warning(s). ---`
        );

        return { chains, warnings, logs: log.entries };
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private findEntryNode(
        host: HostData,
        nodeByUuid: Map<string, NodeData>,
        nodesByIp: Map<string, NodeData[]>,
        dnsMap: Map<string, string[]>,
        log: LogCollector
    ): NodeData | undefined {
        // Strategy 1 – direct host→node assignment
        // Will not work because this field is not strictly enforced to match actual node assignments
        // it is just a user setting that can be left blank or filled with any node UUID
        // for (const id of host.nodes) {
        //     const n = nodeByUuid.get(id);
        //     if (n) return n;
        // }

        // Strategy 2 – DNS-based matching
        const hostname = this.dns.extractHostname(host.address);
        const ips = this.dns.isIpAddress(hostname)
            ? [hostname]
            : (dnsMap.get(hostname) ?? []);

        log.debug(
            `  DNS lookup for "${hostname}" \u2192 [${ips.join(", ") || "none"}]`
        );

        for (const ip of ips) {
            const bucket = nodesByIp.get(ip);
            if (bucket && bucket.length > 0) {
                log.debug(
                    `  IP ${ip} matches node "${bucket[0].name}" (${bucket[0].address})`
                );
                return bucket[0];
            }
        }

        log.warn(
            `  No node address matches resolved IPs for host "${host.remark}".`
        );
        return undefined;
    }

    private findNextHop(
        config: XRayConfig,
        vlessRouteId: number,
        nodeName: string,
        nodesByIp: Map<string, NodeData[]>,
        dnsMap: Map<string, string[]>,
        visited: Set<string>,
        log: LogCollector
    ): { outbound: ChainOutbound; node: NodeData } | null {
        const outbounds = config.outbounds ?? [];
        const rules = config.routing?.rules ?? [];

        log.debug(
            `  Node "${nodeName}": scanning ${rules.length} routing rule(s), ${outbounds.length} outbound(s).`
        );

        // Strategy 1 – match a routing rule by vlessRouteId
        for (const rule of rules) {
            if (!rule.outboundTag) continue;
            if (!this.ruleMatchesRouteId(rule, vlessRouteId))
                continue;

            log.debug(
                `  Routing rule matched: outboundTag="${rule.outboundTag}" ` +
                    `(user=[${(rule.user ?? []).join(",")}], inboundTag=[${(rule.inboundTag ?? []).join(",")}])`
            );

            const ob = outbounds.find(
                (o) => o.tag === rule.outboundTag
            );
            if (!ob) {
                log.debug(
                    `  Outbound "${rule.outboundTag}" referenced by rule but not found in outbounds list.`
                );
                continue;
            }

            const hit = this.resolveOutboundToNode(
                ob,
                nodesByIp,
                dnsMap,
                visited,
                log
            );
            if (hit) return hit;
        }

        // Strategy 2 – any outbound that points to a known node
        log.debug(
            `  No route-ID-specific rule matched; trying all outbounds\u2026`
        );
        for (const ob of outbounds) {
            if (!ob.tag) continue;
            if (ob.protocol && SKIP_PROTOCOLS.has(ob.protocol)) {
                continue;
            }

            const hit = this.resolveOutboundToNode(
                ob,
                nodesByIp,
                dnsMap,
                visited,
                log
            );
            if (hit) return hit;
        }

        log.debug(
            `  No outbound from node "${nodeName}" resolves to a known unvisited node.`
        );
        return null;
    }

    private ruleMatchesRouteId(
        rule: XRayRoutingRule,
        routeId: number
    ): boolean {
        const s = String(routeId);
        if (rule.outboundTag?.includes(s)) return true;
        if (rule.user?.some((u) => u.includes(s))) return true;
        if (rule.inboundTag?.some((t) => t.includes(s))) return true;
        return false;
    }

    private resolveOutboundToNode(
        outbound: XRayOutbound,
        nodesByIp: Map<string, NodeData[]>,
        dnsMap: Map<string, string[]>,
        visited: Set<string>,
        log: LogCollector
    ): { outbound: ChainOutbound; node: NodeData } | null {
        for (const addr of this.outboundServerAddresses(outbound)) {
            const hostname = this.dns.extractHostname(addr.address);
            const ips = this.dns.isIpAddress(hostname)
                ? [hostname]
                : (dnsMap.get(hostname) ?? []);

            for (const ip of ips) {
                const bucket = nodesByIp.get(ip);
                if (!bucket) continue;
                const node = bucket.find(
                    (n) => !visited.has(n.uuid)
                );
                if (node) {
                    log.info(
                        `  Outbound "${outbound.tag}" (${addr.address}:${addr.port}) \u2192 IP ${ip} \u2192 node "${node.name}"`
                    );
                    return {
                        outbound: {
                            tag: outbound.tag ?? "unknown",
                            protocol:
                                outbound.protocol ?? "unknown",
                            address: addr.address,
                            port: addr.port,
                        },
                        node,
                    };
                }
            }
        }
        return null;
    }

    /** Extracts all server addresses from every outbound in a config. */
    private collectOutboundAddresses(
        config: XRayConfig
    ): { address: string; port: number }[] {
        const out: { address: string; port: number }[] = [];
        for (const ob of config.outbounds ?? []) {
            out.push(...this.outboundServerAddresses(ob));
        }
        return out;
    }

    /** Extracts server addresses from a single outbound's settings. */
    private outboundServerAddresses(
        ob: XRayOutbound
    ): { address: string; port: number }[] {
        const out: { address: string; port: number }[] = [];
        for (const v of ob.settings?.vnext ?? []) {
            out.push({ address: v.address, port: v.port });
        }
        for (const s of ob.settings?.servers ?? []) {
            out.push({ address: s.address, port: s.port });
        }
        return out;
    }
}
