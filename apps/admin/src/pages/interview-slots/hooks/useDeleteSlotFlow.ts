import { toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { interviewKeys, interviewMutations } from "@ddd/api"

import type { InterviewSlot } from "@ddd/api"

interface Args {
  /** 삭제 성공 후 호출 (다이얼로그 닫기 등) */
  onSuccess?: () => void
}

export const useDeleteSlotFlow = ({ onSuccess }: Args = {}) => {
  const queryClient = useQueryClient()
  const deleteMutation = useMutation(interviewMutations.deleteInterviewSlot())

  const remove = async (slot: Pick<InterviewSlot, "id">) => {
    try {
      await deleteMutation.mutateAsync({ params: { id: slot.id } })
      queryClient.invalidateQueries({ queryKey: interviewKeys.slotLists() })
      toast.success("면접 슬롯을 삭제했습니다")
      onSuccess?.()
    } catch (error) {
      toast.danger("슬롯 삭제에 실패했습니다", {
        description: (error as Error)?.message,
      })
    }
  }

  return { remove, isPending: deleteMutation.isPending }
}
