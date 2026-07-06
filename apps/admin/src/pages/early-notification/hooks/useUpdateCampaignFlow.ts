import { toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  notificationCampaignKeys,
  notificationCampaignMutations,
} from "@ddd/api"

import {
  serializeCampaignFormPayload,
  type CampaignFormValues,
} from "../lib/campaignForm"

interface Args {
  targetId: number
  onSuccess?: () => void
}

/**
 * 캠페인 본문/예약시각 수정 흐름. PATCH /admin/notification-campaigns/{id}.
 * SCHEDULED 또는 PAUSED 상태에서만 호출되도록 호출 측에서 가드한다.
 */
export const useUpdateCampaignFlow = ({ targetId, onSuccess }: Args) => {
  const queryClient = useQueryClient()
  const updateMutation = useMutation(
    notificationCampaignMutations.updateNotificationCampaign(),
  )

  const submit = async (values: CampaignFormValues) => {
    try {
      await updateMutation.mutateAsync({
        params: { id: targetId },
        payload: serializeCampaignFormPayload(values),
      })
      queryClient.invalidateQueries({
        queryKey: notificationCampaignKeys.adminLists(),
      })
      toast.success("캠페인이 저장되었습니다", {
        description: "예약된 시각에 발송됩니다.",
      })
      onSuccess?.()
    } catch (error) {
      toast.danger("저장에 실패했습니다", {
        description: (error as Error)?.message,
      })
    }
  }

  return { submit, isPending: updateMutation.isPending }
}
