import { CreateCohortRequestDtoStatus, type CohortDto } from "@ddd/api"

import { isCohortComplete } from "@/pages/semesters/lib/completion"

/**
 * "작성 이어하기" 대상 기수를 찾는다 (없으면 undefined).
 *
 * 최신 기수는 항상 id 내림차순 첫 번째로 판정하고, 그 기수의 status 를 함께 본다.
 * - 기수가 없거나 최신 기수가 이미 완성됨 → 이어쓸 대상 없음
 * - 최신 기수가 활동 종료(CLOSED) → 끝난 기수를 이어 작성할 일은 없으므로 제외
 *
 * status 로 후보를 먼저 거르지 않는 이유: 종료된 13기를 건너뛰고 예전 11기가
 * 이어쓰기 대상이 되는 역전이 생긴다. "최신"의 기준은 어디까지나 id 다.
 *
 * 새 기수 등록은 이 판정과 무관하게 항상 가능하다 (SemestersPage 상단 버튼).
 */
export const findResumableCohort = (
  cohorts: CohortDto[],
): CohortDto | undefined => {
  const latest = cohorts.slice().sort((a, b) => b.id - a.id)[0]
  if (!latest) return undefined
  if (latest.status === CreateCohortRequestDtoStatus.CLOSED) return undefined
  return isCohortComplete(latest) ? undefined : latest
}
