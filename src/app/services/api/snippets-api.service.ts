import { inject, Injectable } from "@angular/core";

import {
    CreateSnippetCommand,
    DeleteSnippetCommand,
    GetSnippetsCommand,
    UpdateSnippetCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SnippetsApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateSnippetCommand.Request
    ): Promise<CreateSnippetCommand.Response> {
        return this.api.request({
            method: CreateSnippetCommand.endpointDetails.REQUEST_METHOD,
            url: CreateSnippetCommand.url,
            body,
        });
    }

    getAll(): Promise<GetSnippetsCommand.Response> {
        return this.api.request({
            method: GetSnippetsCommand.endpointDetails.REQUEST_METHOD,
            url: GetSnippetsCommand.url,
        });
    }

    update(
        body: UpdateSnippetCommand.Request
    ): Promise<UpdateSnippetCommand.Response> {
        return this.api.request({
            method: UpdateSnippetCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateSnippetCommand.url,
            body,
        });
    }

    delete(
        body: DeleteSnippetCommand.Request
    ): Promise<DeleteSnippetCommand.Response> {
        return this.api.request({
            method: DeleteSnippetCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteSnippetCommand.url,
            body,
        });
    }
}
