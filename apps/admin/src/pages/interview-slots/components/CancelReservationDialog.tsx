import { AlertDialog, Button } from "@heroui/react"

import { useCancelReservationFlow } from "@/entities/interview-slot"

interface Props {
  reservationId: number
  applicantName: string
  isOpen: boolean
  onClose: () => void
}

export function CancelReservationDialog({
  reservationId,
  applicantName,
  isOpen,
  onClose,
}: Props) {
  const { cancel, isPending } = useCancelReservationFlow({ onSuccess: onClose })

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
            <AlertDialog.Heading>예약을 취소하시겠습니까?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>
              {applicantName} 님의 면접 예약을 취소합니다. 캘린더 이벤트도 함께
              삭제되며 이 작업은 되돌릴 수 없습니다.
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="outline">
              닫기
            </Button>
            <Button
              variant="danger"
              isDisabled={isPending}
              onPress={() => cancel(reservationId)}
            >
              {isPending ? "취소 중..." : "예약 취소"}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  )
}
