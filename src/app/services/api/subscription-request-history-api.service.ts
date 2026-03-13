import { inject, Injectable } from "@angular/core";

import {
    GetSubscriptionRequestHistoryCommand,
    GetSubscriptionRequestHistoryStatsCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SubscriptionRequestHistoryApiService {
    private api = inject(BaseApiService);

    getAll(): Promise<GetSubscriptionRequestHistoryCommand.Response> {
        return this.api.request({
            method: GetSubscriptionRequestHistoryCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionRequestHistoryCommand.url,
        });
    }

    getStats(): Promise<GetSubscriptionRequestHistoryStatsCommand.Response> {
        return this.api.request({
            method: GetSubscriptionRequestHistoryStatsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionRequestHistoryStatsCommand.url,
        });
    }
}
