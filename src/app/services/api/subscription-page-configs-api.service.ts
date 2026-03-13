import { inject, Injectable } from "@angular/core";

import {
    CloneSubscriptionPageConfigCommand,
    CreateSubscriptionPageConfigCommand,
    DeleteSubscriptionPageConfigCommand,
    GetSubscriptionPageConfigCommand,
    GetSubscriptionPageConfigsCommand,
    ReorderSubscriptionPageConfigsCommand,
    UpdateSubscriptionPageConfigCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SubscriptionPageConfigsApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateSubscriptionPageConfigCommand.Request
    ): Promise<CreateSubscriptionPageConfigCommand.Response> {
        return this.api.request({
            method: CreateSubscriptionPageConfigCommand.endpointDetails
                .REQUEST_METHOD,
            url: CreateSubscriptionPageConfigCommand.url,
            body,
        });
    }

    getAll(): Promise<GetSubscriptionPageConfigsCommand.Response> {
        return this.api.request({
            method: GetSubscriptionPageConfigsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionPageConfigsCommand.url,
        });
    }

    getByUuid(
        uuid: string
    ): Promise<GetSubscriptionPageConfigCommand.Response> {
        return this.api.request({
            method: GetSubscriptionPageConfigCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionPageConfigCommand.url(uuid),
        });
    }

    update(
        body: UpdateSubscriptionPageConfigCommand.Request
    ): Promise<UpdateSubscriptionPageConfigCommand.Response> {
        return this.api.request({
            method: UpdateSubscriptionPageConfigCommand.endpointDetails
                .REQUEST_METHOD,
            url: UpdateSubscriptionPageConfigCommand.url,
            body,
        });
    }

    delete(
        uuid: string
    ): Promise<DeleteSubscriptionPageConfigCommand.Response> {
        return this.api.request({
            method: DeleteSubscriptionPageConfigCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteSubscriptionPageConfigCommand.url(uuid),
        });
    }

    reorder(
        body: ReorderSubscriptionPageConfigsCommand.Request
    ): Promise<ReorderSubscriptionPageConfigsCommand.Response> {
        return this.api.request({
            method: ReorderSubscriptionPageConfigsCommand.endpointDetails
                .REQUEST_METHOD,
            url: ReorderSubscriptionPageConfigsCommand.url,
            body,
        });
    }

    clone(
        body: CloneSubscriptionPageConfigCommand.Request
    ): Promise<CloneSubscriptionPageConfigCommand.Response> {
        return this.api.request({
            method: CloneSubscriptionPageConfigCommand.endpointDetails
                .REQUEST_METHOD,
            url: CloneSubscriptionPageConfigCommand.url,
            body,
        });
    }
}
