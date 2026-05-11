import { AlertDialog, Button } from "@heroui/react"

import type { InterviewSlot } from "@ddd/api"

import { useDeleteSlotFlow } from "@/entities/interview-slot"

interface Props {
  slot: Pick<InterviewSlot, "id">
  isOpen: boolean
  onClose: () => void
}

export function DeleteInterviewSlotDialog({ slot, isOpen, onClose }: Props) {
  const { remove, isPending: isDeleting } = useDeleteSlotFlow({
    onSuccess: onClose,
  })

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
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>면접 슬롯을 삭제하시겠습니까?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>이 슬롯에 예약된 지원자가 있다면 함께 영향을 받을 수 있습니다. 이 작업은 되돌릴 수 없습니다.</p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="outline">
              취소
            </Button>
            <Button
              variant="danger"
              isDisabled={isDeleting}
              onPress={() => remove(slot)}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}
