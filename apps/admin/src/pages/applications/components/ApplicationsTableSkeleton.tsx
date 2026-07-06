import { Skeleton, Table } from "@heroui/react"

const SKELETON_ROW_COUNT = 6

export const ApplicationsTableSkeleton = () => {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="지원자 목록 로딩 중" className="min-w-200">
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
            {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
              <Table.Row key={i}>
                <Table.Cell>
                  <Skeleton className="h-4 w-20 rounded" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-24 rounded" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-12 rounded" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-12 rounded" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-20 rounded" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-28 rounded" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-16 rounded" />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
