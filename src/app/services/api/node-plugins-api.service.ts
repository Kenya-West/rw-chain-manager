import { inject, Injectable } from "@angular/core";

import {
    CloneNodePluginCommand,
    CreateNodePluginCommand,
    DeleteNodePluginCommand,
    GetNodePluginCommand,
    GetNodePluginsCommand,
    GetTorrentBlockerReportsCommand,
    GetTorrentBlockerReportsStatsCommand,
    PluginExecutorCommand,
    ReorderNodePluginCommand,
    TruncateTorrentBlockerReportsCommand,
    UpdateNodePluginCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class NodePluginsApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateNodePluginCommand.Request
    ): Promise<CreateNodePluginCommand.Response> {
        return this.api.request({
            method: CreateNodePluginCommand.endpointDetails.REQUEST_METHOD,
            url: CreateNodePluginCommand.url,
            body,
        });
    }

    getAll(): Promise<GetNodePluginsCommand.Response> {
        return this.api.request({
            method: GetNodePluginsCommand.endpointDetails.REQUEST_METHOD,
            url: GetNodePluginsCommand.url,
        });
    }

    getOne(uuid: string): Promise<GetNodePluginCommand.Response> {
        return this.api.request({
            method: GetNodePluginCommand.endpointDetails.REQUEST_METHOD,
            url: GetNodePluginCommand.url(uuid),
        });
    }

    update(
        body: UpdateNodePluginCommand.Request
    ): Promise<UpdateNodePluginCommand.Response> {
        return this.api.request({
            method: UpdateNodePluginCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateNodePluginCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteNodePluginCommand.Response> {
        return this.api.request({
            method: DeleteNodePluginCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteNodePluginCommand.url(uuid),
        });
    }

    execute(
        body: PluginExecutorCommand.Request
    ): Promise<PluginExecutorCommand.Response> {
        return this.api.request({
            method: PluginExecutorCommand.endpointDetails.REQUEST_METHOD,
            url: PluginExecutorCommand.url,
            body,
        });
    }

    clone(
        body: CloneNodePluginCommand.Request
    ): Promise<CloneNodePluginCommand.Response> {
        return this.api.request({
            method: CloneNodePluginCommand.endpointDetails.REQUEST_METHOD,
            url: CloneNodePluginCommand.url,
            body,
        });
    }

    reorder(
        body: ReorderNodePluginCommand.Request
    ): Promise<ReorderNodePluginCommand.Response> {
        return this.api.request({
            method: ReorderNodePluginCommand.endpointDetails.REQUEST_METHOD,
            url: ReorderNodePluginCommand.url,
            body,
        });
    }

    getTorrentBlockerReportsStats(): Promise<GetTorrentBlockerReportsStatsCommand.Response> {
        return this.api.request({
            method: GetTorrentBlockerReportsStatsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetTorrentBlockerReportsStatsCommand.url,
        });
    }

    getTorrentBlockerReports(
        queryParams: GetTorrentBlockerReportsCommand.RequestQuery
    ): Promise<GetTorrentBlockerReportsCommand.Response> {
        return this.api.request({
            method: GetTorrentBlockerReportsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetTorrentBlockerReportsCommand.url,
            queryParams: queryParams as unknown as Record<string, string>,
        });
    }

    truncateTorrentBlockerReports(): Promise<TruncateTorrentBlockerReportsCommand.Response> {
        return this.api.request({
            method: TruncateTorrentBlockerReportsCommand.endpointDetails
                .REQUEST_METHOD,
            url: TruncateTorrentBlockerReportsCommand.url,
        });
    }
}
