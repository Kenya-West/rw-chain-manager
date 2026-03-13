import { inject, Injectable } from "@angular/core";

import {
    CreateConfigProfileCommand,
    DeleteConfigProfileCommand,
    GetAllInboundsCommand,
    GetComputedConfigProfileByUuidCommand,
    GetConfigProfileByUuidCommand,
    GetConfigProfilesCommand,
    GetInboundsByProfileUuidCommand,
    ReorderConfigProfileCommand,
    UpdateConfigProfileCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class ConfigProfilesApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateConfigProfileCommand.Request
    ): Promise<CreateConfigProfileCommand.Response> {
        return this.api.request({
            method: CreateConfigProfileCommand.endpointDetails.REQUEST_METHOD,
            url: CreateConfigProfileCommand.url,
            body,
        });
    }

    getAll(): Promise<GetConfigProfilesCommand.Response> {
        return this.api.request({
            method: GetConfigProfilesCommand.endpointDetails.REQUEST_METHOD,
            url: GetConfigProfilesCommand.url,
        });
    }

    getByUuid(uuid: string): Promise<GetConfigProfileByUuidCommand.Response> {
        return this.api.request({
            method: GetConfigProfileByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetConfigProfileByUuidCommand.url(uuid),
        });
    }

    getComputedByUuid(
        uuid: string
    ): Promise<GetComputedConfigProfileByUuidCommand.Response> {
        return this.api.request({
            method: GetComputedConfigProfileByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetComputedConfigProfileByUuidCommand.url(uuid),
        });
    }

    update(
        body: UpdateConfigProfileCommand.Request
    ): Promise<UpdateConfigProfileCommand.Response> {
        return this.api.request({
            method: UpdateConfigProfileCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateConfigProfileCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteConfigProfileCommand.Response> {
        return this.api.request({
            method: DeleteConfigProfileCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteConfigProfileCommand.url(uuid),
        });
    }

    getAllInbounds(): Promise<GetAllInboundsCommand.Response> {
        return this.api.request({
            method: GetAllInboundsCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllInboundsCommand.url,
        });
    }

    getInboundsByProfileUuid(
        uuid: string
    ): Promise<GetInboundsByProfileUuidCommand.Response> {
        return this.api.request({
            method: GetInboundsByProfileUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetInboundsByProfileUuidCommand.url(uuid),
        });
    }

    reorder(
        body: ReorderConfigProfileCommand.Request
    ): Promise<ReorderConfigProfileCommand.Response> {
        return this.api.request({
            method: ReorderConfigProfileCommand.endpointDetails.REQUEST_METHOD,
            url: ReorderConfigProfileCommand.url,
            body,
        });
    }
}
