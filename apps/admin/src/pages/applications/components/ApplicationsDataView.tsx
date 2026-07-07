import { useMemo } from "react"
import { useSuspenseQueries } from "@tanstack/react-query"

import {
  applicationQueries,
  interviewQueries,
  type ApplicationDto,
  type CohortDto,
  type InterviewSlot,
} from "@ddd/api"

import type { ApplicationStatus } from "@/pages/applications/constants"

import { ApplicationTable } from "./ApplicationTable"

type ApplicationsDataViewProps = {
  effectiveCohortId: number | undefined
  cohortPartId: number | undefined
  status: ApplicationStatus | undefined
  searchText: string
  cohorts: CohortDto[]
  onRowPress: (id: number) => void
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
 * 표 데이터 조립. 표용 지원자(모든 서버 필터)와 면접 슬롯을 병렬로 받는다
 * (useSuspenseQueries 로 묶어 네트워크 워터폴을 방지한다).
 */
export const ApplicationsDataView = ({
  effectiveCohortId,
  cohortPartId,
  status,
  searchText,
  cohorts,
  onRowPress,
}: ApplicationsDataViewProps) => {
  const [{ data: tableData }, { data: slotData }] = useSuspenseQueries({
    queries: [
      applicationQueries.getAdminApplications({
        params: {
          ...(effectiveCohortId !== undefined && { cohortId: effectiveCohortId }),
          ...(cohortPartId !== undefined && { cohortPartId }),
          ...(status !== undefined && { status }),
        },
      }),
      interviewQueries.getInterviewSlots({
        params: effectiveCohortId !== undefined ? { cohortId: effectiveCohortId } : {},
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

  const tableRows = useMemo(
    () => (tableData ?? []).filter((application) => matchesSearch(application, searchText)),
    [tableData, searchText],
  )

  return (
    <ApplicationTable
      applications={tableRows}
      cohorts={cohorts}
      interviewScheduledByApplicationId={interviewScheduledByApplicationId}
      onRowPress={onRowPress}
    />
  )
}
