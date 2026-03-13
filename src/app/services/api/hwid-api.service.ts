import { inject, Injectable } from "@angular/core";

import {
    CreateUserHwidDeviceCommand,
    DeleteAllUserHwidDevicesCommand,
    DeleteUserHwidDeviceCommand,
    GetAllHwidDevicesCommand,
    GetHwidDevicesStatsCommand,
    GetTopUsersByHwidDevicesCommand,
    GetUserHwidDevicesCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class HwidApiService {
    private api = inject(BaseApiService);

    getAll(): Promise<GetAllHwidDevicesCommand.Response> {
        return this.api.request({
            method: GetAllHwidDevicesCommand.endpointDetails.REQUEST_METHOD,
            url: GetAllHwidDevicesCommand.url,
        });
    }

    getByUser(userUuid: string): Promise<GetUserHwidDevicesCommand.Response> {
        return this.api.request({
            method: GetUserHwidDevicesCommand.endpointDetails.REQUEST_METHOD,
            url: GetUserHwidDevicesCommand.url(userUuid),
        });
    }

    create(
        body: CreateUserHwidDeviceCommand.Request
    ): Promise<CreateUserHwidDeviceCommand.Response> {
        return this.api.request({
            method: CreateUserHwidDeviceCommand.endpointDetails.REQUEST_METHOD,
            url: CreateUserHwidDeviceCommand.url,
            body,
        });
    }

    delete(
        body: DeleteUserHwidDeviceCommand.Request
    ): Promise<DeleteUserHwidDeviceCommand.Response> {
        return this.api.request({
            method: DeleteUserHwidDeviceCommand.endpointDetails.REQUEST_METHOD,
            url: DeleteUserHwidDeviceCommand.url,
            body,
        });
    }

    deleteAll(
        body: DeleteAllUserHwidDevicesCommand.Request
    ): Promise<DeleteAllUserHwidDevicesCommand.Response> {
        return this.api.request({
            method: DeleteAllUserHwidDevicesCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteAllUserHwidDevicesCommand.url,
            body,
        });
    }

    getStats(): Promise<GetHwidDevicesStatsCommand.Response> {
        return this.api.request({
            method: GetHwidDevicesStatsCommand.endpointDetails.REQUEST_METHOD,
            url: GetHwidDevicesStatsCommand.url,
        });
    }

    getTopUsers(): Promise<GetTopUsersByHwidDevicesCommand.Response> {
        return this.api.request({
            method: GetTopUsersByHwidDevicesCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetTopUsersByHwidDevicesCommand.url,
        });
    }
}
