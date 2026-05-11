import { useId, useState } from "react"
import {
  Button,
  Checkbox,
  Input,
  Switch,
  Tabs,
  TextArea,
} from "@heroui/react"
import { PlusSignIcon, X } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useFormContext, useWatch } from "react-hook-form"

import type { CohortPartName } from "@ddd/api"

import { PART_LABEL, SEMESTER_PARTS } from "@/entities/cohort"
import { Section } from "@/shared/ui/Section"

import type {
  CohortPartQuestion,
  SemesterRegisterForm,
} from "../../../types"

export function ApplicationFormSection() {
  const { control, setValue, getValues } =
    useFormContext<SemesterRegisterForm>()
  const parts = useWatch({ control, name: "parts" })
  const baseLabelId = useId()

  const [originalKeys] = useState<Set<string>>(
    () =>
      new Set(
        Object.values(getValues("parts") ?? {})
          .flatMap((p) => p.questions.map((q) => q.key))
          .filter((k): k is string => Boolean(k))
      )
  )

  const updateQuestion = (
    part: CohortPartName,
    questionIndex: number,
    patch: Partial<CohortPartQuestion>
  ) => {
    const next = parts[part].questions.map((q, i) =>
      i === questionIndex ? { ...q, ...patch } : q
    )
    setValue(
      "parts",
      { ...parts, [part]: { ...parts[part], questions: next } },
      { shouldDirty: true }
    )
  }

  const addQuestion = (part: CohortPartName) => {
    setValue(
      "parts",
      {
        ...parts,
        [part]: {
          ...parts[part],
          questions: [
            ...parts[part].questions,
            { key: "", label: "", required: true },
          ],
        },
      },
      { shouldDirty: true }
    )
  }

  const removeQuestion = (part: CohortPartName, questionIndex: number) => {
    setValue(
      "parts",
      {
        ...parts,
        [part]: {
          ...parts[part],
          questions: parts[part].questions.filter(
            (_, i) => i !== questionIndex
          ),
        },
      },
      { shouldDirty: true }
    )
  }

  const setPartIsOpen = (part: CohortPartName, isOpen: boolean) => {
    setValue(
      "parts",
      { ...parts, [part]: { ...parts[part], isOpen } },
      { shouldDirty: true }
    )
  }

  return (
    <Section title="파트별 지원서 양식">
      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="파트별 지원서">
            {SEMESTER_PARTS.map((part) => (
              <Tabs.Tab key={part} id={part}>
                {PART_LABEL[part]}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {SEMESTER_PARTS.map((part) => (
          <Tabs.Panel key={part} id={part} className="space-y-3 py-4">
            <div className="flex items-center justify-between rounded-md border border-default-200 px-3 py-2">
              <span className="text-sm font-medium">모집 오픈</span>
              <Switch
                isSelected={parts[part].isOpen}
                onChange={(isSelected) => setPartIsOpen(part, isSelected)}
                aria-label={`${PART_LABEL[part]} 모집 오픈`}
              />
            </div>

            {parts[part].questions.map((question, qIndex) => {
              const labelId = `${baseLabelId}-${part}-${qIndex}-label`
              const keyId = `${baseLabelId}-${part}-${qIndex}-key`
              const isKeyReadOnly =
                Boolean(question.key) && originalKeys.has(question.key)
              return (
                <div
                  key={qIndex}
                  className="space-y-2 rounded-md border border-default-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <label
                      id={labelId}
                      className="text-sm font-medium text-foreground"
                    >
                      질문 {qIndex + 1}
                    </label>
                    {parts[part].questions.length > 1 && (
                      <Button
                        isIconOnly
                        variant="outline"
                        size="sm"
                        onPress={() => removeQuestion(part, qIndex)}
                      >
                        <HugeiconsIcon icon={X} />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={keyId}
                      className="text-xs text-foreground-secondary"
                    >
                      key (저장 후 변경 불가)
                    </label>
                    <Input
                      id={keyId}
                      placeholder="motivation"
                      value={question.key}
                      isReadOnly={isKeyReadOnly}
                      onChange={(e) =>
                        updateQuestion(part, qIndex, { key: e.target.value })
                      }
                    />
                  </div>

                  <TextArea
                    aria-labelledby={labelId}
                    placeholder="질문을 입력하세요"
                    className="w-full resize-none"
                    value={question.label}
                    onChange={(e) =>
                      updateQuestion(part, qIndex, { label: e.target.value })
                    }
                  />

                  <Checkbox
                    isSelected={question.required}
                    onChange={(isSelected) =>
                      updateQuestion(part, qIndex, { required: isSelected })
                    }
                  >
                    필수 응답
                  </Checkbox>
                </div>
              )
            })}
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onPress={() => addQuestion(part)}
            >
              <HugeiconsIcon icon={PlusSignIcon} className="mr-1" />
              질문 추가
            </Button>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Section>
  )
}
