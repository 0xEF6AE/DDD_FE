import { useState } from "react"
import { AlertDialog, Button, toast } from "@heroui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ApiError, applicationKeys, applicationMutations } from "@ddd/api"
import type { ApplicationStatus } from "@/pages/applications/constants"

import { InterviewSlotsRequiredModal } from "./InterviewSlotsRequiredModal"

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  applicationId: number
  applicantName: string
  cohortId: number | undefined
  cohortPartId: number
  partLabel: string
  nextStatus: ApplicationStatus
  label: string
  actionPhrase: string
  isPass: boolean
}

export const StatusChangeModal = ({
  isOpen,
  onOpenChange,
  applicationId,
  applicantName,
  cohortId,
  cohortPartId,
  partLabel,
  nextStatus,
  label,
  actionPhrase,
  isPass,
}: Props) => {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation(
    applicationMutations.patchApplicationStatus(),
  )
  const [isSlotsRequiredOpen, setIsSlotsRequiredOpen] = useState(false)

  const handleConfirm = async () => {
    try {
      await mutateAsync({
        params: { id: applicationId },
        payload: { status: nextStatus },
      })
      await queryClient.invalidateQueries({ queryKey: applicationKeys.adminLists() })
      await queryClient.invalidateQueries({
        queryKey: applicationKeys.adminDetail({ id: applicationId }),
      })
      toast.success(`${applicantName} 지원자를 ${actionPhrase}했어요`)
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError && error.is("INTERVIEW_SLOTS_NOT_READY")) {
        setIsSlotsRequiredOpen(true)
        return
      }
      if (error instanceof ApiError && error.is("INVALID_STATUS_TRANSITION")) {
        toast.danger("이미 상태가 변경된 지원자예요", {
          description: "최신 상태를 다시 불러왔어요. 확인 후 다시 시도해 주세요.",
        })
        await queryClient.invalidateQueries({ queryKey: applicationKeys.adminLists() })
        await queryClient.invalidateQueries({
          queryKey: applicationKeys.adminDetail({ id: applicationId }),
        })
        onOpenChange(false)
        return
      }
      toast.danger("상태 변경에 실패했어요", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <>
      <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-100">
            <AlertDialog.CloseTrigger />
            <AlertDialog.Header>
              <AlertDialog.Icon status={isPass ? "accent" : "danger"} />
              <AlertDialog.Heading>
                {actionPhrase}하시겠습니까?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                <strong>{applicantName}</strong> 지원자의 상태가{" "}
                <strong>{nextStatus}</strong>(으)로 변경됩니다.
                {(nextStatus === "서류불합격" || nextStatus === "최종불합격") &&
                  " 불합격 안내 이메일이 자동 발송됩니다."}
                {nextStatus === "서류합격" && " 서류전형 합격 안내(면접 일정 선택 링크) 이메일이 발송됩니다."}
                {nextStatus === "면접합격" && " 면접전형 합격 안내 이메일이 발송됩니다."}
                {nextStatus === "최종합격" && " 최종 합격 안내 이메일(Discord 연결 버튼 포함)이 발송됩니다."}
                {["활동중", "활동완료", "활동중단"].includes(nextStatus) &&
                  " 지원자에게 이메일은 발송되지 않습니다."}
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                취소
              </Button>
              <Button
                variant={isPass ? "primary" : "danger"}
                isDisabled={isPending}
                onPress={handleConfirm}
              >
                {isPending ? "처리 중..." : label}
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>

      <InterviewSlotsRequiredModal
        isOpen={isSlotsRequiredOpen}
        onClose={() => {
          setIsSlotsRequiredOpen(false)
          onOpenChange(false)
        }}
        applicantName={applicantName}
        label={label}
        partLabel={partLabel}
        cohortId={cohortId}
        cohortPartId={cohortPartId}
      />
    </>
  )
}
