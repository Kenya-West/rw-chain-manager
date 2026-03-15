import { Routes } from "@angular/router";

export const routes: Routes = [
    {
        path: "",
        loadComponent: () =>
            import("./layout/layout.component").then(
                (m) => m.LayoutComponent
            ),
        children: [
            {
                path: "",
                redirectTo: "dashboard",
                pathMatch: "full",
            },
            {
                path: "dashboard",
                loadComponent: () =>
                    import("./pages/dashboard/dashboard.component").then(
                        (m) => m.DashboardComponent
                    ),
                data: { animation: "dashboard" },
            },
            {
                path: "connection",
                loadComponent: () =>
                    import("./pages/home/home.component").then(
                        (m) => m.HomeComponent
                    ),
                data: { animation: "connection" },
            },
            {
                path: "chains",
                loadComponent: () =>
                    import(
                        "./pages/proxy-chains/proxy-chains.component"
                    ).then((m) => m.ProxyChainsComponent),
                data: { animation: "chains" },
            },
            {
                path: "about",
                loadComponent: () =>
                    import("./pages/about/about.component").then(
                        (m) => m.AboutComponent
                    ),
                data: { animation: "about" },
            },
        ],
    },
];
