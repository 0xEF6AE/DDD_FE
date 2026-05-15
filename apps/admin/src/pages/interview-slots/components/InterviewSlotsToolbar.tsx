import { Button, ListBox, Select } from "@heroui/react"
import { PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { CohortDto } from "@ddd/api"

import { FlexBox } from "@/shared/ui/FlexBox"

import { ALL_PARTS, type PartFilterValue } from "../constants"

type Props = {
  cohorts: CohortDto[]
  cohortId: number | null
  onCohortChange: (id: number) => void
  partFilter: PartFilterValue
  onPartFilterChange: (v: PartFilterValue) => void
  onOpenRegister: () => void
  isRegisterDisabled: boolean
}

export const InterviewSlotsToolbar = ({
  cohorts,
  cohortId,
  onCohortChange,
  partFilter,
  onPartFilterChange,
  onOpenRegister,
  isRegisterDisabled,
}: Props) => {
  const selectedCohort = cohorts.find((c) => c.id === cohortId)
  const parts = selectedCohort?.parts ?? []

  const partLabel =
    partFilter === ALL_PARTS
      ? "전체 파트"
      : (parts.find((p) => p.id === partFilter)?.partName ?? "전체 파트")

  return (
    <FlexBox className="flex-wrap justify-between gap-3">
      <FlexBox className="gap-2">
        <Select variant="secondary" className="max-w-40" aria-label="기수 필터">
          <Select.Trigger>
            <Select.Value>{selectedCohort?.name ?? "기수 선택"}</Select.Value>
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {cohorts.map((cohort) => (
                <ListBox.Item
                  key={cohort.id}
                  id={String(cohort.id)}
                  textValue={cohort.name}
                  onClick={() => onCohortChange(cohort.id)}
                >
                  {cohort.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          variant="secondary"
          className="max-w-40"
          aria-label="파트 필터"
          isDisabled={!selectedCohort}
        >
          <Select.Trigger>
            <Select.Value>{partLabel}</Select.Value>
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item
                key="all"
                id="all"
                textValue="전체 파트"
                onClick={() => onPartFilterChange(ALL_PARTS)}
              >
                전체 파트
              </ListBox.Item>
              {parts.map((part) => (
                <ListBox.Item
                  key={part.id}
                  id={String(part.id)}
                  textValue={part.partName}
                  onClick={() => part.id !== undefined && onPartFilterChange(part.id)}
                >
                  {part.partName}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </FlexBox>

      <Button onPress={onOpenRegister} isDisabled={isRegisterDisabled}>
        <HugeiconsIcon icon={PlusSignIcon} className="mr-2" />새 슬롯 등록
      </Button>
    </FlexBox>
  )
}
