import { Injectable, signal, computed } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ConnectionConfigService {
    readonly proxy = signal("");
    readonly domain = signal("");
    readonly port = signal<number | null>(null);
    readonly apiToken = signal("");
    readonly xApiKey = signal("");

    readonly baseUrl = computed(() => {
        const d = this.domain();
        const p = this.port();
        if (!d) return "";
        return p ? `${d}:${p}` : d;
    });

    readonly isConfigured = computed(() => {
        return this.baseUrl() !== "" && this.apiToken() !== "";
    });
}
