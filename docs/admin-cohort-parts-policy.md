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
    { "key": "motivation", "label": "지원 동기를 작성해주세요.", "required": true },
    { "key": "experience", "label": "관련 경험을 작성해주세요.",  "required": false }
  ]
}
```

### key 보존 규칙

- `key` 값은 `POST /api/v1/applications` 의 `answers` 필드 키와 1:1 대응한다.
- 한 번 저장된 key 는 변경하지 않는다. 변경 시 기존 answers 와 매핑이 깨진다.
- FE 에서는 cohort.parts 에서 로드된 question 의 key 를 **readonly** 처리한다.
- 새로 추가된 question 의 key 는 의미 있는 slug 를 사용한다 (`motivation`, `tech_stack`).

## 직렬화 위치

`apps/admin/src/entities/cohort/model/serialize.ts`:

- `serializeFormToCreatePayload` / `serializeFormToUpdatePayload` — `applicationForm` 없음
- `serializeFormToPartsPayload` — `parts: CohortPartConfigDto[]` 생성
- `serializeCohortToForm` — `cohort.parts` → `form.parts` 역직렬화 (기존 key 보존)

## 관련 스펙

[docs/superpowers/specs/2026-05-08-cohort-parts-and-csv-download-design.md](./superpowers/specs/2026-05-08-cohort-parts-and-csv-download-design.md)
