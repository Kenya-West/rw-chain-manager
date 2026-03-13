import { inject, Injectable } from "@angular/core";

import {
    GetRemnawaveSettingsCommand,
    UpdateRemnawaveSettingsCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class RemnawaveSettingsApiService {
    private api = inject(BaseApiService);

    get(): Promise<GetRemnawaveSettingsCommand.Response> {
        return this.api.request({
            method: GetRemnawaveSettingsCommand.endpointDetails.REQUEST_METHOD,
            url: GetRemnawaveSettingsCommand.url,
        });
    }

    update(
        body: UpdateRemnawaveSettingsCommand.Request
    ): Promise<UpdateRemnawaveSettingsCommand.Response> {
        return this.api.request({
            method: UpdateRemnawaveSettingsCommand.endpointDetails
                .REQUEST_METHOD,
            url: UpdateRemnawaveSettingsCommand.url,
            body,
        });
    }
}
