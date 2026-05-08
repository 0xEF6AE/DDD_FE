# 구현 플랜 — Track A: 파트 양식 저장 (parts 단일 source 마이그레이션)

**브랜치**: `feat/cohort-parts-single-source`  
**스펙**: [docs/superpowers/specs/2026-05-08-cohort-parts-and-csv-download-design.md](../specs/2026-05-08-cohort-parts-and-csv-download-design.md)  
**정책 문서**: [docs/admin-cohort-parts-policy.md](../../admin-cohort-parts-policy.md)  
**예상 소요**: 반나절+  
**전제**: Track B 와 독립. 어느 순서로도 진행 가능.

---

## 의존성 그래프

```
Step 0 (completion.ts)  ← ✅ 완료
Step 1 (types.d.ts)
  ├── Step 2 (serialize.ts)
  │     └── Step 3 (useCreateOrUpdateCohortFlow.ts)
  └── Step 4 (ApplicationFormSection.tsx)
        └── Step 5 (SemesterRegisterDrawer/index.tsx)  ← Step 3 도 선행 필요
```

Step 0 은 완료. Step 3 과 Step 4 는 Step 1·2 완료 후 병렬 가능.

---

## 사전 확인

- [x] `cohortMutations.updateCohortParts()` 가 `packages/api/src/cohort/queries.ts` 에 존재함 (확인 완료)
- [x] `CohortDto.parts?: CohortPartConfig[]` 가 응답에 포함됨 (확인 완료)
- [x] `PutUpdateCohortPartsRequest = { parts: CohortPartConfigDto[] }` 타입 확인 완료
- [x] 현재 `serialize.ts` 가 `recruitStartDate` / `recruitEndDate` 를 사용 중이나 `types.d.ts` 에 없음 → Step 1 에서 함께 추가

---

## Step 1 — 폼 타입 업데이트 (`types.d.ts`)

**파일**: `apps/admin/src/pages/semesters/types.d.ts`

```ts
import type { CohortPartName, CohortStatus } from "@ddd/api"

export type ProcessSchedule = {
  documentAcceptStartDate: string
  documentAcceptEndDate: string
  documentResultDate: string
  interviewStartDate: string
  interviewEndDate: string
  finalResultDate: string
}

export type CurriculumWeek = {
  date: string
  description: string
}

export type CohortPartQuestion = {
  key: string       // 슬러그, 저장 후 변경 금지
  label: string
  required: boolean
}

export type CohortPartFormState = {
  isOpen: boolean
  questions: CohortPartQuestion[]
}

export type SemesterRegisterForm = {
  cohortNumber: string
  status: CohortStatus
  recruitStartDate: string   // types.d.ts 에 누락되었던 필드 추가
  recruitEndDate: string     // types.d.ts 에 누락되었던 필드 추가
  process: ProcessSchedule
  curriculum: CurriculumWeek[]
  parts: Record<CohortPartName, CohortPartFormState>  // applicationForms → parts
}
```

**주의**: `applicationForms` 키를 완전히 제거. `recruitStartDate` / `recruitEndDate` 는 serialize.ts 에서 이미 쓰고 있었으나 타입에 누락된 상태였으므로 함께 추가.

---

## Step 2 — 직렬화 함수 업데이트 (`serialize.ts`)

**파일**: `apps/admin/src/entities/cohort/model/serialize.ts`

### 2-a. `emptyForm()` 수정

`applicationForms` → `parts`:

```ts
const emptyForm = (): SemesterRegisterForm => ({
  cohortNumber: "",
  status: "UPCOMING",
  recruitStartDate: "",
  recruitEndDate: "",
  process: { /* 기존과 동일 */ },
  curriculum: Array.from({ length: 9 }, () => ({ date: "", description: "" })),
  parts: Object.fromEntries(
    PARTS.map((name) => [
      name,
      {
        isOpen: true,
        questions: [{ key: "", label: "", required: true }],
      },
    ]),
  ) as SemesterRegisterForm["parts"],
})
```

### 2-b. `serializeFormToCreatePayload` 수정

`applicationForm` 키 제거:

```ts
export const serializeFormToCreatePayload = (
  form: SemesterRegisterForm,
): CreateCohortRequestDto => ({
  name: buildName(form.cohortNumber),
  recruitStartAt: form.recruitStartDate,
  recruitEndAt: form.recruitEndDate,
  status: form.status,
  process: { ...form.process },
  curriculum: form.curriculum.map((w) => ({ ...w })),
  // applicationForm 제거 (dead 필드)
})
```

### 2-c. `serializeFormToUpdatePayload` 수정

동일하게 `applicationForm` 제거.

### 2-d. `serializeFormToPartsPayload` 신설

```ts
export const serializeFormToPartsPayload = (
  form: SemesterRegisterForm,
): PutUpdateCohortPartsRequest => ({
  parts: PARTS.map((name) => ({
    name,
    isOpen: form.parts[name].isOpen,
    formSchema: {
      questions: form.parts[name].questions.map(({ key, label, required }) => ({
        key,
        label,
        required,
      })),
    },
  })),
})
```

import 추가: `PutUpdateCohortPartsRequest` from `@ddd/api`.

### 2-e. `serializeCohortToForm` 수정

`extractApplicationForms` → `extractParts` 로 교체:

```ts
export const serializeCohortToForm = (cohort: CohortDto): SemesterRegisterForm => {
  const base = emptyForm()
  return {
    cohortNumber: stripSuffix(cohort.name ?? ""),
    status: cohort.status,
    recruitStartDate: cohort.recruitStartAt ?? "",
    recruitEndDate: cohort.recruitEndAt ?? "",
    process: extractProcess(cohort.process) ?? base.process,
    curriculum: extractCurriculum(cohort.curriculum) ?? base.curriculum,
    parts: extractParts(cohort.parts) ?? base.parts,
  }
}
```

`extractParts` 신설:

```ts
const extractParts = (
  raw: unknown,
): SemesterRegisterForm["parts"] | null => {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const result = {} as SemesterRegisterForm["parts"]
  for (const part of PARTS) {
    const found = (raw as CohortPartConfig[]).find((p) => p.name === part)
    if (!found) {
      result[part] = { isOpen: true, questions: [{ key: "", label: "", required: true }] }
      continue
    }
    const rawQuestions = (found.formSchema as Record<string, unknown>)?.questions
    const questions: CohortPartQuestion[] = Array.isArray(rawQuestions)
      ? rawQuestions
          .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
          .map((q) => ({
            key: typeof q.key === "string" ? q.key : "",
            label: typeof q.label === "string" ? q.label : "",
            required: typeof q.required === "boolean" ? q.required : true,
          }))
      : [{ key: "", label: "", required: true }]
    result[part] = {
      isOpen: typeof found.isOpen === "boolean" ? found.isOpen : true,
      questions: questions.length > 0 ? questions : [{ key: "", label: "", required: true }],
    }
  }
  return result
}
```

`extractApplicationForms` 함수 삭제.  
import 추가: `CohortPartConfig`, `CohortPartQuestion` (types.d.ts 에서).

---

## Step 3 — Flow 훅 업데이트 (`useCreateOrUpdateCohortFlow.ts`)

**파일**: `apps/admin/src/entities/cohort/model/useCreateOrUpdateCohortFlow.ts`

변경 사항:
1. `Args` 인터페이스에 `onSwitchToEdit?: (newCohortId: number) => void` 추가
2. `updateCohortParts` mutation 추가
3. `serializeFormToPartsPayload` import
4. 단일 try/catch + stage 마커 패턴으로 교체 (스펙 §A-5 참조)
5. `isPending` 에 `updatePartsMutation.isPending` 포함

```ts
import { serializeFormToCreatePayload, serializeFormToUpdatePayload, serializeFormToPartsPayload } from "./serialize"

interface Args {
  mode: Mode
  targetId: number | null
  onSuccess?: () => void
  onSwitchToEdit?: (newCohortId: number) => void
}

export const useCreateOrUpdateCohortFlow = ({ mode, targetId, onSuccess, onSwitchToEdit }: Args) => {
  const queryClient = useQueryClient()
  const createMutation = useMutation(cohortMutations.createCohort())
  const updateMutation = useMutation(cohortMutations.updateCohort())
  const updatePartsMutation = useMutation(cohortMutations.updateCohortParts())

  const isPending = createMutation.isPending || updateMutation.isPending || updatePartsMutation.isPending

  const submit = async (form: SemesterRegisterForm) => {
    let stage: "cohort" | "parts" = "cohort"
    let cohortId: number | null = targetId

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({ payload: serializeFormToCreatePayload(form) })
        cohortId = created.id
        toast.success(`기수 ${created.name}을(를) 등록했습니다`)
      } else {
        if (cohortId == null) { toast.danger("저장할 기수를 찾을 수 없습니다"); return }
        await updateMutation.mutateAsync({ params: { id: cohortId }, payload: serializeFormToUpdatePayload(form) })
      }

      stage = "parts"
      await updatePartsMutation.mutateAsync({
        params: { id: cohortId! },
        payload: serializeFormToPartsPayload(form),
      })

      if (mode !== "create") toast.success("기수 정보를 저장했습니다")
      onSuccess?.()
    } catch (error) {
      const description = (error as Error)?.message
      if (stage === "cohort") {
        toast.danger(mode === "create" ? "기수 등록에 실패했습니다" : "저장에 실패했습니다", { description })
      } else {
        if (mode === "create") {
          toast.danger("파트 양식 저장에 실패했습니다", {
            description: "수정 화면에서 다시 저장해주세요. (기수는 이미 등록되었습니다)",
          })
          onSwitchToEdit?.(cohortId!)
        } else {
          toast.danger("파트 양식 저장에 실패했습니다", { description })
        }
      }
    } finally {
      queryClient.invalidateQueries({ queryKey: cohortKeys.all })
    }
  }

  return { submit, isPending }
}
```

---

## Step 4 — UI 업데이트 (`ApplicationFormSection.tsx`)

**파일**: `apps/admin/src/pages/semesters/components/SemesterRegisterDrawer/components/ApplicationFormSection.tsx`

변경 핵심:
- `useWatch({ name: "applicationForms" })` → `useWatch({ name: "parts" })`
- `updateQuestion`, `addQuestion`, `removeQuestion` 함수: `applicationForms[part]` → `parts[part].questions`
- 각 파트 탭에 `isOpen` Switch 추가
- 각 질문 row 에 `key` Input + `required` Checkbox 추가
- **edit/resume 모드에서 로드된 question 의 key**: `isReadOnly` 처리

### edit 모드 key readonly 식별

드로어에서 `prefill?.parts[part].questions[i].key !== ""` 이면 기존 question으로 간주, key Input 을 readonly 로.
단, 신규 추가된 question (key 가 빈 값으로 시작) 은 입력 가능.

실제 구현: 폼 초기값 로드 시 기존 key 를 `Set<string>` 으로 부모에서 전달하거나, ApplicationFormSection 내부에서 `useRef` 로 초기 key 셋 기억.
→ **단순화 선택**: `ApplicationFormSection` 이 `useFormContext` 에서 `getValues("parts")` 를 mount 시 한 번만 읽어 기존 key 셋을 `useRef` 에 보존.

```ts
const originalKeysRef = useRef<Set<string>>(
  new Set(
    Object.values(getValues("parts")).flatMap((p) => p.questions.map((q) => q.key)).filter(Boolean)
  )
)
// 렌더링 시: isReadOnly={originalKeysRef.current.has(question.key)}
```

---

## Step 5 — Drawer 업데이트 (`SemesterRegisterDrawer/index.tsx`)

**파일**: `apps/admin/src/pages/semesters/components/SemesterRegisterDrawer/index.tsx`

변경 사항:
1. `Props` 에 `onSwitchToEdit?: (newCohortId: number) => void` 추가
2. `buildDefaults` 에서 `applicationForms` → `parts` 교체:
   ```ts
   parts: Object.fromEntries(
     PARTS.map((name) => [name, { isOpen: true, questions: [{ key: "", label: "", required: true }] }])
   ) as SemesterRegisterForm["parts"]
   ```
   - `PARTS` import 추가 (`@/entities/cohort` 에서)
3. `useCreateOrUpdateCohortFlow` 에 `onSwitchToEdit` 전달:
   ```ts
   const { submit, isPending: isMutating } = useCreateOrUpdateCohortFlow({
     mode,
     targetId,
     onSuccess: () => onOpenChange(false),
     onSwitchToEdit,
   })
   ```

**주의**: `onSwitchToEdit` 는 드로어를 닫지 않고 부모 컴포넌트가 mode/targetId 를 업데이트하는 용도. 부모 (SemestersPage 등) 에서 이 콜백을 구현해야 함 → 드로어 호출부 확인 필요.

---

## Step 6 — 드로어 호출부 확인

`SemesterRegisterDrawer` 를 사용하는 부모 컴포넌트에서 `onSwitchToEdit` 구현:

```ts
// 호출부 예시
<SemesterRegisterDrawer
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  mode={drawerMode}
  targetId={drawerTargetId}
  prefill={drawerPrefill}
  onSwitchToEdit={(newId) => {
    setDrawerMode("edit")
    setDrawerTargetId(newId)
    // 드로어는 열린 채로 유지됨 (onOpenChange 호출 안 함)
  }}
/>
```

호출부 파일 위치 확인 필요 (`grep -rn "SemesterRegisterDrawer"` 로 탐색).

---

## 체크리스트

- [x] Step 0: `completion.ts` — `isApplicationFormComplete` 제거, `isPartsComplete`(cohort.parts 기반) 추가
- [ ] Step 1: `types.d.ts` — `parts` 타입, `recruitStartDate/EndDate` 추가
- [ ] Step 2a: `emptyForm()` — `parts` 구조
- [ ] Step 2b-c: `serializeFormToCreatePayload` / `serializeFormToUpdatePayload` — `applicationForm` 제거
- [ ] Step 2d: `serializeFormToPartsPayload` 신설
- [ ] Step 2e: `serializeCohortToForm` — `extractParts` 로 교체, `extractApplicationForms` 삭제
- [ ] Step 3: `useCreateOrUpdateCohortFlow` — mutation 추가, stage 마커 패턴
- [ ] Step 4: `ApplicationFormSection` — key/required/isOpen UI, key readonly 처리
- [ ] Step 5: `SemesterRegisterDrawer` — `parts` 초기값, `onSwitchToEdit` prop 전달
- [ ] Step 6: 드로어 호출부 `onSwitchToEdit` 구현
- [ ] TypeScript 컴파일 에러 없음 (`pnpm --filter @ddd/admin tsc --noEmit`)
- [ ] 린트 통과 (`pnpm --filter @ddd/admin lint`)
- [ ] **create 흐름**: 기수 등록 → parts 저장 → 성공 toast → 드로어 닫힘
- [ ] **edit 흐름**: 기수 수정 → parts 저장 → 저장 toast → 드로어 닫힘
- [ ] **부분 실패**: create POST 성공 + PUT 실패 → toast + 드로어 edit 모드 전환
- [ ] **역직렬화**: edit 모드 진입 시 기존 parts 로드 확인 (key readonly 포함)
- [ ] **isOpen 토글**: 파트 on/off 후 저장 → parts 응답에 반영 확인
