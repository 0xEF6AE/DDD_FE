import { useState } from "react"
import { Button, Drawer, Spinner } from "@heroui/react"
import { useAdminApplication, useCohorts } from "@ddd/api"
import { useIsMobile } from "@/shared/hooks/useIsMobile"
import { Section } from "@/shared/ui/Section"
import { STATUS_BRANCH, PART_LABEL } from "../../constants"
import type { ApplicationStatus, StatusBranch } from "../../constants"
import { AnswerList } from "./components/AnswerList"
import { StatusChangeModal } from "./components/StatusChangeModal"

type ConfirmState = {
  nextStatus: ApplicationStatus
  label: string
  isPass: boolean
}

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  applicationId: number | null
}

const maskPhone = (phone: string) =>
  phone.replace(/(\d{3})-?(\d{3,4})-?(\d{4})/, "$1-****-$3")

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("ko-KR") : "-"

export const ApplicationDetailDrawer = ({
  isOpen,
  onOpenChange,
  applicationId,
}: Props) => {
  const isMobile = useIsMobile()
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const { data: application, isLoading } = useAdminApplication({
    params: { id: applicationId ?? 0 },
  })
  const { data: cohorts } = useCohorts()

  const allParts = (cohorts ?? []).flatMap((c) => c.parts ?? []) as unknown as Array<{
    id: number
    name: string
  }>
  const partName = allParts.find((p) => p.id === application?.cohortPartId)?.name ?? ""
  const partLabel = PART_LABEL[partName] || partName || "-"

  const branch: StatusBranch | undefined = application
    ? STATUS_BRANCH[application.status as ApplicationStatus]
    : undefined

  const openConfirm = (nextStatus: ApplicationStatus, label: string, isPass: boolean) =>
    setConfirmState({ nextStatus, label, isPass })

  return (
    <>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Drawer.Content placement={isMobile ? "bottom" : "right"}>
          <Drawer.Dialog className={!isMobile ? "w-full max-w-120 bg-background" : ""}>
            <Drawer.Header>
              <Drawer.Heading className="text-lg font-semibold">
                {application?.applicantName ?? "지원자 상세"}
              </Drawer.Heading>
            </Drawer.Header>

            <Drawer.Body className="flex-1 space-y-6 overflow-y-auto p-5">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : application ? (
                <>
                  <Section title="기본 정보">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                      <InfoRow label="파트" value={partLabel} />
                      <InfoRow label="이름" value={application.applicantName} />
                      <InfoRow
                        label="연락처"
                        value={
                          application.applicantPhone
                            ? maskPhone(application.applicantPhone)
                            : "-"
                        }
                      />
                      <InfoRow
                        label="생년월일"
                        value={application.applicantBirthDate ?? "-"}
                      />
                      <InfoRow
                        label="거주 지역"
                        value={application.applicantRegion ?? "-"}
                      />
                      <InfoRow
                        label="제출일"
                        value={formatDate(
                          application.submittedAt ?? application.createdAt,
                        )}
                      />
                      <InfoRow
                        label="개인정보 동의"
                        value={application.privacyAgreed ? "동의" : "미동의"}
                      />
                      <InfoRow label="현재 상태" value={application.status} />
                    </dl>
                  </Section>

                  <Section title="지원서 답변">
                    <AnswerList answers={application.answers} />
                  </Section>
                </>
              ) : null}
            </Drawer.Body>

            <Drawer.Footer className="gap-2">
              <Button slot="close" variant="tertiary" className="flex-1">
                닫기
              </Button>
              {branch?.fail && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onPress={() => openConfirm(branch.fail!, "불합격", false)}
                >
                  불합격
                </Button>
              )}
              {branch?.pass && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onPress={() => openConfirm(branch.pass!, "합격", true)}
                >
                  합격
                </Button>
              )}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      {confirmState && application && (
        <StatusChangeModal
          isOpen
          onOpenChange={(open) => !open && setConfirmState(null)}
          applicationId={application.id}
          applicantName={application.applicantName}
          nextStatus={confirmState.nextStatus}
          label={confirmState.label}
          isPass={confirmState.isPass}
        />
      )}
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-medium text-foreground-secondary">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </>
  )
}
