/** 백엔드 ApplicationGetAdminListStatus — generated 타입 미생성 시 로컬 정의 */
export type ApplicationStatus =
  | "서류심사대기"
  | "서류합격"
  | "서류불합격"
  | "최종합격"
  | "최종불합격"
  | "활동중"
  | "활동완료"
  | "활동중단"

export type StatusBranch = {
  pass?: ApplicationStatus
  fail?: ApplicationStatus
}

/** 상태별 합격/불합격 분기 — undefined 이면 종결 상태 */
export const STATUS_BRANCH: Partial<Record<ApplicationStatus, StatusBranch>> = {
  서류심사대기: { pass: "서류합격", fail: "서류불합격" },
  서류합격: { pass: "최종합격", fail: "최종불합격" },
  최종합격: { pass: "활동중" },
  활동중: { pass: "활동완료", fail: "활동중단" },
}

/** 상태 필터 / 카드 표시 순서 */
export const ALL_STATUSES: readonly ApplicationStatus[] = [
  "서류심사대기",
  "서류합격",
  "서류불합격",
  "최종합격",
  "최종불합격",
  "활동중",
  "활동완료",
  "활동중단",
]
