import { Suspense, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { useSuspenseQuery } from "@tanstack/react-query"

import { cohortQueries, type CohortDto, type CohortStatus } from "@ddd/api"

import { EmptyState } from "@/shared/ui/EmptyState"
import { ErrorFallback } from "@/shared/ui/ErrorFallback"

import { CohortsAreaSkeleton } from "./components/CohortsAreaSkeleton"
import { EarlyNotificationBulkSendDrawer } from "./components/EarlyNotificationBulkSendDrawer"
import { EarlyNotificationToolbar } from "./components/EarlyNotificationToolbar"
import { EarlyNotificationDataView } from "./EarlyNotificationDataView"
import { useDownloadEarlyNotificationsCsv } from "./hooks/useDownloadEarlyNotificationsCsv"
import type { StatusFilterOption } from "./constants"
import { EarlyNotificationStatsSection } from "./components/EarlyNotificationStatsSection"
import { NotificationCampaignSection } from "./components/NotificationCampaignSection"

// 백엔드 `CohortRepository.findActive()` + `CohortService.findActiveCohort()` 와
// 동일한 활성 기준. 종료(CLOSED)된 기수는 활성으로 보지 않는다 —
// 예전에는 CLOSED 기수로 폴백해 "지난 기수 0명" 을 정상 화면처럼 보여줬다.
const ACTIVE_STATUS_PRIORITY: CohortStatus[] = [
  "RECRUITING",
  "UPCOMING",
  "ACTIVE",
]

const pickActiveCohortId = (cohorts: CohortDto[]): number | null => {
  const actives = cohorts
    .filter((c) => ACTIVE_STATUS_PRIORITY.includes(c.status))
    .sort((a, b) => {
      const byStatus =
        ACTIVE_STATUS_PRIORITY.indexOf(a.status) -
        ACTIVE_STATUS_PRIORITY.indexOf(b.status)
      if (byStatus !== 0) return byStatus
      return (
        new Date(b.recruitStartAt).getTime() -
        new Date(a.recruitStartAt).getTime()
      )
    })
  return actives[0]?.id ?? null
}

type EarlyNotificationContentProps = {
  searchText: string
  statusFilter: StatusFilterOption
  overrideCohortId: number | null
  onSearchChange: (v: string) => void
  onStatusFilterChange: (v: StatusFilterOption) => void
  onCohortChange: (id: number) => void
}

export const EarlyNotificationContent = ({
  searchText,
  statusFilter,
  overrideCohortId,
  onSearchChange,
  onStatusFilterChange,
  onCohortChange,
}: EarlyNotificationContentProps) => {
  const { data: cohorts } = useSuspenseQuery(cohortQueries.getCohorts())
  const [isBulkSendOpen, setIsBulkSendOpen] = useState(false)
  const { download: handleExport, isExporting } = useDownloadEarlyNotificationsCsv()

  if (cohorts.length === 0) {
    return <EmptyState>등록된 기수가 없습니다.</EmptyState>
  }

  const effectiveCohortId = overrideCohortId ?? pickActiveCohortId(cohorts)
  const selectedCohort =
    effectiveCohortId === null
      ? undefined
      : cohorts.find((c) => c.id === effectiveCohortId)

  // 활성 기수가 없으면 지난 기수로 폴백하지 않고 상태를 그대로 알린다.
  // 기수 선택은 남겨 두어 지난 기수 기록은 계속 열람할 수 있게 한다.
  if (!selectedCohort) {
    return (
      <div className="space-y-5 rounded-lg bg-white p-5 shadow">
        <EarlyNotificationToolbar
          searchText={searchText}
          onSearchChange={onSearchChange}
          cohorts={cohorts}
          cohortId={null}
          onCohortChange={onCohortChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          onOpenBulkSend={() => setIsBulkSendOpen(true)}
          isBulkSendDisabled
          onExportCsv={() => {}}
          isExporting={false}
          isExportDisabled
        />
        <EmptyState>
          <p>모집 예정이거나 진행 중인 기수가 없습니다.</p>
          <p>
            기수를 생성하면 대기 중인 사전 알림 신청자가 해당 기수로 자동
            등록됩니다.
          </p>
          <p>지난 기수 기록은 위 기수 선택에서 확인할 수 있습니다.</p>
        </EmptyState>
      </div>
    )
  }

  const cohortId = selectedCohort.id

  return (
    <div className="space-y-5">
      <Suspense fallback={<CohortsAreaSkeleton />}>
        <EarlyNotificationStatsSection selectedCohort={selectedCohort} />
      </Suspense>

      <div className="space-y-5 rounded-lg bg-white p-5 shadow">
        <EarlyNotificationToolbar
          searchText={searchText}
          onSearchChange={onSearchChange}
          cohorts={cohorts}
          cohortId={cohortId}
          onCohortChange={onCohortChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          onOpenBulkSend={() => setIsBulkSendOpen(true)}
          isBulkSendDisabled={false}
          onExportCsv={() =>
            handleExport({
              cohortId,
              cohortName: selectedCohort.name,
            })
          }
          isExporting={isExporting}
          isExportDisabled={isExporting}
        />
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<CohortsAreaSkeleton />}>
            <EarlyNotificationDataView
              cohortId={cohortId}
              cohorts={cohorts}
              searchText={searchText}
              statusFilter={statusFilter}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Suspense fallback={<CohortsAreaSkeleton />}>
          <NotificationCampaignSection cohortId={cohortId} />
        </Suspense>
      </ErrorBoundary>

      <EarlyNotificationBulkSendDrawer
        isOpen={isBulkSendOpen}
        onOpenChange={setIsBulkSendOpen}
        cohortId={cohortId}
        cohortName={selectedCohort.name}
      />
    </div>
  )
}
