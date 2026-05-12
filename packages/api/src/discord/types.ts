import type { paths } from "../generated/api";

// GET /api/v1/discord/oauth/authorize - Discord OAuth 동의 URL 조회
export type GetDiscordAuthorizeUrlParams =
  paths["/api/v1/discord/oauth/authorize"]["get"]["parameters"]["query"];

// GET /api/v1/discord/oauth/callback - Discord OAuth 콜백
export type GetDiscordOauthCallbackParams =
  paths["/api/v1/discord/oauth/callback"]["get"]["parameters"]["query"];

// GET /api/v1/discord/link - Discord 연동 상태 조회
export type GetDiscordLinkParams =
  paths["/api/v1/discord/link"]["get"]["parameters"]["query"];
