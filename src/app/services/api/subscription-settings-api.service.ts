import { inject, Injectable } from "@angular/core";

import {
    GetSubscriptionSettingsCommand,
    UpdateSubscriptionSettingsCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SubscriptionSettingsApiService {
    private api = inject(BaseApiService);

    get(): Promise<GetSubscriptionSettingsCommand.Response> {
        return this.api.request({
            method: GetSubscriptionSettingsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetSubscriptionSettingsCommand.url,
        });
    }

    update(
        body: UpdateSubscriptionSettingsCommand.Request
    ): Promise<UpdateSubscriptionSettingsCommand.Response> {
        return this.api.request({
            method: UpdateSubscriptionSettingsCommand.endpointDetails
                .REQUEST_METHOD,
            url: UpdateSubscriptionSettingsCommand.url,
            body,
        });
    }
}
