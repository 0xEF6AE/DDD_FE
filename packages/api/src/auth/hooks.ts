/**
 * @deprecated 이 모듈의 wrapper hook 들은 더 이상 사용하지 않는다.
 *
 * 컴포넌트·흐름 훅에서는 `xxxQueries` / `xxxMutations` 옵션 팩토리를
 * `useQuery` / `useMutation` 에 직접 전달한다 (CODE_RULES §3.3 #5).
 * 모든 사용처가 옵션 팩토리로 치환되면 이 파일은 삭제된다.
 */

import { useMutation } from "@tanstack/react-query";
import { authMutations } from "./queries";

/**
 * Access Token 갱신 훅
 *
 * @example
 * const { mutate: refreshToken, isPending } = useRefreshToken()
 * refreshToken()
 */
export const useRefreshToken = () => useMutation(authMutations.refreshToken());

/**
 * 로그아웃 훅
 *
 * @example
 * const { mutate: logout, isPending } = useLogout()
 * logout()
 */
export const useLogout = () => useMutation(authMutations.logout());

/**
 * 회원 탈퇴 훅
 *
 * @example
 * const { mutate: withdrawal, isPending } = useWithdrawal()
 * withdrawal()
 */
export const useWithdrawal = () => useMutation(authMutations.withdrawal());
