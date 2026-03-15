import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import {
    LogViewerComponent,
    LogEntry,
} from "../../components/log-viewer/log-viewer.component";
import { ConnectionConfigService } from "../../services/connection-config.service";
import {
    ProxyChainService,
    ProxyChain,
} from "../../services/proxy-chain.service";

@Component({
    selector: "app-proxy-chains",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        RouterLink,
        MatButtonModule,
        MatCardModule,
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
                    <mat-icon class="text-amber-500">warning</mat-icon>
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

            <!-- Chains -->
            @if (chains().length > 0) {
                @for (
                    chain of chains();
                    track chain.id;
                    let idx = $index
                ) {
                    <mat-card appearance="outlined" class="mb-4">
                        <mat-card-header>
                            <mat-card-title>
                                Chain #{{ idx + 1 }}
                                <span
                                    class="ml-2 text-sm font-normal text-gray-500"
                                >
                                    {{ chain.host.remark }}
                                </span>
                            </mat-card-title>
                            <mat-card-subtitle>
                                {{ chain.hops.length }}
                                hop{{
                                    chain.hops.length === 1
                                        ? ""
                                        : "s"
                                }}
                                &middot; Route ID
                                {{ chain.host.vlessRouteId }}
                            </mat-card-subtitle>
                        </mat-card-header>

                        <mat-card-content>
                            <div
                                class="flex items-stretch gap-3 overflow-x-auto pb-2 pt-4"
                            >
                                <!-- Entry Host -->
                                <div
                                    class="flex min-w-[160px] flex-col rounded-lg border border-blue-200 bg-blue-50 p-3"
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
                                            {{ chain.host.remark }}
                                        </span>
                                    </div>
                                    <span
                                        class="text-xs text-blue-600"
                                    >
                                        {{ chain.host.address }}
                                    </span>
                                    <span
                                        class="text-xs text-blue-600"
                                    >
                                        Port:
                                        {{ chain.host.port }}
                                    </span>
                                    <span
                                        class="mt-auto inline-block self-start rounded bg-blue-200 px-1.5 py-0.5 text-xs font-medium text-blue-800"
                                    >
                                        Route
                                        {{
                                            chain.host.vlessRouteId
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
                                                {{ hop.name }}
                                            </span>
                                        </div>
                                        <span
                                            class="text-xs text-green-600"
                                        >
                                            {{ hop.address }}
                                        </span>
                                        @if (
                                            last && !hop.outbound
                                        ) {
                                            <span
                                                class="mt-auto inline-block self-start rounded bg-green-200 px-1.5 py-0.5 text-xs font-medium text-green-800"
                                            >
                                                Exit
                                            </span>
                                        }
                                    </div>

                                    <!-- Outbound (between nodes) -->
                                    @if (hop.outbound) {
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
                                                        hop.outbound
                                                            .tag
                                                    }}
                                                </span>
                                            </div>
                                            <span
                                                class="text-xs text-purple-600"
                                            >
                                                {{
                                                    hop.outbound
                                                        .address
                                                }}
                                            </span>
                                            <span
                                                class="text-xs text-purple-600"
                                            >
                                                Port:
                                                {{
                                                    hop.outbound
                                                        .port
                                                }}
                                            </span>
                                            <span
                                                class="mt-auto inline-block self-start rounded bg-purple-200 px-1.5 py-0.5 text-xs font-medium text-purple-800"
                                            >
                                                {{
                                                    hop.outbound
                                                        .protocol
                                                }}
                                            </span>
                                        </div>
                                    }
                                }
                            </div>
                        </mat-card-content>
                    </mat-card>
                }
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
                            Ensure hosts have VLESS route IDs configured
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

    readonly loading = signal(false);
    readonly status = signal<string | null>(null);
    readonly error = signal<string | null>(null);
    readonly chains = signal<ProxyChain[]>([]);
    readonly warnings = signal<string[]>([]);
    readonly logs = signal<LogEntry[]>([]);
    readonly hasDetected = signal(false);

    async detect(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);
        this.chains.set([]);
        this.warnings.set([]);
        this.logs.set([]);

        try {
            const result =
                await this.proxyChainService.detectChains((s) =>
                    this.status.set(s)
                );
            this.chains.set(result.chains);
            this.warnings.set(result.warnings);
            this.logs.set(result.logs);
            this.hasDetected.set(true);
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

    getFlag(countryCode: string): string {
        if (!countryCode || countryCode.length !== 2) return "\u{1F310}";
        const offset = 0x1f1e6;
        const a =
            countryCode.toUpperCase().charCodeAt(0) - 65 + offset;
        const b =
            countryCode.toUpperCase().charCodeAt(1) - 65 + offset;
        return String.fromCodePoint(a, b);
    }
}
