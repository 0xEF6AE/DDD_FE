import { z } from "zod"

import type {
  NotificationCampaignDto,
  PatchUpdateNotificationCampaignRequest,
} from "@ddd/api"

/**
 * 캠페인 편집 폼 schema.
 *
 * `scheduledAt` 은 `<input type="datetime-local">` 의 네이티브 포맷
 * (`yyyy-MM-ddTHH:mm`) 으로 다룬다. 직렬화 시점에 ISO 로 변환한다.
 */
export const campaignFormSchema = z.object({
  subject: z
    .string()
    .min(1, "메일 제목을 입력해 주세요.")
    .max(200, "200자 이하로 입력해 주세요."),
  scheduledAt: z
    .string()
    .min(1, "발송 예정 시각을 선택해 주세요.")
    .refine(
      (v) => {
        const t = new Date(v).getTime()
        return Number.isFinite(t) && t > Date.now()
      },
      { message: "현재 시각 이후로 선택해 주세요." },
    ),
  html: z
    .string()
    .min(1, "HTML 본문을 입력해 주세요.")
    .max(50000, "50000자 이하로 입력해 주세요."),
  text: z
    .string()
    .min(1, "텍스트 본문을 입력해 주세요.")
    .max(20000, "20000자 이하로 입력해 주세요."),
})

export type CampaignFormValues = z.infer<typeof campaignFormSchema>

/**
 * ISO → `yyyy-MM-ddTHH:mm` 로컬 포맷. datetime-local input 의 기본값에 사용.
 * 잘못된 입력은 빈 문자열로 폴백.
 */
const toLocalDateTimeInputValue = (iso?: string): string => {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => `${n}`.padStart(2, "0")
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export const buildCampaignFormDefaults = (
  campaign?: NotificationCampaignDto,
): CampaignFormValues => ({
  subject: campaign?.subject ?? "",
  scheduledAt: toLocalDateTimeInputValue(campaign?.scheduledAt),
  html: campaign?.html ?? "",
  text: campaign?.text ?? "",
})

export const serializeCampaignFormPayload = (
  values: CampaignFormValues,
): PatchUpdateNotificationCampaignRequest => ({
  subject: values.subject,
  scheduledAt: new Date(values.scheduledAt).toISOString(),
  html: values.html,
  text: values.text,
})
