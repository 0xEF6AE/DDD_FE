import { useQuery } from "@tanstack/react-query"
import { usersQueries, type MeUser } from "@ddd/api"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

export interface RequireAuthResult {
  status: AuthStatus
  me: MeUser | undefined
}

/**
 * 보호 라우트 진입 시 `GET /api/v1/users/me` 로 인증 상태를 확인한다.
 *
 * - `loading`: 첫 호출이 진행 중 (스피너 등 placeholder 노출)
 * - `unauthenticated`: 401/네트워크 에러 등으로 본인 정보를 받지 못함
 *   (`packages/api/src/client.ts` 의 401 인터셉터가 이미 `paths.login` 으로
 *   redirect 하지만, 호출부에서도 `<Navigate>` 등으로 방어적으로 분기 가능)
 * - `authenticated`: `me` 데이터 보유
 */
export function useRequireAuth(): RequireAuthResult {
  const { data: me, isPending, isError } = useQuery(usersQueries.getMe())

  if (isPending) return { status: "loading", me: undefined }
  if (isError || !me) return { status: "unauthenticated", me: undefined }

  return { status: "authenticated", me }
}
