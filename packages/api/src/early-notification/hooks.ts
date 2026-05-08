/**
 * @deprecated 이 모듈의 wrapper hook 들은 더 이상 사용하지 않는다.
 *
 * 컴포넌트·흐름 훅에서는 `xxxQueries` / `xxxMutations` 옵션 팩토리를
 * `useQuery` / `useMutation` 에 직접 전달한다 (CODE_RULES §3.3 #5).
 * 모든 사용처가 옵션 팩토리로 치환되면 이 파일은 삭제된다.
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { earlyNotificationQueries, earlyNotificationMutations } from "./queries";
import type {
  GetAdminEarlyNotificationsParams,
  GetAdminEarlyNotificationsCsvParams,
} from "./types";

/**
 * 어드민 사전 알림 목록 조회 훅
 *
 * @param {GetAdminEarlyNotificationsParams} params - 조회 파라미터
 * @param {number} params.cohortId - 기수 ID
 * @param {boolean} [params.onlyUnnotified] - 미발송 대상만 조회 (선택)
 *
 * @example
 * const { data: notifications, isLoading } = useAdminEarlyNotifications({ params: { cohortId: 1 } })
 */
export const useAdminEarlyNotifications = ({
  params,
}: {
  params: GetAdminEarlyNotificationsParams;
}) => useQuery(earlyNotificationQueries.getAdminEarlyNotifications({ params }));

/**
 * 어드민 사전 알림 CSV 조회 훅
 *
 * @param {GetAdminEarlyNotificationsCsvParams} params - 조회 파라미터
 * @param {number} params.cohortId - 기수 ID
 *
 * @example
 * const { data: csvBlob, isLoading } = useAdminEarlyNotificationsCsv({ params: { cohortId: 1 } })
 */
export const useAdminEarlyNotificationsCsv = ({
  params,
}: {
  params: GetAdminEarlyNotificationsCsvParams;
}) =>
  useQuery(earlyNotificationQueries.getAdminEarlyNotificationsCsv({ params }));

/**
 * 사전 알림 일괄 발송 훅
 *
 * @example
 * const { mutate: sendBulk, isPending } = useSendBulkEarlyNotification()
 * sendBulk({ payload: { cohortId: 1, subject: '...', html: '...', text: '...' } })
 */
export const useSendBulkEarlyNotification = () =>
  useMutation(earlyNotificationMutations.sendBulkEarlyNotification());

/**
 * 사전 알림 구독 훅
 *
 * @example
 * const { mutate: subscribe, isPending } = useSubscribeEarlyNotification()
 * subscribe({ payload: { cohortId: 1, email: 'user@example.com' } })
 */
export const useSubscribeEarlyNotification = () =>
  useMutation(earlyNotificationMutations.subscribeEarlyNotification());
