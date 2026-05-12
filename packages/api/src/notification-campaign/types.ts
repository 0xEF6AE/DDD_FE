import type { components, paths } from "../generated/api";

// ---------- Runtime enum (consumers reference NotificationCampaignStatus.PAUSED 등) ----------
export const NotificationCampaignStatus = {
  SCHEDULED: "SCHEDULED",
  RUNNING: "RUNNING",
  DONE: "DONE",
  PAUSED: "PAUSED",
  FAILED: "FAILED",
} as const;
export type NotificationCampaignStatus =
  (typeof NotificationCampaignStatus)[keyof typeof NotificationCampaignStatus];

// 별칭 — 기존 코드 호환
export type NotificationCampaignGetAdminListStatus = NotificationCampaignStatus;

// Request DTO 재노출
export type CreateNotificationCampaignRequestDto =
  components["schemas"]["CreateNotificationCampaignRequestDto"];
export type UpdateNotificationCampaignRequestDto =
  components["schemas"]["UpdateNotificationCampaignRequestDto"];

// GET /api/v1/admin/notification-campaigns - 어드민 캠페인 목록 조회
export type GetAdminNotificationCampaignsParams =
  paths["/api/v1/admin/notification-campaigns"]["get"]["parameters"]["query"];
export type GetAdminNotificationCampaignsResponse = NotificationCampaignDto[];
export type NotificationCampaignGetAdminListParams = GetAdminNotificationCampaignsParams;

// POST /api/v1/admin/notification-campaigns - 캠페인 등록
export type PostCreateNotificationCampaignRequest = CreateNotificationCampaignRequestDto;
export type PostCreateNotificationCampaignResponse = void;

// PATCH /api/v1/admin/notification-campaigns/{id} - 캠페인 수정
export type PatchUpdateNotificationCampaignParams = { id: number };
export type PatchUpdateNotificationCampaignRequest = UpdateNotificationCampaignRequestDto;
export type PatchUpdateNotificationCampaignResponse = void;

// DELETE /api/v1/admin/notification-campaigns/{id} - 캠페인 삭제
export type DeleteNotificationCampaignParams = { id: number };
export type DeleteNotificationCampaignResponse = void;

// PATCH /api/v1/admin/notification-campaigns/{id}/pause - 일시정지
export type PatchPauseNotificationCampaignParams = { id: number };
export type PatchPauseNotificationCampaignResponse = void;

// PATCH /api/v1/admin/notification-campaigns/{id}/resume - 재개
export type PatchResumeNotificationCampaignParams = { id: number };
export type PatchResumeNotificationCampaignResponse = void;

// 엔티티 타입 (BE OpenAPI 가 응답 schema 미정의 → 수동 정의)
export interface NotificationCampaignDto {
  id: number;
  cohortId: number;
  status: NotificationCampaignStatus;
  scheduledAt: string;
  subject: string;
  html: string;
  text: string;
  sentAt?: string;
  createdAt: string;
  updatedAt?: string;
}
