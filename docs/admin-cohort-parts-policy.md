# 기수 파트 양식 정책 (cohort parts policy)

어드민에서 기수(cohort)의 파트별 지원서 양식을 다룰 때 반드시 숙지해야 하는 계약.

---

## cohort.applicationForm 은 dead 필드

`CohortDto.applicationForm` JSON 필드는 BE 구조 검증 없이 저장된다.  
지원서 제출·검증 흐름 어디에도 관여하지 **않는다**.

- 프론트에서 이 필드를 읽거나 쓰지 않는다.
- POST `/admin/cohorts`, PATCH `/admin/cohorts/{id}` 페이로드에서 `applicationForm` 를 **포함하지 않는다**.

## 단일 source of truth

파트별 지원서 양식의 유일한 진원지는 `PUT /admin/cohorts/{id}/parts` 다.

```
흐름: 폼 입력 → serializeFormToPartsPayload() → PUT /admin/cohorts/{id}/parts
역흐름: GET /admin/cohorts/{id} → cohort.parts → serializeCohortToForm() → 폼
```

## 도메인 책임 경계

| 도메인 | 책임 |
|---|---|
| `cohort` | "어떤 파트에 어떤 양식이 붙어있는가" (parts 메타) |
| `cohort_part` | 양식의 내부 구조 (`formSchema`) |
| `application` | `formSchema` 를 읽어 answers 검증 (`ApplicationAnswerValidator`) |

## formSchema JSON 계약

BE `ApplicationAnswerValidator` 가 읽는 형태:

```json
{
  "questions": [
    { "key": "motivation",  "label": "지원 동기를 작성해주세요.", "required": true,  "type": "text" },
    { "key": "experience",  "label": "관련 경험을 작성해주세요.",  "required": false, "type": "text" },
    { "key": "portfolio",   "label": "포트폴리오를 첨부해주세요.", "required": true,  "type": "file" }
  ]
}
```

### type — 입력 유형 (2026-08-16 추가)

`formSchema` 는 자유 형식(jsonb)이고 BE 는 `required` 만 검사한다. 즉 `type` 은 **순수 FE 렌더 힌트**로, 지원서 화면이 어떤 입력 UI 를 띄울지 고르는 데만 쓰인다.

| type | 지원서 UI | `answers[key]` 값 |
| --- | --- | --- |
| `"text"` (기본) | TextArea | 문자열 |
| `"file"` | PDF 업로드 | `{ path, originalName, size }` (업로드 응답 객체 그대로) |

- `type` 이 **없는** 기존 질문은 `"text"` 로 본다. admin `serialize.ts`·web `buildApplyQuestions` 둘 다 `"file"` 이 아닌 값을 전부 `"text"` 로 떨어뜨린다.
- 상수·타입 단일 출처는 `packages/api` 의 `APPLICATION_QUESTION_TYPES` / `ApplicationQuestionType`.

### file 질문의 제출 흐름

첨부는 개인정보라 **다운로드 URL 이 응답에 없다**. `path` 만 오가고, 열람이 필요할 때마다 서명 URL 을 발급받는다(10분 만료 — 캐싱·저장 금지).

```
파일 선택 → POST /applications/attachments → { path, originalName, size }
          → 상태로 보관, 화면엔 originalName 표시
          → 제출/임시저장 시 answers[질문키] = 보관한 객체
열람      → GET /applications/attachments/signed-url?path=... → 새 URL 로 열기
```

- PDF 만 · 최대 20MB · 파일명에 `.pdf` 확장자 필수. FE 도 같은 규칙으로 선업로드 전에 거른다.
- 필수 첨부인데 `path` 가 빈 문자열이면 400 `INVALID_APPLICATION_ANSWERS`. FE 는 첨부가 없으면 키를 아예 싣지 않는다.
- 타인의 `path` 를 넣으면 403 `ATTACHMENT_NOT_OWNED` (중첩 깊이 무관).
- 용량 초과는 400 `FILE_SIZE_EXCEEDED` 와 413 `BAD_REQUEST` 두 갈래로 온다 — `fetchClient` 가 status 413 을 먼저 보고 `FILE_SIZE_EXCEEDED` 로 정규화한다.
- 업로드 즉시 저장되므로 파일을 교체해도 이전 파일은 남는다. 최종 `answers` 에 담긴 것만 유효하다. 첨부는 180일 후 자동 삭제.

### 어드민 열람 경로

지원자용 `GET /applications/attachments/signed-url` 은 업로더 본인에게만 발급되므로 운영진은 쓸 수 없다. 어드민은 기존 스토리지 창구인 **`POST /admin/files/signed-url`** (`action: "read"`) 을 쓴다 — `AttachmentAnswer.tsx` 가 이 경로로 발급받아 새 탭으로 연다.

> **BE 확인 필요**
> `POST /admin/files/signed-url` 의 `path` 는 "카테고리 prefix 로 시작해야 함" 제약이 있고, 현재 카테고리는 `project-thumbnail` / `project-pdf` / `blog-thumbnail` 뿐이다. 첨부 경로(`applications/attachments/...`)가 허용 목록에 없으면 발급이 거부된다.
> BE 에 해당 prefix 허용(+ 운영진 권한 검사)을 요청해둔 상태이며, 허용되면 FE 는 수정 없이 그대로 동작한다.

### key 보존 규칙

- `key` 값은 `POST /api/v1/applications` 의 `answers` 필드 키와 1:1 대응한다.
- 한 번 저장된 key 는 변경하지 않는다. 변경 시 기존 answers 와 매핑이 깨진다.
- FE 에서는 cohort.parts 에서 로드된 question 의 `label` 을 **readonly** 처리해 key↔label 의미 불일치를 원천 차단하고, 카드에 `저장됨: <key>` caption 으로 운영자에게 식별자를 노출한다.
- 새 question 의 key 는 UI 에서 입력하지 않으며, 저장 직전 `serializeFormToPartsPayload` 안에서 `slugify(label)` 결과로 자동 생성한다.
  - 정규화 규칙: `trim → NFC → toLowerCase → [^가-힣a-z0-9_]+ → "_"`
  - 예: `지원 동기` → `지원_동기`, `Tech Stack?` → `tech_stack`, `FE 기술 스택` → `fe_기술_스택`
  - 유틸: `apps/admin/src/shared/lib/slug.ts`

### 클라이언트 검증

저장 직전 `validateFormParts` (`apps/admin/src/pages/semesters/lib/validateParts.ts`) 가 다음을 차단한다:

1. **빈 label** — 어떤 question 의 label 이 trim 후 빈 문자열이면 toast 로 알리고 저장 중단.
2. **part 내부 중복 key** — `key.trim() || slugify(label)` 결과가 같은 part 안에서 충돌하면 toast 로 알리고 저장 중단.

토스트는 `@heroui/react` 의 `toast.danger`, 위반 question 카드에 `border-danger` 강조. 폼 입력이 변경되면 강조는 자동 해제.

## 직렬화 위치

`apps/admin/src/pages/semesters/lib/serialize.ts`:

- `serializeFormToCreatePayload` / `serializeFormToUpdatePayload` — `applicationForm` 없음
- `serializeFormToPartsPayload` — `parts: CohortPartConfigDto[]` 생성
- `serializeCohortToForm` — `cohort.parts` → `form.parts` 역직렬화 (기존 key 보존)

## 관련 스펙

[docs/superpowers/specs/2026-05-08-cohort-parts-and-csv-download-design.md](./superpowers/specs/2026-05-08-cohort-parts-and-csv-download-design.md)
