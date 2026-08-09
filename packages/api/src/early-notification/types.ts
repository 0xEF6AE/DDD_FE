import type { components, paths } from "../generated/api";

// GET /api/v1/admin/early-notifications - 어드민 사전 알림 목록 조회
export type GetAdminEarlyNotificationsParams =
  paths["/api/v1/admin/early-notifications"]["get"]["parameters"]["query"];
export type GetAdminEarlyNotificationsResponse = EarlyNotificationDto[];

// GET /api/v1/admin/early-notifications/export - 사전 알림 CSV 내보내기
export type GetAdminEarlyNotificationsCsvParams =
  paths["/api/v1/admin/early-notifications/export"]["get"]["parameters"]["query"];
export type GetAdminEarlyNotificationsCsvResponse = string;

// POST /api/v1/admin/early-notifications/send - 사전 알림 일괄 발송
export type PostSendBulkEarlyNotificationRequest =
  components["schemas"]["SendBulkEarlyNotificationRequestDto"];
export type PostSendBulkEarlyNotificationResponse =
  components["schemas"]["SendBulkEarlyNotificationResponseDto"];

// POST /api/v1/early-notifications - 사전 알림 구독
export type PostSubscribeEarlyNotificationRequest =
  components["schemas"]["SubscribeEarlyNotificationRequestDto"];
export type PostSubscribeEarlyNotificationResponse = void;

// POST /api/v1/early-notifications/general - 대기열 사전 알림 구독 (cohortId 없음)
export type PostSubscribeGeneralEarlyNotificationRequest =
  components["schemas"]["SubscribeGeneralEarlyNotificationRequestDto"];
export type PostSubscribeGeneralEarlyNotificationResponse = void;

// 엔티티 타입 (BE OpenAPI 가 응답 schema 미정의 → 수동 정의)
export interface EarlyNotificationDto {
  id: number;
  cohortId: number;
  email: string;
  notifiedAt?: string;
  createdAt: string;
}
