import { AlertDialog, Button } from "@heroui/react"

import type { PartsRecruitingViolation } from "@/pages/semesters/lib/validateCohortPartsForRecruiting"

interface Props {
  isOpen: boolean
  onClose: () => void
  cohortName: string
  violation: PartsRecruitingViolation
  onOpenEditDrawer: () => void
}

export function TransitionBlockedDialog({
  isOpen,
  onClose,
  cohortName,
  violation,
  onOpenEditDrawer,
}: Props) {
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onClose}
      isKeyboardDismissDisabled={false}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog>
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status="warning" />
            <AlertDialog.Heading>
              {cohortName} 모집중 전환을 진행할 수 없습니다
            </AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>{violation.message}</p>
            <p className="text-foreground-secondary mt-2 text-sm">
              수정 화면을 열어 양식을 채워주세요.
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="outline">
              닫기
            </Button>
            <Button onPress={onOpenEditDrawer}>수정 화면 열기</Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}
