import {
    ChangeDetectionStrategy,
    Component,
    inject,
    signal,
} from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { GetStatsCommand } from "@remnawave/backend-contract";

import { ConnectionConfigService } from "../../services/connection-config.service";
import { LocalStorageService } from "../../services/local-storage.service";
import { SystemApiService } from "../../services/api/system-api.service";

const CONNECTION_STORAGE_KEY = "rw-connection-config";

@Component({
    selector: "app-home",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <div
            class="flex min-h-screen items-center justify-center bg-gray-50 p-4"
        >
            <mat-card class="w-full max-w-lg">
                <mat-card-header>
                    <mat-card-title>Remnawave Connection</mat-card-title>
                    <mat-card-subtitle>
                        Configure your Remnawave panel connection
                    </mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                    <form
                        [formGroup]="form"
                        (ngSubmit)="testConnection()"
                        class="mt-4 flex flex-col gap-2"
                    >
                        <mat-form-field appearance="outline">
                            <mat-label>Proxy endpoint</mat-label>
                            <input
                                matInput
                                formControlName="proxy"
                                placeholder="https://cors-1.youraccount.workers.dev"
                            />
                            <mat-hint
                                >Will be used to avoid CORS. Based on your
                                reverse proxy configuration</mat-hint
                            >
                            @if (form.controls.domain.hasError("required")) {
                                <mat-error>Domain is required</mat-error>
                            }
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
                            @if (form.controls.apiToken.hasError("required")) {
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
                            <mat-hint
                                >Optional, for Caddy/reverse proxy
                                auth</mat-hint
                            >
                        </mat-form-field>

                        <button
                            mat-raised-button
                            color="primary"
                            type="submit"
                            [disabled]="form.invalid || loading()"
                            class="mt-2"
                        >
                            @if (loading()) {
                                <mat-spinner diameter="20" />
                            } @else {
                                <mat-icon>wifi_tethering</mat-icon>
                            }
                            Test Connection
                        </button>
                    </form>

                    @if (error()) {
                        <div
                            class="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700"
                            role="alert"
                        >
                            <strong>Connection failed:</strong> {{ error() }}
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
                                        stats()!.response.onlineStats.onlineNow
                                    }}
                                </div>
                                <div>
                                    <strong>Nodes Online:</strong>
                                    {{ stats()!.response.nodes.totalOnline }}
                                </div>
                                <div>
                                    <strong>Uptime:</strong>
                                    {{ formatUptime(stats()!.response.uptime) }}
                                </div>
                            </div>
                        </div>
                    }
                </mat-card-content>
            </mat-card>
        </div>
    `,
})
export class HomeComponent {
    private connectionConfig = inject(ConnectionConfigService);
    private systemApi = inject(SystemApiService);
    private localStorage = inject(LocalStorageService);
    private fb = inject(FormBuilder);

    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly stats = signal<GetStatsCommand.Response | null>(null);

    readonly form = this.fb.nonNullable.group({
        proxy: ["", Validators.required],
        domain: ["", Validators.required],
        port: [null as number | null],
        apiToken: ["", Validators.required],
        xApiKey: [""],
    });

    constructor() {
        const saved = this.localStorage.get<Record<string, unknown>>(
            CONNECTION_STORAGE_KEY
        );
        if (saved) {
            this.form.patchValue(saved);
        }
    }

    async testConnection(): Promise<void> {
        if (this.form.invalid) return;

        const { proxy, domain, port, apiToken, xApiKey } =
            this.form.getRawValue();

        this.connectionConfig.proxy.set(proxy);
        this.connectionConfig.domain.set(domain);
        this.connectionConfig.port.set(port);
        this.connectionConfig.apiToken.set(apiToken);
        this.connectionConfig.xApiKey.set(xApiKey);

        this.localStorage.set(CONNECTION_STORAGE_KEY, this.form.getRawValue());

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
}
