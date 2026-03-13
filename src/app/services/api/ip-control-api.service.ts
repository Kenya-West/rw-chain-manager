import { inject, Injectable } from "@angular/core";

import {
    DropConnectionsCommand,
    FetchIpsCommand,
    FetchIpsResultCommand,
    FetchUsersIpsCommand,
    FetchUsersIpsResultCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class IpControlApiService {
    private api = inject(BaseApiService);

    fetchIps(
        uuid: string,
        body: FetchIpsCommand.Request
    ): Promise<FetchIpsCommand.Response> {
        return this.api.request({
            method: FetchIpsCommand.endpointDetails.REQUEST_METHOD,
            url: FetchIpsCommand.url(uuid),
            body,
        });
    }

    fetchIpsResult(jobId: string): Promise<FetchIpsResultCommand.Response> {
        return this.api.request({
            method: FetchIpsResultCommand.endpointDetails.REQUEST_METHOD,
            url: FetchIpsResultCommand.url(jobId),
        });
    }

    fetchUsersIps(
        nodeUuid: string,
        body: FetchUsersIpsCommand.Request
    ): Promise<FetchUsersIpsCommand.Response> {
        return this.api.request({
            method: FetchUsersIpsCommand.endpointDetails.REQUEST_METHOD,
            url: FetchUsersIpsCommand.url(nodeUuid),
            body,
        });
    }

    fetchUsersIpsResult(
        jobId: string
    ): Promise<FetchUsersIpsResultCommand.Response> {
        return this.api.request({
            method: FetchUsersIpsResultCommand.endpointDetails.REQUEST_METHOD,
            url: FetchUsersIpsResultCommand.url(jobId),
        });
    }

    dropConnections(
        body: DropConnectionsCommand.Request
    ): Promise<DropConnectionsCommand.Response> {
        return this.api.request({
            method: DropConnectionsCommand.endpointDetails.REQUEST_METHOD,
            url: DropConnectionsCommand.url,
            body,
        });
    }
}
