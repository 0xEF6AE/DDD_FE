import { toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  notificationCampaignKeys,
  notificationCampaignMutations,
  NotificationCampaignStatus,
} from "@ddd/api"
import type { NotificationCampaignDto } from "@ddd/api"

/**
 * 캠페인 SCHEDULED ↔ PAUSED 토글 흐름.
 * - SCHEDULED → pause → PAUSED
 * - PAUSED    → resume → SCHEDULED
 * 다른 상태(RUNNING/DONE/FAILED) 는 호출 측에서 액션 버튼을 막아야 한다.
 */
export const useToggleCampaignScheduleFlow = () => {
  const queryClient = useQueryClient()
  const pauseMutation = useMutation(
    notificationCampaignMutations.pauseNotificationCampaign(),
  )
  const resumeMutation = useMutation(
    notificationCampaignMutations.resumeNotificationCampaign(),
  )

  const toggle = async (campaign: NotificationCampaignDto) => {
    const isPaused = campaign.status === NotificationCampaignStatus.PAUSED
    const mutation = isPaused ? resumeMutation : pauseMutation
    const successLabel = isPaused ? "예약됨" : "일시정지"

    try {
      await mutation.mutateAsync({ params: { id: campaign.id } })
      queryClient.invalidateQueries({
        queryKey: notificationCampaignKeys.adminLists(),
      })
      toast.success(`캠페인을 ${successLabel}(으)로 전환했습니다`)
    } catch (error) {
      toast.danger("상태 전환에 실패했습니다", {
        description: (error as Error)?.message,
      })
    }
  }

  return {
    toggle,
    isPending: pauseMutation.isPending || resumeMutation.isPending,
  }
}
