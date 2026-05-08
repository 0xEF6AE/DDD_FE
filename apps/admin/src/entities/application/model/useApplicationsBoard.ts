import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  applicationQueries,
  cohortQueries,
  type ApplicationDto,
  type CohortDto,
} from "@ddd/api"

import type { ApplicationStatus } from "./constants"

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
  const { data: cohortsData } = useQuery(cohortQueries.getCohorts())
  const cohorts = useMemo(() => cohortsData ?? [], [cohortsData])

  const effectiveCohortId = useMemo(
    () =>
      cohortIdInput === undefined
        ? pickLatestCohortId(cohorts)
        : (cohortIdInput ?? undefined),
    [cohortIdInput, cohorts],
  )

  const { data: cardData } = useQuery(
    applicationQueries.getAdminApplications({
      params: {
        ...(effectiveCohortId !== undefined && { cohortId: effectiveCohortId }),
        ...(cohortPartId !== undefined && { cohortPartId }),
      },
    }),
  )

  const { data: tableData } = useQuery(
    applicationQueries.getAdminApplications({
      params: {
        ...(effectiveCohortId !== undefined && { cohortId: effectiveCohortId }),
        ...(cohortPartId !== undefined && { cohortPartId }),
        ...(status !== undefined && { status: status as string }),
      },
    }),
  )

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
  }
}
