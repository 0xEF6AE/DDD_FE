import { queryOptions, mutationOptions } from "@tanstack/react-query";
import { notificationCampaignAPI } from "./api";
import { notificationCampaignKeys } from "./queryKeys";
import type {
  GetAdminNotificationCampaignsParams,
  PostCreateNotificationCampaignRequest,
  PatchUpdateNotificationCampaignParams,
  PatchUpdateNotificationCampaignRequest,
  DeleteNotificationCampaignParams,
  PatchPauseNotificationCampaignParams,
  PatchResumeNotificationCampaignParams,
} from "./types";

export const notificationCampaignQueries = {
  /**
   * 어드민 사전 알림 캠페인 목록 조회 쿼리
   *
   * @param {GetAdminNotificationCampaignsParams} params - 조회 파라미터
   * @param {number} params.cohortId - 기수 ID
   * @param {NotificationCampaignGetAdminListStatus} [params.status] - 상태 필터 (선택)
   *
   * @returns {QueryOptions} TanStack Query 옵션 객체
   *
   * @example
   * const query = useQuery(notificationCampaignQueries.getAdminNotificationCampaigns({ params: { cohortId: 1 } }))
   */
  getAdminNotificationCampaigns: ({
    params,
  }: {
    params: GetAdminNotificationCampaignsParams;
  }) =>
    queryOptions({
      queryKey: notificationCampaignKeys.adminList(params),
      queryFn: () =>
        notificationCampaignAPI.getAdminNotificationCampaigns({ params }),
      enabled: !!params.cohortId,
    }),
};

export const notificationCampaignMutations = {
  /**
   * 사전 알림 캠페인 등록 mutation
   *
   * @returns {MutationOptions} TanStack Query Mutation 옵션 객체
   *
   * @example
   * const mutation = useMutation(notificationCampaignMutations.createNotificationCampaign())
   * mutation.mutate({ payload: { cohortId: 1, scheduledAt: '2026-06-01T00:00:00Z', subject: '...', html: '...', text: '...' } })
   */
  createNotificationCampaign: () =>
    mutationOptions({
      mutationFn: ({
        payload,
      }: {
        payload: PostCreateNotificationCampaignRequest;
      }) => notificationCampaignAPI.createNotificationCampaign({ payload }),
    }),

  /**
   * 사전 알림 캠페인 수정 mutation (PATCH /api/v1/admin/notification-campaigns/{id})
   *
   * @returns {MutationOptions} TanStack Query Mutation 옵션 객체
   *
   * @example
   * const mutation = useMutation(notificationCampaignMutations.updateNotificationCampaign())
   * mutation.mutate({ params: { id: 1 }, payload: { subject: '수정된 제목' } })
   */
  updateNotificationCampaign: () =>
    mutationOptions({
      mutationFn: ({
        params,
        payload,
      }: {
        params: PatchUpdateNotificationCampaignParams;
        payload: PatchUpdateNotificationCampaignRequest;
      }) =>
        notificationCampaignAPI.updateNotificationCampaign({ params, payload }),
    }),

  /**
   * 사전 알림 캠페인 삭제 mutation
   *
   * @returns {MutationOptions} TanStack Query Mutation 옵션 객체
   *
   * @example
   * const mutation = useMutation(notificationCampaignMutations.deleteNotificationCampaign())
   * mutation.mutate({ params: { id: 1 } })
   */
  deleteNotificationCampaign: () =>
    mutationOptions({
      mutationFn: ({ params }: { params: DeleteNotificationCampaignParams }) =>
        notificationCampaignAPI.deleteNotificationCampaign({ params }),
    }),

  /**
   * 사전 알림 캠페인 일시정지 mutation (SCHEDULED → PAUSED)
   *
   * @returns {MutationOptions} TanStack Query Mutation 옵션 객체
   *
   * @example
   * const mutation = useMutation(notificationCampaignMutations.pauseNotificationCampaign())
   * mutation.mutate({ params: { id: 1 } })
   */
  pauseNotificationCampaign: () =>
    mutationOptions({
      mutationFn: ({
        params,
      }: {
        params: PatchPauseNotificationCampaignParams;
      }) => notificationCampaignAPI.pauseNotificationCampaign({ params }),
    }),

  /**
   * 사전 알림 캠페인 재개 mutation (PAUSED → SCHEDULED)
   *
   * @returns {MutationOptions} TanStack Query Mutation 옵션 객체
   *
   * @example
   * const mutation = useMutation(notificationCampaignMutations.resumeNotificationCampaign())
   * mutation.mutate({ params: { id: 1 } })
   */
  resumeNotificationCampaign: () =>
    mutationOptions({
      mutationFn: ({
        params,
      }: {
        params: PatchResumeNotificationCampaignParams;
      }) => notificationCampaignAPI.resumeNotificationCampaign({ params }),
    }),
};
