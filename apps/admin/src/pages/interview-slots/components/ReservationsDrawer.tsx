import { Suspense, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { Button, Drawer, Spinner } from "@heroui/react"
import { useSuspenseQuery } from "@tanstack/react-query"

import { applicationQueries } from "@ddd/api"
import type { CohortDto, InterviewSlot } from "@ddd/api"

import { PART_LABEL } from "@/entities/cohort"
import { useIsMobile } from "@/shared/hooks/useIsMobile"
import { EmptyState } from "@/shared/ui/EmptyState"
import { ErrorFallback } from "@/shared/ui/ErrorFallback"

import { CancelReservationDialog } from "./CancelReservationDialog"

type CohortPartLite = { id: number; name: keyof typeof PART_LABEL }

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  slot: InterviewSlot
  cohorts: CohortDto[]
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("ko-KR")

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("ko-KR")

const formatTimeRange = (startIso: string, endIso: string): string => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  return `${fmt(startIso)} ~ ${fmt(endIso)}`
}

export const ReservationsDrawer = ({
  isOpen,
  onOpenChange,
  slot,
  cohorts,
}: Props) => {
  const isMobile = useIsMobile()

  const allParts = cohorts.flatMap(
    (c) => c.parts ?? [],
  ) as unknown as CohortPartLite[]
  const partName = allParts.find((p) => p.id === slot.cohortPartId)?.name
  const partLabel = partName ? (PART_LABEL[partName] ?? partName) : "-"

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement={isMobile ? "bottom" : "right"}>
        <Drawer.Dialog
          className={!isMobile ? "w-full max-w-120 bg-background" : ""}
        >
          <Drawer.Header className="space-y-1">
            <Drawer.Heading className="text-lg font-semibold">
              예약자 관리
            </Drawer.Heading>
            <p className="text-foreground-secondary text-sm">
              {formatDate(slot.startAt)} ·{" "}
              {formatTimeRange(slot.startAt, slot.endAt)} · {partLabel} ·{" "}
              {slot.reservedCount}/{slot.capacity}
            </p>
          </Drawer.Header>

          <Drawer.Body className="flex-1 overflow-y-auto p-5">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Suspense
                fallback={
                  <div className="flex justify-center py-10">
                    <Spinner />
                  </div>
                }
              >
                <ReservationsList slot={slot} />
              </Suspense>
            </ErrorBoundary>
          </Drawer.Body>

          <Drawer.Footer>
            <Button slot="close" variant="tertiary" className="w-full">
              닫기
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}

type ReservationsListProps = {
  slot: InterviewSlot
}

const ReservationsList = ({ slot }: ReservationsListProps) => {
  const { data: applications } = useSuspenseQuery(
    applicationQueries.getAdminApplications({
      params: { cohortId: slot.cohortId },
    }),
  )

  const applicantNameById = new Map(
    applications.map((a) => [a.id, a.applicantName]),
  )

  const [pendingCancel, setPendingCancel] = useState<{
    id: number
    name: string
  } | null>(null)

  if (slot.reservations.length === 0) {
    return <EmptyState>예약된 지원자가 없습니다.</EmptyState>
  }

  return (
    <>
      <ul className="divide-y divide-gray-100">
        {slot.reservations.map((reservation) => {
          const name =
            applicantNameById.get(reservation.applicationFormId) ??
            `지원서 #${reservation.applicationFormId}`
          return (
            <li
              key={reservation.id}
              className="flex items-center justify-between py-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-foreground-secondary text-xs">
                  예약 일시 · {formatDateTime(reservation.createdAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="danger"
                onPress={() =>
                  setPendingCancel({ id: reservation.id, name })
                }
              >
                취소
              </Button>
            </li>
          )
        })}
      </ul>

      {pendingCancel && (
        <CancelReservationDialog
          isOpen
          onClose={() => setPendingCancel(null)}
          reservationId={pendingCancel.id}
          applicantName={pendingCancel.name}
        />
      )}
    </>
  )
}
