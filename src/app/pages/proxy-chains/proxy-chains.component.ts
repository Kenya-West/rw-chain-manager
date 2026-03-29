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
import { PanelDataService } from "../../services/panel-data.service";
import {
    ProxyChainService,
    ProxyChain,
} from "../../services/proxy-chain.service";

interface ChainGroup {
    profileUuid: string;
    profileName: string;
    chains: ProxyChain[];
}

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
            <div class="mb-6 flex flex-wrap items-center gap-4">
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
                <button
                    mat-stroked-button
                    (click)="refreshAndDetect()"
                    [disabled]="loading()"
                >
                    <mat-icon>refresh</mat-icon>
                    Refresh Data
                </button>
                @if (status()) {
                    <span class="text-sm text-gray-500">
                        {{ status() }}
                    </span>
                }
                @if (lastUpdated()) {
                    <span class="text-xs text-gray-400">
                        Last updated {{ lastUpdated() }}
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
                                                <!-- User icon -->
                                                <div
                                                    class="flex flex-col items-center justify-center px-1 text-gray-400"
                                                >
                                                    <mat-icon
                                                        style="font-size: 28px; width: 28px; height: 28px"
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

                                                <!-- Host -->
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
                                                            >{{
                                                                chain
                                                                    .host
                                                                    .remark
                                                            }}</span
                                                        >
                                                    </div>
                                                    <span
                                                        class="text-xs text-blue-600"
                                                        >{{
                                                            chain
                                                                .host
                                                                .address
                                                        }}</span
                                                    >
                                                    <span
                                                        class="text-xs text-blue-600"
                                                        >Port:
                                                        {{
                                                            chain
                                                                .host
                                                                .port
                                                        }}</span
                                                    >
                                                    <span
                                                        class="mt-auto inline-block self-start rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800"
                                                        >Route
                                                        {{
                                                            chain
                                                                .host
                                                                .vlessRouteId
                                                        }}</span
                                                    >
                                                </div>

                                                @for (
                                                    hop of chain.hops;
                                                    track $index;
                                                    let last = $last
                                                ) {
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
                                                                >{{
                                                                    getFlag(
                                                                        hop.countryCode
                                                                    )
                                                                }}
                                                                {{
                                                                    hop.name
                                                                }}</span
                                                            >
                                                        </div>
                                                        <span
                                                            class="text-xs text-green-600"
                                                            >{{
                                                                hop.address
                                                            }}</span
                                                        >
                                                        @if (
                                                            last &&
                                                            !hop.outbound
                                                        ) {
                                                            <span
                                                                class="mt-auto inline-block self-start rounded bg-green-200 px-1.5 py-0.5 text-xs font-medium text-green-800"
                                                                >Exit</span
                                                            >
                                                        }
                                                    </div>
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
                                                        <!-- Outbound -->
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
                                                                    >{{
                                                                        hop
                                                                            .outbound
                                                                            .tag
                                                                    }}</span
                                                                >
                                                            </div>
                                                            <span
                                                                class="text-xs text-purple-600"
                                                                >{{
                                                                    hop
                                                                        .outbound
                                                                        .address
                                                                }}</span
                                                            >
                                                            <span
                                                                class="text-xs text-purple-600"
                                                                >Port:
                                                                {{
                                                                    hop
                                                                        .outbound
                                                                        .port
                                                                }}</span
                                                            >
                                                            <span
                                                                class="mt-auto inline-block self-start rounded bg-purple-200 px-1.5 py-0.5 text-xs font-medium text-purple-800"
                                                                >{{
                                                                    hop
                                                                        .outbound
                                                                        .protocol
                                                                }}</span
                                                            >
                                                        </div>
                                                    }
                                                }

                                                <!-- Globe icon -->
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
                                                        style="font-size: 28px; width: 28px; height: 28px"
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
                            style="font-size: 48px; width: 48px; height: 48px"
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

            <!-- Log viewer -->
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
    private panelDataService = inject(PanelDataService);
    private proxyChainService = inject(ProxyChainService);
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

    readonly lastUpdated = computed(() => {
        const d = this.panelDataService.data();
        if (!d) return null;
        return this.formatTimestamp(d.meta.fetchedAt);
    });

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
        this.tryRestore();
    }

    async detect(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        this.chains.set([]);
        this.warnings.set([]);
        this.logs.set([]);
        this.expandedGroups.set(new Set());

        try {
            let data = this.panelDataService.data();
            if (!data) {
                await this.panelDataService.refresh((s) =>
                    this.status.set(s)
                );
                data = this.panelDataService.data();
                if (!data)
                    throw new Error("Failed to fetch panel data");
            }
            await this.runDetection(data);
            this.syncQueryParams();
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

    async refreshAndDetect(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        this.chains.set([]);
        this.warnings.set([]);
        this.logs.set([]);
        this.expandedGroups.set(new Set());

        try {
            await this.panelDataService.refresh((s) =>
                this.status.set(s)
            );
            const data = this.panelDataService.data();
            if (!data)
                throw new Error("Failed to fetch panel data");
            await this.runDetection(data);
            this.syncQueryParams();
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
            countryCode.toUpperCase().charCodeAt(0) -
            65 +
            offset;
        const b =
            countryCode.toUpperCase().charCodeAt(1) -
            65 +
            offset;
        return String.fromCodePoint(a, b);
    }

    // -----------------------------------------------------------------------
    // Private
    // -----------------------------------------------------------------------

    private async runDetection(
        data: import("../../services/panel-data.service").PanelData
    ): Promise<void> {
        const result = await this.proxyChainService.detectChains(
            data,
            (s) => this.status.set(s)
        );
        this.chains.set(result.chains);
        this.warnings.set(result.warnings);
        this.logs.set(result.logs);
        this.hasDetected.set(true);
    }

    private tryRestore(): void {
        const qId =
            this.route.snapshot.queryParamMap.get(
                "connection_id"
            );
        const activeId =
            this.connectionConfig.activeProfileId();
        if (qId && qId === activeId) {
            const restored = this.panelDataService.restore();
            if (restored) {
                const data = this.panelDataService.data()!;
                this.runDetection(data);
            }
        }
    }

    private syncQueryParams(): void {
        const id = this.connectionConfig.activeProfileId();
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { connection_id: id },
            queryParamsHandling: "replace",
            replaceUrl: true,
        });
    }

    private formatTimestamp(ts: number): string {
        const d = new Date(ts);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
}
