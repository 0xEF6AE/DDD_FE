import { useMutation, useQueryClient } from "@tanstack/react-query"

import { cohortKeys, cohortMutations } from "@ddd/api"

import type { SemesterRegisterForm } from "../types"
import {
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
    let name = ""
    let createdInThisCall = false

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          payload: serializeFormToCreatePayload(form),
        })
        cohortId = created.id
        name = created.name
        createdInThisCall = true
      } else {
        if (cohortId == null) throw new Error("저장할 기수를 찾을 수 없습니다")
        const updated = await updateMutation.mutateAsync({
          params: { id: cohortId },
          payload: serializeFormToUpdatePayload(form),
        })
        name = updated.name
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
