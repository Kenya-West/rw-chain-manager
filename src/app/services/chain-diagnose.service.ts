import { Injectable } from "@angular/core";

import { LogEntry } from "../components/log-viewer/log-viewer.component";
import {
    XRayConfig,
    XRayOutbound,
    XRayRoutingRule,
} from "./proxy-chain.service";
import {
    PanelData,
    PanelHost,
    PanelNode,
    PanelExternalSquad,
    PanelInternalSquad,
    PanelConfigProfileSummary,
} from "./panel-data.service";

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
    matchingRules: XRayRoutingRule[];
    matchedOutbounds: XRayOutbound[];
    logs: LogEntry[];
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
    async diagnose(
        vlessRouteId: number,
        configProfileUuid: string,
        data: PanelData,
        onStatus?: (status: string) => void
    ): Promise<DiagnoseResult> {
        const log = new LogCollector();
        const checks: DiagnoseCheckResult[] = [];

        onStatus?.("Running checks\u2026");

        const hosts: PanelHost[] = data.hosts;
        const configProfiles: Record<string, XRayConfig> = data.computedConfigs;
        const nodes: PanelNode[] = data.nodes;
        const xrayConfig: XRayConfig | undefined =
            data.computedConfigs[configProfileUuid];
        const externalSquads: PanelExternalSquad[] = data.externalSquads;
        const internalSquads: PanelInternalSquad[] = data.internalSquads;

        log.info(
            `Panel data: ${hosts.length} hosts, ${nodes.length} nodes, ` +
                `${externalSquads.length} external squads, ${internalSquads.length} internal squads.`
        );

        if (!xrayConfig) {
            log.error("Computed config not available for this Config Profile.");
            checks.push({
                id: "route-in-config",
                title: "VLESS Route ID in Config",
                status: "fail",
                message:
                    "The computed config for this Config Profile is not available. " +
                    "Ensure the Config Profile is assigned to at least one node, " +
                    "then refresh the panel data.",
            });
            return this.skipRemaining(checks, log);
        }

        const outbounds = xrayConfig.outbounds ?? [];
        const rules = xrayConfig.routing?.rules ?? [];
        log.debug(
            `Config has ${outbounds.length} outbound(s) and ${rules.length} routing rule(s).`
        );

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
                id: "route-in-config-profile",
                title: "VLESS Route ID in Config Profile",
                status: "pass",
                message: `${matchingRules.length} routing rule(s) reference VLESS route ID ${vlessRouteId} \u2192 outbound(s): ${matchedOutboundTags.join(", ")}.`,
            });
        } else {
            log.error(
                `Check 1 FAIL: No routing rule references route ID ${vlessRouteId}.`
            );
            checks.push({
                id: "route-in-config-profile",
                title: "VLESS Route ID in Config Profile",
                status: "fail",
                message:
                    `No routing rule in this Config Profile references VLESS route ID ${vlessRouteId}. ` +
                    "Verify the route ID is correct, or check that the Config Profile " +
                    "has routing rules configured for this chain.",
            });
            return this.skipRemaining(checks, log);
        }

        // ---- Check 2: At least one enabled node has this profile ----------
        const profileNodes = nodes.filter(
            (n) =>
                n.configProfile?.activeConfigProfileUuid === configProfileUuid
        );
        const enabledProfileNodes = profileNodes.filter((n) => !n.isDisabled);

        if (enabledProfileNodes.length > 0) {
            log.info(
                `Check 2 PASS: ${enabledProfileNodes.length} enabled node(s) use this profile.`
            );
            for (const n of enabledProfileNodes) {
                log.debug(`  Node "${n.name}" (${n.address})`);
            }
            checks.push({
                id: "node-has-config-profile",
                title: "Node Has Config Profile & Is Enabled",
                status: "pass",
                message: `${enabledProfileNodes.length} enabled node(s) use this config profile (${profileNodes.length} total).`,
            });
        } else if (profileNodes.length > 0) {
            log.warn(
                `Check 2 WARN: ${profileNodes.length} node(s) have this profile but ALL are disabled.`
            );
            checks.push({
                id: "node-has-config-profile",
                title: "Node Has Config Profile & Is Enabled",
                status: "warn",
                message:
                    `${profileNodes.length} node(s) use this Config Profile, but all are disabled. ` +
                    "Enable at least one node for the chain to function.",
            });
        } else {
            log.error(
                "Check 2 FAIL: No nodes have this Config Profile assigned."
            );
            checks.push({
                id: "node-has-config-profile",
                title: "Node Has Config Profile & Is Enabled",
                status: "fail",
                message:
                    "No nodes are assigned to this Config Profile. " +
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
        const matchedConfigProfiles: Record<string, XRayConfig> = {};
        for (const tag of matchedOutboundTags) {
            const ob = outbounds.find((o) => o.tag === tag);
            if (!ob) {
                log.debug(`  Outbound "${tag}" not found in outbounds list.`);
                continue;
            }
            const addrs = this.outboundServerAddresses(ob);
            log.debug(
                `  Outbound "${tag}": ${addrs.length} server address(es): ${addrs.map((a) => a.address).join(", ")}`
            );
            for (const addr of addrs) {
                // get list of configprofiles with this address
                const configProfilesForAddress = Object.entries(
                    configProfiles
                ).filter(([, cp]) =>
                    cp.outbounds?.some((o) =>
                        this.outboundServerAddresses(o).some(
                            (a) => a.address === addr.address
                        )
                    )
                );
                if (configProfilesForAddress.length > 0) {
                    Object.assign(
                        matchedConfigProfiles,
                        Object.fromEntries(configProfilesForAddress)
                    );

                    configProfilesForAddress.forEach(([id]) => {
                        log.debug(
                            `  Matched Config Profile "${this.getConfigProfileName(id, data.configProfiles)} (${id})" (${addr.address})`
                        );
                    });
                }
            }
        }

        if (Object.keys(matchedConfigProfiles).length > 0) {
            log.info(
                `Check 4 PASS: ${Object.keys(matchedConfigProfiles).length} config profiles contain the matched outbound addresses.`
            );
            checks.push({
                id: "config-profiles-exist",
                title: "There are Config Profiles for Outbounds' addresses",
                status: "pass",
                message: `There are ${Object.keys(matchedConfigProfiles).length} config profile(s) that contain the matched outbound addresses: ${Object.keys(
                    matchedConfigProfiles
                )
                    .map(
                        (cp) =>
                            `"${this.getConfigProfileName(cp, data.configProfiles)}"`
                    )
                    .join(", ")}.`,
            });
        } else {
            log.error(
                "Check 4 FAIL: No config profiles contain the matched outbound addresses."
            );
            checks.push({
                id: "config-profiles-exist",
                title: "There are Config Profiles for Outbounds' addresses",
                status: "fail",
                message:
                    "None of the outbound server addresses matched any config profile's outbounds. " +
                    "Ensure that at least one config profile contains outbounds with the server addresses used by the routing rules for this chain.",
            });
            return this.skipRemaining(checks, log);
        }

        // ---- Check 5: There are Hosts with this VLESS route ID -----------------------
        const hostsWithRouteId = hosts.filter(
            (h) => h.vlessRouteId === vlessRouteId
        );

        hostsWithRouteId.forEach((h) => {
            log.debug(
                `  Host "${h.remark}" (${h.address}) has VLESS route ID ${vlessRouteId}.`
            );
        });

        if (hostsWithRouteId.length > 0) {
            log.info(
                `Check 5 PASS: ${hostsWithRouteId.length} host(s) have this VLESS route ID.`
            );
            checks.push({
                id: "host-profile-match",
                title: "Hosts contain VLESS route ID",
                status: "pass",
                message: `${hostsWithRouteId.length} host(s) have this VLESS route ID in their config profile assignment.`,
            });
        } else {
            log.error(
                `Check 5 FAIL: No hosts have this VLESS route ID in their config profile assignment.`
            );
            checks.push({
                id: "host-profile-match",
                title: "Hosts contain VLESS route ID",
                status: "fail",
                message:
                    `No hosts have this VLESS route ID: ${vlessRouteId} - in their config profile assignment. ` +
                    "Ensure that at least one host is assigned to a config profile that contains this route ID, " +
                    "and that the host is enabled.",
            });
            return this.skipRemaining(checks, log);
        }

        // ---- Check 6: The selected Hosts are enabled -----------------------

        const enabledHostsWithRouteId = hostsWithRouteId.filter(
            (h) => !h.isDisabled
        );

        hostsWithRouteId.forEach((h) => {
            if (h.isDisabled) {
                log.debug(
                    `  Host "${h.remark}" (${h.address}) with VLESS route ID ${vlessRouteId} is disabled.`
                );
            } else {
                log.debug(
                    `  Host "${h.remark}" (${h.address}) with VLESS route ID ${vlessRouteId} is enabled.`
                );
            }
        });

        if (enabledHostsWithRouteId.length > 0) {
            log.info(
                `Check 6 PASS: ${enabledHostsWithRouteId.length} host(s) with this VLESS route ID are enabled.`
            );
            checks.push({
                id: "host-enabled",
                title: "Hosts with VLESS route ID are enabled",
                status: "pass",
                message: `${enabledHostsWithRouteId.length} host(s) with this VLESS route ID are enabled.`,
            });
        } else {
            log.error(
                `Check 6 FAIL: All ${hostsWithRouteId.length} host(s) with this VLESS route ID are disabled.`
            );
            checks.push({
                id: "host-enabled",
                title: "Hosts with VLESS route ID are enabled",
                status: "fail",
                message:
                    `No host(s) with this VLESS route ID are enabled. ` +
                    `Enable at least one of these hosts with VLESS route ID: ${vlessRouteId} - for the chain to function.`,
            });
        }

        // ---- All checks passed — compute squad info -----------------------
        const allPassed = checks.every(
            (c) => c.status === "pass" || c.status === "warn"
        );

        let squadInfo: SquadInfo | null = null;
        if (allPassed) {
            squadInfo = this.computeSquadInfo(
                // enabledMatchedHosts,
                configProfileUuid,
                vlessRouteId,
                internalSquads,
                externalSquads,
                log
            );
        }

        log.info(
            `--- Done. ${checks.filter((c) => c.status === "pass").length}/${checks.length} passed, ` +
                `${checks.filter((c) => c.status === "warn").length} warning(s), ` +
                `${checks.filter((c) => c.status === "fail").length} failure(s). ---`
        );

        // Collect matched outbound objects for the visualization
        const matchedOutbounds = matchedOutboundTags
            .map((tag) => outbounds.find((o) => o.tag === tag))
            .filter(Boolean) as XRayOutbound[];

        return {
            checks,
            allPassed,
            squadInfo,
            matchingRules,
            matchedOutbounds,
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
            "route-in-config-profile",
            "node-has-config-profile",
            "routing-consistent",
            "config-profiles-exist",
            "host-profile-match",
            "host-enabled",
        ];
        const titles = [
            "VLESS route ID in Config Profile",
            "Nodes have Config Profile & are Enabled",
            "Routing rules consistency",
            "There are Config Profiles for Outbounds' addresses",
            "Hosts contain VLESS route ID",
            "Hosts with VLESS route ID are enabled",
        ];
        const existing = new Set(checks.map((c) => c.id));
        for (let i = 0; i < allIds.length; i++) {
            if (!existing.has(allIds[i])) {
                checks.push({
                    id: allIds[i],
                    title: titles[i],
                    status: "skipped",
                    message: "Skipped because a prior check failed.",
                });
            }
        }
        log.info("Remaining checks skipped due to prior failure.");
        return {
            checks,
            allPassed: false,
            squadInfo: null,
            matchingRules: [],
            matchedOutbounds: [],
            logs: log.entries,
        };
    }

    private computeSquadInfo(
        // matchedHosts: PanelHost[],
        configProfileUuid: string,
        vlessRouteId: number,
        internalSquads: PanelInternalSquad[],
        externalSquads: PanelExternalSquad[],
        log: LogCollector
    ): SquadInfo {
        const excludedIds = new Set();
        // matchedHosts.flatMap((h) => h.excludedInternalSquads)

        const matchedInternal = internalSquads.filter(
            (s) =>
                s.inbounds.some((ib) => ib.profileUuid === configProfileUuid) &&
                !excludedIds.has(s.uuid)
        );

        const matchedExternal = externalSquads.filter(
            (s) => s.hostOverrides?.vlessRouteId === vlessRouteId
        );

        log.info(
            `Squad analysis: ${matchedInternal.length} internal squad(s), ${matchedExternal.length} external squad(s) affected.`
        );
        for (const s of matchedInternal) {
            log.debug(
                `  Internal: "${s.name}" (${s.info.membersCount} members)`
            );
        }
        for (const s of matchedExternal) {
            log.debug(
                `  External: "${s.name}" (${s.info.membersCount} members)`
            );
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
        return rule.vlessRoute === String(routeId) ? true : false;
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

    private getConfigProfileName(
        cpid: string,
        configProfiles: PanelConfigProfileSummary[]
    ): string {
        return configProfiles.find((cp) => cp.uuid === cpid)?.name || cpid;
    }
}
