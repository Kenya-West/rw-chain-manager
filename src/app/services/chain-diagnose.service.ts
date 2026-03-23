import { inject, Injectable } from "@angular/core";

import { HostsApiService } from "./api/hosts-api.service";
import { NodesApiService } from "./api/nodes-api.service";
import { ConfigProfilesApiService } from "./api/config-profiles-api.service";
import { ExternalSquadsApiService } from "./api/external-squads-api.service";
import { InternalSquadsApiService } from "./api/internal-squads-api.service";
import { LogEntry } from "../components/log-viewer/log-viewer.component";
import {
    XRayConfig,
    XRayOutbound,
    XRayRoutingRule,
} from "./proxy-chain.service";

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type CheckStatus = "pass" | "warn" | "fail" | "skipped";

export interface DiagnoseCheckResult {
    id: string;
    title: string;
    status: CheckStatus;
    message: string;
}

export interface SquadInfo {
    internalSquads: {
        uuid: string;
        name: string;
        membersCount: number;
    }[];
    externalSquads: {
        uuid: string;
        name: string;
        membersCount: number;
    }[];
}

export interface DiagnoseResult {
    checks: DiagnoseCheckResult[];
    allPassed: boolean;
    squadInfo: SquadInfo | null;
    logs: LogEntry[];
}

// ---------------------------------------------------------------------------
// Internal data shapes
// ---------------------------------------------------------------------------

interface HostData {
    uuid: string;
    remark: string;
    address: string;
    port: number;
    isDisabled: boolean;
    vlessRouteId: number | null;
    nodes: string[];
    inbound: {
        configProfileUuid: string | null;
        configProfileInboundUuid: string | null;
    };
    excludedInternalSquads: string[];
}

interface NodeData {
    uuid: string;
    name: string;
    address: string;
    isDisabled: boolean;
    countryCode: string;
    configProfile: {
        activeConfigProfileUuid: string | null;
    };
}

interface InternalSquadData {
    uuid: string;
    name: string;
    info: { membersCount: number; inboundsCount: number };
    inbounds: { uuid: string; profileUuid: string; tag: string }[];
}

interface ExternalSquadData {
    uuid: string;
    name: string;
    info: { membersCount: number };
    hostOverrides: { vlessRouteId?: number | null } | null;
}

// ---------------------------------------------------------------------------
// Log collector
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
export class ChainDiagnoseService {
    private hostsApi = inject(HostsApiService);
    private nodesApi = inject(NodesApiService);
    private configProfilesApi = inject(ConfigProfilesApiService);
    private externalSquadsApi = inject(ExternalSquadsApiService);
    private internalSquadsApi = inject(InternalSquadsApiService);

    async diagnose(
        vlessRouteId: number,
        configProfileUuid: string,
        onStatus?: (status: string) => void
    ): Promise<DiagnoseResult> {
        const log = new LogCollector();
        const checks: DiagnoseCheckResult[] = [];

        // ---- Fetch all data -----------------------------------------------
        onStatus?.("Fetching data from Remnawave\u2026");
        log.info("Fetching hosts, nodes, computed config, squads\u2026");

        const [hostsRes, nodesRes, computedRes, extSquadsRes, intSquadsRes] =
            await Promise.all([
                this.hostsApi.getAll(),
                this.nodesApi.getAll(),
                this.configProfilesApi.getComputedByUuid(
                    configProfileUuid
                ),
                this.externalSquadsApi.getAll(),
                this.internalSquadsApi.getAll(),
            ]);

        const hosts: HostData[] = hostsRes.response;
        const nodes: NodeData[] = nodesRes.response;
        const xrayConfig = computedRes.response.config as
            | XRayConfig
            | null;
        const externalSquads: ExternalSquadData[] =
            extSquadsRes.response.externalSquads;
        const internalSquads: InternalSquadData[] =
            intSquadsRes.response.internalSquads;

        log.info(
            `Fetched ${hosts.length} hosts, ${nodes.length} nodes, ` +
                `${externalSquads.length} external squads, ${internalSquads.length} internal squads.`
        );

        if (!xrayConfig) {
            log.error("Computed config is empty for this profile.");
            checks.push({
                id: "route-in-config",
                title: "VLESS Route ID in Config",
                status: "fail",
                message:
                    "The computed config for this profile is empty. " +
                    "Ensure the config profile has a valid XRay configuration.",
            });
            return this.skipRemaining(checks, log);
        }

        const outbounds = xrayConfig.outbounds ?? [];
        const rules = xrayConfig.routing?.rules ?? [];
        log.debug(
            `Config has ${outbounds.length} outbound(s) and ${rules.length} routing rule(s).`
        );

        onStatus?.("Running checks\u2026");

        // ---- Check 1: VLESS route ID exists in config ---------------------
        const matchingRules = rules.filter((r) =>
            this.ruleMatchesRouteId(r, vlessRouteId)
        );
        const matchedOutboundTags = [
            ...new Set(
                matchingRules
                    .map((r) => r.outboundTag)
                    .filter(Boolean) as string[]
            ),
        ];

        if (matchingRules.length > 0) {
            log.info(
                `Check 1 PASS: ${matchingRules.length} routing rule(s) reference route ID ${vlessRouteId}. ` +
                    `Outbound tag(s): ${matchedOutboundTags.join(", ")}`
            );
            checks.push({
                id: "route-in-config",
                title: "VLESS Route ID in Config",
                status: "pass",
                message: `${matchingRules.length} routing rule(s) reference VLESS route ID ${vlessRouteId} \u2192 outbound(s): ${matchedOutboundTags.join(", ")}.`,
            });
        } else {
            log.error(
                `Check 1 FAIL: No routing rule references route ID ${vlessRouteId}.`
            );
            checks.push({
                id: "route-in-config",
                title: "VLESS Route ID in Config",
                status: "fail",
                message:
                    `No routing rule in this config profile references VLESS route ID ${vlessRouteId}. ` +
                    "Verify the route ID is correct, or check that the config profile " +
                    "has routing rules configured for this chain.",
            });
            return this.skipRemaining(checks, log);
        }

        // ---- Check 2: At least one enabled node has this profile ----------
        const profileNodes = nodes.filter(
            (n) =>
                n.configProfile?.activeConfigProfileUuid ===
                configProfileUuid
        );
        const enabledProfileNodes = profileNodes.filter(
            (n) => !n.isDisabled
        );

        if (enabledProfileNodes.length > 0) {
            log.info(
                `Check 2 PASS: ${enabledProfileNodes.length} enabled node(s) use this profile.`
            );
            for (const n of enabledProfileNodes) {
                log.debug(`  Node "${n.name}" (${n.address})`);
            }
            checks.push({
                id: "node-has-profile",
                title: "Node Has Config Profile & Is Enabled",
                status: "pass",
                message: `${enabledProfileNodes.length} enabled node(s) use this config profile (${profileNodes.length} total).`,
            });
        } else if (profileNodes.length > 0) {
            log.warn(
                `Check 2 WARN: ${profileNodes.length} node(s) have this profile but ALL are disabled.`
            );
            checks.push({
                id: "node-has-profile",
                title: "Node Has Config Profile & Is Enabled",
                status: "warn",
                message:
                    `${profileNodes.length} node(s) use this config profile, but all are disabled. ` +
                    "Enable at least one node for the chain to function.",
            });
        } else {
            log.error(
                "Check 2 FAIL: No nodes have this config profile assigned."
            );
            checks.push({
                id: "node-has-profile",
                title: "Node Has Config Profile & Is Enabled",
                status: "fail",
                message:
                    "No nodes are assigned to this config profile. " +
                    "Assign the profile to at least one node in the Remnawave panel.",
            });
            return this.skipRemaining(checks, log);
        }

        // ---- Check 3: Routing rules point to same outbound ----------------
        if (matchedOutboundTags.length === 1) {
            log.info(
                `Check 3 PASS: All ${matchingRules.length} matching rule(s) point to the same outbound "${matchedOutboundTags[0]}".`
            );
            checks.push({
                id: "routing-consistent",
                title: "Routing Rules Consistency",
                status: "pass",
                message: `All matching rules route to the same outbound: "${matchedOutboundTags[0]}".`,
            });
        } else {
            log.warn(
                `Check 3 WARN: Matching rules point to ${matchedOutboundTags.length} different outbounds: ${matchedOutboundTags.join(", ")}.`
            );
            checks.push({
                id: "routing-consistent",
                title: "Routing Rules Consistency",
                status: "warn",
                message:
                    `Routing rules for this route ID point to ${matchedOutboundTags.length} different outbounds: ` +
                    `${matchedOutboundTags.join(", ")}. This may cause unpredictable routing. ` +
                    "Review the routing rules in the config profile to ensure consistency.",
            });
        }

        // ---- Check 4: Outbound points to existing, enabled host -----------
        const matchedHosts: HostData[] = [];
        for (const tag of matchedOutboundTags) {
            const ob = outbounds.find((o) => o.tag === tag);
            if (!ob) {
                log.debug(
                    `  Outbound "${tag}" not found in outbounds list.`
                );
                continue;
            }
            const addrs = this.outboundServerAddresses(ob);
            log.debug(
                `  Outbound "${tag}": ${addrs.length} server address(es): ${addrs.map((a) => a.address).join(", ")}`
            );
            for (const addr of addrs) {
                const host = hosts.find(
                    (h) => h.address === addr.address
                );
                if (host) {
                    matchedHosts.push(host);
                    log.debug(
                        `  Matched host "${host.remark}" (${host.address}), disabled=${host.isDisabled}`
                    );
                }
            }
        }

        const enabledMatchedHosts = matchedHosts.filter(
            (h) => !h.isDisabled
        );

        if (enabledMatchedHosts.length > 0) {
            log.info(
                `Check 4 PASS: ${enabledMatchedHosts.length} enabled host(s) match outbound addresses.`
            );
            checks.push({
                id: "outbound-valid-host",
                title: "Outbound Points to Valid Host",
                status: "pass",
                message: `Outbound address(es) match ${enabledMatchedHosts.length} enabled host(s): ${enabledMatchedHosts.map((h) => `"${h.remark}"`).join(", ")}.`,
            });
        } else if (matchedHosts.length > 0) {
            log.error(
                `Check 4 FAIL: ${matchedHosts.length} host(s) match but all are disabled.`
            );
            checks.push({
                id: "outbound-valid-host",
                title: "Outbound Points to Valid Host",
                status: "fail",
                message:
                    `${matchedHosts.length} host(s) match the outbound address but are all disabled. ` +
                    "Enable the target host in the Remnawave panel.",
            });
            return this.skipRemaining(checks, log);
        } else {
            log.error(
                "Check 4 FAIL: No host address matches the outbound server addresses."
            );
            const obAddrs = matchedOutboundTags.flatMap((tag) => {
                const ob = outbounds.find((o) => o.tag === tag);
                return ob
                    ? this.outboundServerAddresses(ob).map(
                          (a) => a.address
                      )
                    : [];
            });
            checks.push({
                id: "outbound-valid-host",
                title: "Outbound Points to Valid Host",
                status: "fail",
                message:
                    `No host has an address matching the outbound destination(s): ${obAddrs.join(", ") || "(none)"}. ` +
                    "Create a host with a matching address, or verify the outbound configuration.",
            });
            return this.skipRemaining(checks, log);
        }

        // ---- Check 5: Host's config profile matches -----------------------
        const hostsWithCorrectProfile = enabledMatchedHosts.filter(
            (h) =>
                h.inbound.configProfileUuid === configProfileUuid
        );
        const hostsWithWrongProfile = enabledMatchedHosts.filter(
            (h) =>
                h.inbound.configProfileUuid !== configProfileUuid
        );

        if (hostsWithCorrectProfile.length > 0) {
            if (hostsWithWrongProfile.length === 0) {
                log.info(
                    "Check 5 PASS: All matched hosts belong to the selected config profile."
                );
                checks.push({
                    id: "host-profile-match",
                    title: "Host Config Profile Matches",
                    status: "pass",
                    message:
                        "All matched hosts are assigned to the selected config profile.",
                });
            } else {
                log.warn(
                    `Check 5 WARN: ${hostsWithCorrectProfile.length} host(s) match, but ${hostsWithWrongProfile.length} host(s) have a different profile.`
                );
                checks.push({
                    id: "host-profile-match",
                    title: "Host Config Profile Matches",
                    status: "warn",
                    message:
                        `${hostsWithCorrectProfile.length} host(s) match the selected profile, ` +
                        `but ${hostsWithWrongProfile.length} host(s) are assigned to a different profile: ` +
                        `${hostsWithWrongProfile.map((h) => `"${h.remark}"`).join(", ")}. ` +
                        "Reassign them in the Remnawave panel if they should use this profile.",
                });
            }
        } else {
            log.error(
                "Check 5 FAIL: None of the matched hosts belong to the selected config profile."
            );
            checks.push({
                id: "host-profile-match",
                title: "Host Config Profile Matches",
                status: "fail",
                message:
                    "The matched host(s) are assigned to a different config profile. " +
                    "Update the host's inbound config profile in the Remnawave panel to match.",
            });
            return this.skipRemaining(checks, log);
        }

        // ---- All checks passed — compute squad info -----------------------
        const allPassed = checks.every(
            (c) => c.status === "pass" || c.status === "warn"
        );

        let squadInfo: SquadInfo | null = null;
        if (allPassed) {
            squadInfo = this.computeSquadInfo(
                enabledMatchedHosts,
                configProfileUuid,
                vlessRouteId,
                internalSquads,
                externalSquads,
                log
            );
        }

        log.info(
            `--- Done. ${checks.filter((c) => c.status === "pass").length}/5 passed, ` +
                `${checks.filter((c) => c.status === "warn").length} warning(s), ` +
                `${checks.filter((c) => c.status === "fail").length} failure(s). ---`
        );

        return {
            checks,
            allPassed,
            squadInfo,
            logs: log.entries,
        };
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private skipRemaining(
        checks: DiagnoseCheckResult[],
        log: LogCollector
    ): DiagnoseResult {
        const allIds = [
            "route-in-config",
            "node-has-profile",
            "routing-consistent",
            "outbound-valid-host",
            "host-profile-match",
        ];
        const titles = [
            "VLESS Route ID in Config",
            "Node Has Config Profile & Is Enabled",
            "Routing Rules Consistency",
            "Outbound Points to Valid Host",
            "Host Config Profile Matches",
        ];
        const existing = new Set(checks.map((c) => c.id));
        for (let i = 0; i < allIds.length; i++) {
            if (!existing.has(allIds[i])) {
                checks.push({
                    id: allIds[i],
                    title: titles[i],
                    status: "skipped",
                    message:
                        "Skipped because a prior check failed.",
                });
            }
        }
        log.info("Remaining checks skipped due to prior failure.");
        return {
            checks,
            allPassed: false,
            squadInfo: null,
            logs: log.entries,
        };
    }

    private computeSquadInfo(
        matchedHosts: HostData[],
        configProfileUuid: string,
        vlessRouteId: number,
        internalSquads: InternalSquadData[],
        externalSquads: ExternalSquadData[],
        log: LogCollector
    ): SquadInfo {
        // Internal squads whose inbounds reference the selected profile,
        // excluding those in any matched host's excludedInternalSquads
        const excludedIds = new Set(
            matchedHosts.flatMap((h) => h.excludedInternalSquads)
        );

        const matchedInternal = internalSquads.filter(
            (s) =>
                s.inbounds.some(
                    (ib) => ib.profileUuid === configProfileUuid
                ) && !excludedIds.has(s.uuid)
        );

        // External squads with hostOverrides.vlessRouteId matching
        const matchedExternal = externalSquads.filter(
            (s) => s.hostOverrides?.vlessRouteId === vlessRouteId
        );

        log.info(
            `Squad analysis: ${matchedInternal.length} internal squad(s), ${matchedExternal.length} external squad(s) affected.`
        );
        for (const s of matchedInternal) {
            log.debug(`  Internal: "${s.name}" (${s.info.membersCount} members)`);
        }
        for (const s of matchedExternal) {
            log.debug(`  External: "${s.name}" (${s.info.membersCount} members)`);
        }

        return {
            internalSquads: matchedInternal.map((s) => ({
                uuid: s.uuid,
                name: s.name,
                membersCount: s.info.membersCount,
            })),
            externalSquads: matchedExternal.map((s) => ({
                uuid: s.uuid,
                name: s.name,
                membersCount: s.info.membersCount,
            })),
        };
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
