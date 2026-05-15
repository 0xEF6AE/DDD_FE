import { api } from "../fetchClient";
import type {
  GetAdminEarlyNotificationsParams,
  GetAdminEarlyNotificationsResponse,
  GetAdminEarlyNotificationsCsvParams,
  GetAdminEarlyNotificationsCsvResponse,
  PostSendBulkEarlyNotificationRequest,
  PostSubscribeEarlyNotificationRequest,
  PostSubscribeGeneralEarlyNotificationRequest,
} from "./types";

export const earlyNotificationAPI = {
  /** 기수별 사전 알림 신청 목록 조회 - GET /api/v1/admin/early-notifications */
  getAdminEarlyNotifications: ({
    params,
  }: {
    params: GetAdminEarlyNotificationsParams;
  }) =>
    api.get("/api/v1/admin/early-notifications", {
      params: { query: params },
    }) as unknown as Promise<GetAdminEarlyNotificationsResponse>,

  /** 사전 알림 목록 CSV 내보내기 - GET /api/v1/admin/early-notifications/export */
  exportAdminCsv: ({
    params,
  }: {
    params: GetAdminEarlyNotificationsCsvParams;
  }): Promise<GetAdminEarlyNotificationsCsvResponse> =>
    api.get("/api/v1/admin/early-notifications/export", {
      params: { query: params },
      parseAs: "text",
    }) as unknown as Promise<string>,

  /** 사전 알림 일괄 발송 - POST /api/v1/admin/early-notifications/send */
  sendBulkEarlyNotification: ({
    payload,
  }: {
    payload: PostSendBulkEarlyNotificationRequest;
  }) =>
    api.post("/api/v1/admin/early-notifications/send", {
      body: payload,
    }) as unknown as Promise<void>,

  /** 사전 알림 이메일 구독 - POST /api/v1/early-notifications */
  subscribeEarlyNotification: ({
    payload,
  }: {
    payload: PostSubscribeEarlyNotificationRequest;
  }) =>
    api.post("/api/v1/early-notifications", { body: payload }) as unknown as Promise<void>,

  /** 대기열 사전 알림 구독 - POST /api/v1/early-notifications/general */
  subscribeGeneralEarlyNotification: ({
    payload,
  }: {
    payload: PostSubscribeGeneralEarlyNotificationRequest;
  }) =>
    api.post("/api/v1/early-notifications/general", {
      body: payload,
    }) as unknown as Promise<void>,
};
