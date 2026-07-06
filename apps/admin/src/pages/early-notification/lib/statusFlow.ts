import { NotificationCampaignStatus } from "@ddd/api"

import type { NotificationCampaignGetAdminListStatus } from "@ddd/api"

/** 현재 상태에서 일시정지 가능 여부 (SCHEDULED → PAUSED). */
export const canPause = (
  s: NotificationCampaignGetAdminListStatus,
): boolean => s === NotificationCampaignStatus.SCHEDULED

/** 현재 상태에서 재개 가능 여부 (PAUSED → SCHEDULED). */
export const canResume = (
  s: NotificationCampaignGetAdminListStatus,
): boolean => s === NotificationCampaignStatus.PAUSED

/** 본문/예약 시각 편집 가능 여부 (SCHEDULED, PAUSED 만). */
export const canEdit = (
  s: NotificationCampaignGetAdminListStatus,
): boolean =>
  s === NotificationCampaignStatus.SCHEDULED ||
  s === NotificationCampaignStatus.PAUSED
