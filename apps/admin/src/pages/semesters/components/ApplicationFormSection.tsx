import { useId, useState } from "react"
import { Button, ListBox, Select, Switch, Tabs, TextArea } from "@heroui/react"
import { PlusSignIcon, X } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useFormContext, useWatch } from "react-hook-form"

import { APPLICATION_QUESTION_TYPES } from "@ddd/api"

import type { ApplicationQuestionType, CohortPartName } from "@ddd/api"


import { SEMESTER_PARTS } from "@/pages/semesters/constants"
import { cn } from "@/shared/lib/cn"
import { Section } from "@/shared/ui/Section"

import type { CohortPartQuestion, SemesterRegisterForm } from "../types"

interface Props {
  invalidCells: ReadonlySet<string>
}

const QUESTION_TYPE_LABEL: Record<ApplicationQuestionType, string> = {
  text: "서술형",
  file: "PDF 첨부",
}

const QUESTION_TYPE_PLACEHOLDER: Record<ApplicationQuestionType, string> = {
  text: "질문을 입력하세요",
  file: "첨부 요청 문구를 입력하세요 (예: 포트폴리오를 PDF 로 첨부해주세요)",
}

export function ApplicationFormSection({ invalidCells }: Props) {
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
            { key: "", label: "", required: true, type: "text" },
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
                {part}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        {SEMESTER_PARTS.map((part) => (
          <Tabs.Panel key={part} id={part} className="space-y-3 py-4">
            <div className="border-default-200 flex items-center justify-between rounded-md border px-3 py-2">
              <Switch
                isSelected={parts[part].isOpen}
                onChange={(isSelected) => setPartIsOpen(part, isSelected)}
                aria-label={`${part} 모집 오픈`}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  <span className="text-sm font-medium">모집 오픈</span>
                </Switch.Content>
              </Switch>
            </div>

            {parts[part].questions.map((question, qIndex) => {
              const labelId = `${baseLabelId}-${part}-${qIndex}-label`
              const isLocked =
                Boolean(question.key) && originalKeys.has(question.key)
              const isInvalid = invalidCells.has(`${part}:${qIndex}`)
              return (
                <div
                  key={qIndex}
                  className={cn(
                    "border-default-200 space-y-2 rounded-md border p-3",
                    isInvalid && "border-danger"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <label
                      id={labelId}
                      className="text-sm font-medium text-foreground"
                    >
                      질문 {qIndex + 1}
                    </label>
                    <div className="flex items-center gap-2">
                      <Select
                        variant="secondary"
                        className="w-32"
                        aria-label={`질문 ${qIndex + 1} 유형`}
                      >
                        <Select.Trigger>
                          <Select.Value>
                            {QUESTION_TYPE_LABEL[question.type]}
                          </Select.Value>
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {APPLICATION_QUESTION_TYPES.map((type) => (
                              <ListBox.Item
                                key={type}
                                id={type}
                                textValue={QUESTION_TYPE_LABEL[type]}
                                onClick={() =>
                                  updateQuestion(part, qIndex, { type })
                                }
                              >
                                {QUESTION_TYPE_LABEL[type]}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      {parts[part].questions.length > 0 && (
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
                  </div>

                  <TextArea
                    aria-labelledby={labelId}
                    placeholder={QUESTION_TYPE_PLACEHOLDER[question.type]}
                    className="w-full resize-none"
                    value={question.label}
                    readOnly={isLocked}
                    onChange={(e) =>
                      updateQuestion(part, qIndex, { label: e.target.value })
                    }
                  />

                  {question.type === "file" && (
                    <p className="text-foreground-secondary text-xs">
                      지원자는 PDF 파일 1개(최대 20MB)를 업로드합니다.
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <Switch
                      isSelected={question.required}
                      onChange={(isSelected) =>
                        updateQuestion(part, qIndex, { required: isSelected })
                      }
                      aria-label="필수 응답"
                    >
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        <span className="text-sm font-medium">필수 응답</span>
                      </Switch.Content>
                    </Switch>
                    {isLocked && (
                      <span className="text-foreground-secondary text-xs">
                        저장됨: {question.key}
                      </span>
                    )}
                  </div>
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
