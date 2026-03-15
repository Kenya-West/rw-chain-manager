import { Injectable, inject, signal, computed } from "@angular/core";

import { LocalStorageService } from "./local-storage.service";

export interface ConnectionProfile {
    id: string;
    name: string;
    proxy: string;
    domain: string;
    port: number | null;
    apiToken: string;
    xApiKey: string;
}

const PROFILES_KEY = "rw-connection-profiles";
const ACTIVE_PROFILE_KEY = "rw-active-profile";
const OLD_CONNECTION_KEY = "rw-connection-config";

@Injectable({ providedIn: "root" })
export class ConnectionConfigService {
    private localStorage = inject(LocalStorageService);

    readonly profiles = signal<ConnectionProfile[]>([]);
    readonly activeProfileId = signal<string | null>(null);

    readonly activeProfile = computed(() => {
        const id = this.activeProfileId();
        return this.profiles().find((p) => p.id === id) ?? null;
    });

    readonly proxy = computed(() => this.activeProfile()?.proxy ?? "");
    readonly domain = computed(() => this.activeProfile()?.domain ?? "");
    readonly port = computed(() => this.activeProfile()?.port ?? null);
    readonly apiToken = computed(() => this.activeProfile()?.apiToken ?? "");
    readonly xApiKey = computed(() => this.activeProfile()?.xApiKey ?? "");

    readonly baseUrl = computed(() => {
        const d = this.domain();
        const p = this.port();
        if (!d) return "";
        return p ? `${d}:${p}` : d;
    });

    readonly isConfigured = computed(() => {
        return this.baseUrl() !== "" && this.apiToken() !== "";
    });

    constructor() {
        const saved =
            this.localStorage.get<ConnectionProfile[]>(PROFILES_KEY);
        if (saved && saved.length > 0) {
            this.profiles.set(saved);
            this.activeProfileId.set(
                this.localStorage.get<string>(ACTIVE_PROFILE_KEY)
            );
        } else {
            this.migrateOldConfig();
        }
    }

    saveProfile(input: Omit<ConnectionProfile, "id"> & { id?: string }): string {
        const id = input.id ?? crypto.randomUUID();
        const profile: ConnectionProfile = { ...input, id };

        this.profiles.update((list) => {
            const idx = list.findIndex((p) => p.id === id);
            if (idx >= 0) {
                const updated = [...list];
                updated[idx] = profile;
                return updated;
            }
            return [...list, profile];
        });

        this.persist();
        return id;
    }

    deleteProfile(id: string): void {
        this.profiles.update((list) => list.filter((p) => p.id !== id));
        if (this.activeProfileId() === id) {
            this.activeProfileId.set(null);
        }
        this.persist();
    }

    activateProfile(id: string): void {
        this.activeProfileId.set(id);
        this.localStorage.set(ACTIVE_PROFILE_KEY, id);
    }

    exportProfiles(): string {
        return JSON.stringify(this.profiles(), null, 2);
    }

    importProfiles(json: string): void {
        const imported = JSON.parse(json) as ConnectionProfile[];
        this.profiles.update((existing) => {
            const existingIds = new Set(existing.map((p) => p.id));
            const newProfiles = imported.filter(
                (p) => !existingIds.has(p.id)
            );
            return [...existing, ...newProfiles];
        });
        this.persist();
    }

    private persist(): void {
        this.localStorage.set(PROFILES_KEY, this.profiles());
        const activeId = this.activeProfileId();
        if (activeId) {
            this.localStorage.set(ACTIVE_PROFILE_KEY, activeId);
        }
    }

    private migrateOldConfig(): void {
        const old =
            this.localStorage.get<Record<string, unknown>>(OLD_CONNECTION_KEY);
        if (!old) return;

        const profile: ConnectionProfile = {
            id: crypto.randomUUID(),
            name: "Default",
            proxy: (old["proxy"] as string) ?? "",
            domain: (old["domain"] as string) ?? "",
            port: (old["port"] as number | null) ?? null,
            apiToken: (old["apiToken"] as string) ?? "",
            xApiKey: (old["xApiKey"] as string) ?? "",
        };

        this.profiles.set([profile]);
        this.activeProfileId.set(profile.id);
        this.persist();
        this.localStorage.remove(OLD_CONNECTION_KEY);
    }
}
