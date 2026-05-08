# Handoff — 2026-05-08

> 다른 컴퓨터로 옮겨서 이어갈 작업 컨텍스트.
> CLAUDE.md 의 "세션 복기" 절차에 따라 새 세션 시작 시 자동 읽힘.

## 브랜치 / 워크트리 상태

| 위치 | 브랜치 | 상태 |
|------|--------|------|
| 부모 (`/home/wchang101/projects/DDD_FE`) | `dev/admin` | `68ca160` 까지 origin 동기화 완료 |
| `.worktrees/track-b` | `feat/applications-detail-polish` | 4 commit 완료, **push/PR 미진행** |
| `.worktrees/track-a` | `feat/cohort-parts-single-source` | **빈 상태** (subagent 가 분석만 하고 stop) |

**worktree 디렉토리 자체는 push 되지 않으니 다른 컴퓨터에서 다시 만들어야 한다.** `.worktrees/` 는 `.gitignore` 에 등록됨 (커밋 `68ca160`).

## 완료된 작업

### 1. 디자인·플랜 문서 (`dev/admin` 에 commit + push 완료)

- `27dbd43` — spec: 옵션 B 병렬 트랙 디자인 (`docs/superpowers/specs/2026-05-08-option-b-parallel-tracks-design.md`)
- `9a450e6` — Track A plan 갱신 (Step 3 부분 실패 처리를 B 안 = `PartsSaveAfterCreateError` throw + 호출부 catch)
- `6a2507c` — Track B plan 신설 (`docs/superpowers/plans/2026-05-08-track-b-applications-detail-polish-plan.md`)
- `68ca160` — `.gitignore` 에 `.worktrees/` 추가

### 2. Track B 코드 작업 (worktree `feat/applications-detail-polish` 의 로컬 commit 4 개, **아직 push 안 됨**)

- `6a187f1` — Task 1: `INTERVIEW_SLOTS_NOT_READY` ErrorMessageKey 추가 + `ApplicationDto.privacyAgreedAt?: string` 보강
- `929a833` — Task 2: `ApplicationDetailDrawer` 에 동의 일자 `InfoRow` 추가
- `c31d6be` — Task 3: `StatusChangeModal` 의 catch 블록에서 `ApiError.is("INTERVIEW_SLOTS_NOT_READY")` 분기 + 강조 토스트 (모달 유지)
- `f4509e8` — Task 4: `progress.md` + `docs/admin-implementation-status.md` 갱신

`pnpm --filter @ddd/api tsc --noEmit` / `pnpm --filter @ddd/admin tsc --noEmit` 둘 다 PASS. `pnpm lint` 는 사용자 중단으로 미실행.

## 미완료 / 다음에 할 일

### 즉시 할 일 (Track B 마무리)

1. **Track B 의 4 commit 을 origin 에 push 하고 PR 생성**:
   ```
   git push -u origin feat/applications-detail-polish
   gh pr create --base dev/admin --title "feat(admin/applications): 지원자 상세 Drawer 폴리싱 — 동의 일자 + 슬롯 미준비 분기" --body "..."
   ```
   (PR body 는 `docs/superpowers/plans/2026-05-08-track-b-applications-detail-polish-plan.md` 의 §PR 생성 템플릿 그대로 사용.)
2. **`pnpm lint` 실행**해서 추가 오류 없는지 검증 (지금 환경에서 사용자가 reject 함).

### 그 다음 (Track A 본격 작업)

1. Track A worktree 새로 생성:
   ```
   git worktree add .worktrees/track-a -b feat/cohort-parts-single-source dev/admin
   ```
   *(worktree 가 이미 있으면 `git worktree remove` 후 재생성. 빈 브랜치 `feat/cohort-parts-single-source` 가 origin 에 없는지 확인.)*
2. `cd .worktrees/track-a && pnpm install`
3. `cp -r ../../packages/api/src/generated packages/api/src/generated` *(또는 `pnpm gen:api`)* — `generated/` 가 gitignored 라 worktree 마다 별도로 둬야 한다.
4. `docs/superpowers/plans/2026-05-08-track-a-cohort-parts-plan.md` 의 **Step 1 ~ Step 6** 순서대로 적용.
   - Step 0 (`completion.ts`) 은 이미 dev/admin 에 머지됨 → 건드리지 말 것.
   - Step 3 의 핵심: `useCreateOrUpdateCohortFlow` 가 `PartsSaveAfterCreateError` throw, 호출부 (Drawer onSubmit) 가 try/catch + instanceof 분기. 콜백 (`onSuccess`, `onSwitchToEdit`) 을 훅 인자에 넣지 말 것.
   - Step 6: 호출부에서 `onSwitchToEdit` prop 구현 — 단순한 `setEditTarget({ id: newCohortId })` setter 호출.
5. `pnpm --filter @ddd/admin tsc --noEmit && pnpm lint` PASS 확인.
6. `git push -u origin feat/cohort-parts-single-source` + `gh pr create`.

### 머지 순서 (옵션 B 디자인 그대로)

1. Track B PR 머지 (작은 변경, 리뷰 빠름)
2. Track A 의 base 를 `dev/admin` 으로 rebase (충돌 0 예상 — `applications/` vs `semesters/` 분리)
3. Track A PR 머지

## 핵심 결정 사항 (다른 컴퓨터에서 잊지 말 것)

- **흐름 훅 분리는 보류**: `useCreateOrUpdateCohortFlow` 를 `useCreateCohortFlow` + `useUpdateCohortFlow` + 합성 훅 으로 쪼개는 안은 wrapper hook 정책 위반 위험 + 중복 토스트 문제로 거부됨. 현 단일 훅 구조 유지하고 부분 실패만 throw 패턴으로 정리.
- **부분 실패 시그널**: `PartsSaveAfterCreateError` (커스텀 Error 클래스, `newCohortId` 필드 보유) 를 던져 호출부가 instanceof 로 분기. 콜백 주입 패턴은 사용 금지.
- **CODE_RULES §3.3 #5 wrapper hook 금지**: `cc28e92` 에서 이미 wrapper hook 9 개 제거. 흐름 훅 안에서도 옵션 팩토리 (`xxxQueries.method`, `xxxMutations.method`) 만 사용.

## 다른 컴퓨터에서 처음 할 일 (체크리스트)

1. ☐ `git clone https://github.com/DDD-Community/DDD_FE.git` (없다면) 또는 기존 클론에서 `git fetch --all`
2. ☐ `git checkout dev/admin && git pull`
3. ☐ `pnpm install` (root)
4. ☐ `pnpm gen:api` 또는 백엔드 OpenAPI 가져와서 `packages/api/src/generated/` 채우기
5. ☐ Track B 의 push 가 안 됐는지 확인 (`git ls-remote --heads origin feat/applications-detail-polish`). 이 머신에는 Track B 의 4 commit 이 로컬에만 있으므로 **이전 머신에서 push 하지 않았다면 사라진다**. 만약 미푸시 상태로 다른 머신 이동했다면 Track B 작업 다시 해야 함 (plan 따라 30~40 분 분량).
6. ☐ Track A worktree 만들기 (위 §그 다음 §1)
7. ☐ Track A plan 진행 (위 §그 다음 §4)

## 참고 파일

- 디자인: `docs/superpowers/specs/2026-05-08-option-b-parallel-tracks-design.md`
- Track A plan: `docs/superpowers/plans/2026-05-08-track-a-cohort-parts-plan.md`
- Track B plan: `docs/superpowers/plans/2026-05-08-track-b-applications-detail-polish-plan.md`
- 코드 규칙: `CODE_RULES.md` (§3.3 흐름 훅 SRP)
