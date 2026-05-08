# `/status` 스킬 설계

**날짜**: 2026-05-08  
**범위**: `/status` slash command — 어드민 기획 명세 기반 구현 현황 리포트 + 다음 작업 추천

---

## 개요

`/status` 를 입력하면 Claude가 기획 명세(`docs/admin-spec.md`)와 구현 추적 문서(`progress.md`)를 읽고, 핵심 코드 파일을 교차 검증하여 마크다운 리포트를 출력한다.

---

## 구성 요소

### 1. 기획 명세 파일

- **경로**: `docs/admin-spec.md`
- **역할**: 기획 베이스라인. 어드민 3.1~3.5 기능 명세 전문 보관.
- **백엔드 우선 원칙**: 스키마·엔드포인트는 백엔드 구현 상태를 우선으로 따른다.

### 2. 스킬 파일

- **경로**: `~/.claude/skills/status.md`
- **트리거**: `/status` 입력 시 실행
- **역할**: Claude에게 무엇을 읽고, 어떤 순서로 분석하며, 어떤 형식으로 출력할지 지시

### 3. CLAUDE.md 업데이트

`docs/admin-spec.md` 참조 항목과 `/status` 커맨드 설명 추가.

---

## 실행 순서 (스킬 인스트럭션)

| 단계 | 동작 |
|------|------|
| 1 | `docs/admin-spec.md` 읽기 — 기획 베이스라인 파악 |
| 2 | `progress.md` 읽기 — ✅/🔧/⬜ 현황 및 갭 목록 파악 |
| 3 | 아래 고정 핵심 파일 읽기 — 코드 교차 검증 |
| 4 | 마크다운 리포트 출력 |

### 고정 핵심 파일 목록

```
apps/admin/src/pages/index.tsx
  → 라우트 정의 vs 명세 상 라우트 존재 여부 확인

apps/admin/src/pages/applications/components/ApplicationTable.tsx
  → 행 클릭 상세 진입 연결, 합격/불합격 분기 UI 존재 여부

apps/admin/src/pages/reminders/components/RemindersTable.tsx
  → 개별 발송 컬럼, CSV 다운로드 트리거 존재 여부

packages/api/src/cohort/hooks.ts
  → generated 훅 사용 여부 vs 직접 HTTP 클라이언트 잔존

packages/api/src/application/hooks.ts
  → 훅 커버리지 확인

packages/api/src/early-notification/hooks.ts
  → useAdminEarlyNotificationsCsv 훅 존재 여부

packages/api/src/storage/hooks.ts
  → storageListFiles 등 누락 훅 확인

packages/api/src/notification-campaign/
  → 폴더 자체 존재 여부 (생성 필요 여부)
```

---

## 출력 형식

```markdown
# 어드민 구현 현황 — YYYY-MM-DD

## 전체 요약
전체 N개 항목 중 ✅ N / 🔧 N / ⬜ N (완료율 N%)

## 영역별 현황
| 영역              | ✅ | 🔧 | ⬜ | 완료율 |
|-------------------|----|----|----|----|
| 공통 인프라        |    |    |    |    |
| 3.1 기수 관리      |    |    |    |    |
| 3.2 사전 알림      |    |    |    |    |
| 3.3 지원자 관리    |    |    |    |    |
| 3.4 프로젝트 DB    |    |    |    |    |
| 3.5 블로그 DB      |    |    |    |    |
| 4. SEO (web)      |    |    |    |    |

## 코드 검증 결과
progress.md 기재 내용 vs 실제 코드 불일치 항목만 표시.
일치하면 "(검증 통과)" 한 줄로 요약.

## 다음 작업 Top 3 추천
1. **[작업명]** `파일:라인` — 추천 이유 (명세 대비 갭 + 구현 난이도 고려)
2. ...
3. ...
```

---

## 구현 체크리스트

1. `docs/admin-spec.md` 작성 (어드민 기획 명세 3.1~3.5 전문)
2. `~/.claude/skills/status.md` 작성 (스킬 인스트럭션)
3. `CLAUDE.md` 업데이트 — `docs/admin-spec.md` 참조 + `/status` 설명 추가

---

## 결정 사항

- **스킬 범위**: 사용자 글로벌 스킬(`~/.claude/skills/`) — 다른 프로젝트에는 영향 없음
- **파일 목록 관리**: 고정 목록. 새 도메인 추가 시 스킬 파일도 수동 업데이트
- **백엔드 의존 항목**: `progress.md`에 "백엔드 엔드포인트 없음"으로 표기된 항목은 추천 목록에서 제외
