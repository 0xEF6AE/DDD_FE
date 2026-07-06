import { useMemo } from "react"
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query"
import {
  applicationQueries,
  cohortQueries,
  interviewQueries,
  type ApplicationDto,
  type CohortDto,
  type InterviewSlot,
} from "@ddd/api"

import type { ApplicationStatus } from "../constants"

interface UseApplicationsBoardArgs {
  /** undefined = 미선택(→ 최신 기수 자동 적용), null = 전체 기수, number = 특정 기수 */
  cohortIdInput: number | null | undefined
  cohortPartId?: number
  status?: ApplicationStatus
  searchText: string
}

const pickLatestCohortId = (cohorts: CohortDto[]): number | undefined => {
  if (cohorts.length === 0) return undefined
  return [...cohorts].sort(
    (a, b) =>
      new Date(b.recruitStartAt).getTime() - new Date(a.recruitStartAt).getTime() ||
      b.id - a.id,
  )[0].id
}

const matchesSearch = (application: ApplicationDto, searchText: string): boolean => {
  const trimmed = searchText.trim()
  if (trimmed === "") return true
  return (
    application.applicantName.includes(trimmed) ||
    (application.applicantPhone?.includes(trimmed) ?? false)
  )
}

/**
 * 지원자 보드 데이터 조립 흐름 훅.
 *
 * - GET /admin/applications 카드용 (status 필터 제외) + 표용 (모든 필터)
 * - GET /cohorts 셀렉터 + 최신 기수 자동 선택
 * - 클라이언트 검색 필터 + 카드 카운트 산출까지 한 번에 반환한다.
 */
export const useApplicationsBoard = ({
  cohortIdInput,
  cohortPartId,
  status,
  searchText,
}: UseApplicationsBoardArgs) => {
  const { data: cohorts } = useSuspenseQuery(cohortQueries.getCohorts())

  const effectiveCohortId = useMemo(
    () =>
      cohortIdInput === undefined
        ? pickLatestCohortId(cohorts)
        : (cohortIdInput ?? undefined),
    [cohortIdInput, cohorts],
  )

  // cohorts 는 effectiveCohortId 도출에 필요해 먼저 받고, 나머지 3개는
  // useSuspenseQueries 로 묶어 병렬 요청한다(개별 useSuspenseQuery 를 나열하면
  // 하나씩 suspend 되며 네트워크 워터폴이 발생한다).
  const [{ data: cardData }, { data: tableData }, { data: slotData }] =
    useSuspenseQueries({
      queries: [
        applicationQueries.getAdminApplications({
          params: {
            ...(effectiveCohortId !== undefined && { cohortId: effectiveCohortId }),
            ...(cohortPartId !== undefined && { cohortPartId }),
          },
        }),
        applicationQueries.getAdminApplications({
          params: {
            ...(effectiveCohortId !== undefined && { cohortId: effectiveCohortId }),
            ...(cohortPartId !== undefined && { cohortPartId }),
            ...(status !== undefined && { status }),
          },
        }),
        interviewQueries.getInterviewSlots({
          params:
            effectiveCohortId !== undefined ? { cohortId: effectiveCohortId } : {},
        }),
      ],
    })

  const interviewScheduledByApplicationId = useMemo(() => {
    const map = new Map<number, string>()
    const slots: InterviewSlot[] = slotData ?? []
    for (const slot of slots) {
      for (const reservation of slot.reservations ?? []) {
        map.set(reservation.applicationFormId, slot.startAt)
      }
    }
    return map
  }, [slotData])

  const cards: ApplicationDto[] = useMemo(() => cardData ?? [], [cardData])
  const tableRowsRaw: ApplicationDto[] = useMemo(() => tableData ?? [], [tableData])

  const tableRows = useMemo(
    () => tableRowsRaw.filter((application) => matchesSearch(application, searchText)),
    [tableRowsRaw, searchText],
  )

  const counts = useMemo(() => {
    const acc: Partial<Record<ApplicationStatus, number>> = {}
    for (const application of cards) {
      const key = application.status as ApplicationStatus
      acc[key] = (acc[key] ?? 0) + 1
    }
    return acc
  }, [cards])

  const selectedCohort = cohorts.find((cohort) => cohort.id === effectiveCohortId)
  const contextLabel = selectedCohort ? `${selectedCohort.name} 기준` : "전체 기수 합산"

  return {
    cohorts,
    effectiveCohortId,
    contextLabel,
    cards,
    counts,
    tableRows,
    interviewScheduledByApplicationId,
  }
}
