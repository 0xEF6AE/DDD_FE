import { useState } from "react"
import { TitleSection } from "@/widgets/heading"
import {
  useApplicationsBoard,
  type ApplicationStatus,
} from "@/entities/application"
import { CardSection } from "./components/Sections"
import { ApplicationFilters } from "./components/ApplicationFilters"
import { ApplicationTable } from "./components/ApplicationTable"
import { ApplicationDetailDrawer } from "./components/ApplicationDetailDrawer"

/**
 * undefined = "아직 사용자가 선택하지 않음(→ 최신 기수 자동 적용)"
 * null      = 사용자가 명시적으로 "전체 기수" 선택
 */
export default function ApplicationsPage() {
  const [searchText, setSearchText] = useState("")
  const [selectedCohortId, setSelectedCohortId] = useState<number | null | undefined>(undefined)
  const [selectedCohortPartId, setSelectedCohortPartId] = useState<number | undefined>(undefined)
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | undefined>(undefined)
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null)

  const {
    cohorts,
    effectiveCohortId,
    contextLabel,
    cards,
    counts,
    tableRows,
    interviewScheduledByApplicationId,
  } = useApplicationsBoard({
    cohortIdInput: selectedCohortId,
    cohortPartId: selectedCohortPartId,
    status: selectedStatus,
    searchText,
  })

  const handleCohortChange = (id: number | undefined) => {
    setSelectedCohortId(id ?? null)
    setSelectedCohortPartId(undefined)
  }

  return (
    <div className="w-full space-y-5 p-5">
      <TitleSection
        title="지원자 관리"
        description="지원서를 검토하고 상태를 변경합니다."
      />

      <CardSection
        total={cards.length}
        counts={counts}
        contextLabel={contextLabel}
      />

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
        <ApplicationTable
          applications={tableRows}
          cohorts={cohorts}
          interviewScheduledByApplicationId={interviewScheduledByApplicationId}
          onRowPress={(id) => setSelectedApplicationId(id)}
        />
      </div>

      <ApplicationDetailDrawer
        isOpen={selectedApplicationId !== null}
        onOpenChange={(open) => !open && setSelectedApplicationId(null)}
        applicationId={selectedApplicationId}
      />
    </div>
  )
}
