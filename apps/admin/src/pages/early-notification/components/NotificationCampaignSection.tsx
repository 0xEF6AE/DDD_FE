import { useState } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"

import { notificationCampaignQueries } from "@ddd/api"
import type { NotificationCampaignDto } from "@ddd/api"

import { EmptyState } from "@/shared/ui/EmptyState"

import { NotificationCampaignEditDrawer } from "./NotificationCampaignEditDrawer"
import { NotificationCampaignTable } from "./NotificationCampaignTable"

type NotificationCampaignSectionProps = {
  cohortId: number
}

export const NotificationCampaignSection = ({
  cohortId,
}: NotificationCampaignSectionProps) => {
  const [editTarget, setEditTarget] = useState<NotificationCampaignDto | null>(
    null,
  )

  const { data: campaigns } = useSuspenseQuery(
    notificationCampaignQueries.getAdminNotificationCampaigns({
      params: { cohortId },
    }),
  )

  return (
    <section className="space-y-4 rounded-lg bg-white p-5 shadow">
      <header className="space-y-1">
        <h2 className="text-base font-semibold">예약 발송 캠페인</h2>
        <p className="text-xs text-gray-500">
          기수 생성 시 자동으로 1건이 만들어집니다. 본문/시각을 손본 뒤
          일시정지에서 예약됨으로 풀면 정해진 시각에 자동 발송됩니다.
        </p>
      </header>

      {campaigns.length === 0 ? (
        <EmptyState>
          이 기수에 예약된 캠페인이 없습니다.
        </EmptyState>
      ) : (
        <NotificationCampaignTable
          campaigns={campaigns}
          onEdit={setEditTarget}
        />
      )}

      {editTarget && (
        <NotificationCampaignEditDrawer
          isOpen
          onOpenChange={(open) => !open && setEditTarget(null)}
          campaign={editTarget}
        />
      )}
    </section>
  )
}
