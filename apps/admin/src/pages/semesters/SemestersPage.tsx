import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PencilEdit02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button, Tooltip } from "@heroui/react"

import { cohortQueries, type CohortDto } from "@ddd/api"

import { serializeCohortToForm } from "@/pages/semesters/lib/serialize"
import { findActiveRecruitingCohort } from "@/pages/semesters/lib/activeRecruitingCohort"
import { findResumableCohort } from "@/pages/semesters/lib/resumableCohort"
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
import { useSemestersTableData, type SemestersSummary } from "@/pages/semesters/hooks/useSemestersTableData"

/** Drawer 가 기존 기수를 대상으로 열릴 때의 타겟. null 이면 신규 등록(create). */
type DrawerTarget = {
  mode: "resume" | "edit"
  cohort: CohortDto
}

/** 기수 관리 페이지 */
export default function SemestersPage() {
  const { tableRows, summary, isError, refetch } = useSemestersTableData()
  const { transition } = useTransitionCohortStatusFlow()

  const { data: cohorts = [] } = useQuery(cohortQueries.getCohorts())
  // "모집중·모집예정 기수는 동시에 1개" 제약을 새 기수 등록 전 사전 차단.
  const blockingCohort = findActiveRecruitingCohort(cohorts)
  // 미완성인 채 남아있는 최신 기수 → 별도 "작성 이어하기" 진입점으로 노출.
  const resumableCohort = findResumableCohort(cohorts)

  // null 이면 신규 등록. 행 "수정"·"작성 이어하기" 가 기존 기수를 타겟으로 채운다.
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [pendingBlocked, setPendingBlocked] = useState<{
    cohort: CohortDto
    violation: PartsRecruitingViolation
  } | null>(null)

  const drawerProps = useMemo(() => {
    if (!drawerTarget) {
      return { mode: "create" as const, targetId: null, prefill: undefined }
    }
    return {
      mode: drawerTarget.mode,
      targetId: drawerTarget.cohort.id,
      prefill: serializeCohortToForm(drawerTarget.cohort),
    }
  }, [drawerTarget])

  const openDrawer = (target: DrawerTarget | null) => {
    setDrawerTarget(target)
    setIsDrawerOpen(true)
  }

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open)
    if (!open) setDrawerTarget(null)
  }

  const createButton = (
    <Button
      isDisabled={Boolean(blockingCohort)}
      onPress={() => openDrawer(null)}
    >
      <HugeiconsIcon icon={PlusSignIcon} className="mr-2" />
      새 기수 등록
    </Button>
  )

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
        <FlexBox className="gap-2">
          {resumableCohort && (
            <Button
              variant="outline"
              onPress={() =>
                openDrawer({ mode: "resume", cohort: resumableCohort })
              }
            >
              <HugeiconsIcon icon={PencilEdit02Icon} className="mr-2" />
              {resumableCohort.name} 작성 이어하기
            </Button>
          )}
          {blockingCohort ? (
            // 비활성 Button 은 hover 이벤트를 받지 못하므로 span 을 트리거로 감싼다.
            <Tooltip delay={200}>
              <Tooltip.Trigger>
                <span tabIndex={0} className="inline-block">
                  {createButton}
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content showArrow className="max-w-xs">
                <Tooltip.Arrow />
                <p>
                  {blockingCohort.name}이(가){" "}
                  {STATUS_LABEL[blockingCohort.status]} 상태입니다. 모집예정·모집중
                  기수는 동시에 하나만 둘 수 있어요. 해당 기수를 활동중으로 전환한
                  뒤 등록해주세요.
                </p>
              </Tooltip.Content>
            </Tooltip>
          ) : (
            createButton
          )}
        </FlexBox>
      </FlexBox>

      <CardSection summary={summary} />

      <SemesterRegisterDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerProps.mode}
        targetId={drawerProps.targetId}
        prefill={drawerProps.prefill}
        onSwitchToEdit={(newCohortId) => {
          setDrawerTarget({
            mode: "edit",
            cohort: { id: newCohortId } as CohortDto,
          })
        }}
      />

      <div className="rounded-lg bg-white p-5 shadow">
        <SemesterTableSection
          rows={tableRows}
          onEditRow={(row) => openDrawer({ mode: "edit", cohort: row })}
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
            openDrawer({ mode: "edit", cohort: pendingBlocked.cohort })
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
