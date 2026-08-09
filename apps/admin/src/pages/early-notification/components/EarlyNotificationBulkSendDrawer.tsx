import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery } from "@tanstack/react-query"
import { AlertDialog, Button, Drawer, Input, TextArea } from "@heroui/react"

import { earlyNotificationQueries } from "@ddd/api"

import { useIsMobile } from "@/shared/hooks/useIsMobile"
import { FormField } from "@/shared/ui/FormField"

import { useSendBulkEarlyNotificationFlow } from "../hooks/useSendBulkEarlyNotificationFlow"
import { buildEmailTemplate } from "../lib/buildEmailTemplate"

const bulkSendSchema = z.object({
  subject: z
    .string()
    .min(1, "제목을 입력해 주세요.")
    .max(200, "200자 이하로 입력해 주세요."),
  message: z
    .string()
    .min(1, "본문을 입력해 주세요.")
    .max(5000, "5000자 이하로 입력해 주세요."),
  ctaLabel: z
    .string()
    .min(1, "버튼 라벨을 입력해 주세요.")
    .max(30, "30자 이하로 입력해 주세요."),
  ctaUrl: z
    .string()
    .url("URL 형식이 아닙니다.")
    .refine((u) => /^https?:\/\//i.test(u), {
      message: "http(s) URL만 사용해 주세요.",
    }),
})

type BulkSendFormValues = z.infer<typeof bulkSendSchema>

const DEFAULT_VALUES: BulkSendFormValues = {
  subject: "",
  message: "",
  ctaLabel: "지원하기",
  ctaUrl: "",
}

type EarlyNotificationBulkSendDrawerProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  cohortId: number
  cohortName: string
}

export const EarlyNotificationBulkSendDrawer = ({
  isOpen,
  onOpenChange,
  cohortId,
  cohortName,
}: EarlyNotificationBulkSendDrawerProps) => {
  const isMobile = useIsMobile()
  const { send, isPending } = useSendBulkEarlyNotificationFlow()

  // 발송 대상 수 — 0명 발송 차단 + 확인 문구용 (StatsSection 과 같은 쿼리, 캐시 공유)
  const { data: recipients } = useQuery(
    earlyNotificationQueries.getAdminEarlyNotifications({
      params: { cohortId },
    }),
  )
  const recipientCount = recipients?.length ?? 0

  const [confirmValues, setConfirmValues] = useState<BulkSendFormValues | null>(
    null,
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BulkSendFormValues>({
    resolver: zodResolver(bulkSendSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(function resetFormOnClose() {
    if (!isOpen) {
      reset(DEFAULT_VALUES)
    }
  }, [isOpen, reset])

  // 드로어가 닫힐 때 확인 다이얼로그 상태도 함께 정리 (CloseTrigger·백드롭·ESC 모두 경유)
  const handleDrawerOpenChange = (open: boolean) => {
    if (!open) setConfirmValues(null)
    onOpenChange(open)
  }

  // 발송 버튼 → 폼 검증 통과 시 확인 다이얼로그를 연다 (즉시 발송하지 않음).
  const requestSend = handleSubmit((values) => setConfirmValues(values))

  const doSend = async () => {
    if (!confirmValues) return
    const { html, text } = buildEmailTemplate({
      message: confirmValues.message,
      ctaLabel: confirmValues.ctaLabel,
      ctaUrl: confirmValues.ctaUrl,
    })

    const isSent = await send({
      cohortId,
      cohortName,
      subject: confirmValues.subject,
      html,
      text,
    })

    if (isSent) {
      setConfirmValues(null)
      onOpenChange(false)
    }
  }

  const isBusy = isSubmitting || isPending

  return (
    <>
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={handleDrawerOpenChange}>
      <Drawer.Content placement={isMobile ? "bottom" : "right"}>
        <Drawer.Dialog
          className={!isMobile ? "w-full max-w-1/2 bg-gray-50" : ""}
        >
          <Drawer.Header>
            <Drawer.Heading className="text-lg font-semibold">
              사전 알림 발송
            </Drawer.Heading>
            <p className="text-muted-foreground text-sm">
              {cohortName}에 등록된 신청자 {recipientCount}명에게 일괄 발송됩니다.
            </p>
          </Drawer.Header>

          <Drawer.Body className="flex-1 space-y-6 overflow-y-auto">
            <FormField label="제목" error={errors.subject?.message}>
              <Input
                {...register("subject")}
                placeholder="예: 14기 모집이 시작되었습니다"
                className="w-full"
              />
            </FormField>

            <FormField label="본문" error={errors.message?.message}>
              <TextArea
                {...register("message")}
                rows={8}
                placeholder="신청자에게 안내할 내용을 입력하세요. 줄바꿈은 그대로 적용됩니다."
                className="min-h-40 w-full resize-none"
              />
            </FormField>

            <FormField label="버튼 라벨" error={errors.ctaLabel?.message}>
              <Input
                {...register("ctaLabel")}
                placeholder="지원하기"
                className="w-full"
              />
            </FormField>

            <FormField label="버튼 링크 (URL)" error={errors.ctaUrl?.message}>
              <Input
                {...register("ctaUrl")}
                placeholder="https://dddstudy.com/recruit"
                className="w-full"
              />
            </FormField>
          </Drawer.Body>

          <Drawer.Footer className="gap-2">
            <Drawer.CloseTrigger />
            <Button
              onPress={() => requestSend()}
              isDisabled={isBusy || recipientCount === 0}
            >
              {recipientCount === 0 ? "발송 대상 없음" : "발송"}
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>

    <AlertDialog.Backdrop
      isOpen={confirmValues !== null}
      onOpenChange={(open) => !open && setConfirmValues(null)}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-100">
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="warning" />
            <AlertDialog.Heading>알림을 발송하시겠습니까?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>
              <strong>{cohortName}</strong>에 등록된 신청자{" "}
              <strong>{recipientCount}명</strong>에게 즉시 발송됩니다. 이 작업은
              되돌릴 수 없습니다.
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary">
              취소
            </Button>
            <Button isDisabled={isBusy} onPress={doSend}>
              {isBusy ? "발송 중..." : "발송"}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
    </>
  )
}

