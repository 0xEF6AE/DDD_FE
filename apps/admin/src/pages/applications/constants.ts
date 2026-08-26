/** 백엔드 ApplicationGetAdminListStatus — generated 타입 미생성 시 로컬 정의 */
export type ApplicationStatus =
  | "서류심사대기"
  | "서류합격"
  | "서류불합격"
  | "면접합격"
  | "최종합격"
  | "최종불합격"
  | "활동중"
  | "활동완료"
  | "활동중단"

export type StatusAction = {
  status: ApplicationStatus
  /** 드로어 푸터 버튼 + 확인 모달 CTA */
  label: string
  /** 확인 모달 헤딩·성공 토스트용 서술형 문구 — label 만으로는 문장이 어색한 전이가 있어 분리 */
  actionPhrase: string
}

export type StatusBranch = {
  pass?: StatusAction
  fail?: StatusAction
}

/**
 * 상태별 합격/불합격 분기 — undefined 이면 어드민이 드로어에서 전환할 수 없는 상태다.
 * 최종합격 이후는 합불 판정이 아니라 활동 전환이므로 라벨을 따로 둔다.
 * 활동중 이후도 합불 판정이 아니라 활동 전환이므로 라벨을 따로 둔다.
 */
export const STATUS_BRANCH: Partial<Record<ApplicationStatus, StatusBranch>> = {
  서류심사대기: {
    pass: { status: "서류합격", label: "서류 합격", actionPhrase: "서류 합격 처리" },
    fail: { status: "서류불합격", label: "불합격", actionPhrase: "서류 불합격 처리" },
  },
  서류합격: {
    pass: { status: "면접합격", label: "면접 합격", actionPhrase: "면접 합격 처리" },
    fail: { status: "최종불합격", label: "불합격", actionPhrase: "최종 불합격 처리" },
  },
  면접합격: {
    pass: { status: "최종합격", label: "최종 합격", actionPhrase: "최종 합격 처리" },
    fail: { status: "최종불합격", label: "불합격", actionPhrase: "최종 불합격 처리" },
  },
  최종합격: {
    pass: {
      status: "활동중",
      label: "활동중으로 전환",
      actionPhrase: "활동중으로 전환",
    },
  },
  활동중: {
    pass: {
      status: "활동완료",
      label: "활동 완료 처리",
      actionPhrase: "활동 완료 처리",
    },
    fail: {
      status: "활동중단",
      label: "활동 중단 처리",
      actionPhrase: "활동 중단 처리",
    },
  },
}

/** 상태 필터 / 카드 표시 순서 */
export const ALL_STATUSES: readonly ApplicationStatus[] = [
  "서류심사대기",
  "서류합격",
  "서류불합격",
  "면접합격",
  "최종합격",
  "최종불합격",
  "활동중",
  "활동완료",
  "활동중단",
]
