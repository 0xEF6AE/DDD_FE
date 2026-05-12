import { api } from "../fetchClient";
import type { PostRefreshTokenResponse } from "./types";

export const authAPI = {
  /** 토큰 갱신 - POST /api/v1/auth/refresh */
  refreshToken: () =>
    api.post("/api/v1/auth/refresh") as unknown as Promise<PostRefreshTokenResponse>,

  /** 로그아웃 - POST /api/v1/auth/logout */
  logout: () => api.post("/api/v1/auth/logout") as unknown as Promise<void>,

  /** 회원 탈퇴 - DELETE /api/v1/auth/withdrawal */
  withdrawal: () => api.delete("/api/v1/auth/withdrawal") as unknown as Promise<void>,
};
