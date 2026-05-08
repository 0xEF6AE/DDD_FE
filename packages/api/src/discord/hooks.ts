/**
 * @deprecated 이 모듈의 wrapper hook 들은 더 이상 사용하지 않는다.
 *
 * 컴포넌트·흐름 훅에서는 `xxxQueries` / `xxxMutations` 옵션 팩토리를
 * `useQuery` / `useMutation` 에 직접 전달한다 (CODE_RULES §3.3 #5).
 * 모든 사용처가 옵션 팩토리로 치환되면 이 파일은 삭제된다.
 */

import { useQuery } from "@tanstack/react-query";
import { discordQueries } from "./queries";
import type { GetDiscordAuthorizeUrlParams, GetDiscordLinkParams } from "./types";

/**
 * Discord 인증 URL 조회 훅
 *
 * @param {GetDiscordAuthorizeUrlParams} params - 조회 파라미터
 * @param {string} params.applicationFormId - 지원서 ID
 *
 * @example
 * const { data: authorizeUrl, isLoading } = useDiscordAuthorizeUrl({ params: { applicationFormId: 'form-uuid-123' } })
 */
export const useDiscordAuthorizeUrl = ({
  params,
}: {
  params: GetDiscordAuthorizeUrlParams;
}) => useQuery(discordQueries.getAuthorizeUrl({ params }));

/**
 * Discord 연동 정보 조회 훅
 *
 * @param {GetDiscordLinkParams} params - 조회 파라미터
 * @param {string} params.applicationFormId - 지원서 ID
 *
 * @example
 * const { data: linkInfo, isLoading } = useDiscordLink({ params: { applicationFormId: 'form-uuid-123' } })
 */
export const useDiscordLink = ({ params }: { params: GetDiscordLinkParams }) =>
  useQuery(discordQueries.getLink({ params }));
