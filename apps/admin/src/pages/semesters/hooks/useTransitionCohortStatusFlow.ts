import { toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  ApiError,
  CreateCohortRequestDtoStatus,
  cohortKeys,
  cohortMutations,
} from "@ddd/api"

import type { CohortDto } from "@ddd/api"

import { STATUS_LABEL, nextStatus } from "../lib/statusFlow"
import {
  validateCohortPartsForRecruiting,
  type PartsRecruitingViolation,
} from "../lib/validateCohortPartsForRecruiting"

export type TransitionResult =
  | { status: "success" }
  | {
      status: "blocked"
      cohort: CohortDto
      violation: PartsRecruitingViolation
    }
  | { status: "error" }

/**
 * cohort status 단방향 전이 훅.
 * UPCOMING→RECRUITING→ACTIVE→CLOSED 의 다음 단계로 PATCH 를 호출한다.
 * RECRUITING 전환 시 파트별 양식 가드를 거쳐, 위반 시 mutation 호출 없이
 * blocked 결과를 반환한다 (UI 측에서 모달/Drawer 분기).
 */
export const useTransitionCohortStatusFlow = () => {
  const queryClient = useQueryClient()
  const updateMutation = useMutation(cohortMutations.updateCohort())

  const transition = async (cohort: CohortDto): Promise<TransitionResult> => {
    const next = nextStatus(cohort.status)
    if (next == null) return { status: "success" }

    if (next === CreateCohortRequestDtoStatus.RECRUITING) {
      const violation = validateCohortPartsForRecruiting(cohort)
      if (violation) {
        return { status: "blocked", cohort, violation }
      }
    }

    try {
      await updateMutation.mutateAsync({
        params: { id: cohort.id },
        payload: { status: next },
      })
      queryClient.invalidateQueries({ queryKey: cohortKeys.all })
      toast.success(
        `${cohort.name} 상태를 ${STATUS_LABEL[next]}(으)로 변경했습니다`
      )
      return { status: "success" }
    } catch (error) {
      if (error instanceof ApiError && error.code === "COHORT_ALREADY_EXISTS") {
        toast.danger("이미 모집중·모집예정 기수가 있습니다", {
          description: "모집 라이프사이클 기수는 동시에 하나만 둘 수 있습니다.",
        })
      } else {
        toast.danger("상태 변경에 실패했습니다", {
          description: (error as Error)?.message,
        })
      }
      return { status: "error" }
    }
  }

  return { transition, isPending: updateMutation.isPending }
}
