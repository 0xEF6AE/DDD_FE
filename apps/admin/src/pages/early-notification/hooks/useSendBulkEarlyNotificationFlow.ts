import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@heroui/react"

import { earlyNotificationKeys, earlyNotificationMutations } from "@ddd/api"

type SendParams = {
  cohortId: number
  cohortName: string
  subject: string
  html: string
  text: string
}

/**
 * 사전 알림 일괄 발송 흐름.
 *
 * 백엔드는 `{ total, success, failed }` 를 돌려주므로 부분 실패를 구분해 알린다.
 * 성공한 대상만 `notifiedAt` 이 찍히고 발송은 미발송 대상만 재조회하므로,
 * 실패분은 같은 화면에서 재발송하면 그대로 복구된다.
 */
export function useSendBulkEarlyNotificationFlow() {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useMutation(
    earlyNotificationMutations.sendBulkEarlyNotification(),
  )

  const send = async ({
    cohortId,
    cohortName,
    subject,
    html,
    text,
  }: SendParams): Promise<boolean> => {
    try {
      const result = await mutateAsync({
        payload: { cohortId, subject, html, text },
      })
      queryClient.invalidateQueries({
        queryKey: earlyNotificationKeys.adminLists(),
      })

      if (result.failed > 0) {
        toast.warning("일부 대상에게 발송하지 못했습니다", {
          description: `${cohortName} 대상 ${result.total}명 중 ${result.success}명 성공, ${result.failed}명 실패했습니다. 다시 발송하면 실패한 대상에게만 전송됩니다.`,
        })
        return true
      }

      toast.success("알림 발송이 완료되었습니다", {
        description: `${cohortName}에 등록된 신청자 ${result.success}명에게 발송했습니다.`,
      })
      return true
    } catch (error) {
      toast.danger("발송에 실패했습니다", {
        description:
          error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.",
      })
      return false
    }
  }

  return { send, isPending }
}
