import { inject, Injectable } from "@angular/core";

import {
    GetAllSubscriptionsCommand,
    GetConnectionKeysByUuidCommand,
    GetRawSubscriptionByShortUuidCommand,
    GetSubpageConfigByShortUuidCommand,
    GetSubscriptionByShortUuidProtectedCommand,
    GetSubscriptionByUsernameCommand,
    GetSubscriptionByUuidCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SubscriptionsApiService {
    private api = inject(BaseApiService);

    getAll(): Promise<GetAllSubscriptionsCommand.Response> {
        return this.api.request({
            method: GetAllSubscriptionsCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllSubscriptionsCommand.url,
        });
    }

    getByUuid(uuid: string): Promise<GetSubscriptionByUuidCommand.Response> {
        return this.api.request({
            method: GetSubscriptionByUuidCommand.endpointDetails.REQUEST_METHOD,
            url: GetSubscriptionByUuidCommand.url(uuid),
        });
    }

    getByUsername(
        username: string
    ): Promise<GetSubscriptionByUsernameCommand.Response> {
        return this.api.request({
            method: GetSubscriptionByUsernameCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionByUsernameCommand.url(username),
        });
    }

    getByShortUuidProtected(
        shortUuid: string
    ): Promise<GetSubscriptionByShortUuidProtectedCommand.Response> {
        return this.api.request({
            method: GetSubscriptionByShortUuidProtectedCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionByShortUuidProtectedCommand.url(shortUuid),
        });
    }

    getRawByShortUuid(
        shortUuid: string
    ): Promise<GetRawSubscriptionByShortUuidCommand.Response> {
        return this.api.request({
            method: GetRawSubscriptionByShortUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetRawSubscriptionByShortUuidCommand.url(shortUuid),
        });
    }

    getConnectionKeysByUuid(
        uuid: string
    ): Promise<GetConnectionKeysByUuidCommand.Response> {
        return this.api.request({
            method: GetConnectionKeysByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetConnectionKeysByUuidCommand.url(uuid),
        });
    }

    getSubpageConfigByShortUuid(
        shortUuid: string
    ): Promise<GetSubpageConfigByShortUuidCommand.Response> {
        return this.api.request({
            method: GetSubpageConfigByShortUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubpageConfigByShortUuidCommand.url(shortUuid),
        });
    }
}
