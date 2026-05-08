# 디자인 스펙: 파트 양식 저장 + CSV 다운로드 옵션 팩토리 일원화

**날짜**: 2026-05-08  
**작업 트랙**: A (파트 양식 저장), B (CSV 옵션 팩토리 일원화)  
**PR 단위**: 트랙별 2개 독립 PR — 파일 영역 완전 분리, 의존 관계 없음

---

## 배경 및 핵심 정책 결정

### cohort.applicationForm 은 dead 필드

`cohort.applicationForm` JSON 필드는 BE 구조 검증 없이 저장되며, 지원서 제출·검증 흐름 어디에도 관여하지 않는다. 실제 지원서 검증은 `CohortPart.applicationSchema`(FE 명칭: `formSchema`) 만 읽는다.

**도메인 책임 경계**:
- `cohort` 도메인: "어떤 파트에 어떤 양식이 붙어있는가" (parts 메타) **만** 관리
- `cohort_part`: 양식의 내부 구조(`formSchema`) 책임
- `application` 도메인: `formSchema` 를 읽어 answers 검증 (`ApplicationAnswerValidator`)

→ **파트별 지원서 양식의 single source of truth = `PUT /admin/cohorts/{id}/parts` 를 통한 `CohortPartConfigDto.formSchema`**. POST/PATCH cohort 페이로드의 `applicationForm` 는 이 스펙 이후로 전송하지 않는다.

> 이 정책의 상세 설명은 [docs/admin-cohort-parts-policy.md](../admin-cohort-parts-policy.md) 를 참조한다.

### formSchema JSON 계약

BE `ApplicationAnswerValidator` 가 기대하는 방식 1 (권장):

```json
{
  "questions": [
    { "key": "motivation", "label": "지원 동기를 작성해주세요.", "required": true },
    { "key": "experience", "label": "관련 경험을 작성해주세요.",  "required": false }
  ]
}
```

- `key` 는 answers 제출 시 키로 그대로 쓰임 → **저장 후 변경 금지**
- 의미 있는 slug 사용 권장 (`motivation`, `tech_stack`)
- `required: true` 인 것만 필수 검증

---

## Track A — 파트 양식 저장 (parts 단일 source 마이그레이션)

### 변경 대상 파일

| 파일 | 변경 내용 |
|---|---|
| `apps/admin/src/entities/cohort/model/completion.ts` | ✅ **완료** — `isApplicationFormComplete`(dead 필드) 제거, `isPartsComplete`(cohort.parts 기반) 추가 |
| `apps/admin/src/pages/semesters/types.d.ts` | 폼 타입: `applicationForms: Record<Part, string[]>` → `parts: Record<Part, CohortPartFormState>` |
| `apps/admin/src/entities/cohort/model/serialize.ts` | `applicationForm` 제거, `serializeFormToPartsPayload` 추가, `serializeCohortToForm` 에서 `cohort.parts` 역직렬화 |
| `apps/admin/src/entities/cohort/model/useCreateOrUpdateCohortFlow.ts` | `updateCohortParts` mutation 추가, 단일 try/catch + stage 마커 패턴 |
| `apps/admin/src/pages/semesters/components/SemesterRegisterDrawer/components/ApplicationFormSection.tsx` | UI: `key` Input, `required` Checkbox, `isOpen` Switch 추가 |
| `apps/admin/src/pages/semesters/components/SemesterRegisterDrawer/index.tsx` | `onSwitchToEdit(newCohortId: number)` 콜백 처리 (부분 실패 시 create→edit 전환) |

### 폼 타입 (`types.d.ts`)

```ts
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
  recruitStartDate: string
  recruitEndDate: string
  process: ProcessSchedule
  curriculum: CurriculumWeek[]
  parts: Record<CohortPartName, CohortPartFormState>  // applicationForms 대체
}
```

### 직렬화 (`serialize.ts`)

**신규 함수**:
```ts
export const serializeFormToPartsPayload = (
  form: SemesterRegisterForm,
): PutUpdateCohortPartsRequest => ({
  parts: PARTS.map((name) => ({
    name,
    isOpen: form.parts[name].isOpen,
    formSchema: {
      questions: form.parts[name].questions.map(({ key, label, required }) => ({
        key, label, required,
      })),
    },
  })),
})
```

**수정**:
- `serializeFormToCreatePayload` / `serializeFormToUpdatePayload` 에서 `applicationForm` 제거
- `serializeCohortToForm` 에서 `cohort.parts` → `form.parts` 역직렬화:
  - `cohort.parts` 없거나 비면 → 빈 폼 (각 파트: `isOpen: true`, `questions: [{ key: '', label: '', required: true }]`)
  - `cohort.parts` 있으면 각 part 의 `formSchema.questions` 를 `CohortPartFormState` 로 매핑, 기존 key 보존

### Flow 훅 (`useCreateOrUpdateCohortFlow.ts`)

단일 `try/catch` + `stage` 마커 패턴:

```ts
const submit = async (form) => {
  let stage: 'cohort' | 'parts' = 'cohort'
  let cohortId: number | null = targetId

  try {
    if (mode === 'create') {
      const created = await createMutation.mutateAsync({ payload: serializeFormToCreatePayload(form) })
      cohortId = created.id
      toast.success(`기수 ${created.name}을(를) 등록했습니다`)
    } else {
      if (cohortId == null) { toast.danger('저장할 기수를 찾을 수 없습니다'); return }
      await updateMutation.mutateAsync({ params: { id: cohortId }, payload: serializeFormToUpdatePayload(form) })
    }

    stage = 'parts'
    await updatePartsMutation.mutateAsync({
      params: { id: cohortId! },
      payload: serializeFormToPartsPayload(form),
    })

    if (mode !== 'create') toast.success('기수 정보를 저장했습니다')
    onSuccess?.()
  } catch (error) {
    const description = (error as Error)?.message
    if (stage === 'cohort') {
      toast.danger(mode === 'create' ? '기수 등록에 실패했습니다' : '저장에 실패했습니다', { description })
    } else {
      // parts 단계 실패
      if (mode === 'create') {
        toast.danger('파트 양식 저장에 실패했습니다', {
          description: '수정 화면에서 다시 저장해주세요. (기수는 이미 등록되었습니다)',
        })
        onSwitchToEdit?.(cohortId!)
      } else {
        toast.danger('파트 양식 저장에 실패했습니다', { description })
      }
    }
  } finally {
    queryClient.invalidateQueries({ queryKey: cohortKeys.all })
  }
}
```

**hook Args 타입 추가**:
```ts
interface Args {
  mode: Mode
  targetId: number | null
  onSuccess?: () => void
  onSwitchToEdit?: (newCohortId: number) => void  // 신규: create 부분 실패 시
}
```

`isPending` 에 `updatePartsMutation.isPending` 포함.

### UI (`ApplicationFormSection.tsx`)

각 파트 탭:
- **탭 헤더 영역**: `isOpen` Switch ("이 파트 모집 받기")
- **질문 row**: `key` Input (slug) + `label` TextArea + `required` Checkbox + 삭제 버튼

key 편집 정책:
- **edit/resume 모드에서 `cohort.parts` 로드된 question**: key Input `isReadOnly`
- **새로 추가된 question**: key Input 자유 입력

### 부분 실패 시 create → edit 전환

`SemesterRegisterDrawer` 가 부모로부터 `onSwitchToEdit(newCohortId)` 를 받고:
1. 내부 `mode` 를 `edit` 으로 전환
2. `targetId` 를 `newCohortId` 로 교체
3. 드로어는 열린 채 유지

---

## Track B — CSV 다운로드 옵션 팩토리 일원화

### 문제

`pages/early-notification/lib/downloadEarlyNotificationsCsv.ts` 가
`earlyNotificationAPI.exportAdminCsv()` 를 직접 호출 →
`earlyNotificationQueries.getAdminEarlyNotificationsCsv` 옵션 팩토리 우회.

### 변경 대상 파일

| 파일 | 변경 내용 |
|---|---|
| `pages/early-notification/lib/downloadEarlyNotificationsCsv.ts` | 삭제 |
| `pages/early-notification/lib/triggerCsvDownload.ts` | 신규: BOM + Blob + anchor click 순수 함수 |
| `pages/early-notification/hooks/useDownloadEarlyNotificationsCsv.ts` | 신규: queryClient.fetchQuery 경유 훅 |
| `pages/early-notification/EarlyNotificationContent.tsx` | 훅으로 교체, `isExporting` state 제거 |

### 신규 훅

```ts
// pages/early-notification/hooks/useDownloadEarlyNotificationsCsv.ts

export const useDownloadEarlyNotificationsCsv = () => {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const download = async ({ cohortId, cohortName }: { cohortId: number; cohortName: string }) => {
    setIsExporting(true)
    try {
      const csv = await queryClient.fetchQuery({
        ...earlyNotificationQueries.getAdminEarlyNotificationsCsv({ params: { cohortId } }),
        staleTime: 0,
        gcTime: 0,   // 대용량 문자열 캐시 불필요
      })
      triggerCsvDownload(csv, cohortName)
    } catch (error) {
      toast.danger('CSV 내보내기에 실패했습니다', {
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return { download, isExporting }
}
```

### 순수 함수 (`lib/triggerCsvDownload.ts`)

기존 `downloadEarlyNotificationsCsv.ts` 의 BOM/Blob/anchor 로직을 그대로 이전. 파일명 생성(`formatYyyyMmDd`, `sanitizeFilenameSegment`) 포함.

### `EarlyNotificationContent.tsx` 변경

```ts
// before
const [isExporting, setIsExporting] = useState(false)
const handleExport = async () => { ... }

// after
const { download: handleExport, isExporting } = useDownloadEarlyNotificationsCsv()
```

Toolbar Props 시그니처 무변경.

---

## 에러 처리 요약

| 시나리오 | toast | 이후 동작 |
|---|---|---|
| A — cohort POST 실패 | `danger("기수 등록에 실패했습니다")` | 드로어 유지, 재시도 가능 |
| A — cohort PATCH 실패 | `danger("저장에 실패했습니다")` | 드로어 유지 |
| A — create POST 성공 + PUT parts 실패 | `danger("파트 양식 저장에 실패했습니다 ... 기수는 등록됨")` | 드로어 edit 모드 전환 |
| A — edit PUT parts 실패 | `danger("파트 양식 저장에 실패했습니다")` | 드로어 유지 |
| B — CSV fetchQuery 실패 | `danger("CSV 내보내기에 실패했습니다")` | 버튼 재활성화 |

---

## 병렬 작업 순서 권장

1. **Track B 먼저 머지** (공수 小, 가치 즉시 회수, A 와 의존 없음)
2. **Track A 작업** (공수 大, 명세 핵심 기능)
