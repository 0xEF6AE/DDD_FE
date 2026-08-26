import {
  STATUS_BRANCH,
  type ApplicationStatus,
  type StatusAction,
} from "@/pages/applications/constants"

/** 드로어 푸터에 노출할 전이 하나 — `isPass` 는 버튼 variant·확인 모달 아이콘을 가른다 */
export type StatusTransition = {
  action: StatusAction
  isPass: boolean
}

/**
 * 지원자 상태에서 어드민이 지금 실행할 수 있는 전이를 푸터 노출 순서(불합격 → 합격)로 반환한다.
 *
 * `STATUS_BRANCH` 에 항목이 없는 상태(서류불합격·최종불합격·활동완료·활동중단 등 종결 상태)는 어드민
 * 지원자 상세에서 더 전환할 수 없으므로 빈 배열을 돌려주고, 그 경우 푸터에는 "닫기" 만 남는다.
 * BE 가 아직 모르는 상태 문자열을 내려줘도 빈 배열로 떨어져 버튼이 새지 않는다.
 */
export function getAvailableStatusTransitions(
  status: string | undefined,
): StatusTransition[] {
  const branch =
    status === undefined
      ? undefined
      : STATUS_BRANCH[status as ApplicationStatus]

  if (branch === undefined) return []

  const transitions: StatusTransition[] = []
  if (branch.fail) transitions.push({ action: branch.fail, isPass: false })
  if (branch.pass) transitions.push({ action: branch.pass, isPass: true })

  return transitions
}
