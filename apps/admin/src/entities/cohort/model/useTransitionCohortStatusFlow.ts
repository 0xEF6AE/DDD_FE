import { toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cohortKeys, cohortMutations } from "@ddd/api"

import type { CohortDto } from "@ddd/api"

import { STATUS_LABEL, nextStatus } from "./statusFlow"

/**
 * cohort status 단방향 전이 훅.
 * UPCOMING→RECRUITING→ACTIVE→CLOSED 의 다음 단계로 PATCH 를 호출한다.
 */
export const useTransitionCohortStatusFlow = () => {
  const queryClient = useQueryClient()
  const updateMutation = useMutation(cohortMutations.updateCohort())

  const transition = async (cohort: CohortDto) => {
    const next = nextStatus(cohort.status)
    if (next == null) return

    try {
      await updateMutation.mutateAsync({
        params: { id: cohort.id },
        payload: { status: next },
      })
      queryClient.invalidateQueries({ queryKey: cohortKeys.all })
      toast.success(
        `${cohort.name} 상태를 ${STATUS_LABEL[next]}(으)로 변경했습니다`
      )
    } catch (error) {
      toast.danger("상태 변경에 실패했습니다", {
        description: (error as Error)?.message,
      })
    }
  }

  return { transition, isPending: updateMutation.isPending }
}
