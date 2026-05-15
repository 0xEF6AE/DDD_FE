import type { CohortDto, CohortPartConfigDto, CohortPartName } from "@ddd/api"

export interface PartsRecruitingViolation {
  message: string
  invalidParts: ReadonlyArray<CohortPartName>
}

const hasQuestion = (part: CohortPartConfigDto): boolean => {
  const raw = (part.applicationSchema as Record<string, unknown> | undefined)
    ?.questions
  return Array.isArray(raw) && raw.length > 0
}

/**
 * UPCOMING → RECRUITING 전환 가드.
 * isOpen=true 파트가 0개이거나, 그 중 questions 가 비어 있는 파트가 있으면 차단.
 */
export const validateCohortPartsForRecruiting = (
  cohort: CohortDto
): PartsRecruitingViolation | null => {
  const openParts = (cohort.parts ?? []).filter((p) => p.isOpen)

  if (openParts.length === 0) {
    return {
      message:
        "모집할 파트가 없습니다. 최소 한 개 이상의 파트를 모집 오픈으로 설정해주세요",
      invalidParts: [],
    }
  }

  const empty = openParts.filter((p) => !hasQuestion(p))
  if (empty.length === 0) return null

  const labels = empty.map((p) => p.partName).join(", ")
  return {
    message: `${labels} 파트의 지원서 양식이 비어있어 모집중으로 전환할 수 없습니다`,
    invalidParts: empty.map((p) => p.partName),
  }
}
