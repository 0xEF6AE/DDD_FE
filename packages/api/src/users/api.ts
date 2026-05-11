import { usersMe } from "../generated/users/users";

export const usersAPI = {
  /** 현재 로그인한 사용자의 식별 정보와 활성 권한을 반환합니다. */
  getMe: () => usersMe(),
};
