import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@heroui/react"

import { cohortQueries, type CohortDto } from "@ddd/api"

import { serializeCohortToForm } from "@/pages/semesters/lib/serialize"
import { findActiveRecruitingCohort } from "@/pages/semesters/lib/activeRecruitingCohort"
import { STATUS_LABEL } from "@/pages/semesters/lib/statusFlow"
import { useTransitionCohortStatusFlow } from "@/pages/semesters/hooks/useTransitionCohortStatusFlow"
import { type PartsRecruitingViolation } from "@/pages/semesters/lib/validateCohortPartsForRecruiting"
import { FlexBox } from "@/shared/ui/FlexBox"
import { GridBox } from "@/shared/ui/GridBox"
import { StatCard } from "@/shared/ui/StatCard"
import { TitleSection } from "@/shared/ui/Heading"

import { SemesterRegisterDrawer } from "@/pages/semesters/components/SemesterRegisterDrawer"
import { SemesterTableSection } from "@/pages/semesters/components/SemesterTableSection"
import { TransitionBlockedDialog } from "@/pages/semesters/components/TransitionBlockedDialog"
import { useSemesterRegistrationMode } from "@/pages/semesters/hooks/useSemesterRegistrationMode"
import { useSemestersTableData, type SemestersSummary } from "@/pages/semesters/hooks/useSemestersTableData"

/** 기수 관리 페이지 */
export default function SemestersPage() {
  const { tableRows, summary, isError, refetch } = useSemestersTableData()
  const registration = useSemesterRegistrationMode()
  const { transition } = useTransitionCohortStatusFlow()

  // "모집중·모집예정 기수는 동시에 1개" 제약을 새 기수 등록 전 사전 차단.
  // (resume 모드는 기존 미완성 기수를 이어서 편집하는 것이라 제외)
  const { data: cohorts = [] } = useQuery(cohortQueries.getCohorts())
  const blockingCohort =
    registration.mode === "create"
      ? findActiveRecruitingCohort(cohorts)
      : undefined

  // 행 "수정" 클릭 시 채워지는 edit 타겟. registration 모드를 오버라이드.
  const [editTarget, setEditTarget] = useState<CohortDto | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [pendingBlocked, setPendingBlocked] = useState<{
    cohort: CohortDto
    violation: PartsRecruitingViolation
  } | null>(null)

  const drawerProps = useMemo(() => {
    if (editTarget) {
      return {
        mode: "edit" as const,
        targetId: editTarget.id,
        prefill: serializeCohortToForm(editTarget),
      }
    }
    return {
      mode: registration.mode,
      targetId: registration.targetId,
      prefill: registration.prefill,
    }
  }, [editTarget, registration])

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open)
    if (!open) setEditTarget(null)
  }

  if (isError) {
    return (
      <div className="w-full p-5">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-semibold text-red-800">
            기수 목록을 불러오지 못했습니다
          </p>
          <Button className="mt-3" onPress={refetch}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5 p-5">
      <FlexBox className="justify-between">
        <TitleSection
          title="기수 관리"
          description="DDD 활동 기수를 등록하고 상태를 관리합니다."
        />
        <Button
          isDisabled={Boolean(blockingCohort)}
          title={
            blockingCohort
              ? `${blockingCohort.name}이(가) ${STATUS_LABEL[blockingCohort.status]} 상태입니다. 모집중·모집예정 기수는 동시에 하나만 둘 수 있습니다.`
              : undefined
          }
          onPress={() => {
            setEditTarget(null)
            setIsDrawerOpen(true)
          }}
        >
          <HugeiconsIcon icon={PlusSignIcon} className="mr-2" />
          {registration.buttonLabel}
        </Button>
      </FlexBox>

      <CardSection summary={summary} />

      <SemesterRegisterDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerProps.mode}
        targetId={drawerProps.targetId}
        prefill={drawerProps.prefill}
        onSwitchToEdit={(newCohortId) => {
          setEditTarget({ id: newCohortId } as CohortDto)
        }}
      />

      <div className="rounded-lg bg-white p-5 shadow">
        <SemesterTableSection
          rows={tableRows}
          onEditRow={(row) => {
            setEditTarget(row)
            setIsDrawerOpen(true)
          }}
          onTransitionRow={async (row) => {
            const result = await transition(row)
            if (result.status === "blocked") {
              setPendingBlocked({
                cohort: result.cohort,
                violation: result.violation,
              })
            }
          }}
        />
      </div>

      {pendingBlocked && (
        <TransitionBlockedDialog
          isOpen
          onClose={() => setPendingBlocked(null)}
          cohortName={pendingBlocked.cohort.name}
          violation={pendingBlocked.violation}
          onOpenEditDrawer={() => {
            setEditTarget(pendingBlocked.cohort)
            setIsDrawerOpen(true)
            setPendingBlocked(null)
          }}
        />
      )}
    </div>
  )
}

// ─── 서브컴포넌트 ────────────────────────────────────────────────────────────

type CardSectionProps = {
  summary: SemestersSummary
}

const CardSection = ({ summary }: CardSectionProps) => {
  return (
    <GridBox className="grid-cols-4 gap-5">
      <StatCard
        title="전체 기수"
        value={`${summary.totalCohorts}`}
        footer="등록된 기수 수"
      />
      <StatCard
        title="현재 상태"
        value={summary.currentStatusLabel}
        footer="가장 최신 기수"
      />
      <StatCard
        title="누적 지원자"
        value={`${summary.totalApplicants}명`}
        footer="전체 기수 합산"
      />
      <StatCard
        title="누적 활동 멤버"
        value={`${summary.totalMembers}명`}
        footer="전체 기수 합산"
      />
    </GridBox>
  )
}
