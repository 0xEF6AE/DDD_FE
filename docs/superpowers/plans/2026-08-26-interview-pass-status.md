# 면접합격 상태 도입 (지원자 상태 전이 3단계화) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BE 에 신규 도입된 `면접합격` 상태를 어드민 지원자 관리 UI 에 반영해, 서류합격 상태에서 [합격] 클릭 시 최종합격으로 건너뛰던 이슈를 해소한다.

**Architecture:** 상태 전이의 단일 출처는 `pages/applications/constants.ts` 의 `STATUS_BRANCH` 맵이고, 드로어 푸터 버튼은 `lib/statusTransition.ts` 의 `getAvailableStatusTransitions()` 가 이 맵을 읽어 렌더한다(현재 워킹트리에 진행 중인 `StatusAction` 리팩터가 이 구조를 이미 만들어 둠). 이 계획은 ① 진행 중 리팩터를 먼저 커밋으로 확정하고 ② generated API 타입을 재생성한 뒤 ③ `STATUS_BRANCH`/`ALL_STATUSES` 에 면접합격을 추가하고 ④ 카드·모달 문구·문서를 스펙에 맞춘다.

**Tech Stack:** Vite + React 19, TanStack Query, HeroUI v3, openapi-typescript (`pnpm gen:api`)

**Spec:** `docs/specs/2026-08-26-application-status-api.html` (원본: `~/Downloads/api-interface-status.html`)

## Global Constraints

- 상태 enum 값은 스펙 문자열 그대로: `서류심사대기 | 서류합격 | 서류불합격 | 면접합격 | 최종합격 | 최종불합격 | 활동중 | 활동완료 | 활동중단`
- 전이 규칙(서버 검증): `서류심사대기 → 서류합격·서류불합격`, `서류합격 → 면접합격·최종불합격`, `면접합격 → 최종합격·최종불합격`, `최종합격 → 활동중`, `활동중 → 활동완료·활동중단`
- 스펙에 없는 전이 요청 시 400 `INVALID_STATUS_TRANSITION` (message 는 그대로 노출 가능한 한국어)
- 메일 발송: 서류합격·서류불합격·면접합격·최종합격·최종불합격 5종만 자동 발송, 활동 전환 3종은 미발송
- `packages/api/src/generated/api.ts` 는 손으로 수정하지 않는다 — `pnpm gen:api` 로만 갱신 (로컬 BE `http://localhost:3000` 필요)
- CODE_RULES §1: 페이지 전용 코드는 `pages/applications/` 콜로케이션 유지, barrel 금지
- apps/admin 에는 테스트 러너가 없다 — 각 태스크의 검증 게이트는 `pnpm --filter @ddd/admin typecheck` + `pnpm lint` + 브라우저 수동 확인

---

### Task 1: 진행 중 `StatusAction` 리팩터 커밋 확정

워킹트리에 이미 있는 미커밋 변경(라벨/문구를 데이터로 옮긴 `StatusAction` 도입, `statusTransition.ts` 신설)을 면접합격 작업의 베이스로 먼저 확정한다.

**Files:**
- Modify (이미 수정됨, 커밋만): `apps/admin/src/pages/applications/constants.ts`
- Modify (이미 수정됨, 커밋만): `apps/admin/src/pages/applications/components/ApplicationDetailDrawer.tsx`
- Modify (이미 수정됨, 커밋만): `apps/admin/src/pages/applications/components/StatusChangeModal.tsx`
- Create (이미 생성됨, 커밋만): `apps/admin/src/pages/applications/lib/statusTransition.ts`
- Create: `docs/specs/2026-08-26-application-status-api.html` (스펙 사본, 이미 복사됨)

**Interfaces:**
- Produces: `StatusAction = { status: ApplicationStatus; label: string; actionPhrase: string }`, `StatusBranch = { pass?: StatusAction; fail?: StatusAction }`, `getAvailableStatusTransitions(status: string | undefined): StatusTransition[]` — Task 3 이 이 구조 위에 면접합격 항목을 추가한다.

- [ ] **Step 1: 타입·린트 게이트 통과 확인**

Run: `pnpm --filter @ddd/admin typecheck && pnpm lint`
Expected: 에러 0건

- [ ] **Step 2: 커밋**

```bash
git add apps/admin/src/pages/applications docs/specs/2026-08-26-application-status-api.html
git commit -m "refactor(admin/applications): 상태 전이 버튼을 StatusAction 데이터 기반으로 개편"
```

---

### Task 2: generated API 타입 재생성 (`면접합격` enum 반영)

`UpdateApplicationStatusRequestDto.status` · `ApplicationDto.status` · 목록 필터 enum 에 `면접합격` 이 들어와야 Task 3 의 payload 가 타입 에러 없이 통과한다.

**Files:**
- Regenerate: `packages/api/src/generated/api.ts`

**Interfaces:**
- Produces: generated `status` 유니온에 `"면접합격"` 포함 — Task 3 의 `STATUS_BRANCH` 값이 `PatchApplicationStatusRequest` 에 대입 가능해진다.

- [ ] **Step 1: 로컬 BE 기동 확인 후 재생성**

Run: `curl -sf http://localhost:3000/api/api-docs-json > /dev/null && pnpm gen:api`

로컬 BE 가 안 떠 있으면 여기서 멈추고 사용자에게 BE 기동(또는 최신 openapi.json 경로)을 요청한다. **generated 파일을 손으로 고치는 폴백은 금지.**

- [ ] **Step 2: 면접합격이 실제로 들어왔는지 검증**

Run: `grep -c "면접합격" packages/api/src/generated/api.ts`
Expected: 1 이상 (0 이면 BE 배포본이 구스펙 — 사용자에게 보고하고 중단)

- [ ] **Step 3: 타입 게이트**

Run: `pnpm --filter @ddd/admin typecheck`
Expected: 에러 0건 (enum 확장은 하위호환이라 기존 코드가 깨지지 않아야 함)

- [ ] **Step 4: 커밋**

```bash
git add packages/api/src/generated/api.ts
git commit -m "chore(api): BE 스키마 재생성 — ApplicationStatus 면접합격 추가"
```

---

### Task 3: `constants.ts` — 면접합격 상태·전이·필터 순서 반영

전이 맵을 스펙 표와 1:1 로 맞춘다. 이번 이슈의 재발 방지를 위해 합격 버튼 라벨을 단계 명시형(`서류 합격`·`면접 합격`·`최종 합격`)으로 바꾼다 — 운영진이 라벨만 보고도 어느 단계 판정인지 알 수 있게.

**Files:**
- Modify: `apps/admin/src/pages/applications/constants.ts`

**Interfaces:**
- Consumes: Task 1 의 `StatusAction`/`StatusBranch` 타입
- Produces: `ApplicationStatus` 유니온에 `"면접합격"`, `STATUS_BRANCH` 5개 키(서류심사대기·서류합격·면접합격·최종합격), `ALL_STATUSES` 9개 항목 — 드로어·필터·카드가 자동으로 이 값을 따른다.

- [ ] **Step 1: `ApplicationStatus` 유니온에 면접합격 추가**

```ts
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
```

- [ ] **Step 2: `STATUS_BRANCH` 를 스펙 전이 표대로 교체**

```ts
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
}
```

(`활동중 → 활동완료·활동중단` 은 스펙상 존재하지만 어드민 지원자 상세에서 다루지 않는 기존 결정을 유지한다 — 기수 종료 처리로 일괄 전환되는 흐름이기 때문. Task 6 문서에 이 결정을 명기한다.)

- [ ] **Step 3: `ALL_STATUSES` 에 면접합격 삽입 (서류불합격 다음)**

```ts
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
```

- [ ] **Step 4: 타입 게이트**

Run: `pnpm --filter @ddd/admin typecheck`
Expected: 에러 0건. `statusTransition.ts`·`ApplicationDetailDrawer`·`ApplicationFilters`·카운트 집계는 전부 `STATUS_BRANCH`/`ALL_STATUSES` 를 순회하므로 코드 수정 없이 면접합격을 따라온다.

- [ ] **Step 5: 커밋**

```bash
git add apps/admin/src/pages/applications/constants.ts
git commit -m "feat(admin/applications): 면접합격 상태 도입 — 서류합격→면접합격→최종합격 3단계 전이"
```

---

### Task 4: 통계 카드에 면접합격 추가

**Files:**
- Modify: `apps/admin/src/pages/applications/components/Sections.tsx`

**Interfaces:**
- Consumes: Task 3 의 `ApplicationStatus` (면접합격 포함). `counts` 는 `ApplicationsCards.tsx` 가 상태 문자열 기준으로 범용 집계하므로 변경 불필요.

- [ ] **Step 1: 카드 배열에 면접합격 추가 + 그리드 6칸으로**

`cards` 배열을 다음으로 교체:

```ts
const cards: { title: string; key: ApplicationStatus | "total" }[] = [
  { title: "전체 지원", key: "total" },
  { title: "서류심사대기", key: "서류심사대기" },
  { title: "서류합격", key: "서류합격" },
  { title: "면접합격", key: "면접합격" },
  { title: "최종합격", key: "최종합격" },
  { title: "활동중", key: "활동중" },
]
```

`<GridBox className="grid-cols-5 gap-5">` → `<GridBox className="grid-cols-6 gap-5">`

- [ ] **Step 2: 타입 게이트 + 브라우저 확인**

Run: `pnpm --filter @ddd/admin typecheck`
브라우저: `pnpm dev:admin` → 지원자 목록에서 카드 6장이 한 줄에 깨짐 없이 렌더되는지 확인 (좁은 뷰포트에서 카드 최소폭 확인 포함)

- [ ] **Step 3: 커밋**

```bash
git add apps/admin/src/pages/applications/components/Sections.tsx
git commit -m "feat(admin/applications): 상태 카드에 면접합격 추가"
```

---

### Task 5: 확인 모달 — 메일 안내 문구 스펙 정합 + `INVALID_STATUS_TRANSITION` 처리

**Files:**
- Modify: `apps/admin/src/pages/applications/components/StatusChangeModal.tsx`

**Interfaces:**
- Consumes: `ApiError.is(code)` (`@ddd/api`), Task 3 의 `nextStatus` 값 (면접합격 포함)

- [ ] **Step 1: 모달 본문 메일 안내를 스펙 메일 표와 1:1 로 교체**

현 본문 (`AlertDialog.Body` 내부):

```tsx
{!isPass && " 불합격 이메일이 자동 발송됩니다."}
{nextStatus === "서류합격" && " 면접 일정 선택 링크 이메일이 발송됩니다."}
{nextStatus === "최종합격" && " 합격 이메일(Discord 연결 버튼 포함)이 발송됩니다."}
```

교체:

```tsx
{!isPass && " 불합격 안내 이메일이 자동 발송됩니다."}
{nextStatus === "서류합격" && " 서류전형 합격 안내(면접 일정 선택 링크) 이메일이 발송됩니다."}
{nextStatus === "면접합격" && " 면접전형 합격 안내 이메일이 발송됩니다."}
{nextStatus === "최종합격" && " 최종 합격 안내 이메일(Discord 연결 버튼 포함)이 발송됩니다."}
{nextStatus === "활동중" && " 지원자에게 이메일은 발송되지 않습니다."}
```

- [ ] **Step 2: `handleConfirm` catch 에 `INVALID_STATUS_TRANSITION` 분기 추가**

다른 운영자가 먼저 상태를 바꿔 드로어가 낡은 상태를 들고 있을 때 나는 에러이므로, 안내 후 쿼리를 무효화해 화면을 최신화한다. 기존 `INTERVIEW_SLOTS_NOT_READY` 분기 아래에 추가:

```tsx
if (error instanceof ApiError && error.is("INVALID_STATUS_TRANSITION")) {
  toast.danger("이미 상태가 변경된 지원자예요", {
    description: "최신 상태를 다시 불러왔어요. 확인 후 다시 시도해 주세요.",
  })
  await queryClient.invalidateQueries({ queryKey: applicationKeys.adminLists() })
  await queryClient.invalidateQueries({
    queryKey: applicationKeys.adminDetail({ id: applicationId }),
  })
  onOpenChange(false)
  return
}
```

- [ ] **Step 3: 타입 게이트 + 브라우저 시나리오 확인**

Run: `pnpm --filter @ddd/admin typecheck && pnpm lint`

브라우저 (로컬 BE 연동, 테스트 지원서 1건으로):
1. 서류심사대기 → [서류 합격] → 모달에 "서류합격" + 면접 일정 링크 문구 → 확정 (슬롯 없으면 `InterviewSlotsRequiredModal` 노출 확인)
2. 서류합격 → 버튼이 [불합격]·[면접 합격] 인지, [면접 합격] 모달에 **면접합격** 이 표기되는지 — **이번 이슈의 재현 케이스, 최종합격 문구가 나오면 실패**
3. 면접합격 → [최종 합격] → 최종합격 전환 + Discord 문구
4. 최종합격 → [활동중으로 전환] → 이메일 미발송 문구

- [ ] **Step 4: 커밋**

```bash
git add apps/admin/src/pages/applications/components/StatusChangeModal.tsx
git commit -m "fix(admin/applications): 상태 변경 모달 메일 안내 스펙 정합 + 전이 충돌 시 재조회"
```

---

### Task 6: 구현 현황 문서 갱신

**Files:**
- Modify: `docs/admin-implementation-status.md` (§3.3 지원자 상태 표 · 상태 전이 규칙 · 상태 변경 자동화 표)

- [ ] **Step 1: 상태 표에 면접합격 행 추가**

`| 서류합격 | ... |` 행 아래에:

```markdown
| 면접합격 | `면접합격` | 양쪽 | ✅ | ✅ | 2026-08 신규. 서류합격·면접합격의 탈락은 모두 `최종불합격` 으로 수렴 |
```

- [ ] **Step 2: 전이 규칙 코드블록 교체**

```
서류심사대기 → 서류합격 | 서류불합격
서류합격     → 면접합격 | 최종불합격
면접합격     → 최종합격 | 최종불합격
최종합격     → 활동중
활동중       → 활동완료 | 활동중단   (어드민 상세 UI 미노출 — 기수 종료 처리로 일괄 전환)
```

블록 아래에 한 줄 추가: `서버가 전이를 검증하며 위반 시 400 INVALID_STATUS_TRANSITION. FE 는 STATUS_BRANCH 로 동일 규칙을 미러링.`

- [ ] **Step 3: 상태 변경 자동화 표에 면접합격 메일 행 추가**

```markdown
| 면접합격 → 면접전형 합격 안내 이메일 발송 | 백엔드 | ✅ | – | BE: 상태 변경 이벤트로 발송 |
```

- [ ] **Step 4: 커밋**

```bash
git add docs/admin-implementation-status.md
git commit -m "docs(admin): 면접합격 상태 도입 반영 — 상태 표·전이 규칙·메일 자동화"
```

---

## 스코프 밖 (별도 계획 권장)

같은 스펙 문서의 **기수 `activityEndAt` (활동 자동 종료)** 는 독립 서브시스템(`pages/semesters` + `packages/api/src/cohort`)이라 이 계획에 넣지 않았다. 현재 FE 에 `activityEndAt` 참조가 0건이므로 별도 계획으로: ① cohort 타입/쿼리에 필드 추가(gen:api 재생성으로 대부분 해결) ② `SemesterRegisterDrawer` 에 활동 종료일 DatePicker(+ null 로 예약 해제) ③ `INVALID_ACTIVITY_END_DATE`·`ACTIVITY_END_DATE_IN_PAST` 에러 안내 ④ 기수 CLOSED 전환 확인 다이얼로그에 "활동중 지원자 일괄 활동완료 전환, 되돌릴 수 없음" 경고.
