import { useMemo, useState } from "react"
import { Table } from "@heroui/react"
import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { StatusFilterValue } from "../constants"
import type { CohortRow } from "@/pages/semesters/hooks/useSemestersTableData"

import { SemesterTableRow } from "./SemesterTableRow"
import { SemesterTableToolbar } from "./SemesterTableToolbar"
import { DeleteCohortDialog } from "./DeleteCohortDialog"

interface Props {
  rows: CohortRow[]
  onEditRow: (row: CohortRow) => void
  onTransitionRow: (row: CohortRow) => void
}

export function SemesterTableSection({
  rows,
  onEditRow,
  onTransitionRow,
}: Props) {
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("ALL")
  const [deletingRow, setDeletingRow] = useState<CohortRow | null>(null)

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) =>
        searchText === "" ? true : row.name.includes(searchText)
      )
      .filter((row) =>
        statusFilter === "ALL" ? true : row.status === statusFilter
      )
  }, [rows, searchText, statusFilter])

  return (
    <div className="space-y-5">
      <SemesterTableToolbar
        searchText={searchText}
        onSearchTextChange={setSearchText}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="기수 목록">
            <Table.Header>
              <Table.Column isRowHeader>기수</Table.Column>
              <Table.Column>상태</Table.Column>
              <Table.Column>모집 기간</Table.Column>
              <Table.Column>지원자 수</Table.Column>
              <Table.Column>멤버 수</Table.Column>
              <Table.Column>등록일</Table.Column>
              <Table.Column>
                <span className="inline-flex items-center gap-1">
                  액션
                  {/* ponytail: native title 툴팁. 스타일 버전 필요하면 @heroui Tooltip 으로 승격 */}
                  <span
                    className="text-foreground-secondary cursor-help"
                    title="상태는 '다음 단계 전환' 버튼으로만 단방향(모집예정→모집중→활동중→활동종료)으로 변경됩니다. 모집중 전환에는 파트별 지원서 양식이 필요하며, 모집중·모집예정 기수는 동시에 하나만 둘 수 있습니다."
                  >
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      className="size-3.5"
                    />
                  </span>
                </span>
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {filteredRows.map((row) => (
                <SemesterTableRow
                  key={row.id}
                  row={row}
                  onEdit={() => onEditRow(row)}
                  onTransition={() => onTransitionRow(row)}
                  onDelete={() => setDeletingRow(row)}
                />
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {deletingRow && (
        <DeleteCohortDialog
          cohort={deletingRow}
          isOpen
          onClose={() => setDeletingRow(null)}
        />
      )}
    </div>
  )
}
