import { toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { interviewKeys, interviewMutations } from "@ddd/api"

interface Args {
  /** 취소 성공 후 호출 (다이얼로그 닫기 등) */
  onSuccess?: () => void
}

export const useCancelReservationFlow = ({ onSuccess }: Args = {}) => {
  const queryClient = useQueryClient()
  const cancelMutation = useMutation(
    interviewMutations.cancelInterviewReservation(),
  )

  const cancel = async (reservationId: number) => {
    try {
      await cancelMutation.mutateAsync({ params: { reservationId } })
      queryClient.invalidateQueries({ queryKey: interviewKeys.slotLists() })
      toast.success("예약을 취소했습니다")
      onSuccess?.()
    } catch (error) {
      toast.danger("예약 취소에 실패했습니다", {
        description: (error as Error)?.message,
      })
    }
  }

  return { cancel, isPending: cancelMutation.isPending }
}
