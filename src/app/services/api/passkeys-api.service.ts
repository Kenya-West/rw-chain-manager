import { inject, Injectable } from "@angular/core";

import {
    DeletePasskeyCommand,
    GetAllPasskeysCommand,
    GetPasskeyRegistrationOptionsCommand,
    UpdatePasskeyCommand,
    VerifyPasskeyRegistrationCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class PasskeysApiService {
    private api = inject(BaseApiService);

    getRegistrationOptions(): Promise<GetPasskeyRegistrationOptionsCommand.Response> {
        return this.api.request({
            method: GetPasskeyRegistrationOptionsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetPasskeyRegistrationOptionsCommand.url,
        });
    }

    verifyRegistration(
        body: VerifyPasskeyRegistrationCommand.Request
    ): Promise<VerifyPasskeyRegistrationCommand.Response> {
        return this.api.request({
            method: VerifyPasskeyRegistrationCommand.endpointDetails
                .REQUEST_METHOD,
            url: VerifyPasskeyRegistrationCommand.url,
            body,
        });
    }

    getAll(): Promise<GetAllPasskeysCommand.Response> {
        return this.api.request({
            method: GetAllPasskeysCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllPasskeysCommand.url,
        });
    }

    update(
        body: UpdatePasskeyCommand.Request
    ): Promise<UpdatePasskeyCommand.Response> {
        return this.api.request({
            method: UpdatePasskeyCommand.endpointDetails.REQUEST_METHOD,
            url: UpdatePasskeyCommand.url,
            body,
        });
    }

    delete(
        body: DeletePasskeyCommand.Request
    ): Promise<DeletePasskeyCommand.Response> {
        return this.api.request({
            method: DeletePasskeyCommand.endpointDetails.REQUEST_METHOD,
            url: DeletePasskeyCommand.url,
            body,
        });
    }
}
