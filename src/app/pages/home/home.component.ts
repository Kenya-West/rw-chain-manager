import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";

import { GetStatsCommand } from "@remnawave/backend-contract";

import {
    ConnectionConfigService,
    ConnectionProfile,
} from "../../services/connection-config.service";
import { SystemApiService } from "../../services/api/system-api.service";

@Component({
    selector: "app-home",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatDividerModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatTooltipModule,
    ],
    template: `
        <div class="mx-auto max-w-lg">
            <mat-card>
                <mat-card-header>
                    <mat-card-title>Remnawave Connection</mat-card-title>
                    <mat-card-subtitle>
                        Manage your Remnawave panel connections
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <!-- Profile selector -->
                    <div class="mt-4 flex items-center gap-2">
                        <mat-form-field appearance="outline" class="flex-1">
                            <mat-label>Profile</mat-label>
                            <mat-select
                                [value]="selectedProfileId()"
                                (selectionChange)="selectProfile($event.value)"
                            >
                                @for (
                                    profile of connectionConfig.profiles();
                                    track profile.id
                                ) {
                                    <mat-option [value]="profile.id">
                                        {{ profile.name }}
                                    </mat-option>
                                }
                            </mat-select>
                        </mat-form-field>
                        <button
                            mat-icon-button
                            (click)="newProfile()"
                            matTooltip="New profile"
                        >
                            <mat-icon>add</mat-icon>
                        </button>
                        <button
                            mat-icon-button
                            (click)="deleteProfile()"
                            [disabled]="!selectedProfileId()"
                            matTooltip="Delete profile"
                        >
                            <mat-icon>delete</mat-icon>
                        </button>
                    </div>

                    <mat-divider class="my-2" />

                    <!-- Connection form -->
                    <form
                        [formGroup]="form"
                        (ngSubmit)="testConnection()"
                        class="mt-4 flex flex-col gap-2"
                    >
                        <mat-form-field appearance="outline">
                            <mat-label>Profile name</mat-label>
                            <input
                                matInput
                                formControlName="name"
                                placeholder="My Server"
                            />
                            @if (form.controls.name.hasError("required")) {
                                <mat-error
                                    >Profile name is required</mat-error
                                >
                            }
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Proxy endpoint</mat-label>
                            <input
                                matInput
                                formControlName="proxy"
                                placeholder="https://cors-1.youraccount.workers.dev"
                            />
                            <mat-hint>
                                Optional. Used to avoid CORS via reverse proxy
                            </mat-hint>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Domain</mat-label>
                            <input
                                matInput
                                formControlName="domain"
                                placeholder="https://panel.example.com"
                            />
                            <mat-hint>Include protocol (https://)</mat-hint>
                            @if (form.controls.domain.hasError("required")) {
                                <mat-error>Domain is required</mat-error>
                            }
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>Port</mat-label>
                            <input
                                matInput
                                formControlName="port"
                                type="number"
                                placeholder="3000"
                            />
                            <mat-hint>Leave empty for default port</mat-hint>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>API Token</mat-label>
                            <input
                                matInput
                                formControlName="apiToken"
                                type="password"
                                placeholder="Bearer token"
                            />
                            @if (
                                form.controls.apiToken.hasError("required")
                            ) {
                                <mat-error>API Token is required</mat-error>
                            }
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                            <mat-label>X-Api-Key</mat-label>
                            <input
                                matInput
                                formControlName="xApiKey"
                                type="password"
                                placeholder="Optional reverse proxy key"
                            />
                            <mat-hint>
                                Optional, for Caddy/reverse proxy auth
                            </mat-hint>
                        </mat-form-field>

                        <div class="mt-2 flex gap-2">
                            <button
                                mat-raised-button
                                color="primary"
                                type="button"
                                (click)="saveProfile()"
                                [disabled]="form.invalid"
                            >
                                <mat-icon>save</mat-icon>
                                Save
                            </button>
                            <button
                                mat-raised-button
                                type="submit"
                                [disabled]="form.invalid || loading()"
                            >
                                @if (loading()) {
                                    <mat-spinner diameter="20" />
                                } @else {
                                    <mat-icon>wifi_tethering</mat-icon>
                                }
                                Test Connection
                            </button>
                        </div>
                    </form>

                    @if (error()) {
                        <div
                            class="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700"
                            role="alert"
                        >
                            <strong>Connection failed:</strong>
                            {{ error() }}
                        </div>
                    }

                    @if (stats()) {
                        <div
                            class="mt-4 rounded-md border border-green-300 bg-green-50 p-4"
                        >
                            <h3
                                class="mb-2 text-lg font-semibold text-green-800"
                            >
                                Connected successfully!
                            </h3>
                            <div
                                class="grid grid-cols-2 gap-2 text-sm text-green-700"
                            >
                                <div>
                                    <strong>CPU Cores:</strong>
                                    {{ stats()!.response.cpu.cores }}
                                </div>
                                <div>
                                    <strong>Memory Used:</strong>
                                    {{
                                        formatBytes(
                                            stats()!.response.memory.used
                                        )
                                    }}
                                </div>
                                <div>
                                    <strong>Total Users:</strong>
                                    {{ stats()!.response.users.totalUsers }}
                                </div>
                                <div>
                                    <strong>Online Now:</strong>
                                    {{
                                        stats()!.response.onlineStats
                                            .onlineNow
                                    }}
                                </div>
                                <div>
                                    <strong>Nodes Online:</strong>
                                    {{
                                        stats()!.response.nodes.totalOnline
                                    }}
                                </div>
                                <div>
                                    <strong>Uptime:</strong>
                                    {{
                                        formatUptime(
                                            stats()!.response.uptime
                                        )
                                    }}
                                </div>
                            </div>
                        </div>
                    }

                    <mat-divider class="my-4" />

                    <!-- Import / Export -->
                    <div class="flex gap-2">
                        <button
                            mat-stroked-button
                            (click)="exportProfiles()"
                            [disabled]="
                                connectionConfig.profiles().length === 0
                            "
                        >
                            <mat-icon>download</mat-icon>
                            Export
                        </button>
                        <button
                            mat-stroked-button
                            (click)="fileInput.click()"
                        >
                            <mat-icon>upload</mat-icon>
                            Import
                        </button>
                        <input
                            #fileInput
                            type="file"
                            accept=".json"
                            class="hidden"
                            (change)="importProfiles($event)"
                        />
                    </div>
                </mat-card-content>
            </mat-card>
        </div>
    `,
})
export class HomeComponent {
    readonly connectionConfig = inject(ConnectionConfigService);
    private systemApi = inject(SystemApiService);
    private fb = inject(FormBuilder);

    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly stats = signal<GetStatsCommand.Response | null>(null);
    readonly selectedProfileId = signal<string | null>(null);

    readonly form = this.fb.nonNullable.group({
        name: ["", Validators.required],
        proxy: [""],
        domain: ["", Validators.required],
        port: [null as number | null],
        apiToken: ["", Validators.required],
        xApiKey: [""],
    });

    constructor() {
        const active = this.connectionConfig.activeProfile();
        if (active) {
            this.selectedProfileId.set(active.id);
            this.loadProfileIntoForm(active);
        }
    }

    selectProfile(id: string): void {
        this.selectedProfileId.set(id);
        const profile = this.connectionConfig
            .profiles()
            .find((p) => p.id === id);
        if (profile) {
            this.loadProfileIntoForm(profile);
            this.connectionConfig.activateProfile(id);
        }
        this.error.set(null);
        this.stats.set(null);
    }

    newProfile(): void {
        this.selectedProfileId.set(null);
        this.form.reset();
        this.error.set(null);
        this.stats.set(null);
    }

    saveProfile(): void {
        if (this.form.invalid) return;

        const v = this.form.getRawValue();
        const id = this.connectionConfig.saveProfile({
            id: this.selectedProfileId() ?? undefined,
            name: v.name,
            proxy: v.proxy,
            domain: v.domain,
            port: v.port,
            apiToken: v.apiToken,
            xApiKey: v.xApiKey,
        });

        this.selectedProfileId.set(id);
        this.connectionConfig.activateProfile(id);
    }

    deleteProfile(): void {
        const id = this.selectedProfileId();
        if (!id) return;
        this.connectionConfig.deleteProfile(id);
        this.selectedProfileId.set(null);
        this.form.reset();
        this.error.set(null);
        this.stats.set(null);
    }

    async testConnection(): Promise<void> {
        if (this.form.invalid) return;
        this.saveProfile();

        this.loading.set(true);
        this.error.set(null);
        this.stats.set(null);

        try {
            const result = await this.systemApi.getStats();
            this.stats.set(result);
        } catch (e) {
            this.error.set(
                e instanceof Error ? e.message : "Unknown error occurred"
            );
        } finally {
            this.loading.set(false);
        }
    }

    exportProfiles(): void {
        const json = this.connectionConfig.exportProfiles();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rw-connections.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    importProfiles(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                this.connectionConfig.importProfiles(
                    reader.result as string
                );
            } catch {
                this.error.set(
                    "Failed to import profiles: invalid JSON"
                );
            }
        };
        reader.readAsText(file);
        input.value = "";
    }

    formatBytes(bytes: number): string {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    }

    formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    }

    private loadProfileIntoForm(profile: ConnectionProfile): void {
        this.form.patchValue({
            name: profile.name,
            proxy: profile.proxy,
            domain: profile.domain,
            port: profile.port,
            apiToken: profile.apiToken,
            xApiKey: profile.xApiKey,
        });
    }
}
