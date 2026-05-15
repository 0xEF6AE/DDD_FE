import { api } from "../fetchClient";
import type { MeUser } from "./types";

export const usersAPI = {
  /** 현재 로그인한 사용자의 식별 정보와 활성 권한 - GET /api/v1/users/me */
  getMe: () => api.get("/api/v1/users/me") as unknown as Promise<MeUser>,
};
