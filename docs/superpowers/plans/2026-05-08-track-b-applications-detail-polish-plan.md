# Applications Detail Drawer 폴리싱 (wt-2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `ApplicationDetailDrawer` 에 개인정보 동의 일자 행을 추가하고, 상태 변경 시 `INTERVIEW_SLOTS_NOT_READY` 에러를 별도 안내로 분기하는 두 작업을 단일 PR 로 처리한다.

**Architecture:** `@ddd/api` 의 `ApiError.is()` 타입 가드로 에러 코드 분기. `ApplicationDto` 에 `privacyAgreedAt` 필드를 manual 타입으로 보강(generated 갱신 전 임시). 토스트는 HeroUI v3 `toast.danger(message, { description })` 표준 패턴 사용.

**Tech Stack:** React 19 + TypeScript, TanStack Query, HeroUI v3, `@ddd/api`(orval + manual types).

**관련 spec:** [docs/superpowers/specs/2026-05-08-option-b-parallel-tracks-design.md](../specs/2026-05-08-option-b-parallel-tracks-design.md) §wt-2

---

## File Structure

| 파일 | 변경 책임 |
|------|-----------|
| `packages/api/src/errors.ts` | `INTERVIEW_SLOTS_NOT_READY` ErrorMessageKey 추가 |
| `packages/api/src/application/types.ts` | `ApplicationDto.privacyAgreedAt?: string` 추가 (manual) |
| `apps/admin/src/pages/applications/components/ApplicationDetailDrawer/index.tsx` | 동의 일자 `<InfoRow>` 추가 |
| `apps/admin/src/pages/applications/components/ApplicationDetailDrawer/components/StatusChangeModal.tsx` | catch 블록에서 `error.is("INTERVIEW_SLOTS_NOT_READY")` 분기 + import |
| `progress.md` | 3.3 §개인정보 동의 일시, §INTERVIEW_SLOTS_NOT_READY 항목 갱신 |
| `docs/admin-implementation-status.md` | 갭 #4(슬롯 미준비 안내), #8(동의 일자) FE 상태 갱신 |

작업 영역이 `pages/applications/` 와 `packages/api/src/` 로 한정되어 wt-1 (`pages/semesters/`, `entities/cohort/`) 와 충돌 0.

---

## Task 1: API 패키지 타입 보강

**Files:**
- Modify: `packages/api/src/errors.ts`
- Modify: `packages/api/src/application/types.ts`

- [ ] **Step 1: `INTERVIEW_SLOTS_NOT_READY` 에러 코드 추가**

`packages/api/src/errors.ts` 의 `ErrorMessage` 상수에 항목 1 개 추가. 기존 `INTERVIEW_SLOT_*` 항목 바로 아래에 둔다 (관련 그룹).

```ts
  INTERVIEW_SLOT_NOT_FOUND: "면접 슬롯을 찾을 수 없습니다.",
  INTERVIEW_SLOT_ALREADY_RESERVED: "이미 예약된 면접 슬롯입니다.",
  INTERVIEW_SLOTS_NOT_READY: "면접 슬롯이 준비되지 않았습니다.",
```

- [ ] **Step 2: `ApplicationDto` 에 `privacyAgreedAt` 추가**

`packages/api/src/application/types.ts` 의 `ApplicationDto` 인터페이스에서 `privacyAgreed` 바로 다음 줄에 필드 추가.

```ts
export interface ApplicationDto {
  id: number;
  cohortId: number;
  cohortPartId: number;
  applicantName: string;
  applicantPhone?: string;
  applicantBirthDate?: string;
  applicantRegion?: string;
  answers: Record<string, unknown>;
  status: ApplicationStatus;
  privacyAgreed?: boolean;
  privacyAgreedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

> 참고: `packages/api/src/generated/dddApi.schemas.ts` 는 orval 산출물이라 직접 수정 금지. `application/types.ts` 는 manual 타입 파일이라 자유롭게 보강 가능. 백엔드 OpenAPI 가 `privacyAgreedAt` 노출되면 추후 `pnpm gen:api` 로 generated 동기화 후 manual 필드 정리.

- [ ] **Step 3: 타입 체크**

Run: `pnpm --filter @ddd/api tsc --noEmit`

Expected: PASS (에러 없음)

- [ ] **Step 4: 커밋**

```bash
git add packages/api/src/errors.ts packages/api/src/application/types.ts
git commit -m "feat(api): INTERVIEW_SLOTS_NOT_READY 에러 코드 + ApplicationDto.privacyAgreedAt 추가

- errors.ts: 슬롯 미준비 상태에서 상태 변경 시도 시 BE 가 반환하는 코드
- application/types.ts: 개인정보 동의 일자 필드를 manual 타입으로 보강 (generated 갱신 전)"
```

---

## Task 2: 개인정보 동의 일자 행 추가

**Files:**
- Modify: `apps/admin/src/pages/applications/components/ApplicationDetailDrawer/index.tsx:105-109`

- [ ] **Step 1: `InfoRow` 한 줄 추가**

기존 `InfoRow label="개인정보 동의"` 와 `InfoRow label="현재 상태"` 사이에 동의 일자 행을 끼워 넣는다.

수정 전 (line 105~109):
```tsx
<InfoRow
  label="개인정보 동의"
  value={application.privacyAgreed ? "동의" : "미동의"}
/>
<InfoRow label="현재 상태" value={application.status} />
```

수정 후:
```tsx
<InfoRow
  label="개인정보 동의"
  value={application.privacyAgreed ? "동의" : "미동의"}
/>
<InfoRow
  label="동의 일자"
  value={formatDate(application.privacyAgreedAt)}
/>
<InfoRow label="현재 상태" value={application.status} />
```

기존 `formatDate(iso?: string)` 가 `undefined` 입력 시 `"-"` 반환하므로(line 31~32) BE 응답에 필드 부재해도 회귀 없음.

- [ ] **Step 2: 타입 체크**

Run: `pnpm --filter @ddd/admin tsc --noEmit`

Expected: PASS

- [ ] **Step 3: 브라우저 동작 검증**

Run: `pnpm dev:admin`

검증 절차:
1. `/applications` 진입
2. 임의 지원자 행 클릭 → Drawer 열기
3. "기본 정보" 섹션에서 "개인정보 동의" 행 아래에 "동의 일자" 행이 노출되는지 확인
4. BE 응답에 `privacyAgreedAt` 가 없으면 값이 `"-"` 로 표시되는지 확인

Expected: 행 1 줄 추가 노출, BE 필드 부재 시 `"-"` 폴백.

- [ ] **Step 4: 커밋**

```bash
git add apps/admin/src/pages/applications/components/ApplicationDetailDrawer/index.tsx
git commit -m "feat(admin/applications): 지원자 상세 Drawer 에 개인정보 동의 일자 행 추가

privacyAgreedAt 필드를 formatDate 로 렌더링 — BE 응답 부재 시 \"-\" 폴백."
```

---

## Task 3: `INTERVIEW_SLOTS_NOT_READY` 에러 분기

**Files:**
- Modify: `apps/admin/src/pages/applications/components/ApplicationDetailDrawer/components/StatusChangeModal.tsx:1-3,30-45`

- [ ] **Step 1: `ApiError` import 추가**

수정 전 (line 3):
```ts
import { applicationKeys, applicationMutations } from "@ddd/api"
```

수정 후:
```ts
import { ApiError, applicationKeys, applicationMutations } from "@ddd/api"
```

- [ ] **Step 2: `handleConfirm` catch 블록 분기**

수정 전 (line 30~45):
```ts
const handleConfirm = async () => {
  try {
    await mutateAsync({
      params: { id: applicationId },
      payload: { status: nextStatus as string },
    })
    await queryClient.invalidateQueries({ queryKey: applicationKeys.adminLists() })
    await queryClient.invalidateQueries({
      queryKey: applicationKeys.adminDetail({ id: applicationId }),
    })
    toast.success(`${applicantName} 지원자를 ${label} 처리했어요`)
    onOpenChange(false)
  } catch {
    toast.danger("상태 변경에 실패했어요")
  }
}
```

수정 후:
```ts
const handleConfirm = async () => {
  try {
    await mutateAsync({
      params: { id: applicationId },
      payload: { status: nextStatus as string },
    })
    await queryClient.invalidateQueries({ queryKey: applicationKeys.adminLists() })
    await queryClient.invalidateQueries({
      queryKey: applicationKeys.adminDetail({ id: applicationId }),
    })
    toast.success(`${applicantName} 지원자를 ${label} 처리했어요`)
    onOpenChange(false)
  } catch (error) {
    if (error instanceof ApiError && error.is("INTERVIEW_SLOTS_NOT_READY")) {
      toast.danger("면접 슬롯이 준비되지 않았습니다", {
        description:
          "슬롯 관리 기능 준비 중입니다. 슬롯 등록 후 다시 시도해주세요.",
      })
      return
    }
    toast.danger("상태 변경에 실패했어요", {
      description: error instanceof Error ? error.message : undefined,
    })
  }
}
```

설계 노트:
- `INTERVIEW_SLOTS_NOT_READY` 분기 시 `onOpenChange(false)` 를 호출하지 **않는다**. AlertDialog 가 열린 채로 유지되어 사용자가 다시 시도하거나 취소할 수 있게 함.
- 일반 에러도 description 추가로 메시지 노출 강화 (BE 메시지 그대로 표시되어 디버깅 용이).
- 슬롯 관리 페이지 도입 시 `description` 에 "슬롯 관리로 이동" 링크 또는 별도 AlertDialog 승격 (별도 PR).

- [ ] **Step 3: 타입 체크**

Run: `pnpm --filter @ddd/admin tsc --noEmit`

Expected: PASS

- [ ] **Step 4: 브라우저 동작 검증 (수동)**

Run: `pnpm dev:admin`

검증 절차 (BE 가 `INTERVIEW_SLOTS_NOT_READY` 반환 가능한 환경에서):
1. `/applications` 진입 → "서류심사대기" 상태 지원자 선택
2. Drawer Footer "합격" 클릭 → `StatusChangeModal` 열림
3. AlertDialog 내 "합격" 버튼 클릭 → BE 가 `INTERVIEW_SLOTS_NOT_READY` 반환
4. "면접 슬롯이 준비되지 않았습니다" 토스트 + description 노출 + 모달이 **닫히지 않음** 확인
5. 다른 일반 에러(예: 권한 없음) 발생 시 "상태 변경에 실패했어요" + 에러 message description 노출 확인

만약 로컬 BE 가 해당 코드를 반환하지 않는 환경이면, 임시로 `mutateAsync` 라인을 `throw new ApiError("INTERVIEW_SLOTS_NOT_READY", "test")` 로 한 번만 바꿔 검증 후 원복.

Expected:
- `INTERVIEW_SLOTS_NOT_READY` → 강조 안내 토스트 + 모달 유지
- 그 외 → 일반 에러 토스트 + 모달 닫힘은 발생하지 않음(현 구현은 어차피 catch 블록에서 닫지 않음)

- [ ] **Step 5: 커밋**

```bash
git add apps/admin/src/pages/applications/components/ApplicationDetailDrawer/components/StatusChangeModal.tsx
git commit -m "feat(admin/applications): 상태 변경 시 INTERVIEW_SLOTS_NOT_READY 분기 안내

ApiError.is() 타입 가드로 슬롯 미준비 케이스를 별도 토스트로 분기.
모달은 닫히지 않게 유지 — 사용자가 재시도/취소 선택 가능.
일반 에러도 description 으로 BE 메시지 노출 강화."
```

---

## Task 4: 문서 갱신 + 빌드 최종 검증

**Files:**
- Modify: `progress.md`
- Modify: `docs/admin-implementation-status.md`

- [ ] **Step 1: `progress.md` 갱신**

3.3.3 §지원자 상세 (line 137 부근) 항목 변경:

수정 전:
```
- ⬜ 개인정보 동의 일시 — `privacyAgreedAt` 필드 미렌더링 (BE 응답 포함 여부 확인 필요)
```

수정 후:
```
- ✅ 개인정보 동의 일시 — `ApplicationDetailDrawer/index.tsx` `InfoRow` 로 `privacyAgreedAt` 렌더링 (BE 미응답 시 `formatDate` 폴백 `"-"`)
```

§정밀 갭 §우선순위 Top 3 (line 288~292) 에서 2 번/3 번 항목 제거 또는 처리됨 표기:

수정 전:
```
2. **`StatusChangeModal` `INTERVIEW_SLOTS_NOT_READY` 에러 분기** — 서류합격 시 슬롯 없으면 일반 toast만 표시. 에러 코드 분기 → AlertDialog + 안내 문구로 교체
3. **`개인정보 동의 일자` 표시** — `ApplicationDetailDrawer` 에서 `privacyAgreedAt` 미렌더링. BE 응답 포함 확인 후 `InfoRow` 추가
```

수정 후:
```
2. ~~`StatusChangeModal` `INTERVIEW_SLOTS_NOT_READY` 에러 분기~~ — ✅ 처리됨 (`ApiError.is("INTERVIEW_SLOTS_NOT_READY")` 분기 + 강조 토스트)
3. ~~`개인정보 동의 일자` 표시~~ — ✅ 처리됨 (`InfoRow` `동의 일자` 추가)
```

- [ ] **Step 2: `docs/admin-implementation-status.md` 갱신**

§3.3 지원 DB 관리 §지원자 상세 페이지 (line 158) 항목 변경:

수정 전:
```
| **개인정보 동의 일자 표시** | 양쪽 | ⚠️ | ❌ | FE 상세 Drawer 에 동의 일자 필드 미렌더링 (BE 응답 포함 여부 별도 확인 필요) |
```

수정 후:
```
| **개인정보 동의 일자 표시** | 양쪽 | ⚠️ | ✅ | FE: `ApplicationDetailDrawer` 에 동의 일자 `InfoRow` 추가, BE 응답 부재 시 `"-"` 폴백 |
```

§3.3 §상태 변경 자동화 (line 120) 항목 변경:

수정 전:
```
| **서류합격 시 슬롯 없으면 팝업 안내 → 슬롯 생성 페이지 이동** | 양쪽 | ⚠️ | ❌ | BE: 팝업 없이 `400 INTERVIEW_SLOTS_NOT_READY` 로 상태 변경 거부. FE: `StatusChangeModal` 이 에러 코드 분기 없이 일반 toast 만 표시. 슬롯 생성 페이지 이동 미구현 |
```

수정 후:
```
| **서류합격 시 슬롯 없으면 팝업 안내 → 슬롯 생성 페이지 이동** | 양쪽 | ⚠️ | ⚠️ | BE: `400 INTERVIEW_SLOTS_NOT_READY` 반환. FE: `StatusChangeModal` 이 코드 분기 + 강조 토스트로 안내 (모달 유지). 슬롯 생성 페이지 이동은 슬롯 관리 UI 도입 후 |
```

§미구현/명세 불일치 요약 §#4 (line 199), §#8 (line 203) 두 항목도 동일 흐름으로 갱신:

#4 수정 전:
```
| 4 | 지원 | 서류합격 시 슬롯 없을 때 팝업 안내 | 양쪽 | ⚠️ | ❌ | FE: `StatusChangeModal` 에서 `INTERVIEW_SLOTS_NOT_READY` 에러 코드 분기 → AlertDialog 안내 + 슬롯 생성 페이지 이동 |
```

#4 수정 후:
```
| 4 | 지원 | 서류합격 시 슬롯 없을 때 팝업 안내 | 양쪽 | ⚠️ | ⚠️ | FE: `StatusChangeModal` 에러 코드 분기 + 강조 토스트 적용. 슬롯 생성 페이지 이동은 슬롯 관리 UI 도입 후 (별도 PR) |
```

#8 수정 전:
```
| 8 | 지원 | 개인정보 동의 일자 표시 | 양쪽 | ⚠️ | ❌ | BE: 상세 응답에 `privacyAgreedAt` 포함 확인. FE: `ApplicationDetailDrawer` 에 동의 일자 행 추가 |
```

#8 수정 후:
```
| 8 | 지원 | 개인정보 동의 일자 표시 | 양쪽 | ⚠️ | ✅ | FE: `ApplicationDetailDrawer` 에 동의 일자 `InfoRow` 추가 완료. BE: 상세 응답 `privacyAgreedAt` 포함 여부 확인 남음 |
```

- [ ] **Step 3: 전체 패키지 빌드/타입 체크**

Run: `pnpm --filter @ddd/api tsc --noEmit && pnpm --filter @ddd/admin tsc --noEmit`

Expected: 양쪽 모두 PASS

- [ ] **Step 4: 린트**

Run: `pnpm lint`

Expected: 0 errors (warning 은 기존 수준 유지)

- [ ] **Step 5: 최종 커밋**

```bash
git add progress.md docs/admin-implementation-status.md
git commit -m "docs: ApplicationDetailDrawer 폴리싱 진행 반영

- progress.md §3.3 동의 일시 ⬜→✅, §정밀 갭 Top 3 의 #2/#3 처리 표기
- admin-implementation-status.md §3.3 동의 일자 ❌→✅, 슬롯 미준비 안내 ❌→⚠️ (UI 분기 적용, 페이지 이동은 후속)"
```

---

## PR 생성

**Branch:** `feat/applications-detail-polish` (wt-2 worktree 의 브랜치)

**Base:** `dev/admin`

**Title:** `feat(admin/applications): 지원자 상세 Drawer 폴리싱 — 동의 일자 + 슬롯 미준비 분기`

**Body 템플릿:**
```markdown
## Summary
- `ApplicationDetailDrawer` 에 `privacyAgreedAt` `InfoRow` 추가 (BE 미응답 시 `"-"` 폴백)
- `StatusChangeModal` 의 catch 블록에서 `ApiError.is("INTERVIEW_SLOTS_NOT_READY")` 분기 → 강조 토스트, 모달 유지
- `@ddd/api` 의 `errors.ts` 에 `INTERVIEW_SLOTS_NOT_READY` 코드, `application/types.ts` 에 `privacyAgreedAt?: string` 보강

## Test plan
- [ ] `/applications` 진입 → 임의 지원자 Drawer 에서 "동의 일자" 행 노출 확인
- [ ] 서류심사대기 지원자 합격 처리 → BE `INTERVIEW_SLOTS_NOT_READY` 반환 시 강조 토스트 + 모달 유지 확인
- [ ] 그 외 일반 에러는 기존처럼 "상태 변경에 실패했어요" + description 노출 확인
- [ ] `pnpm --filter @ddd/api tsc --noEmit && pnpm --filter @ddd/admin tsc --noEmit && pnpm lint` 통과
```

---

## 체크리스트 (요약)

- [ ] Task 1: `errors.ts` + `application/types.ts` 보강 (1 commit)
- [ ] Task 2: `ApplicationDetailDrawer/index.tsx` 동의 일자 행 추가 (1 commit)
- [ ] Task 3: `StatusChangeModal.tsx` 에러 분기 (1 commit)
- [ ] Task 4: `progress.md` + `admin-implementation-status.md` 갱신 + 전체 빌드 검증 (1 commit)
- [ ] PR 오픈

총 4 commit / 단일 PR / 영향 파일 6 개. 분량 ~40~60 분.
