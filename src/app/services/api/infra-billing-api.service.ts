import { inject, Injectable } from "@angular/core";

import {
    CreateInfraBillingHistoryRecordCommand,
    CreateInfraBillingNodeCommand,
    CreateInfraProviderCommand,
    DeleteInfraBillingHistoryRecordCommand,
    DeleteInfraBillingNodeByUuidCommand,
    DeleteInfraProviderByUuidCommand,
    GetInfraBillingHistoryRecordsCommand,
    GetInfraBillingNodesCommand,
    GetInfraProviderByUuidCommand,
    GetInfraProvidersCommand,
    UpdateInfraBillingNodeCommand,
    UpdateInfraProviderCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class InfraBillingApiService {
    private api = inject(BaseApiService);

    // Providers
    createProvider(
        body: CreateInfraProviderCommand.Request
    ): Promise<CreateInfraProviderCommand.Response> {
        return this.api.request({
            method: CreateInfraProviderCommand.endpointDetails.REQUEST_METHOD,
            url: CreateInfraProviderCommand.url,
            body,
        });
    }

    getProviders(): Promise<GetInfraProvidersCommand.Response> {
        return this.api.request({
            method: GetInfraProvidersCommand.endpointDetails.REQUEST_METHOD,
            url: GetInfraProvidersCommand.url,
        });
    }

    getProviderByUuid(
        uuid: string
    ): Promise<GetInfraProviderByUuidCommand.Response> {
        return this.api.request({
            method: GetInfraProviderByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetInfraProviderByUuidCommand.url(uuid),
        });
    }

    updateProvider(
        body: UpdateInfraProviderCommand.Request
    ): Promise<UpdateInfraProviderCommand.Response> {
        return this.api.request({
            method: UpdateInfraProviderCommand.endpointDetails.REQUEST_METHOD,
            url: UpdateInfraProviderCommand.url,
            body,
        });
    }

    deleteProvider(
        uuid: string
    ): Promise<DeleteInfraProviderByUuidCommand.Response> {
        return this.api.request({
            method: DeleteInfraProviderByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteInfraProviderByUuidCommand.url(uuid),
        });
    }

    // Billing Nodes
    createBillingNode(
        body: CreateInfraBillingNodeCommand.Request
    ): Promise<CreateInfraBillingNodeCommand.Response> {
        return this.api.request({
            method: CreateInfraBillingNodeCommand.endpointDetails
                .REQUEST_METHOD,
            url: CreateInfraBillingNodeCommand.url,
            body,
        });
    }

    getBillingNodes(): Promise<GetInfraBillingNodesCommand.Response> {
        return this.api.request({
            method: GetInfraBillingNodesCommand.endpointDetails.REQUEST_METHOD,
            url: GetInfraBillingNodesCommand.url,
        });
    }

    updateBillingNode(
        body: UpdateInfraBillingNodeCommand.Request
    ): Promise<UpdateInfraBillingNodeCommand.Response> {
        return this.api.request({
            method: UpdateInfraBillingNodeCommand.endpointDetails
                .REQUEST_METHOD,
            url: UpdateInfraBillingNodeCommand.url,
            body,
        });
    }

    deleteBillingNode(
        uuid: string
    ): Promise<DeleteInfraBillingNodeByUuidCommand.Response> {
        return this.api.request({
            method: DeleteInfraBillingNodeByUuidCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteInfraBillingNodeByUuidCommand.url(uuid),
        });
    }

    // History
    createBillRecord(
        body: CreateInfraBillingHistoryRecordCommand.Request
    ): Promise<CreateInfraBillingHistoryRecordCommand.Response> {
        return this.api.request({
            method: CreateInfraBillingHistoryRecordCommand.endpointDetails
                .REQUEST_METHOD,
            url: CreateInfraBillingHistoryRecordCommand.url,
            body,
        });
    }

    getBillRecords(): Promise<GetInfraBillingHistoryRecordsCommand.Response> {
        return this.api.request({
            method: GetInfraBillingHistoryRecordsCommand.endpointDetails
                .REQUEST_METHOD,
            url: GetInfraBillingHistoryRecordsCommand.url,
        });
    }

    deleteBillRecord(
        uuid: string
    ): Promise<DeleteInfraBillingHistoryRecordCommand.Response> {
        return this.api.request({
            method: DeleteInfraBillingHistoryRecordCommand.endpointDetails
                .REQUEST_METHOD,
            url: DeleteInfraBillingHistoryRecordCommand.url(uuid),
        });
    }
}
