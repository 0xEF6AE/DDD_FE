import { api } from "../fetchClient";
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
  /** 기수별 사전 알림 캠페인 목록 - GET /api/v1/admin/notification-campaigns */
  getAdminNotificationCampaigns: ({
    params,
  }: {
    params: GetAdminNotificationCampaignsParams;
  }) =>
    api.get("/api/v1/admin/notification-campaigns", {
      params: { query: params },
    }) as unknown as Promise<GetAdminNotificationCampaignsResponse>,

  /** 사전 알림 캠페인 등록 - POST /api/v1/admin/notification-campaigns */
  createNotificationCampaign: ({
    payload,
  }: {
    payload: PostCreateNotificationCampaignRequest;
  }) =>
    api.post("/api/v1/admin/notification-campaigns", {
      body: payload,
    }) as unknown as Promise<void>,

  /** 캠페인 수정 - PATCH /api/v1/admin/notification-campaigns/{id} */
  updateNotificationCampaign: ({
    params,
    payload,
  }: {
    params: PatchUpdateNotificationCampaignParams;
    payload: PatchUpdateNotificationCampaignRequest;
  }) =>
    api.patch("/api/v1/admin/notification-campaigns/{id}", {
      params: { path: { id: params.id } },
      body: payload,
    }) as unknown as Promise<void>,

  /** 캠페인 soft delete - DELETE /api/v1/admin/notification-campaigns/{id} */
  deleteNotificationCampaign: ({
    params,
  }: {
    params: DeleteNotificationCampaignParams;
  }) =>
    api.delete("/api/v1/admin/notification-campaigns/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<void>,

  /** SCHEDULED → PAUSED - PATCH /api/v1/admin/notification-campaigns/{id}/pause */
  pauseNotificationCampaign: ({
    params,
  }: {
    params: PatchPauseNotificationCampaignParams;
  }) =>
    api.patch("/api/v1/admin/notification-campaigns/{id}/pause", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<void>,

  /** PAUSED → SCHEDULED - PATCH /api/v1/admin/notification-campaigns/{id}/resume */
  resumeNotificationCampaign: ({
    params,
  }: {
    params: PatchResumeNotificationCampaignParams;
  }) =>
    api.patch("/api/v1/admin/notification-campaigns/{id}/resume", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<void>,
};
