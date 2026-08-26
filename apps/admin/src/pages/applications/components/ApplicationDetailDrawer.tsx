import { useState } from "react"
import { Button, Drawer, Spinner } from "@heroui/react"
import { useQuery } from "@tanstack/react-query"
import { applicationQueries, cohortQueries } from "@ddd/api"
import { useIsMobile } from "@/shared/hooks/useIsMobile"
import { Section } from "@/shared/ui/Section"
import type { StatusAction } from "@/pages/applications/constants"
import { buildCohortPartInfoById } from "@/pages/applications/lib/cohortPart"
import { getAvailableStatusTransitions } from "@/pages/applications/lib/statusTransition"
import { AnswerList } from "./AnswerList"
import { StatusChangeModal } from "./StatusChangeModal"

type ConfirmState = {
  action: StatusAction
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

  const { data: application, isLoading } = useQuery(
    applicationQueries.getAdminApplication({
      params: { id: applicationId ?? 0 },
    })
  )
  const { data: cohorts } = useQuery(cohortQueries.getCohorts())

  const cohortPartInfoById = buildCohortPartInfoById(cohorts ?? [])
  const partInfo =
    application === undefined
      ? undefined
      : cohortPartInfoById.get(application.cohortPartId)
  const partLabel = partInfo?.partName ?? "-"

  const statusTransitions = getAvailableStatusTransitions(application?.status)

  const openConfirm = (action: StatusAction, isPass: boolean) =>
    setConfirmState({ action, isPass })

  return (
    <>
      <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Drawer.Content placement={isMobile ? "bottom" : "right"}>
          <Drawer.Dialog
            className={!isMobile ? "w-full max-w-120 bg-background" : ""}
          >
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
                        label="이메일"
                        value={application.applicantEmail ?? "-"}
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
                        value={formatDate(application.createdAt)}
                      />
                      <InfoRow
                        label="개인정보 동의"
                        value={application.privacyAgreedAt ? "동의" : "미동의"}
                      />
                      <InfoRow
                        label="동의 일자"
                        value={formatDate(application.privacyAgreedAt)}
                      />
                      <InfoRow label="현재 상태" value={application.status ?? "-"} />
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
              {statusTransitions.map(({ action, isPass }) => (
                <Button
                  key={action.status}
                  variant={isPass ? "primary" : "danger"}
                  className="flex-1"
                  onPress={() => openConfirm(action, isPass)}
                >
                  {action.label}
                </Button>
              ))}
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
          cohortId={partInfo?.cohortId}
          cohortPartId={application.cohortPartId}
          partLabel={partLabel}
          nextStatus={confirmState.action.status}
          label={confirmState.action.label}
          actionPhrase={confirmState.action.actionPhrase}
          isPass={confirmState.isPass}
        />
      )}
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-foreground-secondary font-medium">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </>
  )
}
