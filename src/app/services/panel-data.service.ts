import { effect, inject, Injectable, signal } from "@angular/core";

import { HostsApiService } from "./api/hosts-api.service";
import { NodesApiService } from "./api/nodes-api.service";
import { ConfigProfilesApiService } from "./api/config-profiles-api.service";
import { ExternalSquadsApiService } from "./api/external-squads-api.service";
import { InternalSquadsApiService } from "./api/internal-squads-api.service";
import { ConnectionConfigService } from "./connection-config.service";
import { LocalStorageService } from "./local-storage.service";
import { XRayConfig } from "./proxy-chain.service";

// ---------------------------------------------------------------------------
// PanelData model — the single source of truth for Remnawave panel state
// ---------------------------------------------------------------------------

export interface PanelDataMeta {
    connectionId: string;
    connectionName: string;
    domain: string;
    port: string;
    fetchedAt: number;
}

export interface PanelHost {
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

export interface PanelNode {
    uuid: string;
    name: string;
    address: string;
    isDisabled: boolean;
    countryCode: string;
    configProfile: {
        activeConfigProfileUuid: string | null;
    };
}

export interface PanelConfigProfileSummary {
    uuid: string;
    name: string;
}

export interface PanelExternalSquad {
    uuid: string;
    name: string;
    info: { membersCount: number };
    hostOverrides: { vlessRouteId?: number | null } | null;
}

export interface PanelInternalSquad {
    uuid: string;
    name: string;
    info: { membersCount: number; inboundsCount: number };
    inbounds: { uuid: string; profileUuid: string; tag: string }[];
}

export interface PanelData {
    meta: PanelDataMeta;
    hosts: PanelHost[];
    nodes: PanelNode[];
    configProfiles: PanelConfigProfileSummary[];
    computedConfigs: Record<string, XRayConfig>;
    externalSquads: PanelExternalSquad[];
    internalSquads: PanelInternalSquad[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "rw-panel-data";

@Injectable({ providedIn: "root" })
export class PanelDataService {
    private hostsApi = inject(HostsApiService);
    private nodesApi = inject(NodesApiService);
    private configProfilesApi = inject(ConfigProfilesApiService);
    private externalSquadsApi = inject(ExternalSquadsApiService);
    private internalSquadsApi = inject(InternalSquadsApiService);
    private connectionConfig = inject(ConnectionConfigService);
    private localStorage = inject(LocalStorageService);

    readonly data = signal<PanelData | null>(null);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    private refreshPromise: Promise<void> | null = null;
    private lastProfileId: string | null = null;

    constructor() {
        // Auto-clear when user switches connection
        effect(() => {
            const id = this.connectionConfig.activeProfileId();
            if (this.lastProfileId !== null && id !== this.lastProfileId) {
                this.clear();
            }
            this.lastProfileId = id;
        });
    }

    /** Try restoring cached panel data from localStorage for the active connection. */
    restore(): boolean {
        const id = this.connectionConfig.activeProfileId();
        if (!id) return false;

        const cached = this.localStorage.get<PanelData>(
            `${STORAGE_PREFIX}:${id}`
        );
        if (cached && cached.meta?.connectionId === id) {
            this.data.set(cached);
            return true;
        }
        return false;
    }

    /** Fetch all data from Remnawave API for the active connection. */
    async refresh(
        onStatus?: (status: string) => void
    ): Promise<void> {
        // Guard against concurrent refreshes
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = this.doRefresh(onStatus).finally(
            () => {
                this.refreshPromise = null;
            }
        );
        return this.refreshPromise;
    }

    clear(): void {
        this.data.set(null);
        this.error.set(null);
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    private async doRefresh(
        onStatus?: (status: string) => void
    ): Promise<void> {
        const profile = this.connectionConfig.activeProfile();
        if (!profile) {
            this.error.set("No active connection configured.");
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        try {
            // ---- Bulk fetch -------------------------------------------------
            onStatus?.("Fetching hosts, nodes, config profiles, squads\u2026");

            const [hostsRes, nodesRes, configsRes, extRes, intRes] =
                await Promise.all([
                    this.hostsApi.getAll(),
                    this.nodesApi.getAll(),
                    this.configProfilesApi.getAll(),
                    this.externalSquadsApi.getAll(),
                    this.internalSquadsApi.getAll(),
                ]);

            const hosts: PanelHost[] = hostsRes.response;
            const nodes: PanelNode[] = nodesRes.response;
            const configProfiles: PanelConfigProfileSummary[] =
                configsRes.response.configProfiles.map((c) => ({
                    uuid: c.uuid,
                    name: c.name,
                }));
            const externalSquads: PanelExternalSquad[] =
                extRes.response.externalSquads;
            const internalSquads: PanelInternalSquad[] =
                intRes.response.internalSquads;

            // ---- Computed configs for profiles used by nodes ----------------
            const profileUuids = new Set<string>();
            for (const n of nodes) {
                const id =
                    n.configProfile?.activeConfigProfileUuid;
                if (id) profileUuids.add(id);
            }

            onStatus?.(
                `Fetching ${profileUuids.size} computed config(s)\u2026`
            );

            const computedConfigs: Record<string, XRayConfig> = {};
            const results = await Promise.allSettled(
                [...profileUuids].map(async (uuid) => {
                    const res =
                        await this.configProfilesApi.getComputedByUuid(
                            uuid
                        );
                    return { uuid, config: res.response.config };
                })
            );

            for (const r of results) {
                if (r.status === "fulfilled" && r.value.config) {
                    computedConfigs[r.value.uuid] =
                        r.value.config as XRayConfig;
                }
            }

            // ---- Build PanelData --------------------------------------------
            const panelData: PanelData = {
                meta: {
                    connectionId: profile.id,
                    connectionName: profile.name,
                    domain: profile.domain,
                    port: String(profile.port ?? ""),
                    fetchedAt: Date.now(),
                },
                hosts,
                nodes,
                configProfiles,
                computedConfigs,
                externalSquads,
                internalSquads,
            };

            this.data.set(panelData);
            this.localStorage.set(
                `${STORAGE_PREFIX}:${profile.id}`,
                panelData
            );
        } catch (e) {
            this.error.set(
                e instanceof Error
                    ? e.message
                    : "Failed to fetch panel data"
            );
            throw e;
        } finally {
            this.loading.set(false);
        }
    }
}
