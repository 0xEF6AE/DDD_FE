import { Button, Modal } from "@heroui/react"
import { useNavigate } from "react-router"

import { paths } from "@/shared/lib/paths"

interface Props {
  isOpen: boolean
  onClose: () => void
  applicantName: string
  label: string
  partLabel: string
  cohortId: number
  cohortPartId: number
}

export const InterviewSlotsRequiredModal = ({
  isOpen,
  onClose,
  applicantName,
  label,
  partLabel,
  cohortId,
  cohortPartId,
}: Props) => {
  const navigate = useNavigate()

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Icon status="warning" />
              <Modal.Heading>면접 슬롯이 준비되지 않았습니다</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                <strong>{applicantName}</strong> 지원자를 <strong>{label}</strong>{" "}
                처리하려면 <strong>{partLabel}</strong> 파트의 면접 슬롯이 먼저
                등록되어 있어야 합니다. 슬롯을 등록한 뒤 다시 시도해 주세요.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="outline">
                닫기
              </Button>
              <Button
                onPress={() => {
                  navigate(
                    `${paths.interviewSlots}?cohortId=${cohortId}&cohortPartId=${cohortPartId}`,
                  )
                  onClose()
                }}
              >
                슬롯 등록하러 가기
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
