import { inject, Injectable } from "@angular/core";

import { z } from "zod";

import {
    GetPasskeyAuthenticationOptionsCommand,
    GetStatusCommand,
    LoginCommand,
    OAuth2AuthorizeCommand,
    OAuth2CallbackCommand,
    RegisterCommand,
    VerifyPasskeyAuthenticationCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class AuthApiService {
    private api = inject(BaseApiService);

    login(body: LoginCommand.Request): Promise<LoginCommand.Response> {
        return this.api.request({
            method: LoginCommand.endpointDetails.REQUEST_METHOD,
            url: LoginCommand.url,
            body,
        });
    }

    register(body: RegisterCommand.Request): Promise<RegisterCommand.Response> {
        return this.api.request({
            method: RegisterCommand.endpointDetails.REQUEST_METHOD,
            url: RegisterCommand.url,
            body,
        });
    }

    getStatus(): Promise<GetStatusCommand.Response> {
        return this.api.request({
            method: GetStatusCommand.endpointDetails.REQUEST_METHOD,
            url: GetStatusCommand.url,
        });
    }

    oauth2Authorize(
        body: z.infer<typeof OAuth2AuthorizeCommand.RequestSchema>
    ): Promise<OAuth2AuthorizeCommand.Response> {
        return this.api.request({
            method: OAuth2AuthorizeCommand.endpointDetails.REQUEST_METHOD,
            url: OAuth2AuthorizeCommand.url,
            body,
        });
    }

    oauth2Callback(
        body: OAuth2CallbackCommand.Request
    ): Promise<OAuth2CallbackCommand.Response> {
        return this.api.request({
            method: OAuth2CallbackCommand.endpointDetails.REQUEST_METHOD,
            url: OAuth2CallbackCommand.url,
            body,
        });
    }

    getPasskeyAuthenticationOptions(): Promise<GetPasskeyAuthenticationOptionsCommand.Response> {
        return this.api.request({
            method: GetPasskeyAuthenticationOptionsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetPasskeyAuthenticationOptionsCommand.url,
        });
    }

    verifyPasskeyAuthentication(
        body: VerifyPasskeyAuthenticationCommand.Request
    ): Promise<VerifyPasskeyAuthenticationCommand.Response> {
        return this.api.request({
            method: VerifyPasskeyAuthenticationCommand.endpointDetails
                .REQUEST_METHOD,
            url: VerifyPasskeyAuthenticationCommand.url,
            body,
        });
    }
}
