import { inject, Injectable } from "@angular/core";

import {
    GetLegacyStatsNodeUserUsageCommand,
    GetLegacyStatsUserUsageCommand,
    GetStatsNodeUsersUsageCommand,
    GetStatsNodesUsageCommand,
    GetStatsUserUsageCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class BandwidthStatsApiService {
    private api = inject(BaseApiService);

    getNodesUsage(): Promise<GetStatsNodesUsageCommand.Response> {
        return this.api.request({
            method: GetStatsNodesUsageCommand.endpointDetails.REQUEST_METHOD,
            url: GetStatsNodesUsageCommand.url,
        });
    }

    getNodeUsersUsage(
        uuid: string,
        queryParams?: Omit<GetStatsNodeUsersUsageCommand.Request, "uuid">
    ): Promise<GetStatsNodeUsersUsageCommand.Response> {
        return this.api.request({
            method: GetStatsNodeUsersUsageCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetStatsNodeUsersUsageCommand.url(uuid),
            queryParams: queryParams as Record<string, string | undefined>,
        });
    }

    getUserUsage(
        uuid: string,
        queryParams?: Omit<GetStatsUserUsageCommand.Request, "uuid">
    ): Promise<GetStatsUserUsageCommand.Response> {
        return this.api.request({
            method: GetStatsUserUsageCommand.endpointDetails.REQUEST_METHOD,
            url: GetStatsUserUsageCommand.url(uuid),
            queryParams: queryParams as Record<string, string | undefined>,
        });
    }

    getLegacyNodeUserUsage(
        uuid: string,
        queryParams?: Omit<GetLegacyStatsNodeUserUsageCommand.Request, "uuid">
    ): Promise<GetLegacyStatsNodeUserUsageCommand.Response> {
        return this.api.request({
            method: GetLegacyStatsNodeUserUsageCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetLegacyStatsNodeUserUsageCommand.url(uuid),
            queryParams: queryParams as Record<string, string | undefined>,
        });
    }

    getLegacyUserUsage(
        uuid: string,
        queryParams?: Omit<GetLegacyStatsUserUsageCommand.Request, "uuid">
    ): Promise<GetLegacyStatsUserUsageCommand.Response> {
        return this.api.request({
            method: GetLegacyStatsUserUsageCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetLegacyStatsUserUsageCommand.url(uuid),
            queryParams: queryParams as Record<string, string | undefined>,
        });
    }
}
