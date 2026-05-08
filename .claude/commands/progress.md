---
description: "어드민 기획 명세 대비 구현 현황 분석 + 다음 작업 Top 3 추천"
allowed-tools: Read, Bash(ls:*), Bash(date:*)
---

# 어드민 구현 현황 리포트

어드민 기획 명세와 `progress.md`를 교차 분석하여 영역별 완료율과 다음 작업을 추천한다.

## 실행 순서

### 1단계: 문서 읽기

다음 두 파일을 순서대로 읽는다:

1. `docs/admin-spec.md` — 기획 베이스라인 (3.1 기수 ~ 3.5 블로그 명세 전문)
2. `progress.md` — ✅/🔧/⬜ 기호로 표시된 구현 추적 현황

### 2단계: 코드 교차 검증

다음 파일들을 읽어 progress.md 기재 내용과 실제 코드 상태를 비교한다:

| 파일 | 검증 포인트 |
|------|------------|
| `apps/admin/src/pages/index.tsx` | `/applications/:id` 등 명세 라우트 존재 여부 |
| `apps/admin/src/pages/applications/components/ApplicationTable.tsx` | 행 클릭 → 상세 진입 연결, 합격/불합격 분기 UI |
| `apps/admin/src/pages/reminders/components/RemindersTable.tsx` | 개별 발송 컬럼, CSV 다운로드 트리거 |
| `packages/api/src/cohort/hooks.ts` | generated 훅 사용 여부 (vs 직접 HTTP 클라이언트) |
| `packages/api/src/application/hooks.ts` | 훅 커버리지 |
| `packages/api/src/early-notification/hooks.ts` | `useAdminEarlyNotificationsCsv` 훅 존재 여부 |
| `packages/api/src/storage/hooks.ts` | `storageListFiles`, `storageDeleteFile` 등 누락 훅 |

`packages/api/src/notification-campaign/` 폴더 존재 여부도 `ls packages/api/src/notification-campaign/`로 확인한다.

### 3단계: 리포트 출력

오늘 날짜(`currentDate` 컨텍스트)를 기준으로 아래 형식의 마크다운 리포트를 출력한다.

---

# 어드민 구현 현황 — {오늘 날짜}

## 전체 요약
전체 N개 항목 중 ✅ N / 🔧 N / ⬜ N (완료율 N%)
- 완료율 계산: (✅ + 🔧 × 0.5) / 전체 × 100

## 영역별 현황
| 영역 | ✅ | 🔧 | ⬜ | 완료율 |
|------|----|----|----|----|
| 공통 인프라 | | | | |
| 3.1 기수 관리 | | | | |
| 3.2 사전 알림 | | | | |
| 3.3 지원자 관리 | | | | |
| 3.4 프로젝트 DB | | | | |
| 3.5 블로그 DB | | | | |
| 4. SEO (web) | | | | |

## 코드 검증 결과
progress.md 기재 내용 vs 실제 코드 불일치 항목만 표시한다.
모두 일치하면 "검증 통과" 한 줄 요약.

## 다음 작업 Top 3 추천
아래 항목은 제외한다:
- progress.md에 "백엔드 엔드포인트 없음" 명시 항목
- Phase 2로 분류된 항목

추천 기준: 명세 대비 갭 크기 + 외부 의존성 없이 즉시 구현 가능한 항목 우선.

1. **[작업명]** `파일:라인` — 추천 이유
2. **[작업명]** `파일:라인` — 추천 이유
3. **[작업명]** `파일:라인` — 추천 이유
