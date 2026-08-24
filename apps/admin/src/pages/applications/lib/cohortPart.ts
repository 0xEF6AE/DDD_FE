import type { CohortDto, CohortPartName } from "@ddd/api"

/** `cohortPartId` 로 찾은 소속 기수 + 파트 정보 */
export type CohortPartInfo = {
  cohortId: number
  cohortName: string
  partName: CohortPartName
}

/**
 * `cohortPartId → { 기수, 파트 }` 역인덱스.
 *
 * 어드민 지원서 응답(BE `AdminApplicationFormResponseDto`)은 `cohortPartId` 만
 * 담고 기수 식별자를 담지 않는다. cohort_part 는 기수 하나에만 속하므로,
 * 기수 목록(`GET /admin/cohorts`, 응답에 `parts[]` 포함)을 뒤집어 소속 기수를
 * 복원한다. 표의 "파트"·"기수" 컬럼과 상세 드로어가 이 인덱스를 공유한다.
 */
export function buildCohortPartInfoById(
  cohorts: CohortDto[],
): Map<number, CohortPartInfo> {
  const infoById = new Map<number, CohortPartInfo>()

  for (const cohort of cohorts) {
    for (const part of cohort.parts ?? []) {
      if (part.id === undefined) continue
      infoById.set(part.id, {
        cohortId: cohort.id,
        cohortName: cohort.name,
        partName: part.partName,
      })
    }
  }

  return infoById
}
