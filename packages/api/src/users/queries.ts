import { queryOptions } from "@tanstack/react-query";
import { usersAPI } from "./api";
import { usersKeys } from "./queryKeys";

export const usersQueries = {
  /**
   * 내 정보 조회 쿼리
   *
   * 현재 로그인한 사용자의 식별 정보와 활성 권한을 반환합니다.
   *
   * @returns {QueryOptions} TanStack Query 옵션 객체
   *
   * @example
   * const query = useQuery(usersQueries.getMe())
   */
  getMe: () =>
    queryOptions({
      queryKey: usersKeys.me(),
      queryFn: () => usersAPI.getMe(),
    }),
};
