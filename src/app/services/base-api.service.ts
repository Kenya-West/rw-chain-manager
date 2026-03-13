import { inject, Injectable } from "@angular/core";

import { ConnectionConfigService } from "./connection-config.service";

export interface ApiError {
    statusCode: number;
    message: string;
    error?: string;
}

@Injectable({ providedIn: "root" })
export class BaseApiService {
    private connectionConfig = inject(ConnectionConfigService);

    private get headers(): HeadersInit {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "x-forwarded-for": "127.0.0.1",
            "x-forwarded-proto": "https",
        };

        const token = this.connectionConfig.apiToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const xApiKey = this.connectionConfig.xApiKey();
        if (xApiKey) {
            headers["X-Api-Key"] = xApiKey;
        }

        return headers;
    }

    async request<TResponse>(options: {
        method: string;
        url: string;
        body?: unknown;
        queryParams?: Record<string, string | undefined>;
    }): Promise<TResponse> {
        const proxy = this.connectionConfig.proxy();
        const baseUrl = this.connectionConfig.baseUrl();
        if (!baseUrl) {
            throw new Error(
                "Connection not configured. Please set domain and API token."
            );
        }

        let fullUrl = `${proxy}/?${baseUrl}${options.url}`;

        if (options.queryParams) {
            const filtered = Object.entries(options.queryParams).filter(
                (entry): entry is [string, string] => entry[1] !== undefined
            );
            if (filtered.length > 0) {
                const params = new URLSearchParams(filtered);
                fullUrl += `?${params.toString()}`;
            }
        }

        const response = await fetch(fullUrl, {
            method: options.method.toUpperCase(),
            headers: this.headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
            let errorBody: ApiError | undefined;
            try {
                errorBody = await response.json();
            } catch {
                // response body is not JSON
            }
            throw new Error(
                errorBody?.message ??
                    `HTTP ${response.status}: ${response.statusText}`
            );
        }

        return response.json() as Promise<TResponse>;
    }
}
