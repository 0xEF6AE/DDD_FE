import {
  DateField,
  DateRangePicker,
  Input,
  RangeCalendar,
} from "@heroui/react"
import { Controller, useFormContext, useWatch } from "react-hook-form"

import { FormField } from "@/shared/ui/FormField"
import { GridBox } from "@/shared/ui/GridBox"
import { Section } from "@/shared/ui/Section"
import { toDateRangeValue } from "@/shared/lib/toDateValue"

import type { SemesterRegisterForm } from "../types"

export function ProcessSection() {
  const { control, setValue } = useFormContext<SemesterRegisterForm>()

  const recruitStart = useWatch({ control, name: "recruitStartDate" })
  const recruitEnd = useWatch({ control, name: "recruitEndDate" })
  const interviewStart = useWatch({
    control,
    name: "process.interviewStartDate",
  })
  const interviewEnd = useWatch({
    control,
    name: "process.interviewEndDate",
  })

  return (
    <Section title="프로세스 일정">
      <GridBox className="grid-cols-2 gap-5">
        <FormField label="모집 기간 (서류접수 기간)">
          <DateRangePicker
            className="w-full"
            value={toDateRangeValue(recruitStart, recruitEnd)}
            onChange={(value) => {
              setValue("recruitStartDate", value?.start.toString() ?? "", {
                shouldDirty: true,
              })
              setValue("recruitEndDate", value?.end.toString() ?? "", {
                shouldDirty: true,
              })
            }}
          >
            <DateField.Group fullWidth>
              <DateField.Input slot="start">
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateRangePicker.RangeSeparator />
              <DateField.Input slot="end">
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateField.Suffix>
                <DateRangePicker.Trigger>
                  <DateRangePicker.TriggerIndicator />
                </DateRangePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DateRangePicker.Popover placement="bottom start">
              <RangeCalendar aria-label="모집 기간">
                <RangeCalendar.Header>
                  <RangeCalendar.YearPickerTrigger>
                    <RangeCalendar.YearPickerTriggerHeading />
                    <RangeCalendar.YearPickerTriggerIndicator />
                  </RangeCalendar.YearPickerTrigger>
                  <RangeCalendar.NavButton slot="previous" />
                  <RangeCalendar.NavButton slot="next" />
                </RangeCalendar.Header>
                <RangeCalendar.Grid>
                  <RangeCalendar.GridHeader>
                    {(day) => (
                      <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => <RangeCalendar.Cell date={date} />}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
              </RangeCalendar>
            </DateRangePicker.Popover>
          </DateRangePicker>
        </FormField>

        <FormField label="서류 발표">
          <Controller
            control={control}
            name="process.documentResultDate"
            render={({ field }) => (
              <Input
                type="date"
                aria-label="서류 발표"
                className="w-full"
                value={field.value?.slice(0, 10) ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </FormField>

        <FormField label="인터뷰 날짜">
          <DateRangePicker
            className="w-full"
            value={toDateRangeValue(interviewStart, interviewEnd)}
            onChange={(value) => {
              setValue(
                "process.interviewStartDate",
                value?.start.toString() ?? "",
                { shouldDirty: true }
              )
              setValue(
                "process.interviewEndDate",
                value?.end.toString() ?? "",
                { shouldDirty: true }
              )
            }}
          >
            <DateField.Group fullWidth>
              <DateField.Input slot="start">
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateRangePicker.RangeSeparator />
              <DateField.Input slot="end">
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DateField.Suffix>
                <DateRangePicker.Trigger>
                  <DateRangePicker.TriggerIndicator />
                </DateRangePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DateRangePicker.Popover placement="bottom start">
              <RangeCalendar aria-label="인터뷰 기간">
                <RangeCalendar.Header>
                  <RangeCalendar.YearPickerTrigger>
                    <RangeCalendar.YearPickerTriggerHeading />
                    <RangeCalendar.YearPickerTriggerIndicator />
                  </RangeCalendar.YearPickerTrigger>
                  <RangeCalendar.NavButton slot="previous" />
                  <RangeCalendar.NavButton slot="next" />
                </RangeCalendar.Header>
                <RangeCalendar.Grid>
                  <RangeCalendar.GridHeader>
                    {(day) => (
                      <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                    )}
                  </RangeCalendar.GridHeader>
                  <RangeCalendar.GridBody>
                    {(date) => <RangeCalendar.Cell date={date} />}
                  </RangeCalendar.GridBody>
                </RangeCalendar.Grid>
              </RangeCalendar>
            </DateRangePicker.Popover>
          </DateRangePicker>
        </FormField>

        <FormField label="최종 발표">
          <Controller
            control={control}
            name="process.finalResultDate"
            render={({ field }) => (
              <Input
                type="date"
                aria-label="최종 발표"
                className="w-full"
                value={field.value?.slice(0, 10) ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            )}
          />
        </FormField>
      </GridBox>
    </Section>
  )
}
