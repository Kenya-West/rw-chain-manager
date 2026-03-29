import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";

import {
    LogViewerComponent,
    LogEntry,
} from "../../components/log-viewer/log-viewer.component";
import { ConnectionConfigService } from "../../services/connection-config.service";
import {
    PanelDataService,
    PanelConfigProfileSummary,
} from "../../services/panel-data.service";
import {
    ChainDiagnoseService,
    DiagnoseResult,
    CheckStatus,
} from "../../services/chain-diagnose.service";
import {
    XRayRoutingRule,
    XRayOutbound,
} from "../../services/proxy-chain.service";

interface RuleOutboundGroup {
    tag: string;
    rules: XRayRoutingRule[];
    outbound: XRayOutbound | null;
}

@Component({
    selector: "app-chain-diagnose",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        RouterLink,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatDividerModule,
        LogViewerComponent,
    ],
    template: `
        <h1 class="mb-2 text-2xl font-semibold text-gray-800">
            Chain Diagnostics
        </h1>
        <p class="mb-6 text-sm text-gray-500">
            Validate that a VLESS route ID is correctly wired within a config
            profile
        </p>

        @if (!connectionConfig.isConfigured()) {
            <mat-card appearance="outlined">
                <mat-card-content class="flex items-center gap-3 py-6">
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
            <!-- Input form -->
            <mat-card appearance="outlined" class="mb-6">
                <mat-card-content>
                    <div class="flex flex-wrap items-end gap-4 pt-2">
                        <mat-form-field appearance="outline">
                            <mat-label>VLESS Route ID</mat-label>
                            <input
                                matInput
                                type="number"
                                [ngModel]="vlessRouteId()"
                                (ngModelChange)="vlessRouteId.set($event)"
                                placeholder="1"
                            />
                        </mat-form-field>

                        <mat-form-field
                            appearance="outline"
                            class="min-w-[240px]"
                        >
                            <mat-label>Config Profile</mat-label>
                            <mat-select
                                [value]="selectedProfileUuid()"
                                (selectionChange)="
                                    selectedProfileUuid.set($event.value)
                                "
                            >
                                @for (p of configProfiles(); track p.uuid) {
                                    <mat-option [value]="p.uuid">
                                        {{ p.name }}
                                    </mat-option>
                                }
                            </mat-select>
                            @if (panelDataService.loading()) {
                                <mat-hint>Loading data…</mat-hint>
                            }
                        </mat-form-field>

                        <button
                            mat-raised-button
                            color="primary"
                            (click)="runDiagnose()"
                            [disabled]="
                                loading() ||
                                !vlessRouteId() ||
                                !selectedProfileUuid()
                            "
                            class="mb-[22px]"
                        >
                            @if (loading()) {
                                <mat-spinner diameter="20" />
                            } @else {
                                <mat-icon>troubleshoot</mat-icon>
                            }
                            Run Diagnose
                        </button>

                        <button
                            mat-stroked-button
                            (click)="refreshData()"
                            [disabled]="loading()"
                            class="mb-[22px]"
                        >
                            <mat-icon>refresh</mat-icon>
                            Refresh Data
                        </button>
                    </div>
                    @if (lastUpdated()) {
                        <p class="text-xs text-gray-400">
                            Last updated {{ lastUpdated() }}
                        </p>
                    }
                </mat-card-content>
            </mat-card>

            <!-- Status -->
            @if (status()) {
                <p class="mb-4 text-sm text-gray-500">
                    {{ status() }}
                </p>
            }

            <!-- Error -->
            @if (error()) {
                <div
                    class="mb-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700"
                    role="alert"
                >
                    <strong>Error:</strong> {{ error() }}
                </div>
            }

            <!-- Check results -->
            @if (result()) {
                <div class="space-y-0">
                    @for (
                        check of result()!.checks;
                        track check.id;
                        let last = $last
                    ) {
                        <div
                            class="flex items-start gap-4 rounded-lg border p-4 {{
                                borderColor(check.status)
                            }}"
                        >
                            <div
                                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full {{
                                    iconBg(check.status)
                                }}"
                            >
                                <mat-icon
                                    class="{{ iconColor(check.status) }}"
                                    >{{ statusIcon(check.status) }}</mat-icon
                                >
                            </div>
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium text-gray-800">{{
                                        check.title
                                    }}</span>
                                    <span
                                        class="rounded px-2 py-0.5 text-xs font-semibold uppercase {{
                                            badgeClass(check.status)
                                        }}"
                                        >{{ check.status }}</span
                                    >
                                </div>
                                <p class="mt-1 text-sm text-gray-600">
                                    {{ check.message }}
                                </p>
                            </div>
                        </div>
                        @if (!last) {
                            <div class="ml-5 h-4 w-px bg-gray-300"></div>
                        }
                    }
                </div>

                <!-- Rules & Outbounds mapping -->
                @if (ruleOutboundGroups().length > 0) {
                    <mat-card appearance="outlined" class="mt-6">
                        <mat-card-header>
                            <mat-card-title
                                >Rules &amp; Outbounds</mat-card-title
                            >
                            <mat-card-subtitle>
                                Routing rules linked to outbounds by tag
                            </mat-card-subtitle>
                        </mat-card-header>
                        <mat-card-content class="mt-2">
                            @for (
                                group of ruleOutboundGroups();
                                track group.tag;
                                let last = $last
                            ) {
                                <div class="mb-1 flex items-center gap-2">
                                    <mat-icon
                                        class="text-indigo-500"
                                        style="
                                            font-size: 18px;
                                            width: 18px;
                                            height: 18px;
                                        "
                                        >sell</mat-icon
                                    >
                                    <span
                                        class="text-sm font-semibold text-indigo-700"
                                        >{{ group.tag }}</span
                                    >
                                    <span class="text-xs text-gray-400"
                                        >{{ group.rules.length }} rule{{
                                            group.rules.length === 1 ? "" : "s"
                                        }}</span
                                    >
                                </div>

                                <div
                                    class="grid grid-cols-1 gap-4 md:grid-cols-2"
                                >
                                    <!-- Left: rules -->
                                    <div>
                                        <h4
                                            class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500"
                                        >
                                            Routing Rules
                                        </h4>
                                        @for (
                                            rule of group.rules;
                                            track $index
                                        ) {
                                            <pre
                                                class="mb-2 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700"
                                                >{{ formatJson(rule) }}</pre
                                            >
                                        }
                                    </div>

                                    <!-- Right: outbound -->
                                    <div>
                                        <h4
                                            class="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500"
                                        >
                                            Outbound
                                        </h4>
                                        @if (group.outbound) {
                                            <pre
                                                class="overflow-x-auto rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700"
                                                >{{
                                                    formatJson(
                                                        group.outbound,
                                                        true
                                                    )
                                                }}</pre
                                            >
                                        } @else {
                                            <p class="text-sm text-gray-400">
                                                Outbound not found in config
                                            </p>
                                        }
                                    </div>
                                </div>

                                @if (!last) {
                                    <mat-divider class="my-4" />
                                }
                            }
                        </mat-card-content>
                    </mat-card>
                }

                <!-- Squad info -->
                @if (result()!.allPassed && result()!.squadInfo) {
                    <mat-card appearance="outlined" class="mt-6">
                        <mat-card-header>
                            <mat-card-title>Affected Squads</mat-card-title>
                            <mat-card-subtitle>
                                Squads that use this chain configuration
                            </mat-card-subtitle>
                        </mat-card-header>
                        <mat-card-content>
                            <div
                                class="mt-2 grid grid-cols-1 gap-6 md:grid-cols-2"
                            >
                                <div>
                                    <h3
                                        class="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        Internal Squads
                                    </h3>
                                    @for (
                                        squad of result()!.squadInfo!
                                            .internalSquads;
                                        track squad.uuid
                                    ) {
                                        <div
                                            class="mb-1 flex items-center gap-2 text-sm"
                                        >
                                            <mat-icon
                                                class="text-indigo-500"
                                                style="font-size: 18px; width: 18px; height: 18px"
                                                >group</mat-icon
                                            >
                                            <span class="font-medium">{{
                                                squad.name
                                            }}</span>
                                            <span class="text-gray-400"
                                                >&middot;
                                                {{ squad.membersCount }}
                                                members</span
                                            >
                                        </div>
                                    } @empty {
                                        <p class="text-sm text-gray-400">
                                            No internal squads affected
                                        </p>
                                    }
                                </div>
                                <div>
                                    <h3
                                        class="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500"
                                    >
                                        External Squads
                                    </h3>
                                    @for (
                                        squad of result()!.squadInfo!
                                            .externalSquads;
                                        track squad.uuid
                                    ) {
                                        <div
                                            class="mb-1 flex items-center gap-2 text-sm"
                                        >
                                            <mat-icon
                                                class="text-teal-500"
                                                style="font-size: 18px; width: 18px; height: 18px"
                                                >groups</mat-icon
                                            >
                                            <span class="font-medium">{{
                                                squad.name
                                            }}</span>
                                            <span class="text-gray-400"
                                                >&middot;
                                                {{ squad.membersCount }}
                                                members</span
                                            >
                                        </div>
                                    } @empty {
                                        <p class="text-sm text-gray-400">
                                            No external squads use this route ID
                                        </p>
                                    }
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                }
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
export class ChainDiagnoseComponent {
    readonly connectionConfig = inject(ConnectionConfigService);
    readonly panelDataService = inject(PanelDataService);
    private diagnoseService = inject(ChainDiagnoseService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    readonly loading = signal(false);
    readonly status = signal<string | null>(null);
    readonly error = signal<string | null>(null);
    readonly result = signal<DiagnoseResult | null>(null);
    readonly logs = signal<LogEntry[]>([]);
    readonly configProfiles = signal<PanelConfigProfileSummary[]>([]);
    readonly selectedProfileUuid = signal<string | null>(null);
    readonly vlessRouteId = signal<number | null>(null);

    readonly ruleOutboundGroups = computed((): RuleOutboundGroup[] => {
        const r = this.result();
        if (!r || r.matchingRules.length === 0) return [];

        const grouped = new Map<string, RuleOutboundGroup>();
        for (const rule of r.matchingRules) {
            const tag = rule.outboundTag ?? "(no tag)";
            if (!grouped.has(tag)) {
                grouped.set(tag, {
                    tag,
                    rules: [],
                    outbound:
                        r.matchedOutbounds.find((o) => o.tag === tag) ?? null,
                });
            }
            grouped.get(tag)!.rules.push(rule);
        }
        return [...grouped.values()];
    });

    readonly lastUpdated = computed(() => {
        const d = this.panelDataService.data();
        if (!d) return null;
        return this.formatTimestamp(d.meta.fetchedAt);
    });

    constructor() {
        this.tryRestore();
    }

    async runDiagnose(): Promise<void> {
        const routeId = this.vlessRouteId();
        const profileUuid = this.selectedProfileUuid();
        if (routeId == null || !profileUuid) return;

        this.loading.set(true);
        this.error.set(null);
        this.result.set(null);
        this.logs.set([]);

        try {
            let data = this.panelDataService.data();
            if (!data) {
                await this.panelDataService.refresh((s) => this.status.set(s));
                data = this.panelDataService.data();
                if (!data) throw new Error("Failed to fetch panel data");
                this.configProfiles.set(data.configProfiles);
            }
            const res = await this.diagnoseService.diagnose(
                routeId,
                profileUuid,
                data,
                (s) => this.status.set(s)
            );
            this.result.set(res);
            this.logs.set(res.logs);
            this.syncQueryParams();
        } catch (e) {
            this.error.set(
                e instanceof Error ? e.message : "Unknown error occurred"
            );
        } finally {
            this.loading.set(false);
            this.status.set(null);
        }
    }

    async refreshData(): Promise<void> {
        this.loading.set(true);
        this.error.set(null);

        try {
            await this.panelDataService.refresh((s) => this.status.set(s));
            const data = this.panelDataService.data();
            if (data) {
                this.configProfiles.set(data.configProfiles);
            }

            const routeId = this.vlessRouteId();
            const profileUuid = this.selectedProfileUuid();
            if (routeId != null && profileUuid && data) {
                const res = await this.diagnoseService.diagnose(
                    routeId,
                    profileUuid,
                    data,
                    (s) => this.status.set(s)
                );
                this.result.set(res);
                this.logs.set(res.logs);
            }
            this.syncQueryParams();
        } catch (e) {
            this.error.set(
                e instanceof Error ? e.message : "Unknown error occurred"
            );
        } finally {
            this.loading.set(false);
            this.status.set(null);
        }
    }

    // -----------------------------------------------------------------------
    // Status styling helpers
    // -----------------------------------------------------------------------

    statusIcon(s: CheckStatus): string {
        switch (s) {
            case "pass":
                return "check_circle";
            case "warn":
                return "warning";
            case "fail":
                return "cancel";
            case "skipped":
                return "skip_next";
        }
    }

    borderColor(s: CheckStatus): string {
        switch (s) {
            case "pass":
                return "border-green-200";
            case "warn":
                return "border-amber-200";
            case "fail":
                return "border-red-200";
            case "skipped":
                return "border-gray-200";
        }
    }

    iconBg(s: CheckStatus): string {
        switch (s) {
            case "pass":
                return "bg-green-100";
            case "warn":
                return "bg-amber-100";
            case "fail":
                return "bg-red-100";
            case "skipped":
                return "bg-gray-100";
        }
    }

    iconColor(s: CheckStatus): string {
        switch (s) {
            case "pass":
                return "text-green-600";
            case "warn":
                return "text-amber-600";
            case "fail":
                return "text-red-600";
            case "skipped":
                return "text-gray-400";
        }
    }

    badgeClass(s: CheckStatus): string {
        switch (s) {
            case "pass":
                return "bg-green-100 text-green-700";
            case "warn":
                return "bg-amber-100 text-amber-700";
            case "fail":
                return "bg-red-100 text-red-700";
            case "skipped":
                return "bg-gray-100 text-gray-500";
        }
    }

    formatJson(obj: unknown, outbound = false): string {
        const replacer = (key: string, value: unknown) => {
            if (key === "streamSettings") {
                // For outbound settings, we set realitySettings.password field as "<REDACTED>"
                if (
                    typeof value === "object" &&
                    value !== null &&
                    "realitySettings" in value
                ) {
                    return {
                        ...value,
                        realitySettings: {
                            ...(value.realitySettings as Object),
                            password: "<REDACTED>",
                        },
                    };
                }
                return undefined; // Omit other fields
            }
            return value;
        };

        return JSON.stringify(obj, outbound ? replacer : null, 2);
    }

    // -----------------------------------------------------------------------
    // Private
    // -----------------------------------------------------------------------

    private tryRestore(): void {
        if (!this.connectionConfig.isConfigured()) return;

        const qId = this.route.snapshot.queryParamMap.get("connection_id");
        const activeId = this.connectionConfig.activeProfileId();
        if (qId && qId === activeId) {
            this.panelDataService.restore();
        }

        const data = this.panelDataService.data();
        if (data) {
            this.configProfiles.set(data.configProfiles);
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
