import { Input } from "@heroui/react"
import { Controller, useFormContext } from "react-hook-form"

import { Section } from "@/shared/ui/Section"

import { CURRICULUM_WEEK_COUNT } from "../constants"
import type { SemesterRegisterForm } from "../types"

export function CurriculumSection() {
  const { control, register } = useFormContext<SemesterRegisterForm>()
  return (
    <Section title="커리큘럼">
      <div className="space-y-3">
        {Array.from({ length: CURRICULUM_WEEK_COUNT }, (_, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-sm text-gray-500">
              {index + 1}주차
            </span>
            <Controller
              control={control}
              name={`curriculum.${index}.date`}
              render={({ field }) => (
                <Input
                  type="date"
                  aria-label={`${index + 1}주차 날짜`}
                  className="w-1/2"
                  value={field.value?.slice(0, 10) ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Input
              aria-label={`${index + 1}주차 내용`}
              placeholder="내용 입력"
              className="w-full"
              {...register(`curriculum.${index}.description`)}
            />
          </div>
        ))}
      </div>
    </Section>
  )
}
