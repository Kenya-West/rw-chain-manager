import { inject, Injectable } from "@angular/core";

import {
    BulkDeleteHostsCommand,
    BulkDisableHostsCommand,
    BulkEnableHostsCommand,
    CreateHostCommand,
    DeleteHostCommand,
    GetAllHostsCommand,
    GetAllHostTagsCommand,
    GetOneHostCommand,
    ReorderHostCommand,
    SetInboundToManyHostsCommand,
    SetPortToManyHostsCommand,
    UpdateHostCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class HostsApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateHostCommand.Request
    ): Promise<CreateHostCommand.Response> {
        return this.api.request({
            method: CreateHostCommand.endpointDetails.REQUEST_METHOD,
            url: CreateHostCommand.url,
            body,
        });
    }

    update(
        body: UpdateHostCommand.Request
    ): Promise<UpdateHostCommand.Response> {
        return this.api.request({
            method: UpdateHostCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateHostCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteHostCommand.Response> {
        return this.api.request({
            method: DeleteHostCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteHostCommand.url(uuid),
        });
    }

    getAll(): Promise<GetAllHostsCommand.Response> {
        return this.api.request({
            method: GetAllHostsCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllHostsCommand.url,
        });
    }

    getOne(uuid: string): Promise<GetOneHostCommand.Response> {
        return this.api.request({
            method: GetOneHostCommand.endpointDetails.REQUEST_METHOD,
            url: GetOneHostCommand.url(uuid),
        });
    }

    reorder(
        body: ReorderHostCommand.Request
    ): Promise<ReorderHostCommand.Response> {
        return this.api.request({
            method: ReorderHostCommand.endpointDetails.REQUEST_METHOD,
            url: ReorderHostCommand.url,
            body,
        });
    }

    bulkDelete(
        body: BulkDeleteHostsCommand.Request
    ): Promise<BulkDeleteHostsCommand.Response> {
        return this.api.request({
            method: BulkDeleteHostsCommand.endpointDetails.REQUEST_METHOD,
            url: BulkDeleteHostsCommand.url,
            body,
        });
    }

    bulkDisable(
        body: BulkDisableHostsCommand.Request
    ): Promise<BulkDisableHostsCommand.Response> {
        return this.api.request({
            method: BulkDisableHostsCommand.endpointDetails.REQUEST_METHOD,
            url: BulkDisableHostsCommand.url,
            body,
        });
    }

    bulkEnable(
        body: BulkEnableHostsCommand.Request
    ): Promise<BulkEnableHostsCommand.Response> {
        return this.api.request({
            method: BulkEnableHostsCommand.endpointDetails.REQUEST_METHOD,
            url: BulkEnableHostsCommand.url,
            body,
        });
    }

    setInboundToMany(
        body: SetInboundToManyHostsCommand.Request
    ): Promise<SetInboundToManyHostsCommand.Response> {
        return this.api.request({
            method: SetInboundToManyHostsCommand.endpointDetails.REQUEST_METHOD,
            url: SetInboundToManyHostsCommand.url,
            body,
        });
    }

    setPortToMany(
        body: SetPortToManyHostsCommand.Request
    ): Promise<SetPortToManyHostsCommand.Response> {
        return this.api.request({
            method: SetPortToManyHostsCommand.endpointDetails.REQUEST_METHOD,
            url: SetPortToManyHostsCommand.url,
            body,
        });
    }

    getAllTags(): Promise<GetAllHostTagsCommand.Response> {
        return this.api.request({
            method: GetAllHostTagsCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllHostTagsCommand.url,
        });
    }
}
