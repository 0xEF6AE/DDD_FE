import type { CohortPartName, CohortStatus } from "@ddd/api"

export type ProcessSchedule = {
  documentResultDate: string
  interviewStartDate: string
  interviewEndDate: string
  finalResultDate: string
}

export type CurriculumWeek = {
  date: string
  description: string
}

export type CohortPartQuestion = {
  key: string
  label: string
  required: boolean
}

export type CohortPartFormState = {
  isOpen: boolean
  questions: CohortPartQuestion[]
}

export type SemesterRegisterForm = {
  cohortNumber: string
  status: CohortStatus
  recruitStartDate: string
  recruitEndDate: string
  process: ProcessSchedule
  curriculum: CurriculumWeek[]
  parts: Record<CohortPartName, CohortPartFormState>
}
