import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
} from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import {
    LogViewerComponent,
    LogEntry,
} from "../../components/log-viewer/log-viewer.component";
import { ConnectionConfigService } from "../../services/connection-config.service";
import { LocalStorageService } from "../../services/local-storage.service";
import {
    ProxyChainService,
    ProxyChain,
    ChainDetectionResult,
} from "../../services/proxy-chain.service";

interface ChainGroup {
    profileUuid: string;
    profileName: string;
    chains: ProxyChain[];
}

interface CachedChainResult {
    connectionName: string;
    domain: string;
    port: string;
    chains: ProxyChain[];
    warnings: string[];
    logs: LogEntry[];
    timestamp: number;
}

const CACHE_KEY = "rw-chain-results";

@Component({
    selector: "app-proxy-chains",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        RouterLink,
        MatButtonModule,
        MatCardModule,
        MatExpansionModule,
        MatIconModule,
        MatProgressSpinnerModule,
        LogViewerComponent,
    ],
    template: `
        <h1 class="mb-2 text-2xl font-semibold text-gray-800">
            Proxy Chains
        </h1>
        <p class="mb-6 text-sm text-gray-500">
            Detect and visualize proxy chain configurations across
            your nodes
        </p>

        @if (!connectionConfig.isConfigured()) {
            <mat-card appearance="outlined">
                <mat-card-content
                    class="flex items-center gap-3 py-6"
                >
                    <mat-icon class="text-amber-500"
                        >warning</mat-icon
                    >
                    <span>
                        Please configure a connection first on the
                        <a
                            class="text-indigo-600 underline"
                            routerLink="/connection"
                            >Connection</a
                        >
                        page.
                    </span>
                </mat-card-content>
            </mat-card>
        } @else {
            <div class="mb-6 flex items-center gap-4">
                <button
                    mat-raised-button
                    color="primary"
                    (click)="detect()"
                    [disabled]="loading()"
                >
                    @if (loading()) {
                        <mat-spinner diameter="20" />
                    } @else {
                        <mat-icon>search</mat-icon>
                    }
                    Detect Chains
                </button>
                @if (status()) {
                    <span class="text-sm text-gray-500">
                        {{ status() }}
                    </span>
                }
                @if (cachedAt()) {
                    <span class="text-xs text-gray-400">
                        Cached {{ cachedAt() }}
                    </span>
                }
            </div>

            <!-- Error -->
            @if (error()) {
                <div
                    class="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700"
                    role="alert"
                >
                    <strong>Error:</strong> {{ error() }}
                </div>
            }

            <!-- Warnings -->
            @if (warnings().length > 0) {
                <mat-card appearance="outlined" class="mb-4">
                    <mat-card-content>
                        <div
                            class="flex items-start gap-2 text-sm text-amber-700"
                        >
                            <mat-icon
                                class="shrink-0 text-amber-500"
                                >info</mat-icon
                            >
                            <ul class="list-inside list-disc">
                                @for (
                                    w of warnings();
                                    track $index
                                ) {
                                    <li>{{ w }}</li>
                                }
                            </ul>
                        </div>
                    </mat-card-content>
                </mat-card>
            }

            <!-- Chains grouped by config profile -->
            @if (chainGroups().length > 0) {
                <mat-accordion multi>
                    @for (
                        group of chainGroups();
                        track group.profileUuid
                    ) {
                        <mat-expansion-panel [expanded]="true">
                            <mat-expansion-panel-header>
                                <mat-panel-title
                                    class="flex items-center gap-2"
                                >
                                    <mat-icon>settings</mat-icon>
                                    {{ group.profileName }}
                                </mat-panel-title>
                                <mat-panel-description>
                                    {{ group.chains.length }}
                                    chain{{
                                        group.chains.length === 1
                                            ? ""
                                            : "s"
                                    }}
                                </mat-panel-description>
                            </mat-expansion-panel-header>

                            @for (
                                chain of group.chains;
                                track chain.id;
                                let idx = $index
                            ) {
                                @if (
                                    idx < 3 ||
                                    expandedGroups().has(
                                        group.profileUuid
                                    )
                                ) {
                                    <mat-card
                                        appearance="outlined"
                                        class="mb-3"
                                    >
                                        <mat-card-header>
                                            <mat-card-title>
                                                Chain #{{
                                                    idx + 1
                                                }}
                                                <span
                                                    class="ml-2 text-sm font-normal text-gray-500"
                                                >
                                                    {{
                                                        chain.host
                                                            .remark
                                                    }}
                                                </span>
                                            </mat-card-title>
                                            <mat-card-subtitle>
                                                {{
                                                    chain.hops
                                                        .length
                                                }}
                                                hop{{
                                                    chain.hops
                                                        .length ===
                                                    1
                                                        ? ""
                                                        : "s"
                                                }}
                                                &middot; Route ID
                                                {{
                                                    chain.host
                                                        .vlessRouteId
                                                }}
                                            </mat-card-subtitle>
                                        </mat-card-header>

                                        <mat-card-content>
                                            <div
                                                class="flex items-stretch gap-3 overflow-x-auto pb-2 pt-4"
                                            >
                                                <!-- User icon (start) -->
                                                <div
                                                    class="flex flex-col items-center justify-center px-1 text-gray-400"
                                                >
                                                    <mat-icon
                                                        style="
                                                            font-size: 28px;
                                                            width: 28px;
                                                            height: 28px;
                                                        "
                                                        >person</mat-icon
                                                    >
                                                    <span
                                                        class="mt-1 text-[10px]"
                                                        >User</span
                                                    >
                                                </div>

                                                <div
                                                    class="flex items-center"
                                                >
                                                    <mat-icon
                                                        class="text-gray-300"
                                                        >east</mat-icon
                                                    >
                                                </div>

                                                <!-- Entry Host -->
                                                <div
                                                    class="flex min-w-[160px] flex-col rounded-lg border border-blue-200 bg-blue-50 p-3"
                                                >
                                                    <span
                                                        class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-400"
                                                        >Host</span
                                                    >
                                                    <div
                                                        class="mb-1 flex items-center gap-2"
                                                    >
                                                        <mat-icon
                                                            class="text-blue-600"
                                                            >language</mat-icon
                                                        >
                                                        <span
                                                            class="text-sm font-medium text-blue-800"
                                                        >
                                                            {{
                                                                chain
                                                                    .host
                                                                    .remark
                                                            }}
                                                        </span>
                                                    </div>
                                                    <span
                                                        class="text-xs text-blue-600"
                                                    >
                                                        {{
                                                            chain
                                                                .host
                                                                .address
                                                        }}
                                                    </span>
                                                    <span
                                                        class="text-xs text-blue-600"
                                                    >
                                                        Port:
                                                        {{
                                                            chain
                                                                .host
                                                                .port
                                                        }}
                                                    </span>
                                                    <span
                                                        class="mt-auto inline-block self-start rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800"
                                                    >
                                                        Route
                                                        {{
                                                            chain
                                                                .host
                                                                .vlessRouteId
                                                        }}
                                                    </span>
                                                </div>

                                                @for (
                                                    hop of chain.hops;
                                                    track $index;
                                                    let last = $last
                                                ) {
                                                    <!-- Arrow -->
                                                    <div
                                                        class="flex items-center"
                                                    >
                                                        <mat-icon
                                                            class="text-gray-400"
                                                            >east</mat-icon
                                                        >
                                                    </div>

                                                    <!-- Node -->
                                                    <div
                                                        class="flex min-w-[160px] flex-col rounded-lg border border-green-200 bg-green-50 p-3"
                                                    >
                                                        <span
                                                            class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-green-400"
                                                            >Node</span
                                                        >
                                                        <div
                                                            class="mb-1 flex items-center gap-2"
                                                        >
                                                            <mat-icon
                                                                class="text-green-600"
                                                                >dns</mat-icon
                                                            >
                                                            <span
                                                                class="text-sm font-medium text-green-800"
                                                            >
                                                                {{
                                                                    getFlag(
                                                                        hop.countryCode
                                                                    )
                                                                }}
                                                                {{
                                                                    hop.name
                                                                }}
                                                            </span>
                                                        </div>
                                                        <span
                                                            class="text-xs text-green-600"
                                                        >
                                                            {{
                                                                hop.address
                                                            }}
                                                        </span>
                                                        @if (
                                                            last &&
                                                            !hop.outbound
                                                        ) {
                                                            <span
                                                                class="mt-auto inline-block self-start rounded bg-green-200 px-1.5 py-0.5 text-xs font-medium text-green-800"
                                                            >
                                                                Exit
                                                            </span>
                                                        }
                                                    </div>

                                                    <!-- Outbound -->
                                                    @if (
                                                        hop.outbound
                                                    ) {
                                                        <div
                                                            class="flex items-center"
                                                        >
                                                            <mat-icon
                                                                class="text-gray-400"
                                                                >east</mat-icon
                                                            >
                                                        </div>

                                                        <div
                                                            class="flex min-w-[140px] flex-col rounded-lg border border-purple-200 bg-purple-50 p-3"
                                                        >
                                                            <span
                                                                class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-purple-400"
                                                                >Outbound</span
                                                            >
                                                            <div
                                                                class="mb-1 flex items-center gap-2"
                                                            >
                                                                <mat-icon
                                                                    class="text-purple-600"
                                                                    >call_split</mat-icon
                                                                >
                                                                <span
                                                                    class="text-sm font-medium text-purple-800"
                                                                >
                                                                    {{
                                                                        hop
                                                                            .outbound
                                                                            .tag
                                                                    }}
                                                                </span>
                                                            </div>
                                                            <span
                                                                class="text-xs text-purple-600"
                                                            >
                                                                {{
                                                                    hop
                                                                        .outbound
                                                                        .address
                                                                }}
                                                            </span>
                                                            <span
                                                                class="text-xs text-purple-600"
                                                            >
                                                                Port:
                                                                {{
                                                                    hop
                                                                        .outbound
                                                                        .port
                                                                }}
                                                            </span>
                                                            <span
                                                                class="mt-auto inline-block self-start rounded bg-purple-200 px-1.5 py-0.5 text-xs font-medium text-purple-800"
                                                            >
                                                                {{
                                                                    hop
                                                                        .outbound
                                                                        .protocol
                                                                }}
                                                            </span>
                                                        </div>
                                                    }
                                                }

                                                <!-- Globe icon (end) -->
                                                <div
                                                    class="flex items-center"
                                                >
                                                    <mat-icon
                                                        class="text-gray-300"
                                                        >east</mat-icon
                                                    >
                                                </div>
                                                <div
                                                    class="flex flex-col items-center justify-center px-1 text-gray-400"
                                                >
                                                    <mat-icon
                                                        style="
                                                            font-size: 28px;
                                                            width: 28px;
                                                            height: 28px;
                                                        "
                                                        >public</mat-icon
                                                    >
                                                    <span
                                                        class="mt-1 text-[10px]"
                                                        >Internet</span
                                                    >
                                                </div>
                                            </div>
                                        </mat-card-content>
                                    </mat-card>
                                }
                            }

                            <!-- Show more / less -->
                            @if (group.chains.length > 3) {
                                <div class="mt-1 text-center">
                                    @if (
                                        !expandedGroups().has(
                                            group.profileUuid
                                        )
                                    ) {
                                        <button
                                            mat-button
                                            (click)="
                                                toggleGroup(
                                                    group.profileUuid
                                                )
                                            "
                                        >
                                            Show all
                                            {{
                                                group.chains.length
                                            }}
                                            chains
                                        </button>
                                    } @else {
                                        <button
                                            mat-button
                                            (click)="
                                                toggleGroup(
                                                    group.profileUuid
                                                )
                                            "
                                        >
                                            Show less
                                        </button>
                                    }
                                </div>
                            }
                        </mat-expansion-panel>
                    }
                </mat-accordion>
            } @else if (!loading() && hasDetected()) {
                <mat-card appearance="outlined">
                    <mat-card-content
                        class="flex flex-col items-center gap-2 py-8"
                    >
                        <mat-icon
                            class="text-gray-400"
                            style="
                                font-size: 48px;
                                width: 48px;
                                height: 48px;
                            "
                            >link_off</mat-icon
                        >
                        <p class="text-gray-500">
                            No proxy chains detected
                        </p>
                        <p class="text-xs text-gray-400">
                            Ensure hosts have VLESS route IDs
                            configured
                        </p>
                    </mat-card-content>
                </mat-card>
            }

            <!-- Detection Log -->
            @if (logs().length > 0) {
                <div class="mt-4">
                    <app-log-viewer [logs]="logs()" />
                </div>
            }
        }
    `,
})
export class ProxyChainsComponent {
    readonly connectionConfig = inject(ConnectionConfigService);
    private proxyChainService = inject(ProxyChainService);
    private localStorage = inject(LocalStorageService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    readonly loading = signal(false);
    readonly status = signal<string | null>(null);
    readonly error = signal<string | null>(null);
    readonly chains = signal<ProxyChain[]>([]);
    readonly warnings = signal<string[]>([]);
    readonly logs = signal<LogEntry[]>([]);
    readonly hasDetected = signal(false);
    readonly expandedGroups = signal(new Set<string>());
    readonly cachedAt = signal<string | null>(null);

    readonly chainGroups = computed(() => {
        const groups = new Map<string, ChainGroup>();
        for (const chain of this.chains()) {
            const key = chain.configProfileUuid;
            if (!groups.has(key)) {
                groups.set(key, {
                    profileUuid: key,
                    profileName: chain.configProfileName,
                    chains: [],
                });
            }
            groups.get(key)!.chains.push(chain);
        }
        return [...groups.values()];
    });

    constructor() {
        this.restoreFromCache();
    }

    async detect(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        this.chains.set([]);
        this.warnings.set([]);
        this.logs.set([]);
        this.expandedGroups.set(new Set());
        this.cachedAt.set(null);

        try {
            const result =
                await this.proxyChainService.detectChains((s) =>
                    this.status.set(s)
                );
            this.chains.set(result.chains);
            this.warnings.set(result.warnings);
            this.logs.set(result.logs);
            this.hasDetected.set(true);

            this.syncQueryParams();
            this.saveToCache(result);
        } catch (e) {
            this.error.set(
                e instanceof Error
                    ? e.message
                    : "Unknown error occurred"
            );
        } finally {
            this.loading.set(false);
            this.status.set(null);
        }
    }

    toggleGroup(profileUuid: string): void {
        this.expandedGroups.update((s) => {
            const next = new Set(s);
            if (next.has(profileUuid)) {
                next.delete(profileUuid);
            } else {
                next.add(profileUuid);
            }
            return next;
        });
    }

    getFlag(countryCode: string): string {
        if (!countryCode || countryCode.length !== 2)
            return "\u{1F310}";
        const offset = 0x1f1e6;
        const a =
            countryCode.toUpperCase().charCodeAt(0) - 65 + offset;
        const b =
            countryCode.toUpperCase().charCodeAt(1) - 65 + offset;
        return String.fromCodePoint(a, b);
    }

    // -----------------------------------------------------------------------
    // Query params & cache
    // -----------------------------------------------------------------------

    private getConnectionParams(): {
        connectionName: string;
        domain: string;
        port: string;
    } {
        const profile = this.connectionConfig.activeProfile();
        return {
            connectionName: profile?.name ?? "",
            domain: profile?.domain ?? "",
            port: String(profile?.port ?? ""),
        };
    }

    private syncQueryParams(): void {
        const p = this.getConnectionParams();
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                connection_name: p.connectionName,
                domain: p.domain,
                port: p.port || null,
            },
            queryParamsHandling: "replace",
            replaceUrl: true,
        });
    }

    private cacheKey(): string {
        const p = this.getConnectionParams();
        return `${CACHE_KEY}:${p.connectionName}:${p.domain}:${p.port}`;
    }

    private saveToCache(result: ChainDetectionResult): void {
        const p = this.getConnectionParams();
        const cached: CachedChainResult = {
            connectionName: p.connectionName,
            domain: p.domain,
            port: p.port,
            chains: result.chains,
            warnings: result.warnings,
            logs: result.logs,
            timestamp: Date.now(),
        };
        this.localStorage.set(this.cacheKey(), cached);
    }

    private restoreFromCache(): void {
        const snapshot = this.route.snapshot.queryParamMap;
        const qName = snapshot.get("connection_name");
        const qDomain = snapshot.get("domain");
        const qPort = snapshot.get("port") ?? "";

        // No query params → nothing to restore
        if (!qName && !qDomain) return;

        // Check if active connection matches query params
        const p = this.getConnectionParams();
        if (
            qName &&
            qDomain &&
            qName === p.connectionName &&
            qDomain === p.domain &&
            qPort === p.port
        ) {
            const cached =
                this.localStorage.get<CachedChainResult>(
                    this.cacheKey()
                );
            if (
                cached &&
                cached.connectionName === p.connectionName &&
                cached.domain === p.domain &&
                cached.port === p.port
            ) {
                this.chains.set(cached.chains);
                this.warnings.set(cached.warnings);
                this.logs.set(cached.logs);
                this.hasDetected.set(true);
                this.cachedAt.set(this.formatTimestamp(cached.timestamp));
            }
        }
    }

    private formatTimestamp(ts: number): string {
        const d = new Date(ts);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
}
