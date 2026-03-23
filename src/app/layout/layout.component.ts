import { ChangeDetectionStrategy, Component } from "@angular/core";
import {
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
} from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";

import { routeFadeAnimation } from "../animations/route.animation";

@Component({
    selector: "app-layout",
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [routeFadeAnimation],
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatToolbarModule,
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatDividerModule,
    ],
    template: `
        <mat-sidenav-container class="h-full">
            <mat-sidenav #sidenav mode="side" opened class="w-64">
                <div class="flex items-center gap-3 px-4 py-5">
                    <mat-icon class="text-indigo-600">hub</mat-icon>
                    <span class="text-lg font-semibold tracking-tight"
                        >RW Chain Manager</span
                    >
                </div>
                <mat-divider />
                <mat-nav-list>
                    <a
                        mat-list-item
                        routerLink="/dashboard"
                        routerLinkActive
                        #rlaDashboard="routerLinkActive"
                        [activated]="rlaDashboard.isActive"
                    >
                        <mat-icon matListItemIcon>dashboard</mat-icon>
                        <span matListItemTitle>Dashboard</span>
                    </a>
                    <a
                        mat-list-item
                        routerLink="/connection"
                        routerLinkActive
                        #rlaConnection="routerLinkActive"
                        [activated]="rlaConnection.isActive"
                    >
                        <mat-icon matListItemIcon>settings_ethernet</mat-icon>
                        <span matListItemTitle>Connection</span>
                    </a>
                    <a
                        mat-list-item
                        routerLink="/chains"
                        routerLinkActive
                        #rlaChains="routerLinkActive"
                        [activated]="rlaChains.isActive"
                    >
                        <mat-icon matListItemIcon>link</mat-icon>
                        <span matListItemTitle>Proxy Chains</span>
                    </a>
                    <a
                        mat-list-item
                        routerLink="/chain-diagnose"
                        routerLinkActive
                        #rlaDiagnose="routerLinkActive"
                        [activated]="rlaDiagnose.isActive"
                    >
                        <mat-icon matListItemIcon>troubleshoot</mat-icon>
                        <span matListItemTitle>Chain Diagnose</span>
                    </a>
                    <mat-divider />
                    <a
                        mat-list-item
                        routerLink="/about"
                        routerLinkActive
                        #rlaAbout="routerLinkActive"
                        [activated]="rlaAbout.isActive"
                    >
                        <mat-icon matListItemIcon>info</mat-icon>
                        <span matListItemTitle>About</span>
                    </a>
                </mat-nav-list>
            </mat-sidenav>
            <mat-sidenav-content>
                <mat-toolbar color="primary">
                    <button
                        mat-icon-button
                        (click)="sidenav.toggle()"
                        aria-label="Toggle navigation menu"
                    >
                        <mat-icon>menu</mat-icon>
                    </button>
                    <span class="ml-2">RW Chain Manager</span>
                </mat-toolbar>
                <main
                    class="p-6"
                    [@routeFade]="prepareRoute(outlet)"
                >
                    <router-outlet #outlet="outlet" />
                </main>
            </mat-sidenav-content>
        </mat-sidenav-container>
    `,
    styles: [
        `
            :host {
                display: block;
                height: 100%;
            }
        `,
    ],
})
export class LayoutComponent {
    prepareRoute(outlet: RouterOutlet): string {
        return outlet.isActivated
            ? (outlet.activatedRoute.snapshot.routeConfig?.path ?? "")
            : "";
    }
}
