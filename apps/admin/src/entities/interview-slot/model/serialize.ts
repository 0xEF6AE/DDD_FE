import type {
  CreateInterviewSlotRequestDto,
  InterviewSlot,
  UpdateInterviewSlotRequestDto,
} from "@ddd/api"

import type { InterviewSlotForm } from "../../../pages/interview-slots/types"

/** "2026-03-15" + "14:00:00" → "2026-03-15T14:00:00" */
const combineToIsoLocal = (date: string, time: string): string => {
  const t = time.length === 5 ? `${time}:00` : time
  return `${date}T${t}`
}

/** ISO 문자열에서 날짜 부분 추출 ("2026-03-15") */
const isoDate = (iso: string): string => iso.slice(0, 10)

/** ISO 문자열에서 시각 부분 추출 ("14:00:00") */
const isoTime = (iso: string): string => {
  const t = iso.slice(11, 19)
  return t.length === 5 ? `${t}:00` : t || "00:00:00"
}

const trimmedOrUndefined = (s: string): string | undefined => {
  const t = s.trim()
  return t.length === 0 ? undefined : t
}

export const serializeFormToCreatePayload = (
  form: InterviewSlotForm,
): CreateInterviewSlotRequestDto => ({
  cohortId: form.cohortId,
  cohortPartId: form.cohortPartId,
  startAt: combineToIsoLocal(form.date, form.startTime),
  endAt: combineToIsoLocal(form.date, form.endTime),
  capacity: form.capacity,
  location: trimmedOrUndefined(form.location),
  description: trimmedOrUndefined(form.description),
})

/**
 * 수정 페이로드 — BE PATCH DTO 가 cohortId/cohortPartId 를 받지 않으므로 제외.
 * 슬롯의 기수/파트는 한 번 만들면 변경 불가 (정책).
 */
export const serializeFormToUpdatePayload = (
  form: InterviewSlotForm,
): UpdateInterviewSlotRequestDto => ({
  startAt: combineToIsoLocal(form.date, form.startTime),
  endAt: combineToIsoLocal(form.date, form.endTime),
  capacity: form.capacity,
  location: trimmedOrUndefined(form.location),
  description: trimmedOrUndefined(form.description),
})

export const serializeSlotToForm = (
  slot: InterviewSlot,
): Partial<InterviewSlotForm> => ({
  cohortId: slot.cohortId,
  cohortPartId: slot.cohortPartId,
  date: isoDate(slot.startAt),
  startTime: isoTime(slot.startAt),
  endTime: isoTime(slot.endAt),
  capacity: slot.capacity,
  location: slot.location ?? "",
  description: slot.description ?? "",
})
