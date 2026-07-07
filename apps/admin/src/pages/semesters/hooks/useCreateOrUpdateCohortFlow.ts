import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cohortKeys, cohortMutations } from "@ddd/api"

import type { SemesterRegisterForm } from "../types"
import {
  buildName,
  serializeFormToCreatePayload,
  serializeFormToPartsPayload,
  serializeFormToUpdatePayload,
} from "../lib/serialize"

export class PartsSaveAfterCreateError extends Error {
  readonly name = "PartsSaveAfterCreateError"
  readonly newCohortId: number
  constructor(newCohortId: number, cause: unknown) {
    super("Cohort created but parts save failed", { cause })
    this.newCohortId = newCohortId
  }
}

type Mode = "create" | "resume" | "edit"

interface Args {
  mode: Mode
  /** resume/edit 에서 채워짐. create 모드면 null */
  targetId: number | null
}

interface SubmitResult {
  cohortId: number
  name: string
  createdInThisCall: boolean
}

export const useCreateOrUpdateCohortFlow = ({ mode, targetId }: Args) => {
  const queryClient = useQueryClient()
  const createMutation = useMutation(cohortMutations.createCohort())
  const updateMutation = useMutation(cohortMutations.updateCohort())
  const updatePartsMutation = useMutation(cohortMutations.updateCohortParts())

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    updatePartsMutation.isPending

  const submit = async (form: SemesterRegisterForm): Promise<SubmitResult> => {
    let cohortId = targetId
    let createdInThisCall = false
    // 이름은 BE 응답이 아니라 폼에서 도출한다 — PATCH/POST 가 cohort 바디를
    // 안 실어주면 mutateAsync 결과가 null 이라, 결과의 .name 을 읽으면 크래시하고
    // 뒤따르는 파트 저장이 건너뛰어져 부분 저장이 된다.
    const name = buildName(form.cohortNumber)

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          payload: serializeFormToCreatePayload(form),
        })
        // 생성은 새 id 가 반드시 필요하다 (파트 저장 대상). 없으면 진행 불가.
        if (created?.id == null) {
          throw new Error("기수 생성 응답이 비어 있습니다")
        }
        cohortId = created.id
        createdInThisCall = true
      } else {
        if (cohortId == null) throw new Error("저장할 기수를 찾을 수 없습니다")
        await updateMutation.mutateAsync({
          params: { id: cohortId },
          payload: serializeFormToUpdatePayload(form),
        })
      }

      try {
        await updatePartsMutation.mutateAsync({
          params: { id: cohortId! },
          payload: serializeFormToPartsPayload(form),
        })
      } catch (partsError) {
        if (createdInThisCall) {
          throw new PartsSaveAfterCreateError(cohortId!, partsError)
        }
        throw partsError
      }

      return { cohortId: cohortId!, name, createdInThisCall }
    } finally {
      queryClient.invalidateQueries({ queryKey: cohortKeys.all })
    }
  }

  return { submit, isPending }
}
