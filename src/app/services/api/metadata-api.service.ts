import { inject, Injectable } from "@angular/core";

import {
    GetNodeMetadataCommand,
    GetUserMetadataCommand,
    UpsertNodeMetadataCommand,
    UpsertUserMetadataCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class MetadataApiService {
    private api = inject(BaseApiService);

    getNodeMetadata(uuid: string): Promise<GetNodeMetadataCommand.Response> {
        return this.api.request({
            method: GetNodeMetadataCommand.endpointDetails.REQUEST_METHOD,
            url: GetNodeMetadataCommand.url(uuid),
        });
    }

    upsertNodeMetadata(
        uuid: string,
        body: UpsertNodeMetadataCommand.RequestBody
    ): Promise<UpsertNodeMetadataCommand.Response> {
        return this.api.request({
            method: UpsertNodeMetadataCommand.endpointDetails.REQUEST_METHOD,
            url: UpsertNodeMetadataCommand.url(uuid),
            body,
        });
    }

    getUserMetadata(uuid: string): Promise<GetUserMetadataCommand.Response> {
        return this.api.request({
            method: GetUserMetadataCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserMetadataCommand.url(uuid),
        });
    }

    upsertUserMetadata(
        uuid: string,
        body: UpsertUserMetadataCommand.RequestBody
    ): Promise<UpsertUserMetadataCommand.Response> {
        return this.api.request({
            method: UpsertUserMetadataCommand.endpointDetails.REQUEST_METHOD,
            url: UpsertUserMetadataCommand.url(uuid),
            body,
        });
    }
}
