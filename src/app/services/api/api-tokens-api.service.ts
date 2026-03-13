import { inject, Injectable } from "@angular/core";

import {
    CreateApiTokenCommand,
    DeleteApiTokenCommand,
    FindAllApiTokensCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class ApiTokensApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateApiTokenCommand.Request
    ): Promise<CreateApiTokenCommand.Response> {
        return this.api.request({
            method: CreateApiTokenCommand.endpointDetails.REQUEST_METHOD,
            url: CreateApiTokenCommand.url,
            body,
        });
    }

    findAll(): Promise<FindAllApiTokensCommand.Response> {
        return this.api.request({
            method: FindAllApiTokensCommand.endpointDetails.REQUEST_METHOD,
            url: FindAllApiTokensCommand.url,
        });
    }

    delete(uuid: string): Promise<DeleteApiTokenCommand.Response> {
        return this.api.request({
            method: DeleteApiTokenCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteApiTokenCommand.url(uuid),
        });
    }
}
