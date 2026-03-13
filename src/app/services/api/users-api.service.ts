import { inject, Injectable } from "@angular/core";

import {
    BulkAllExtendExpirationDateCommand,
    BulkAllResetTrafficUsersCommand,
    BulkAllUpdateUsersCommand,
    BulkDeleteUsersByStatusCommand,
    BulkDeleteUsersCommand,
    BulkExtendExpirationDateCommand,
    BulkResetTrafficUsersCommand,
    BulkRevokeUsersSubscriptionCommand,
    BulkUpdateUsersCommand,
    BulkUpdateUsersSquadsCommand,
    CreateUserCommand,
    DeleteUserCommand,
    DisableUserCommand,
    EnableUserCommand,
    GetAllTagsCommand,
    GetAllUsersCommand,
    GetUserAccessibleNodesCommand,
    GetUserByEmailCommand,
    GetUserByIdCommand,
    GetUserByShortUuidCommand,
    GetUserByTagCommand,
    GetUserByTelegramIdCommand,
    GetUserByUsernameCommand,
    GetUserByUuidCommand,
    GetUserSubscriptionRequestHistoryCommand,
    ResetUserTrafficCommand,
    ResolveUserCommand,
    RevokeUserSubscriptionCommand,
    UpdateUserCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class UsersApiService {
    private api = inject(BaseApiService);

    create(
        body: CreateUserCommand.Request
    ): Promise<CreateUserCommand.Response> {
        return this.api.request({
            method: CreateUserCommand.endpointDetails.REQUEST_METHOD,
            url: CreateUserCommand.url,
            body,
        });
    }

    update(
        body: UpdateUserCommand.Request
    ): Promise<UpdateUserCommand.Response> {
        return this.api.request({
            method: UpdateUserCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateUserCommand.url,
            body,
        });
    }

    delete(uuid: string): Promise<DeleteUserCommand.Response> {
        return this.api.request({
            method: DeleteUserCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteUserCommand.url(uuid),
        });
    }

    getAll(): Promise<GetAllUsersCommand.Response> {
        return this.api.request({
            method: GetAllUsersCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllUsersCommand.url,
        });
    }

    getByUuid(uuid: string): Promise<GetUserByUuidCommand.Response> {
        return this.api.request({
            method: GetUserByUuidCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserByUuidCommand.url(uuid),
        });
    }

    getAccessibleNodes(
        uuid: string
    ): Promise<GetUserAccessibleNodesCommand.Response> {
        return this.api.request({
            method: GetUserAccessibleNodesCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetUserAccessibleNodesCommand.url(uuid),
        });
    }

    getSubscriptionRequestHistory(
        uuid: string
    ): Promise<GetUserSubscriptionRequestHistoryCommand.Response> {
        return this.api.request({
            method: GetUserSubscriptionRequestHistoryCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetUserSubscriptionRequestHistoryCommand.url(uuid),
        });
    }

    resolve(
        body: ResolveUserCommand.Request
    ): Promise<ResolveUserCommand.Response> {
        return this.api.request({
            method: ResolveUserCommand.endpointDetails.REQUEST_METHOD,
            url: ResolveUserCommand.url,
            body,
        });
    }

    getByEmail(email: string): Promise<GetUserByEmailCommand.Response> {
        return this.api.request({
            method: GetUserByEmailCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserByEmailCommand.url(email),
        });
    }

    getById(id: string): Promise<GetUserByIdCommand.Response> {
        return this.api.request({
            method: GetUserByIdCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserByIdCommand.url(id),
        });
    }

    getByShortUuid(
        shortUuid: string
    ): Promise<GetUserByShortUuidCommand.Response> {
        return this.api.request({
            method: GetUserByShortUuidCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserByShortUuidCommand.url(shortUuid),
        });
    }

    getByTag(tag: string): Promise<GetUserByTagCommand.Response> {
        return this.api.request({
            method: GetUserByTagCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserByTagCommand.url(tag),
        });
    }

    getByTelegramId(
        telegramId: string
    ): Promise<GetUserByTelegramIdCommand.Response> {
        return this.api.request({
            method: GetUserByTelegramIdCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserByTelegramIdCommand.url(telegramId),
        });
    }

    getByUsername(
        username: string
    ): Promise<GetUserByUsernameCommand.Response> {
        return this.api.request({
            method: GetUserByUsernameCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserByUsernameCommand.url(username),
        });
    }

    getAllTags(): Promise<GetAllTagsCommand.Response> {
        return this.api.request({
            method: GetAllTagsCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllTagsCommand.url,
        });
    }

    disable(uuid: string): Promise<DisableUserCommand.Response> {
        return this.api.request({
            method: DisableUserCommand.endpointDetails.REQUEST_METHOD,
            url: DisableUserCommand.url(uuid),
        });
    }

    enable(uuid: string): Promise<EnableUserCommand.Response> {
        return this.api.request({
            method: EnableUserCommand.endpointDetails.REQUEST_METHOD,
            url: EnableUserCommand.url(uuid),
        });
    }

    resetTraffic(uuid: string): Promise<ResetUserTrafficCommand.Response> {
        return this.api.request({
            method: ResetUserTrafficCommand.endpointDetails.REQUEST_METHOD,
            url: ResetUserTrafficCommand.url(uuid),
        });
    }

    revokeSubscription(
        uuid: string,
        body: RevokeUserSubscriptionCommand.Request
    ): Promise<RevokeUserSubscriptionCommand.Response> {
        return this.api.request({
            method: RevokeUserSubscriptionCommand.endpointDetails
                .REQUEST_METHOD,
            url: RevokeUserSubscriptionCommand.url(uuid),
            body,
        });
    }

    bulkDelete(
        body: BulkDeleteUsersCommand.Request
    ): Promise<BulkDeleteUsersCommand.Response> {
        return this.api.request({
            method: BulkDeleteUsersCommand.endpointDetails.REQUEST_METHOD,
            url: BulkDeleteUsersCommand.url,
            body,
        });
    }

    bulkDeleteByStatus(
        body: BulkDeleteUsersByStatusCommand.Request
    ): Promise<BulkDeleteUsersByStatusCommand.Response> {
        return this.api.request({
            method: BulkDeleteUsersByStatusCommand.endpointDetails
                .REQUEST_METHOD,
            url: BulkDeleteUsersByStatusCommand.url,
            body,
        });
    }

    bulkExtendExpirationDate(
        body: BulkExtendExpirationDateCommand.Request
    ): Promise<BulkExtendExpirationDateCommand.Response> {
        return this.api.request({
            method: BulkExtendExpirationDateCommand.endpointDetails
                .REQUEST_METHOD,
            url: BulkExtendExpirationDateCommand.url,
            body,
        });
    }

    bulkResetTraffic(
        body: BulkResetTrafficUsersCommand.Request
    ): Promise<BulkResetTrafficUsersCommand.Response> {
        return this.api.request({
            method: BulkResetTrafficUsersCommand.endpointDetails.REQUEST_METHOD,
            url: BulkResetTrafficUsersCommand.url,
            body,
        });
    }

    bulkRevokeSubscription(
        body: BulkRevokeUsersSubscriptionCommand.Request
    ): Promise<BulkRevokeUsersSubscriptionCommand.Response> {
        return this.api.request({
            method: BulkRevokeUsersSubscriptionCommand.endpointDetails
                .REQUEST_METHOD,
            url: BulkRevokeUsersSubscriptionCommand.url,
            body,
        });
    }

    bulkUpdate(
        body: BulkUpdateUsersCommand.Request
    ): Promise<BulkUpdateUsersCommand.Response> {
        return this.api.request({
            method: BulkUpdateUsersCommand.endpointDetails.REQUEST_METHOD,
            url: BulkUpdateUsersCommand.url,
            body,
        });
    }

    bulkUpdateSquads(
        body: BulkUpdateUsersSquadsCommand.Request
    ): Promise<BulkUpdateUsersSquadsCommand.Response> {
        return this.api.request({
            method: BulkUpdateUsersSquadsCommand.endpointDetails.REQUEST_METHOD,
            url: BulkUpdateUsersSquadsCommand.url,
            body,
        });
    }

    bulkAllExtendExpirationDate(
        body: BulkAllExtendExpirationDateCommand.Request
    ): Promise<BulkAllExtendExpirationDateCommand.Response> {
        return this.api.request({
            method: BulkAllExtendExpirationDateCommand.endpointDetails
                .REQUEST_METHOD,
            url: BulkAllExtendExpirationDateCommand.url,
            body,
        });
    }

    bulkAllResetTraffic(): Promise<BulkAllResetTrafficUsersCommand.Response> {
        return this.api.request({
            method: BulkAllResetTrafficUsersCommand.endpointDetails
                .REQUEST_METHOD,
            url: BulkAllResetTrafficUsersCommand.url,
        });
    }

    bulkAllUpdate(
        body: BulkAllUpdateUsersCommand.Request
    ): Promise<BulkAllUpdateUsersCommand.Response> {
        return this.api.request({
            method: BulkAllUpdateUsersCommand.endpointDetails.REQUEST_METHOD,
            url: BulkAllUpdateUsersCommand.url,
            body,
        });
    }
}
