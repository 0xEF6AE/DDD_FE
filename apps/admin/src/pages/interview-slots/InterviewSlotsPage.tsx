import { useMemo, useState } from "react"
import { useSearchParams } from "react-router"
import { useQuery } from "@tanstack/react-query"

import { cohortQueries, interviewQueries } from "@ddd/api"
import type { CohortPartName, InterviewSlot } from "@ddd/api"

import { serializeSlotToForm } from "@/entities/interview-slot"
import { FlexBox } from "@/shared/ui/FlexBox"
import { TitleSection } from "@/widgets/heading"

import {
  DeleteInterviewSlotDialog,
  InterviewSlotRegisterDrawer,
  InterviewSlotsTable,
  InterviewSlotsToolbar,
  ReservationsDrawer,
} from "./components"
import { ALL_PARTS, type PartFilterValue } from "./constants"
import type { InterviewSlotForm } from "./types"

type CohortPartLite = { id: number; name: CohortPartName }

export default function InterviewSlotsPage() {
  const [searchParams] = useSearchParams()
  const initialCohortId = Number(searchParams.get("cohortId")) || null
  const initialCohortPartId = Number(searchParams.get("cohortPartId")) || null

  const { data: cohorts = [] } = useQuery(cohortQueries.getCohorts())

  const [explicitCohortId, setExplicitCohortId] = useState<number | null>(
    initialCohortId,
  )
  const [partFilter, setPartFilter] = useState<PartFilterValue>(
    initialCohortPartId ?? ALL_PARTS,
  )
  // 사용자가 명시적으로 선택했으면 그 값, 아니면 cohorts 의 첫 번째로 자동 fallback
  const cohortId = explicitCohortId ?? cohorts[0]?.id ?? null

  const slotsQuery = useQuery({
    ...interviewQueries.getInterviewSlots({
      params: {
        cohortId: cohortId ?? undefined,
        cohortPartId:
          partFilter === ALL_PARTS ? undefined : (partFilter as number),
      },
    }),
    enabled: cohortId != null,
  })
  const slots: InterviewSlot[] = slotsQuery.data?.data ?? []

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<InterviewSlot | null>(null)
  const [deletingSlot, setDeletingSlot] = useState<InterviewSlot | null>(null)
  // 예약 취소 후 list 가 갱신되면 최신 slot 의 reservations 가 반영되도록 id 로만 보관
  const [viewingSlotId, setViewingSlotId] = useState<number | null>(null)
  const viewingSlot =
    viewingSlotId != null
      ? (slots.find((s) => s.id === viewingSlotId) ?? null)
      : null

  const drawerProps = useMemo(() => {
    if (editingSlot) {
      const cohort = cohorts.find((c) => c.id === editingSlot.cohortId)
      const parts = (cohort?.parts ?? []) as unknown as CohortPartLite[]
      const partName = parts.find((p) => p.id === editingSlot.cohortPartId)?.name
      return {
        mode: "edit" as const,
        targetId: editingSlot.id,
        prefill: {
          ...serializeSlotToForm(editingSlot),
          cohortPartName: partName,
        } as Partial<InterviewSlotForm>,
      }
    }
    // create 모드 — 현재 필터를 초기값으로
    const cohort = cohorts.find((c) => c.id === cohortId)
    const parts = (cohort?.parts ?? []) as unknown as CohortPartLite[]
    const initialPart =
      partFilter !== ALL_PARTS
        ? parts.find((p) => p.id === partFilter)
        : parts[0]
    return {
      mode: "create" as const,
      targetId: null,
      prefill: {
        cohortId: cohortId ?? 0,
        cohortPartId: initialPart?.id ?? 0,
        cohortPartName: initialPart?.name,
      } as Partial<InterviewSlotForm>,
    }
  }, [editingSlot, cohortId, partFilter, cohorts])

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open)
    if (!open) setEditingSlot(null)
  }

  return (
    <div className="w-full space-y-5 p-5">
      <FlexBox className="justify-between">
        <TitleSection
          title="면접 슬롯"
          description="기수·파트별 면접 시간대를 등록하고 관리합니다."
        />
      </FlexBox>

      <InterviewSlotsToolbar
        cohorts={cohorts}
        cohortId={cohortId}
        onCohortChange={(id) => {
          setExplicitCohortId(id)
          setPartFilter(ALL_PARTS)
        }}
        partFilter={partFilter}
        onPartFilterChange={setPartFilter}
        onOpenRegister={() => {
          setEditingSlot(null)
          setIsDrawerOpen(true)
        }}
        isRegisterDisabled={cohortId == null}
      />

      <div className="rounded-lg bg-white p-5 shadow">
        {slotsQuery.isLoading ? (
          <p className="text-foreground-secondary py-10 text-center text-sm">
            불러오는 중...
          </p>
        ) : slots.length === 0 ? (
          <p className="text-foreground-secondary py-10 text-center text-sm">
            등록된 면접 슬롯이 없습니다
          </p>
        ) : (
          <InterviewSlotsTable
            slots={slots}
            cohorts={cohorts}
            onEdit={(slot) => {
              setEditingSlot(slot)
              setIsDrawerOpen(true)
            }}
            onDelete={(slot) => setDeletingSlot(slot)}
            onOpenReservations={(slot) => setViewingSlotId(slot.id)}
          />
        )}
      </div>

      <InterviewSlotRegisterDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerProps.mode}
        targetId={drawerProps.targetId}
        prefill={drawerProps.prefill}
      />

      {deletingSlot && (
        <DeleteInterviewSlotDialog
          slot={deletingSlot}
          isOpen
          onClose={() => setDeletingSlot(null)}
        />
      )}

      {viewingSlot && (
        <ReservationsDrawer
          isOpen
          onOpenChange={(open) => !open && setViewingSlotId(null)}
          slot={viewingSlot}
          cohorts={cohorts}
        />
      )}
    </div>
  )
}
