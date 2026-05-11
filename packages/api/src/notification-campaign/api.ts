import {
  notificationCampaignCreateAdmin,
  notificationCampaignGetAdminList,
  notificationCampaignUpdateAdmin,
  notificationCampaignDeleteAdmin,
  notificationCampaignPauseAdmin,
  notificationCampaignResumeAdmin,
} from "../generated/admin-notification-campaign/admin-notification-campaign";
import type {
  GetAdminNotificationCampaignsParams,
  GetAdminNotificationCampaignsResponse,
  PostCreateNotificationCampaignRequest,
  PatchUpdateNotificationCampaignParams,
  PatchUpdateNotificationCampaignRequest,
  DeleteNotificationCampaignParams,
  PatchPauseNotificationCampaignParams,
  PatchResumeNotificationCampaignParams,
} from "./types";

export const notificationCampaignAPI = {
  /** 기수별 사전 알림 캠페인 목록을 조회합니다. */
  getAdminNotificationCampaigns: ({
    params,
  }: {
    params: GetAdminNotificationCampaignsParams;
  }) =>
    notificationCampaignGetAdminList(
      params,
    ) as unknown as Promise<GetAdminNotificationCampaignsResponse>,

  /** 특정 기수의 사전 알림 캠페인을 등록합니다. */
  createNotificationCampaign: ({
    payload,
  }: {
    payload: PostCreateNotificationCampaignRequest;
  }) => notificationCampaignCreateAdmin(payload),

  /** SCHEDULED/PAUSED 상태의 캠페인 본문/예약 시각을 수정합니다. */
  updateNotificationCampaign: ({
    params,
    payload,
  }: {
    params: PatchUpdateNotificationCampaignParams;
    payload: PatchUpdateNotificationCampaignRequest;
  }) => notificationCampaignUpdateAdmin(params.id, payload),

  /** 캠페인을 soft delete 합니다. */
  deleteNotificationCampaign: ({
    params,
  }: {
    params: DeleteNotificationCampaignParams;
  }) => notificationCampaignDeleteAdmin(params.id),

  /** SCHEDULED → PAUSED 로 전환합니다. */
  pauseNotificationCampaign: ({
    params,
  }: {
    params: PatchPauseNotificationCampaignParams;
  }) => notificationCampaignPauseAdmin(params.id),

  /** PAUSED → SCHEDULED 로 복귀시킵니다. */
  resumeNotificationCampaign: ({
    params,
  }: {
    params: PatchResumeNotificationCampaignParams;
  }) => notificationCampaignResumeAdmin(params.id),
};
