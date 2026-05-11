import { Table } from "@heroui/react"

import type { CohortDto, InterviewSlot } from "@ddd/api"

import { InterviewSlotsTableRow } from "./InterviewSlotsTableRow"

type Props = {
  slots: InterviewSlot[]
  cohorts: CohortDto[]
  onEdit: (slot: InterviewSlot) => void
  onDelete: (slot: InterviewSlot) => void
}

export const InterviewSlotsTable = ({
  slots,
  cohorts,
  onEdit,
  onDelete,
}: Props) => {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="면접 슬롯 목록" className="min-w-200">
          <Table.Header>
            <Table.Column isRowHeader>날짜</Table.Column>
            <Table.Column>시간</Table.Column>
            <Table.Column>파트</Table.Column>
            <Table.Column>예약/정원</Table.Column>
            <Table.Column>장소</Table.Column>
            <Table.Column>액션</Table.Column>
          </Table.Header>
          <Table.Body>
            {slots.map((slot) => (
              <InterviewSlotsTableRow
                key={slot.id}
                slot={slot}
                cohorts={cohorts}
                onEdit={() => onEdit(slot)}
                onDelete={() => onDelete(slot)}
              />
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
