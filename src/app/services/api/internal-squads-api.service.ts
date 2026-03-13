import { inject, Injectable } from "@angular/core";

import {
    AddUsersToInternalSquadCommand,
    CreateInternalSquadCommand,
    DeleteInternalSquadCommand,
    DeleteUsersFromInternalSquadCommand,
    GetInternalSquadAccessibleNodesCommand,
    GetInternalSquadByUuidCommand,
    GetInternalSquadsCommand,
    ReorderInternalSquadCommand,
    UpdateInternalSquadCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class InternalSquadsApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateInternalSquadCommand.Request
    ): Promise<CreateInternalSquadCommand.Response> {
        return this.api.request({
            method: CreateInternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: CreateInternalSquadCommand.url,
            body,
        });
    }

    getAll(): Promise<GetInternalSquadsCommand.Response> {
        return this.api.request({
            method: GetInternalSquadsCommand.endpointDetails.REQUEST_METHOD,
            url: GetInternalSquadsCommand.url,
        });
    }

    getByUuid(uuid: string): Promise<GetInternalSquadByUuidCommand.Response> {
        return this.api.request({
            method: GetInternalSquadByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetInternalSquadByUuidCommand.url(uuid),
        });
    }

    update(
        body: UpdateInternalSquadCommand.Request
    ): Promise<UpdateInternalSquadCommand.Response> {
        return this.api.request({
            method: UpdateInternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateInternalSquadCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteInternalSquadCommand.Response> {
        return this.api.request({
            method: DeleteInternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteInternalSquadCommand.url(uuid),
        });
    }

    getAccessibleNodes(
        uuid: string
    ): Promise<GetInternalSquadAccessibleNodesCommand.Response> {
        return this.api.request({
            method: GetInternalSquadAccessibleNodesCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetInternalSquadAccessibleNodesCommand.url(uuid),
        });
    }

    reorder(
        body: ReorderInternalSquadCommand.Request
    ): Promise<ReorderInternalSquadCommand.Response> {
        return this.api.request({
            method: ReorderInternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: ReorderInternalSquadCommand.url,
            body,
        });
    }

    addUsers(
        uuid: string,
        body: AddUsersToInternalSquadCommand.Request
    ): Promise<AddUsersToInternalSquadCommand.Response> {
        return this.api.request({
            method: AddUsersToInternalSquadCommand.endpointDetails
                .REQUEST_METHOD,
            url: AddUsersToInternalSquadCommand.url(uuid),
            body,
        });
    }

    removeUsers(
        uuid: string,
        body: DeleteUsersFromInternalSquadCommand.Request
    ): Promise<DeleteUsersFromInternalSquadCommand.Response> {
        return this.api.request({
            method: DeleteUsersFromInternalSquadCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteUsersFromInternalSquadCommand.url(uuid),
            body,
        });
    }
}
