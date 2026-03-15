import { Injectable } from "@angular/core";

interface DnsAnswer {
    name: string;
    type: number;
    data: string;
}

interface DnsResponse {
    Answer?: DnsAnswer[];
}

@Injectable({ providedIn: "root" })
export class DnsService {
    private cache = new Map<string, string[]>();

    async resolve(domain: string): Promise<string[]> {
        const hostname = this.extractHostname(domain);
        if (this.isIpAddress(hostname)) return [hostname];
        if (this.cache.has(hostname)) return this.cache.get(hostname)!;

        try {
            const res = await fetch(
                `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`,
                { headers: { Accept: "application/dns-json" } }
            );
            if (!res.ok) return [];

            const data: DnsResponse = await res.json();
            const ips = (data.Answer ?? [])
                .filter((a) => a.type === 1)
                .map((a) => a.data);

            this.cache.set(hostname, ips);
            return ips;
        } catch {
            return [];
        }
    }

    async resolveAll(
        domains: string[]
    ): Promise<Map<string, string[]>> {
        const unique = [
            ...new Set(domains.map((d) => this.extractHostname(d))),
        ];
        const results = await Promise.allSettled(
            unique.map(async (d) => ({
                domain: d,
                ips: await this.resolve(d),
            }))
        );

        const map = new Map<string, string[]>();
        for (const r of results) {
            if (r.status === "fulfilled") {
                map.set(r.value.domain, r.value.ips);
            }
        }
        return map;
    }

    clearCache(): void {
        this.cache.clear();
    }

    isIpAddress(address: string): boolean {
        return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(address);
    }

    extractHostname(address: string): string {
        return address
            .replace(/^https?:\/\//, "")
            .split("/")[0]
            .split(":")[0];
    }
}
