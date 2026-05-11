import type {
  CreateNotificationCampaignRequestDto,
  UpdateNotificationCampaignRequestDto,
  NotificationCampaignGetAdminListParams,
  NotificationCampaignGetAdminListStatus,
} from "../generated/dddApi.schemas";

export type {
  CreateNotificationCampaignRequestDto,
  UpdateNotificationCampaignRequestDto,
  NotificationCampaignGetAdminListParams,
  NotificationCampaignGetAdminListStatus,
};
export { NotificationCampaignGetAdminListStatus as NotificationCampaignStatus } from "../generated/dddApi.schemas";

// GET /api/v1/admin/notification-campaigns - 어드민 캠페인 목록 조회
export type GetAdminNotificationCampaignsParams = NotificationCampaignGetAdminListParams;
export type GetAdminNotificationCampaignsResponse = NotificationCampaignDto[];

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

// PATCH /api/v1/admin/notification-campaigns/{id}/pause - 캠페인 일시정지
export type PatchPauseNotificationCampaignParams = { id: number };
export type PatchPauseNotificationCampaignResponse = void;

// PATCH /api/v1/admin/notification-campaigns/{id}/resume - 캠페인 재개
export type PatchResumeNotificationCampaignParams = { id: number };
export type PatchResumeNotificationCampaignResponse = void;

// 엔티티 타입 (백엔드 응답 스펙이 OpenAPI 에 명시되지 않아 수동 정의 — early-notification 패턴)
export interface NotificationCampaignDto {
  id: number;
  cohortId: number;
  status: NotificationCampaignGetAdminListStatus;
  scheduledAt: string;
  subject: string;
  html: string;
  text: string;
  sentAt?: string;
  createdAt: string;
  updatedAt?: string;
}
