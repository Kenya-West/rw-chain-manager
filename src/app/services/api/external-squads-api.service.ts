import { inject, Injectable } from "@angular/core";

import {
    AddUsersToExternalSquadCommand,
    CreateExternalSquadCommand,
    DeleteExternalSquadCommand,
    DeleteUsersFromExternalSquadCommand,
    GetExternalSquadByUuidCommand,
    GetExternalSquadsCommand,
    ReorderExternalSquadCommand,
    UpdateExternalSquadCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class ExternalSquadsApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateExternalSquadCommand.Request
    ): Promise<CreateExternalSquadCommand.Response> {
        return this.api.request({
            method: CreateExternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: CreateExternalSquadCommand.url,
            body,
        });
    }

    getAll(): Promise<GetExternalSquadsCommand.Response> {
        return this.api.request({
            method: GetExternalSquadsCommand.endpointDetails.REQUEST_METHOD,
            url: GetExternalSquadsCommand.url,
        });
    }

    getByUuid(uuid: string): Promise<GetExternalSquadByUuidCommand.Response> {
        return this.api.request({
            method: GetExternalSquadByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetExternalSquadByUuidCommand.url(uuid),
        });
    }

    update(
        body: UpdateExternalSquadCommand.Request
    ): Promise<UpdateExternalSquadCommand.Response> {
        return this.api.request({
            method: UpdateExternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateExternalSquadCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteExternalSquadCommand.Response> {
        return this.api.request({
            method: DeleteExternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteExternalSquadCommand.url(uuid),
        });
    }

    reorder(
        body: ReorderExternalSquadCommand.Request
    ): Promise<ReorderExternalSquadCommand.Response> {
        return this.api.request({
            method: ReorderExternalSquadCommand.endpointDetails.REQUEST_METHOD,
            url: ReorderExternalSquadCommand.url,
            body,
        });
    }

    addUsers(
        uuid: string,
        body: AddUsersToExternalSquadCommand.Request
    ): Promise<AddUsersToExternalSquadCommand.Response> {
        return this.api.request({
            method: AddUsersToExternalSquadCommand.endpointDetails
                .REQUEST_METHOD,
            url: AddUsersToExternalSquadCommand.url(uuid),
            body,
        });
    }

    removeUsers(
        uuid: string,
        body: DeleteUsersFromExternalSquadCommand.Request
    ): Promise<DeleteUsersFromExternalSquadCommand.Response> {
        return this.api.request({
            method: DeleteUsersFromExternalSquadCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteUsersFromExternalSquadCommand.url(uuid),
            body,
        });
    }
}
