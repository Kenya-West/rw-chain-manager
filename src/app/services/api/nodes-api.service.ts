import { inject, Injectable } from "@angular/core";

import {
    BulkNodesActionsCommand,
    BulkNodesProfileModificationCommand,
    BulkNodesUpdateCommand,
    CreateNodeCommand,
    DeleteNodeCommand,
    DisableNodeCommand,
    EnableNodeCommand,
    GetAllNodesCommand,
    GetAllNodesTagsCommand,
    GetOneNodeCommand,
    ReorderNodeCommand,
    ResetNodeTrafficCommand,
    RestartAllNodesCommand,
    RestartNodeCommand,
    UpdateNodeCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class NodesApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateNodeCommand.Request
    ): Promise<CreateNodeCommand.Response> {
        return this.api.request({
            method: CreateNodeCommand.endpointDetails.REQUEST_METHOD,
            url: CreateNodeCommand.url,
            body,
        });
    }

    update(
        body: UpdateNodeCommand.Request
    ): Promise<UpdateNodeCommand.Response> {
        return this.api.request({
            method: UpdateNodeCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateNodeCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteNodeCommand.Response> {
        return this.api.request({
            method: DeleteNodeCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteNodeCommand.url(uuid),
        });
    }

    getAll(): Promise<GetAllNodesCommand.Response> {
        return this.api.request({
            method: GetAllNodesCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllNodesCommand.url,
        });
    }

    getOne(uuid: string): Promise<GetOneNodeCommand.Response> {
        return this.api.request({
            method: GetOneNodeCommand.endpointDetails.REQUEST_METHOD,
            url: GetOneNodeCommand.url(uuid),
        });
    }

    disable(uuid: string): Promise<DisableNodeCommand.Response> {
        return this.api.request({
            method: DisableNodeCommand.endpointDetails.REQUEST_METHOD,
            url: DisableNodeCommand.url(uuid),
        });
    }

    enable(uuid: string): Promise<EnableNodeCommand.Response> {
        return this.api.request({
            method: EnableNodeCommand.endpointDetails.REQUEST_METHOD,
            url: EnableNodeCommand.url(uuid),
        });
    }

    reorder(
        body: ReorderNodeCommand.Request
    ): Promise<ReorderNodeCommand.Response> {
        return this.api.request({
            method: ReorderNodeCommand.endpointDetails.REQUEST_METHOD,
            url: ReorderNodeCommand.url,
            body,
        });
    }

    resetTraffic(uuid: string): Promise<ResetNodeTrafficCommand.Response> {
        return this.api.request({
            method: ResetNodeTrafficCommand.endpointDetails.REQUEST_METHOD,
            url: ResetNodeTrafficCommand.url(uuid),
        });
    }

    restart(uuid: string): Promise<RestartNodeCommand.Response> {
        return this.api.request({
            method: RestartNodeCommand.endpointDetails.REQUEST_METHOD,
            url: RestartNodeCommand.url(uuid),
        });
    }

    restartAll(): Promise<RestartAllNodesCommand.Response> {
        return this.api.request({
            method: RestartAllNodesCommand.endpointDetails.REQUEST_METHOD,
            url: RestartAllNodesCommand.url,
        });
    }

    bulkActions(
        body: BulkNodesActionsCommand.Request
    ): Promise<BulkNodesActionsCommand.Response> {
        return this.api.request({
            method: BulkNodesActionsCommand.endpointDetails.REQUEST_METHOD,
            url: BulkNodesActionsCommand.url,
            body,
        });
    }

    bulkUpdate(
        body: BulkNodesUpdateCommand.Request
    ): Promise<BulkNodesUpdateCommand.Response> {
        return this.api.request({
            method: BulkNodesUpdateCommand.endpointDetails.REQUEST_METHOD,
            url: BulkNodesUpdateCommand.url,
            body,
        });
    }

    bulkProfileModification(
        body: BulkNodesProfileModificationCommand.Request
    ): Promise<BulkNodesProfileModificationCommand.Response> {
        return this.api.request({
            method: BulkNodesProfileModificationCommand.endpointDetails
                .REQUEST_METHOD,
            url: BulkNodesProfileModificationCommand.url,
            body,
        });
    }

    getAllTags(): Promise<GetAllNodesTagsCommand.Response> {
        return this.api.request({
            method: GetAllNodesTagsCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllNodesTagsCommand.url,
        });
    }
}
