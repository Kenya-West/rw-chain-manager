import axios from "axios";

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { GetUserByUsernameCommand } from "@remnawave/backend-contract";

import { ICommandResponse } from "../types/command-response.type";

@Injectable()
export class AxiosService {
    public axiosInstance: AxiosInstance;
    private readonly logger = new Logger(AxiosService.name);

    constructor(private readonly configService: ConfigService) {
        this.axiosInstance = axios.create({
            baseURL: this.configService.getOrThrow("REMNAWAVE_PANEL_URL"),
            timeout: 45_000,
            headers: {
                "x-forwarded-for": "127.0.0.1", // use this headers to bypass the panel reverse proxy restrictions. So you can access the panel from bridge networks: http://remnawave:3000
                "x-forwarded-proto": "https", // use this headers to bypass the panel reverse proxy restrictions. So you can access the panel from bridge networks: http://remnawave:3000
                Authorization: `Bearer ${this.configService.get("REMNAWAVE_API_TOKEN")}`,
            },
        });

        const caddyAuthApiToken = this.configService.get(
            "CADDY_AUTH_API_TOKEN"
        );

        if (caddyAuthApiToken) {
            this.axiosInstance.defaults.headers.common["X-Api-Key"] =
                caddyAuthApiToken;
        }
    }

    public async getUserByUsername(
        username: string
    ): Promise<ICommandResponse<GetUserByUsernameCommand.Response>> {
        try {
            const response =
                await this.axiosInstance.request<GetUserByUsernameCommand.Response>(
                    {
                        method: GetUserByUsernameCommand.endpointDetails
                            .REQUEST_METHOD,
                        url: GetUserByUsernameCommand.url(username),
                    }
                );

            return {
                isOk: true,
                response: response.data,
            };
        } catch (error) {
            if (error instanceof AxiosError) {
                this.logger.error(
                    "Error in Axios GetUserByUsername Request:",
                    error.message
                );

                return {
                    isOk: false,
                };
            } else {
                this.logger.error("Error in GetUserByUsername Request:", error);

                return {
                    isOk: false,
                };
            }
        }
    }
}
