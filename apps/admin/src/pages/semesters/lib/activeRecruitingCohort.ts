import { CreateCohortRequestDtoStatus, type CohortDto } from "@ddd/api"

/**
 * "모집 라이프사이클"을 점유하는 상태 = 모집예정 + 모집중.
 * 동아리는 한 번에 한 기수만 모집하므로 이 상태의 기수는 동시에 하나만 존재해야 한다.
 */
const ACTIVE_STATUSES: ReadonlySet<CohortDto["status"]> = new Set([
  CreateCohortRequestDtoStatus.UPCOMING,
  CreateCohortRequestDtoStatus.RECRUITING,
])

/**
 * `excludeId` 를 제외하고 이미 모집예정/모집중인 기수를 찾는다 (없으면 undefined).
 * 새 기수 등록·모집중 전환 전에 "동시 모집 1개" 제약을 클라이언트에서 사전 판정하는 용도.
 */
export const findActiveRecruitingCohort = (
  cohorts: CohortDto[],
  excludeId?: number,
): CohortDto | undefined =>
  cohorts.find((c) => c.id !== excludeId && ACTIVE_STATUSES.has(c.status))
