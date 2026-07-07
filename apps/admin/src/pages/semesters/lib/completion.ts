import { CohortPartConfigDtoName } from "@ddd/api"

import type { CohortDto, CohortPartConfig } from "@ddd/api"

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0

const PROCESS_KEYS = [
  "documentResultDate",
  "interviewStartDate",
  "interviewEndDate",
  "finalResultDate",
] as const

const PARTS = [
  CohortPartConfigDtoName.PM,
  CohortPartConfigDtoName.PD,
  CohortPartConfigDtoName.BE,
  CohortPartConfigDtoName.FE,
  CohortPartConfigDtoName.IOS,
  CohortPartConfigDtoName.AND,
] as const

/** process: 6개 키 모두 비어있지 않은 string 이어야 완료 */
export const isProcessComplete = (process: unknown): boolean => {
  if (typeof process !== "object" || process === null) return false
  const obj = process as Record<string, unknown>
  return PROCESS_KEYS.every((k) => isNonEmptyString(obj[k]))
}

/** curriculum: 길이 9 배열 + 모든 항목이 { date, description } 둘 다 비어있지 않음 */
export const isCurriculumComplete = (curriculum: unknown): boolean => {
  if (!Array.isArray(curriculum)) return false
  if (curriculum.length !== 9) return false
  return curriculum.every((week) => {
    if (typeof week !== "object" || week === null) return false
    const w = week as Record<string, unknown>
    return isNonEmptyString(w.date) && isNonEmptyString(w.description)
  })
}

/**
 * parts: 6개 파트(PM/PD/BE/FE/IOS/AND) 모두 존재하고, **모집 오픈된 파트**는
 * formSchema.questions 에 label 이 비어있지 않은 질문이 1개 이상.
 * 닫힌 파트는 지원서에 안 쓰이므로 완성 판정에서 제외한다 (저장 검증
 * `validateFormParts`·모집중 전환 가드 `validateCohortPartsForRecruiting` 와 정합).
 */
const isPartsComplete = (parts: unknown): boolean => {
  if (!Array.isArray(parts) || parts.length === 0) return false
  return PARTS.every((partName) => {
    const part = (parts as CohortPartConfig[]).find((p) => p.partName === partName)
    if (!part) return false
    if (!part.isOpen) return true
    const questions = (part.applicationSchema as Record<string, unknown>)?.questions
    if (!Array.isArray(questions)) return false
    return questions.some(
      (q) =>
        typeof q === "object" &&
        q !== null &&
        isNonEmptyString((q as Record<string, unknown>).label),
    )
  })
}

/** process / curriculum / parts 모두 완료여야 cohort 완료로 간주 (= "새 기수 등록" 모드) */
export const isCohortComplete = (cohort: CohortDto): boolean =>
  isProcessComplete(cohort.process) &&
  isCurriculumComplete(cohort.curriculum) &&
  isPartsComplete(cohort.parts)
