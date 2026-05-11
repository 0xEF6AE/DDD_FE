import { toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { interviewKeys, interviewMutations } from "@ddd/api"

import type { InterviewSlotForm } from "../../../pages/interview-slots/types"
import {
  serializeFormToCreatePayload,
  serializeFormToUpdatePayload,
} from "./serialize"

type Mode = "create" | "edit"

interface Args {
  mode: Mode
  /** edit 에서 채워짐. create 모드면 null */
  targetId: number | null
}

/**
 * interview-slot 등록/수정 흐름.
 * - create: POST /admin/interview-slots
 * - edit:   PATCH /admin/interview-slots/:id (cohortId/cohortPartId 변경 불가)
 * 성공 시 목록 invalidate + toast.
 */
export const useCreateOrUpdateSlotFlow = ({ mode, targetId }: Args) => {
  const queryClient = useQueryClient()
  const createMutation = useMutation(interviewMutations.createInterviewSlot())
  const updateMutation = useMutation(interviewMutations.updateInterviewSlot())

  const isPending = createMutation.isPending || updateMutation.isPending

  const submit = async (form: InterviewSlotForm) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          payload: serializeFormToCreatePayload(form),
        })
        toast.success("면접 슬롯을 등록했습니다")
      } else {
        if (targetId == null)
          throw new Error("수정할 슬롯을 찾을 수 없습니다")
        await updateMutation.mutateAsync({
          params: { id: targetId },
          payload: serializeFormToUpdatePayload(form),
        })
        toast.success("면접 슬롯을 수정했습니다")
      }
    } catch (error) {
      toast.danger(
        mode === "create" ? "슬롯 등록에 실패했습니다" : "슬롯 수정에 실패했습니다",
        { description: (error as Error)?.message },
      )
      throw error
    } finally {
      queryClient.invalidateQueries({ queryKey: interviewKeys.slotLists() })
    }
  }

  return { submit, isPending }
}
