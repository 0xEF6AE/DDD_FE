import { Input } from "@heroui/react"
import { useFormContext } from "react-hook-form"

import { FormField } from "@/shared/ui/FormField"
import { Section } from "@/shared/ui/Section"

import type { SemesterRegisterForm } from "../types"

// 상태는 이 폼에서 변경하지 않는다 — 기수 테이블의 "다음 단계 전환" 버튼으로만
// 단방향(모집예정→모집중→활동중→활동종료) 전이하며, 그 경로에만 가드가 걸린다.
export function BasicInfoSection() {
  const { register } = useFormContext<SemesterRegisterForm>()
  return (
    <Section title="기본 정보">
      <FormField label="기수">
        <Input
          type="text"
          placeholder="예: 16"
          className="w-full"
          {...register("cohortNumber")}
        />
      </FormField>
    </Section>
  )
}
