import { Button, Table } from "@heroui/react"

import type { NotificationCampaignDto } from "@ddd/api"

import {
  STATUS_LABEL,
  STATUS_TONE,
  canEdit,
  canPause,
  canResume,
  useToggleCampaignScheduleFlow,
} from "@/entities/notification-campaign"
import { cn } from "@/shared/lib/cn"

type NotificationCampaignTableProps = {
  campaigns: NotificationCampaignDto[]
  onEdit: (campaign: NotificationCampaignDto) => void
}

const formatDateTime = (iso?: string): string =>
  iso ? new Date(iso).toLocaleString("ko-KR") : "-"

export const NotificationCampaignTable = ({
  campaigns,
  onEdit,
}: NotificationCampaignTableProps) => {
  const { toggle, isPending } = useToggleCampaignScheduleFlow()

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="예약 발송 캠페인 목록" className="min-w-200">
          <Table.Header>
            <Table.Column isRowHeader>예약 시각</Table.Column>
            <Table.Column>상태</Table.Column>
            <Table.Column>제목</Table.Column>
            <Table.Column>액션</Table.Column>
          </Table.Header>
          <Table.Body>
            {campaigns.map((campaign) => (
              <Table.Row key={campaign.id}>
                <Table.Cell>{formatDateTime(campaign.scheduledAt)}</Table.Cell>
                <Table.Cell>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_TONE[campaign.status],
                    )}
                  >
                    {STATUS_LABEL[campaign.status]}
                  </span>
                </Table.Cell>
                <Table.Cell>{campaign.subject}</Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    {canEdit(campaign.status) && (
                      <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => onEdit(campaign)}
                      >
                        편집
                      </Button>
                    )}
                    {canPause(campaign.status) && (
                      <Button
                        size="sm"
                        variant="tertiary"
                        isDisabled={isPending}
                        onPress={() => toggle(campaign)}
                      >
                        일시정지
                      </Button>
                    )}
                    {canResume(campaign.status) && (
                      <Button
                        size="sm"
                        variant="primary"
                        isDisabled={isPending}
                        onPress={() => toggle(campaign)}
                      >
                        예약 시작
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}
