import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LocalStorageService {
    get<T>(key: string): T | null {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }

    set<T>(key: string, value: T): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    remove(key: string): void {
        localStorage.removeItem(key);
    }
}
