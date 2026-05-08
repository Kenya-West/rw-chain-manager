import { inject, Injectable } from "@angular/core";

import {
    GetSubscriptionByShortUuidByClientTypeCommand,
    GetSubscriptionByShortUuidCommand,
    GetSubscriptionInfoByShortUuidCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SubscriptionApiService {
    private api = inject(BaseApiService);

    getByShortUuid(shortUuid: string): Promise<unknown> {
        return this.api.request({
            method: "get",
            url: GetSubscriptionByShortUuidCommand.url(shortUuid),
        });
    }

    getByShortUuidByClientType(
        shortUuid: string,
        clientType: string
    ): Promise<unknown> {
        return this.api.request({
            method: "get",
            url: `${GetSubscriptionByShortUuidByClientTypeCommand.url(shortUuid)}/${clientType}`,
        });
    }

    getInfoByShortUuid(
        shortUuid: string
    ): Promise<GetSubscriptionInfoByShortUuidCommand.Response> {
        return this.api.request({
            method: GetSubscriptionInfoByShortUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionInfoByShortUuidCommand.url(shortUuid),
        });
    }
}
