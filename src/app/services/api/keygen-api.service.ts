import { inject, Injectable } from "@angular/core";

import { GetPubKeyCommand } from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class KeygenApiService {
    private api = inject(BaseApiService);

    getPubKey(): Promise<GetPubKeyCommand.Response> {
        return this.api.request({
            method: GetPubKeyCommand.endpointDetails.REQUEST_METHOD,
            url: GetPubKeyCommand.url,
        });
    }
}
