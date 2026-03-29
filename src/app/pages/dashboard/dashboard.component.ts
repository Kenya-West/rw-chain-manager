import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { ConnectionConfigService } from "../../services/connection-config.service";

@Component({
    selector: "app-dashboard",
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
    template: `
        <h1 class="mb-6 text-2xl font-semibold text-gray-800">Dashboard</h1>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <mat-card appearance="outlined">
                <mat-card-header>
                    <mat-icon matCardAvatar>settings_ethernet</mat-icon>
                    <mat-card-title>Connection</mat-card-title>
                    <mat-card-subtitle>
                        {{
                            connectionConfig.isConfigured()
                                ? "Connected"
                                : "Not configured"
                        }}
                    </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <p class="text-sm text-gray-600">
                        Configure your Remnawave panel connection settings.
                    </p>
                </mat-card-content>
                <mat-card-actions>
                    <a mat-button routerLink="/connection">
                        {{
                            connectionConfig.isConfigured()
                                ? "View Settings"
                                : "Configure"
                        }}
                    </a>
                </mat-card-actions>
            </mat-card>

            <mat-card appearance="outlined">
                <mat-card-header>
                    <mat-icon matCardAvatar>link</mat-icon>
                    <mat-card-title>Proxy Chains</mat-card-title>
                    <mat-card-subtitle>Detect</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <p class="text-sm text-gray-600">
                        View and detect proxy chains and their configurations.
                    </p>
                </mat-card-content>
                <mat-card-actions>
                    <a mat-button routerLink="/chains">
                        {{
                            connectionConfig.isConfigured()
                                ? "View Settings"
                                : "Configure"
                        }}
                    </a>
                </mat-card-actions>
            </mat-card>

            <mat-card appearance="outlined">
                <mat-card-header>
                    <mat-icon matCardAvatar>troubleshoot</mat-icon>
                    <mat-card-title>Chain Diagnostics</mat-card-title>
                    <mat-card-subtitle>Inspect</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <p class="text-sm text-gray-600">
                        Inspect and diagnose issues with your proxy chains in
                        your Remnawave setup.
                    </p>
                </mat-card-content>
                <mat-card-actions>
                    <a mat-button routerLink="/chain-diagnose">
                        {{
                            connectionConfig.isConfigured()
                                ? "Run Diagnostics"
                                : "Configure Connection"
                        }}
                    </a>
                </mat-card-actions>
            </mat-card>
        </div>
    `,
})
export class DashboardComponent {
    readonly connectionConfig = inject(ConnectionConfigService);
}
