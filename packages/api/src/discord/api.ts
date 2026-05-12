import { api } from "../fetchClient";
import type {
  GetDiscordAuthorizeUrlParams,
  GetDiscordLinkParams,
  GetDiscordOauthCallbackParams,
} from "./types";

export const discordAPI = {
  /** Discord OAuth 동의 URL 조회 — GET /api/v1/discord/oauth/authorize */
  getAuthorizeUrl: ({ params }: { params: GetDiscordAuthorizeUrlParams }) =>
    api.get("/api/v1/discord/oauth/authorize", { params: { query: params } }),

  /** Discord OAuth 콜백 — GET /api/v1/discord/oauth/callback */
  oauthCallback: ({ params }: { params: GetDiscordOauthCallbackParams }) =>
    api.get("/api/v1/discord/oauth/callback", { params: { query: params } }),

  /** Discord 연동 상태 조회 — GET /api/v1/discord/link */
  getLink: ({ params }: { params: GetDiscordLinkParams }) =>
    api.get("/api/v1/discord/link", { params: { query: params } }),
};
