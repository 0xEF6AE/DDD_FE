import { Suspense, useMemo, useState } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import { ErrorBoundary } from "react-error-boundary"

import { cohortQueries, type CohortDto } from "@ddd/api"

import { TitleSection } from "@/shared/ui/Heading"
import { ErrorFallback } from "@/shared/ui/ErrorFallback"
import { type ApplicationStatus } from "@/pages/applications/constants"
import { ApplicationFilters } from "./components/ApplicationFilters"
import { ApplicationsCards } from "./components/ApplicationsCards"
import { ApplicationsCardsSkeleton } from "./components/ApplicationsCardsSkeleton"
import { ApplicationsDataView } from "./components/ApplicationsDataView"
import { ApplicationsTableSkeleton } from "./components/ApplicationsTableSkeleton"
import { ApplicationDetailDrawer } from "./components/ApplicationDetailDrawer"

const pickLatestCohortId = (cohorts: CohortDto[]): number | undefined => {
  if (cohorts.length === 0) return undefined
  return [...cohorts].sort(
    (a, b) =>
      new Date(b.recruitStartAt).getTime() - new Date(a.recruitStartAt).getTime() ||
      b.id - a.id,
  )[0].id
}

export default function ApplicationsPage() {
  return (
    <div className="w-full space-y-5 p-5">
      <TitleSection
        title="지원자 관리"
        description="지원서를 검토하고 상태를 변경합니다."
      />
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense
          fallback={
            <>
              <ApplicationsCardsSkeleton />
              <div className="space-y-5 rounded-lg bg-white p-5 shadow">
                <ApplicationsTableSkeleton />
              </div>
            </>
          }
        >
          <ApplicationsContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

/**
 * undefined = "아직 사용자가 선택하지 않음(→ 최신 기수 자동 적용)"
 * null      = 사용자가 명시적으로 "전체 기수" 선택
 *
 * 셀렉터/기수 목록은 이 경계에서 한 번만 로드하고, 필터 변경 시 재-suspend
 * 되면 안 되므로 카드/표만 각자의 내부 Suspense 경계로 감싼다(필터 유지).
 */
function ApplicationsContent() {
  const [searchText, setSearchText] = useState("")
  const [selectedCohortId, setSelectedCohortId] = useState<number | null | undefined>(undefined)
  const [selectedCohortPartId, setSelectedCohortPartId] = useState<number | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | undefined>(undefined)
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null)

  const { data: cohorts } = useSuspenseQuery(cohortQueries.getCohorts())

  const effectiveCohortId = useMemo(
    () =>
      selectedCohortId === undefined
        ? pickLatestCohortId(cohorts)
        : (selectedCohortId ?? undefined),
    [selectedCohortId, cohorts],
  )

  const selectedCohort = cohorts.find((cohort) => cohort.id === effectiveCohortId)
  const contextLabel = selectedCohort ? `${selectedCohort.name} 기준` : "전체 기수 합산"

  const handleCohortChange = (id: number | undefined) => {
    setSelectedCohortId(id ?? null)
    setSelectedCohortPartId(undefined)
  }

  return (
    <>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<ApplicationsCardsSkeleton />}>
          <ApplicationsCards
            effectiveCohortId={effectiveCohortId}
            cohortPartId={selectedCohortPartId}
            contextLabel={contextLabel}
          />
        </Suspense>
      </ErrorBoundary>

      <div className="space-y-5 rounded-lg bg-white p-5 shadow">
        <ApplicationFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          cohorts={cohorts}
          selectedCohortId={effectiveCohortId}
          onCohortChange={handleCohortChange}
          selectedCohortPartId={selectedCohortPartId}
          onCohortPartChange={setSelectedCohortPartId}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<ApplicationsTableSkeleton />}>
            <ApplicationsDataView
              effectiveCohortId={effectiveCohortId}
              cohortPartId={selectedCohortPartId}
              status={selectedStatus}
              searchText={searchText}
              cohorts={cohorts}
              onRowPress={(id) => setSelectedApplicationId(id)}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      <ApplicationDetailDrawer
        isOpen={selectedApplicationId !== null}
        onOpenChange={(open) => !open && setSelectedApplicationId(null)}
        applicationId={selectedApplicationId}
      />
    </>
  )
}
