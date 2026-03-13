import { inject, Injectable } from "@angular/core";

import {
    CreateSubscriptionTemplateCommand,
    DeleteSubscriptionTemplateCommand,
    GetSubscriptionTemplateCommand,
    GetSubscriptionTemplatesCommand,
    ReorderSubscriptionTemplateCommand,
    UpdateSubscriptionTemplateCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SubscriptionTemplateApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateSubscriptionTemplateCommand.Request
    ): Promise<CreateSubscriptionTemplateCommand.Response> {
        return this.api.request({
            method: CreateSubscriptionTemplateCommand.endpointDetails
                .REQUEST_METHOD,
            url: CreateSubscriptionTemplateCommand.url,
            body,
        });
    }

    getAll(): Promise<GetSubscriptionTemplatesCommand.Response> {
        return this.api.request({
            method: GetSubscriptionTemplatesCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionTemplatesCommand.url,
        });
    }

    getByUuid(uuid: string): Promise<GetSubscriptionTemplateCommand.Response> {
        return this.api.request({
            method: GetSubscriptionTemplateCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionTemplateCommand.url(uuid),
        });
    }

    update(
        body: UpdateSubscriptionTemplateCommand.Request
    ): Promise<UpdateSubscriptionTemplateCommand.Response> {
        return this.api.request({
            method: UpdateSubscriptionTemplateCommand.endpointDetails
                .REQUEST_METHOD,
            url: UpdateSubscriptionTemplateCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteSubscriptionTemplateCommand.Response> {
        return this.api.request({
            method: DeleteSubscriptionTemplateCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteSubscriptionTemplateCommand.url(uuid),
        });
    }

    reorder(
        body: ReorderSubscriptionTemplateCommand.Request
    ): Promise<ReorderSubscriptionTemplateCommand.Response> {
        return this.api.request({
            method: ReorderSubscriptionTemplateCommand.endpointDetails
                .REQUEST_METHOD,
            url: ReorderSubscriptionTemplateCommand.url,
            body,
        });
    }
}
