import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Drawer, Input, TextArea } from "@heroui/react"

import type { NotificationCampaignDto } from "@ddd/api"

import {
  buildCampaignFormDefaults,
  campaignFormSchema,
  useUpdateCampaignFlow,
  type CampaignFormValues,
} from "@/entities/notification-campaign"
import { useIsMobile } from "@/shared/hooks/useIsMobile"
import { FormField } from "@/shared/ui/FormField"
import { Section } from "@/shared/ui/Section"

type NotificationCampaignEditDrawerProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  campaign: NotificationCampaignDto
}

export const NotificationCampaignEditDrawer = ({
  isOpen,
  onOpenChange,
  campaign,
}: NotificationCampaignEditDrawerProps) => {
  const isMobile = useIsMobile()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: buildCampaignFormDefaults(campaign),
  })

  useEffect(() => {
    if (isOpen) reset(buildCampaignFormDefaults(campaign))
  }, [isOpen, campaign, reset])

  const { submit, isPending } = useUpdateCampaignFlow({
    targetId: campaign.id,
    onSuccess: () => onOpenChange(false),
  })

  const onSubmit = handleSubmit(submit)
  const htmlPreview = useWatch({ control, name: "html" })

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement={isMobile ? "bottom" : "right"}>
        <Drawer.Dialog
          className={!isMobile ? "w-full max-w-1/2 bg-gray-50" : ""}
        >
          <Drawer.Header>
            <Drawer.Heading className="text-lg font-semibold">
              캠페인 편집
            </Drawer.Heading>
          </Drawer.Header>

          <Drawer.Body className="flex-1 space-y-6 overflow-y-auto">
            <Section title="발송 정보">
              <FormField label="메일 제목" error={errors.subject?.message}>
                <Input
                  {...register("subject")}
                  placeholder="모집 시작 알림"
                  className="w-full"
                />
              </FormField>

              <FormField
                label="발송 예정 시각"
                error={errors.scheduledAt?.message}
              >
                <input
                  {...register("scheduledAt")}
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </FormField>
            </Section>

            <Section title="본문">
              <FormField label="텍스트 본문" error={errors.text?.message}>
                <TextArea
                  {...register("text")}
                  placeholder="이메일 클라이언트가 HTML 을 표시하지 못할 때 보이는 대체 본문"
                  className="min-h-32 w-full resize-y"
                />
              </FormField>

              <FormField label="HTML 본문" error={errors.html?.message}>
                <TextArea
                  {...register("html")}
                  placeholder="<p>안녕하세요...</p>"
                  className="min-h-48 w-full resize-y font-mono text-xs"
                />
              </FormField>
            </Section>

            <Section title="미리보기">
              <iframe
                title="HTML 본문 미리보기"
                srcDoc={htmlPreview}
                sandbox=""
                className="h-80 w-full rounded border border-gray-200 bg-white"
              />
            </Section>
          </Drawer.Body>

          <Drawer.Footer className="gap-2">
            <Drawer.CloseTrigger />
            <Button onPress={() => onSubmit()} isDisabled={isPending}>
              {isPending ? "저장 중..." : "저장"}
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
