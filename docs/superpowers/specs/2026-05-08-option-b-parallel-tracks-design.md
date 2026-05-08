# 디자인 — 옵션 B: 2 worktree 병렬 트랙 (wt-1 Track A / wt-2 Applications 폴리싱)

**작성일**: 2026-05-08
**관련 문서**:
- [progress.md](../../../progress.md) §정밀 갭 — 우선순위 Top 3
- [docs/admin-implementation-status.md](../../admin-implementation-status.md) §미구현 갭 #1, #4, #8
- [docs/superpowers/specs/2026-05-08-cohort-parts-and-csv-download-design.md](./2026-05-08-cohort-parts-and-csv-download-design.md) — Track A 의 원본 설계
- [docs/superpowers/plans/2026-05-08-track-a-cohort-parts-plan.md](../plans/2026-05-08-track-a-cohort-parts-plan.md) — Track A Step 1~6 구현 플랜

---

## 목적

`/progress` 가 산출한 다음 작업 Top 3 를 단일 세션 안에서 2 개 worktree 로 동시 진행해 처리량을 극대화한다.

| # | 작업 | 영역 | 분량 | worktree |
|---|------|------|------|----------|
| 1 | `useUpdateCohortParts` 연결 (Track A) | `pages/semesters/`, `entities/cohort/` | 반나절+ | wt-1 |
| 2 | `INTERVIEW_SLOTS_NOT_READY` 에러 분기 | `applications/.../StatusChangeModal.tsx` | ~30분 | wt-2 |
| 3 | `privacyAgreedAt` 표시 | `applications/.../ApplicationDetailDrawer/index.tsx` | ~5분 | wt-2 |

---

## 구조

```
main (dev/admin)
├── wt-1: feat/cohort-parts-single-source   ← Track A
└── wt-2: feat/applications-detail-polish   ← Task 2 + Task 3 단일 PR
```

작업 영역이 `semesters/` vs `applications/` 로 완전 분리되어 있어 머지 충돌 가능성이 사실상 0. 두 worktree 는 동시 시작.

---

## wt-1 — Track A: useUpdateCohortParts 연결

### 기준

- **원본 spec**: [`2026-05-08-cohort-parts-and-csv-download-design.md`](./2026-05-08-cohort-parts-and-csv-download-design.md)
- **구현 plan**: [`2026-05-08-track-a-cohort-parts-plan.md`](../plans/2026-05-08-track-a-cohort-parts-plan.md) (Step 0 완료, Step 1~6 진행)

### 변경 파일

1. `apps/admin/src/pages/semesters/types.d.ts` — `parts` 타입 + `recruitStartDate/EndDate` 추가
2. `apps/admin/src/entities/cohort/model/serialize.ts` — `applicationForm` 제거, `serializeFormToPartsPayload` 신설, `extractParts` 도입
3. `apps/admin/src/entities/cohort/model/useCreateOrUpdateCohortFlow.ts` — `cohortMutations.updateCohortParts()` 추가, stage 마커 패턴
4. `apps/admin/src/pages/semesters/components/SemesterRegisterDrawer/components/ApplicationFormSection.tsx` — key/required/isOpen UI, key readonly 처리
5. `apps/admin/src/pages/semesters/components/SemesterRegisterDrawer/index.tsx` — `parts` 초기값, `onSwitchToEdit` prop 전달
6. `apps/admin/src/pages/semesters/SemestersPage.tsx` (혹은 호출부) — `onSwitchToEdit` 구현

### 부분 실패 처리 패턴 (Step 3 / 5 결정)

흐름 훅 (`useCreateOrUpdateCohortFlow`) 의 부분 실패 (cohort 는 만들어졌으나 parts 저장 실패) 처리는 **B 안: throw + 호출부 catch** 채택.

- 흐름 훅의 `Args` 에서 `onSuccess` / `onSwitchToEdit` 콜백 모두 제거 — 흐름 훅은 mutation 합성 + 부분 실패 시그널만 책임
- 부분 실패 시 `PartsSaveAfterCreateError(newCohortId, cause)` throw — 의미가 타입 자체에 명시되고 `newCohortId` 가 보장 필드
- 토스트·드로어 닫기·모드 전환 등 UI 부수효과는 모두 호출부 (`SemesterRegisterDrawer.onSubmit`) 의 try/catch 안에서 처리
- mode 별 흐름 훅 분리 (`useCreateCohortRegistration` / `useUpdateCohortRegistration`) 는 호출부가 1 개인 현 시점에서는 분리 비용이 가치를 못 만들어 보류 — 호출부가 분화되면 재검토 (CODE_RULES §3.3 흐름 훅 SRP)

### Step 6 (`onSwitchToEdit`) 호출부 처리

`SemesterRegisterDrawer` 를 사용하는 부모 컴포넌트(`SemestersPage` 등) 에서 `onSwitchToEdit` prop 구현. 의미는 "create 흐름에서 parts 저장 실패 시 → 부모가 mode/targetId 를 edit 으로 전환, 드로어는 열린 채 유지" 한 가지로 한정. worktree 진입 직후 호출부 파일 직접 확인하고 단순한 setter 호출로 마감.

### PR 단위

1 개 (Track A Step 1~6 일괄)

---

## wt-2 — Applications 폴리싱: Task 2 + Task 3 단일 PR

### Task 3 — `privacyAgreedAt` 표시

**파일**: `apps/admin/src/pages/applications/components/ApplicationDetailDrawer/index.tsx`

**변경 위치**: 105 행 `<InfoRow label="개인정보 동의" ... />` 바로 아래

**변경 내용**:
```tsx
<InfoRow
  label="동의 일자"
  value={formatDate(application.privacyAgreedAt)}
/>
```

**가드**:
- 기존 `formatDate` 가 `undefined` 입력 시 `"-"` 반환 (line 31~32) — BE 응답에 필드 부재해도 회귀 없음
- `ApplicationDto` 타입에 `privacyAgreedAt?: string` 가 있는지 진입 직후 확인. 없으면 `(application as { privacyAgreedAt?: string }).privacyAgreedAt` 임시 캐스팅 + 추후 `@ddd/api` 갱신.

### Task 2 — `INTERVIEW_SLOTS_NOT_READY` 에러 분기

**파일**: `apps/admin/src/pages/applications/components/ApplicationDetailDrawer/components/StatusChangeModal.tsx`

**변경 내용**:
- 상태 변경 mutation 의 `onError` 콜백에서 BE 에러 코드 추출
- `code === "INTERVIEW_SLOTS_NOT_READY"` 분기:
  - 현재 단계: 일반 `toast.error(...)` 대신 강조 메시지 toast 로 "면접 슬롯이 준비되지 않았습니다. 슬롯 관리 기능 준비 중입니다." 안내 (슬롯 페이지 미구현으로 사용자가 즉시 취할 액션이 없음 → AlertDialog 까지는 과함)
  - 다음 단계 (슬롯 관리 페이지 도입 시): HeroUI `AlertDialog` 로 승격 + "슬롯 관리로 이동" 버튼 추가 (별도 PR)
- 그 외 에러 코드는 기존 동작 유지

**prop 시그니처 변경 없음** → 호출부 `ApplicationDetailDrawer/index.tsx:148-156` 와 머지 충돌 0.

**에러 코드 추출 패턴**:
- 어드민 표준 에러 인터셉터에서 `error.code` 또는 `error.response?.data?.code` 어느 쪽이 노출되는지 진입 직후 확인 (`packages/api/src/client/...` 또는 기존 사용 사례 grep). 표준 패턴 그대로 따름.

### PR 단위

1 개 (Task 2 + Task 3 일괄, 동일 Drawer 영역)

---

## 머지 / 동기화 전략

```
시점 0 ─ wt-1, wt-2 병렬 시작
시점 1 ─ wt-2 PR 오픈 (~40분 후)
시점 2 ─ wt-2 머지
시점 3 ─ wt-1 의 base 를 dev/admin 으로 rebase (충돌 0 예상)
시점 4 ─ wt-1 PR 오픈
시점 5 ─ wt-1 머지
```

작업 디렉토리가 `semesters/` vs `applications/` 로 완전 분리. `progress.md` 갱신만 양쪽 PR 에 모두 들어가므로 마지막 머지 측에서 1 줄 충돌 가능성 → 그 PR 에서 통합 후 push.

---

## 리스크 및 폴백

| 리스크 | 폴백 |
|--------|------|
| wt-1 Step 6 호출부 결정 지연 | 디폴트(수동) 채택, 자동화는 후속 PR |
| BE 응답에 `privacyAgreedAt` 부재 | `formatDate(undefined) → "-"` 폴백, 회귀 없음 |
| BE 에러 응답에 `code` 필드 부재 | message 패턴 매칭으로 fallback (`"INTERVIEW_SLOTS_NOT_READY"` 문자열 포함 검사) |
| `progress.md` 충돌 | 마지막 머지 측에서 통합 |

---

## 완료 기준

- [ ] wt-2 PR 머지 → `ApplicationDetailDrawer` 에 동의 일자 행 노출 + 슬롯 미준비 에러 안내 분기 적용
- [ ] wt-1 PR 머지 → `SemesterRegisterDrawer` 등록/수정 시 파트 양식이 `PUT /admin/cohorts/{id}/parts` 로 저장됨 (`useCreateOrUpdateCohortFlow` 연동)
- [ ] `progress.md` 갱신 — 3.1.2 파트 양식 🔧→✅, 3.3.3 동의 일시 ⬜→✅, 3.3 슬롯 안내 ❌→⚠️
- [ ] `pnpm --filter @ddd/admin tsc --noEmit` 통과
- [ ] 두 worktree 정리 (`git worktree remove`)
