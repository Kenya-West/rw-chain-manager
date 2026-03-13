import { inject, Injectable } from "@angular/core";

import {
    EncryptHappCryptoLinkCommand,
    GenerateX25519Command,
    GetBandwidthStatsCommand,
    GetMetadataCommand,
    GetNodesMetricsCommand,
    GetNodesStatisticsCommand,
    GetRecapCommand,
    GetRemnawaveHealthCommand,
    GetStatsCommand,
    TestSrrMatcherCommand,
} from "@remnawave/backend-contract";

import { BaseApiService } from "../base-api.service";

@Injectable({ providedIn: "root" })
export class SystemApiService {
    private api = inject(BaseApiService);

    getStats(
        queryParams?: GetStatsCommand.Request
    ): Promise<GetStatsCommand.Response> {
        return this.api.request({
            method: GetStatsCommand.endpointDetails.REQUEST_METHOD,
            url: GetStatsCommand.url,
            queryParams: queryParams as Record<string, string | undefined>,
        });
    }

    getMetadata(): Promise<GetMetadataCommand.Response> {
        return this.api.request({
            method: GetMetadataCommand.endpointDetails.REQUEST_METHOD,
            url: GetMetadataCommand.url,
        });
    }

    getBandwidthStats(): Promise<GetBandwidthStatsCommand.Response> {
        return this.api.request({
            method: GetBandwidthStatsCommand.endpointDetails.REQUEST_METHOD,
            url: GetBandwidthStatsCommand.url,
        });
    }

    getNodesMetrics(): Promise<GetNodesMetricsCommand.Response> {
        return this.api.request({
            method: GetNodesMetricsCommand.endpointDetails.REQUEST_METHOD,
            url: GetNodesMetricsCommand.url,
        });
    }

    getNodesStatistics(): Promise<GetNodesStatisticsCommand.Response> {
        return this.api.request({
            method: GetNodesStatisticsCommand.endpointDetails.REQUEST_METHOD,
            url: GetNodesStatisticsCommand.url,
        });
    }

    getRecap(): Promise<GetRecapCommand.Response> {
        return this.api.request({
            method: GetRecapCommand.endpointDetails.REQUEST_METHOD,
            url: GetRecapCommand.url,
        });
    }

    getHealth(): Promise<GetRemnawaveHealthCommand.Response> {
        return this.api.request({
            method: GetRemnawaveHealthCommand.endpointDetails.REQUEST_METHOD,
            url: GetRemnawaveHealthCommand.url,
        });
    }

    testSrrMatcher(
        body: TestSrrMatcherCommand.Request
    ): Promise<TestSrrMatcherCommand.Response> {
        return this.api.request({
            method: TestSrrMatcherCommand.endpointDetails.REQUEST_METHOD,
            url: TestSrrMatcherCommand.url,
            body,
        });
    }

    encryptHappCryptoLink(
        body: EncryptHappCryptoLinkCommand.Request
    ): Promise<EncryptHappCryptoLinkCommand.Response> {
        return this.api.request({
            method: EncryptHappCryptoLinkCommand.endpointDetails.REQUEST_METHOD,
            url: EncryptHappCryptoLinkCommand.url,
            body,
        });
    }

    generateX25519(): Promise<GenerateX25519Command.Response> {
        return this.api.request({
            method: GenerateX25519Command.endpointDetails.REQUEST_METHOD,
            url: GenerateX25519Command.url,
        });
    }
}
