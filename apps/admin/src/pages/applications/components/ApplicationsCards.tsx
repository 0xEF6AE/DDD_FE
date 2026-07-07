import { useMemo } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"

import { applicationQueries, type ApplicationDto } from "@ddd/api"

import type { ApplicationStatus } from "@/pages/applications/constants"

import { CardSection } from "./Sections"

type ApplicationsCardsProps = {
  /** 최신 기수 자동 적용까지 반영된 확정 cohortId (전체 기수면 undefined) */
  effectiveCohortId: number | undefined
  cohortPartId: number | undefined
  contextLabel: string
}

/** 카드 카운트용: status 필터는 제외하고 기수/파트 기준으로만 집계한다. */
export const ApplicationsCards = ({
  effectiveCohortId,
  cohortPartId,
  contextLabel,
}: ApplicationsCardsProps) => {
  const { data } = useSuspenseQuery(
    applicationQueries.getAdminApplications({
      params: {
        ...(effectiveCohortId !== undefined && { cohortId: effectiveCohortId }),
        ...(cohortPartId !== undefined && { cohortPartId }),
      },
    }),
  )

  const cards: ApplicationDto[] = useMemo(() => data ?? [], [data])

  const counts = useMemo(() => {
    const acc: Partial<Record<ApplicationStatus, number>> = {}
    for (const application of cards) {
      const key = application.status as ApplicationStatus
      acc[key] = (acc[key] ?? 0) + 1
    }
    return acc
  }, [cards])

  return (
    <CardSection total={cards.length} counts={counts} contextLabel={contextLabel} />
  )
}
