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
  cohortId: number
  cohortPartId: number
  partLabel: string
  nextStatus: ApplicationStatus
  label: string
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
      toast.success(`${applicantName} 지원자를 ${label} 처리했어요`)
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError && error.is("INTERVIEW_SLOTS_NOT_READY")) {
        setIsSlotsRequiredOpen(true)
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
                {label} 처리하시겠습니까?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>
                <strong>{applicantName}</strong> 지원자의 상태가{" "}
                <strong>{nextStatus}</strong>(으)로 변경됩니다.
                {!isPass && " 불합격 이메일이 자동 발송됩니다."}
                {nextStatus === "서류합격" && " 면접 일정 선택 링크 이메일이 발송됩니다."}
                {nextStatus === "최종합격" && " 합격 이메일(Discord 연결 버튼 포함)이 발송됩니다."}
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
