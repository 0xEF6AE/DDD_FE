import { Table } from "@heroui/react"
import { type ApplicationDto, type CohortDto } from "@ddd/api"

type ApplicationTableProps = {
  applications: ApplicationDto[]
  cohorts: CohortDto[]
  interviewScheduledByApplicationId: Map<number, string>
  onRowPress: (id: number) => void
}

const formatDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString("ko-KR") : "-"

const formatDateTime = (iso?: string): string => {
  if (!iso) return "-"
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const ApplicationTable = ({
  applications,
  cohorts,
  interviewScheduledByApplicationId,
  onRowPress,
}: ApplicationTableProps) => {
  const cohortNameById = new Map(cohorts.map((c) => [c.id, c.name]))
  const allParts = cohorts.flatMap((c) => c.parts ?? []) as unknown as Array<{
    id: number
    name: string
  }>

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="지원자 목록" className="min-w-200">
          <Table.Header>
            <Table.Column isRowHeader>지원자명</Table.Column>
            <Table.Column>연락처</Table.Column>
            <Table.Column>파트</Table.Column>
            <Table.Column>기수</Table.Column>
            <Table.Column>지원일</Table.Column>
            <Table.Column>면접일자</Table.Column>
            <Table.Column>상태</Table.Column>
          </Table.Header>
          <Table.Body>
            {applications.map((app) => {
              const partName =
                allParts.find((p) => p.id === app.cohortPartId)?.name ?? ""
              return (
                <Table.Row
                  key={app.id}
                  className="cursor-pointer"
                  onPress={() => onRowPress(app.id)}
                >
                  <Table.Cell>{app.applicantName}</Table.Cell>
                  <Table.Cell>{app.applicantPhone ?? "-"}</Table.Cell>
                  <Table.Cell>{partName || "-"}</Table.Cell>
                  <Table.Cell>
                    {cohortNameById.get(app.cohortId) ?? "-"}
                  </Table.Cell>
                  <Table.Cell>
                    {formatDate(app.submittedAt ?? app.createdAt)}
                  </Table.Cell>
                  <Table.Cell>
                    {formatDateTime(interviewScheduledByApplicationId.get(app.id))}
                  </Table.Cell>
                  <Table.Cell>{app.status}</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
