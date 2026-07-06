---
description: "seokit api-scaffold 에이전트로 도메인별 api/types/queryKeys/queries 파일을 생성/최신화"
argument-hint: "[도메인 이름 (선택, 비우면 전체)]"
allowed-tools: Task
---

# API 스캐폴딩

`packages/api/src/generated/api.ts`(openapi-typescript 산출물)를 기반으로 도메인별 API 모듈(`api.ts`, `types.ts`, `queryKeys.ts`, `queries.ts`)의 **변경분만** 생성/최신화한다.

## 동작

`seokit-frontend:api-scaffold` 서브에이전트를 호출한다. 에이전트는 다음을 수행한다:

1. 프로젝트 정찰(`.api-scaffold.json` 캐시) — `packages/api` 4-file 구조, `fetchClient.ts` unwrap 패턴(`{ code, message, data }`) 학습
2. `pnpm gen:api` 로 최신화된 `generated/api.ts` 를 스냅샷 대비 diff
3. 변경된 endpoint/타입만 도메인별 4개 파일에 `Edit` 으로 반영 (신규 도메인만 4파일 최초 생성)
4. 정찰에서 확인한 typecheck 실행

> Phase A(스펙 재생성)는 이 레포의 `pnpm gen:api` 를 단일 출처로 사용한다. 에이전트의 자체 spec-fetch(`scripts/fetch-spec.mjs`)는 사용하지 않는다.

## 입력

- 인자: `$ARGUMENTS`
  - 비어 있으면 `generated/api.ts` 의 모든 변경분 처리
  - 특정 도메인명(예: `cohort`, `application`)이 주어지면 해당 도메인만 처리

## 행동 규칙

- 반드시 `seokit-frontend:api-scaffold` 서브에이전트를 호출하고, 메인 컨텍스트에서 직접 파일을 만들지 않는다
- 기존 도메인 파일을 통째로 덮어쓰지 않는다 — 변경분만 `Edit`
- 실행 후 어떤 파일이 생성/수정/스킵되었는지 한국어로 요약 보고한다
