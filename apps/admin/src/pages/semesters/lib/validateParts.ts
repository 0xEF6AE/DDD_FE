import type { CohortPartName } from "@ddd/api"

import { slugify } from "@/shared/lib/slug"

import type { SemesterRegisterForm } from "../types"

import { SEMESTER_PARTS } from "../constants"

export interface InvalidQuestionCell {
  part: CohortPartName
  index: number
}

export interface PartsValidationError {
  message: string
  invalidCells: ReadonlyArray<InvalidQuestionCell>
}

const formatIndex = (index: number) => `${index + 1}번`

const findEmptyLabel = (
  form: SemesterRegisterForm
): PartsValidationError | null => {
  for (const part of SEMESTER_PARTS) {
    // 모집 off 파트는 지원서에 안 쓰이므로 검증하지 않는다 (모집중 전환 가드가
    // isOpen 파트만 보는 것과 대칭). 나중에 열어 전환할 때 그 가드가 다시 잡는다.
    if (!form.parts[part].isOpen) continue
    const questions = form.parts[part].questions
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].label.trim() === "") {
        return {
          message: `${part} 파트 ${formatIndex(i)} 질문을 입력해주세요`,
          invalidCells: [{ part, index: i }],
        }
      }
    }
  }
  return null
}

const findDuplicateKey = (
  form: SemesterRegisterForm
): PartsValidationError | null => {
  for (const part of SEMESTER_PARTS) {
    if (!form.parts[part].isOpen) continue
    const questions = form.parts[part].questions
    const groups = new Map<string, number[]>()
    questions.forEach((q, i) => {
      const k = q.key.trim() || slugify(q.label)
      if (!k) return
      const bucket = groups.get(k) ?? []
      bucket.push(i)
      groups.set(k, bucket)
    })
    for (const indices of groups.values()) {
      if (indices.length > 1) {
        const labels = indices.map(formatIndex).join("과 ")
        return {
          message: `${part} 파트 ${labels} 질문이 중복됩니다`,
          invalidCells: indices.map((index) => ({ part, index })),
        }
      }
    }
  }
  return null
}

/**
 * 파트별 질문 폼의 클라이언트 검증.
 * 빈 label 을 우선 검사하고, 그 다음 정규화된 key 의 part 내부 중복을 검사한다.
 * 위반이 없으면 null 을 반환한다.
 */
export function validateFormParts(
  form: SemesterRegisterForm
): PartsValidationError | null {
  return findEmptyLabel(form) ?? findDuplicateKey(form)
}
