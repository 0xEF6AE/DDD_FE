import { NotificationCampaignStatus } from "@ddd/api"

import type { NotificationCampaignGetAdminListStatus } from "@ddd/api"

/** status enum → 사용자 표시 라벨 */
export const STATUS_LABEL: Record<
  NotificationCampaignGetAdminListStatus,
  string
> = {
  [NotificationCampaignStatus.SCHEDULED]: "예약됨",
  [NotificationCampaignStatus.PAUSED]: "일시정지",
  [NotificationCampaignStatus.RUNNING]: "발송 중",
  [NotificationCampaignStatus.DONE]: "발송 완료",
  [NotificationCampaignStatus.FAILED]: "실패",
}

/** 상태 배지 톤 (Tailwind 클래스) */
export const STATUS_TONE: Record<
  NotificationCampaignGetAdminListStatus,
  string
> = {
  [NotificationCampaignStatus.SCHEDULED]: "bg-blue-100 text-blue-700",
  [NotificationCampaignStatus.PAUSED]: "bg-gray-100 text-gray-700",
  [NotificationCampaignStatus.RUNNING]: "bg-amber-100 text-amber-700",
  [NotificationCampaignStatus.DONE]: "bg-emerald-100 text-emerald-700",
  [NotificationCampaignStatus.FAILED]: "bg-red-100 text-red-700",
}
