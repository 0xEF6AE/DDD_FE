import { getApiClient } from "../client";
import type { MeUser } from "./types";

const USERS_BASE_URL = "/api/v1/users" as const;

export const usersAPI = {
  /** 현재 로그인한 사용자의 식별 정보와 활성 권한을 반환합니다. */
  getMe: () => getApiClient().get<MeUser>(`${USERS_BASE_URL}/me`),
};
