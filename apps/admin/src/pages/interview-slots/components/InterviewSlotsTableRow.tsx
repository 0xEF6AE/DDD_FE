import { Button, Table } from "@heroui/react"

import type { CohortDto, InterviewSlot } from "@ddd/api"

import { PART_LABEL } from "@/entities/cohort"

type CohortPartLite = { id: number; name: keyof typeof PART_LABEL }

type Props = {
  slot: InterviewSlot
  cohorts: CohortDto[]
  onEdit: () => void
  onDelete: () => void
}

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("ko-KR")

const formatTimeRange = (startIso: string, endIso: string): string => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  return `${fmt(startIso)} ~ ${fmt(endIso)}`
}

export const InterviewSlotsTableRow = ({
  slot,
  cohorts,
  onEdit,
  onDelete,
}: Props) => {
  const allParts = cohorts.flatMap((c) => c.parts ?? []) as unknown as CohortPartLite[]
  const partName = allParts.find((p) => p.id === slot.cohortPartId)?.name
  const partLabel = partName ? (PART_LABEL[partName] ?? partName) : "-"

  return (
    <Table.Row>
      <Table.Cell>{formatDate(slot.startAt)}</Table.Cell>
      <Table.Cell>{formatTimeRange(slot.startAt, slot.endAt)}</Table.Cell>
      <Table.Cell>{partLabel}</Table.Cell>
      <Table.Cell>
        {slot.reservedCount}/{slot.capacity}
      </Table.Cell>
      <Table.Cell>{slot.location ?? "-"}</Table.Cell>
      <Table.Cell>
        <Button size="sm" variant="outline" className="mr-2" onPress={onEdit}>
          수정
        </Button>
        <Button size="sm" variant="danger" onPress={onDelete}>
          삭제
        </Button>
      </Table.Cell>
    </Table.Row>
  )
}
