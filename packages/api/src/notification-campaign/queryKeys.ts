import type { GetAdminNotificationCampaignsParams } from "./types";

export const notificationCampaignKeys = {
  /** 사전 알림 캠페인 base key */
  all: ["notificationCampaigns"] as const,

  /** 어드민 캠페인 목록 key */
  adminLists: () =>
    [...notificationCampaignKeys.all, "admin", "list"] as const,

  /**
   * 어드민 캠페인 목록 필터 key
   *
   * @param {GetAdminNotificationCampaignsParams} params - 조회 파라미터
   * @param {number} params.cohortId - 기수 ID
   * @param {NotificationCampaignGetAdminListStatus} [params.status] - 상태 필터 (선택)
   */
  adminList: (params: GetAdminNotificationCampaignsParams) =>
    [...notificationCampaignKeys.adminLists(), params] as const,
};
