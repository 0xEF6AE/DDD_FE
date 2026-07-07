import { CohortPartConfigDtoName } from "@ddd/api"

import type {
  CohortDto,
  CohortPartConfig,
  CohortPartName,
  CreateCohortRequestDto,
  PutUpdateCohortPartsRequest,
  UpdateCohortRequestDto,
} from "@ddd/api"

import { slugify } from "@/shared/lib/slug"

import type {
  CohortPartFormState,
  CohortPartQuestion,
  SemesterRegisterForm,
} from "../types"

const PARTS: CohortPartName[] = [
  CohortPartConfigDtoName.PM,
  CohortPartConfigDtoName.PD,
  CohortPartConfigDtoName.BE,
  CohortPartConfigDtoName.FE,
  CohortPartConfigDtoName.IOS,
  CohortPartConfigDtoName.AND,
]

/** form.cohortNumber("16") → DTO.name("16기"). cohort.name 가 "기" 로 끝나면 그대로 둔다 */
export const buildName = (cohortNumber: string): string => {
  const trimmed = cohortNumber.trim()
  if (!trimmed) return ""
  return trimmed.endsWith("기") ? trimmed : `${trimmed}기`
}

const stripSuffix = (name: string): string =>
  name.endsWith("기") ? name.slice(0, -1) : name

const emptyForm = (): SemesterRegisterForm => ({
  cohortNumber: "",
  status: "UPCOMING",
  recruitStartDate: "",
  recruitEndDate: "",
  process: {
    documentResultDate: "",
    interviewStartDate: "",
    interviewEndDate: "",
    finalResultDate: "",
  },
  curriculum: Array.from({ length: 9 }, () => ({ date: "", description: "" })),
  parts: Object.fromEntries(
    PARTS.map((name) => [
      name,
      {
        isOpen: true,
        questions: [{ key: "", label: "", required: true }],
      },
    ])
  ) as SemesterRegisterForm["parts"],
})

export const serializeFormToCreatePayload = (
  form: SemesterRegisterForm
): CreateCohortRequestDto => ({
  name: buildName(form.cohortNumber),
  recruitStartAt: form.recruitStartDate,
  recruitEndAt: form.recruitEndDate,
  status: form.status,
  process: { ...form.process },
  curriculum: form.curriculum.map((w) => ({ ...w })),
})

export const serializeFormToUpdatePayload = (
  form: SemesterRegisterForm
): UpdateCohortRequestDto => ({
  name: buildName(form.cohortNumber),
  recruitStartAt: form.recruitStartDate,
  recruitEndAt: form.recruitEndDate,
  status: form.status,
  process: { ...form.process },
  curriculum: form.curriculum.map((w) => ({ ...w })),
})

export const serializeFormToPartsPayload = (
  form: SemesterRegisterForm
): PutUpdateCohortPartsRequest => ({
  parts: PARTS.map((partName) => ({
    partName,
    isOpen: form.parts[partName].isOpen,
    applicationSchema: {
      questions: form.parts[partName].questions.map(({ key, label, required }) => ({
        key: key.trim() || slugify(label),
        label,
        required,
      })),
    },
  })),
})

export const serializeCohortToForm = (
  cohort: CohortDto
): SemesterRegisterForm => {
  const base = emptyForm()
  return {
    cohortNumber: stripSuffix(cohort.name ?? ""),
    status: cohort.status,
    recruitStartDate: cohort.recruitStartAt ?? "",
    recruitEndDate: cohort.recruitEndAt ?? "",
    process: extractProcess(cohort.process) ?? base.process,
    curriculum: extractCurriculum(cohort.curriculum) ?? base.curriculum,
    parts: extractParts(cohort.parts) ?? base.parts,
  }
}

// ── helpers ──────────────────────────────────────────────────────────────

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0

const extractProcess = (
  raw: unknown
): SemesterRegisterForm["process"] | null => {
  if (typeof raw !== "object" || raw === null) return null
  const o = raw as Record<string, unknown>
  return {
    documentResultDate: isNonEmptyString(o.documentResultDate)
      ? o.documentResultDate
      : "",
    interviewStartDate: isNonEmptyString(o.interviewStartDate)
      ? o.interviewStartDate
      : "",
    interviewEndDate: isNonEmptyString(o.interviewEndDate)
      ? o.interviewEndDate
      : "",
    finalResultDate: isNonEmptyString(o.finalResultDate)
      ? o.finalResultDate
      : "",
  }
}

const extractCurriculum = (
  raw: unknown
): SemesterRegisterForm["curriculum"] | null => {
  if (!Array.isArray(raw)) return null
  const padded = Array.from({ length: 9 }, (_, i) => {
    const w = raw[i]
    if (typeof w !== "object" || w === null)
      return { date: "", description: "" }
    const o = w as Record<string, unknown>
    return {
      date: isNonEmptyString(o.date) ? o.date : "",
      description: isNonEmptyString(o.description) ? o.description : "",
    }
  })
  return padded
}

const defaultPartState = (): CohortPartFormState => ({
  isOpen: true,
  questions: [{ key: "", label: "", required: true }],
})

const extractParts = (
  raw: unknown
): SemesterRegisterForm["parts"] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const result = {} as SemesterRegisterForm["parts"]
  for (const part of PARTS) {
    const found = (raw as CohortPartConfig[]).find((p) => p.partName === part)
    if (!found) {
      result[part] = defaultPartState()
      continue
    }
    const rawQuestions = (found.applicationSchema as Record<string, unknown>)
      ?.questions
    const questions: CohortPartQuestion[] = Array.isArray(rawQuestions)
      ? rawQuestions
          .filter((q): q is Record<string, unknown> =>
            typeof q === "object" && q !== null
          )
          .map((q) => ({
            key: typeof q.key === "string" ? q.key : "",
            label: typeof q.label === "string" ? q.label : "",
            required: typeof q.required === "boolean" ? q.required : true,
          }))
      : []
    result[part] = {
      isOpen: typeof found.isOpen === "boolean" ? found.isOpen : true,
      questions:
        questions.length > 0
          ? questions
          : [{ key: "", label: "", required: true }],
    }
  }
  return result
}
