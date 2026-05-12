# `/status` 스킬 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/status` 커맨드를 입력하면 어드민 기획 명세(`docs/admin-spec.md`) + `progress.md`를 읽고 핵심 코드 파일을 교차 검증하여 영역별 완료율 + 다음 작업 Top 3 추천 마크다운 리포트를 출력한다.

**Architecture:** 글로벌 스킬 파일(`~/.claude/skills/status.md`)이 Claude에게 읽어야 할 파일 목록·분석 순서·출력 형식을 지시한다. 기획 명세는 `docs/admin-spec.md`에 별도 보관하며, `CLAUDE.md`가 두 문서를 모두 참조하도록 업데이트한다.

**Tech Stack:** Claude Code slash commands (skill 파일), Markdown

---

## 파일 구조

| 동작 | 경로 | 역할 |
|------|------|------|
| Create | `docs/admin-spec.md` | 어드민 기획 명세 3.1~3.5 원문 보관 |
| Create | `~/.claude/skills/status.md` | `/status` 스킬 인스트럭션 (git 외부) |
| Modify | `CLAUDE.md` | `docs/admin-spec.md` 참조 + `/status` 설명 추가 |

---

## Task 1: 어드민 기획 명세 파일 작성

**Files:**
- Create: `docs/admin-spec.md`

- [ ] **Step 1: `docs/admin-spec.md` 작성**

```markdown
# 어드민 기능 명세

> 백엔드 스키마·엔드포인트는 백엔드 구현 상태를 우선으로 따른다.
> 이 문서는 기획 베이스라인이며, `/status` 커맨드의 단일 진실 소스로 사용된다.

---

## 3.1 기수 관리

### 3.1.1 기수 상태 정의

| 상태 | 홈페이지 노출 버튼 | 설명 |
|------|--------------------|------|
| 모집예정 | [사전 알림 신청] | 신규 기수 등록 후 모집 전 단계. 이전 기수 프로세스/커리큘럼 표시 |
| 모집중 | [지원 신청] | 현재 기수 모집 진행 중. 현재 기수 프로세스/커리큘럼 표시 |
| 활동중 | [모집 종료] | 모집 완료, 활동 진행 중 |
| 활동종료 | [모집 종료] | 기수 활동 종료 |

> ⚠️ 1개의 기수만 모집예정 또는 모집중 상태일 수 있습니다.

### 3.1.2 기수 목록

| 노출 정보 | 제공 기능 |
|-----------|-----------|
| 기수명 | 상태 수정 |
| 현재 상태 | 기수 등록/수정/상세 이동 |

### 3.1.3 기수 등록/수정/상세

| 필드 | 필수 여부 | 설명 |
|------|-----------|------|
| 기수 | 필수 | 기수명 (예: 14기) |
| 상태 | 필수 | 모집예정 / 모집중 / 활동중 / 활동종료 |
| 모집기간 | 선택 | 모집 시작일 ~ 종료일 |
| 프로세스 | 선택 | 서류접수 ~ 최종발표 각 단계 날짜 |
| 커리큘럼 | 선택 | 1~9주차 일정 (날짜 + 제목) |
| 파트별 지원서 양식 | 선택 (모집중 전환 시 필수) | 파트별 질문 항목 설정 |
| 파트별 면접 슬롯 | 선택 | 파트별 면접 가능 시간 목록 |

### 3.1.4 상태 변경 규칙

- 모집중 전환 조건: 파트별 지원서 양식이 모두 작성된 경우에만 가능
- 모집기간 종료 시 자동으로 활동중 상태로 변경 (수동 변경도 지원)
- 최초 세팅: 13기 → 활동종료 상태로 등록

---

## 3.2 사전 알림 신청 DB 관리

| 항목 | 내용 |
|------|------|
| 저장 데이터 | 사전 신청 기수, 이메일 |
| 이메일 발송 트리거 | 해당 기수의 상태가 모집중으로 변경되는 시점에 자동 발송 |
| 목록 기능 | 기수별 필터, 이메일 목록 조회, CSV 다운로드, 개별 발송 |

> ✅ 기수 상태가 [모집중]으로 변경되는 순간, 해당 기수로 사전 알림 신청한 이메일 전체에 자동 발송.

---

## 3.3 지원 DB 관리

### 3.3.1 지원자 목록

| 노출 정보 | 제공 기능 |
|-----------|-----------|
| 기수, 파트, 이름 | 파트별 필터 |
| 상태 | 상태 변경 (합격/불합격 분기 UI) |
| 면접일자 | 상세페이지 이동 (행 클릭) |

### 3.3.2 지원자 상태 및 자동화 흐름

| 상태 | 전환 시 자동 동작 | 비고 |
|------|------------------|------|
| 서류대기 | – | 지원 접수 초기 상태 |
| 서류불합격 | 불합격 이메일 자동 발송 | |
| 서류합격 | ① 면접 슬롯 없을 시 안내 팝업 → 슬롯 생성 이동 ② 면접 일정 선택 링크 이메일 발송 | 면접 예약 흐름 참고 |
| 최종불합격 | 불합격 이메일 자동 발송 | |
| 최종합격 | 합격 이메일 발송 (Discord OAuth 버튼 포함) → OAuth 완료 시 Discord 서버 자동 초대 | Discord 초대 흐름 참고 |
| 활동중 | – | 최종합격 후 활동 시작 |
| 활동완료 | – | 기수 활동 정상 종료 |
| 활동중단 | – | 중도 이탈 |

### 3.3.3 면접 예약 흐름

| 단계 | 행위자 | 내용 |
|------|--------|------|
| 1 | 관리자 | 서류합격 상태로 변경 |
| 2 | 시스템 | 해당 기수·파트 면접 슬롯 존재 여부 확인 |
| 3 | 시스템 | 슬롯 없으면 안내 팝업 노출 → 슬롯 생성 페이지로 이동 |
| 4 | 시스템 | 면접 일정 선택 페이지 링크를 이메일로 발송 |
| 5 | 지원자 | 링크 접속 → 가능한 시간 선택 → [저장] 클릭 |
| 6-A | 시스템 | 슬롯 중복 감지 시: 새로고침 + "이미 선택된 시간입니다" 안내 |
| 6-B | 시스템 | 슬롯 중복 없을 시: Google Calendar API → Meet 링크 생성 → 캘린더 초대 메일 발송 → DB 저장 |

### 3.3.4 최종합격 – Discord 초대 흐름

| 단계 | 내용 |
|------|------|
| 1 | 관리자가 최종합격 상태로 변경 |
| 2 | 합격 이메일 발송 (Discord 연결 버튼 포함) |
| 3 | 지원자가 버튼 클릭 → Discord OAuth 진행 |
| 4 | OAuth 완료 시 서버가 기수·역할 정보를 동적으로 주입하여 Discord 서버 자동 초대 |
| 5 | 예기치 않은 오류 시 재시도 가능하도록 처리 |

> ⚠️ 지원자가 입력한 이메일과 Discord 계정이 다를 수 있으므로 OAuth 기반으로 Discord 계정을 직접 연동합니다.

### 3.3.5 지원자 상세 페이지

| 노출 정보 | 비고 |
|-----------|------|
| 지원 파트, 이름, 휴대폰번호 (가운데 번호 마스킹) | |
| 생년월일, 거주지역 | |
| 지원서 답변 | 파트별 질문 답변 |
| 제출 일자 | |
| 현재 상태 + 상태 변경 기능 | |
| 개인정보 동의 여부 및 동의 일자 | |

> ⚠️ 개인정보는 일정 수집 기간 이후 자동 파기 정책을 적용합니다.

---

## 3.4 프로젝트 DB 관리

| 항목 | 내용 |
|------|------|
| 목록 노출 정보 | 썸네일, 플랫폼, 서비스명, 한줄 설명, 기수, 참여자수 |
| 등록/수정 필드 | 썸네일, 플랫폼(iOS/AOS/WEB), 서비스명, 한줄 설명, 기수 |
| 참여자 정보 | 이름, 파트, 후기 (복수 입력 가능) |
| 기타 | PDF 업로드 (Phase 2) |

---

## 3.5 블로그 DB 관리

| 항목 | 내용 |
|------|------|
| 목록 노출 정보 | 썸네일, 제목, 본문 일부, 링크, 등록일 |
| 등록/수정 필드 | 썸네일, 제목, 본문 일부, 외부 링크 URL |
```

저장 경로: `docs/admin-spec.md`

- [ ] **Step 2: 파일 존재 확인**

```bash
ls docs/admin-spec.md
```

기대 출력: `docs/admin-spec.md`

- [ ] **Step 3: 커밋**

```bash
git add docs/admin-spec.md
git commit -m "docs: 어드민 기획 명세 파일 추가 (admin-spec.md)"
```

---

## Task 2: `/status` 스킬 파일 작성

**Files:**
- Create: `~/.claude/skills/status.md` (git 외부 — 커밋 불필요)

- [ ] **Step 1: `~/.claude/skills/status.md` 작성**

```markdown
# /status — 어드민 구현 현황 리포트

어드민 기획 명세 대비 구현 현황을 분석하고 다음 작업을 추천한다.

## 실행 순서

### 1단계: 문서 읽기

다음 두 파일을 순서대로 읽는다:

1. `docs/admin-spec.md` — 기획 베이스라인 (3.1 기수 ~ 3.5 블로그 명세 전문)
2. `progress.md` — ✅/🔧/⬜ 기호로 표시된 구현 추적 현황

### 2단계: 코드 교차 검증

다음 파일들을 읽어 progress.md 기재 내용과 실제 코드 상태를 비교한다:

| 파일 | 검증 포인트 |
|------|------------|
| `apps/admin/src/pages/index.tsx` | `/applications/:id` 등 명세 라우트 존재 여부 |
| `apps/admin/src/pages/applications/components/ApplicationTable.tsx` | 행 클릭 → 상세 진입 연결, 합격/불합격 분기 UI |
| `apps/admin/src/pages/reminders/components/RemindersTable.tsx` | 개별 발송 컬럼, CSV 다운로드 트리거 |
| `packages/api/src/cohort/hooks.ts` | generated 훅 사용 여부 (vs 직접 HTTP 클라이언트) |
| `packages/api/src/application/hooks.ts` | 훅 커버리지 |
| `packages/api/src/early-notification/hooks.ts` | `useAdminEarlyNotificationsCsv` 훅 존재 여부 |
| `packages/api/src/storage/hooks.ts` | `storageListFiles`, `storageDeleteFile` 등 누락 훅 |

`packages/api/src/notification-campaign/` 폴더 존재 여부도 Bash `ls packages/api/src/notification-campaign/`로 확인한다.

### 3단계: 리포트 출력

아래 형식의 마크다운 리포트를 출력한다. 오늘 날짜(`currentDate` 컨텍스트 또는 Bash `date`)를 자동으로 삽입한다.

---

# 어드민 구현 현황 — {오늘 날짜}

## 전체 요약
전체 N개 항목 중 ✅ N / 🔧 N / ⬜ N (완료율 N%)
- 완료율 계산: (✅ + 🔧 × 0.5) / 전체 × 100

## 영역별 현황
| 영역 | ✅ | 🔧 | ⬜ | 완료율 |
|------|----|----|----|----|
| 공통 인프라 | | | | |
| 3.1 기수 관리 | | | | |
| 3.2 사전 알림 | | | | |
| 3.3 지원자 관리 | | | | |
| 3.4 프로젝트 DB | | | | |
| 3.5 블로그 DB | | | | |
| 4. SEO (web) | | | | |

## 코드 검증 결과
progress.md 기재 내용 vs 실제 코드 불일치 항목만 표시한다.
모두 일치하면 "검증 통과" 한 줄 요약.

## 다음 작업 Top 3 추천
아래 항목은 제외한다:
- progress.md에 "백엔드 엔드포인트 없음" 명시 항목
- Phase 2로 분류된 항목

추천 기준: 명세 대비 갭 크기 + 외부 의존성 없이 즉시 구현 가능한 항목 우선.

1. **[작업명]** `파일:라인` — 추천 이유
2. **[작업명]** `파일:라인` — 추천 이유
3. **[작업명]** `파일:라인` — 추천 이유
```

저장 경로: `~/.claude/skills/status.md`

- [ ] **Step 2: 파일 존재 및 등록 확인**

```bash
ls ~/.claude/skills/status.md
```

기대 출력: `/home/{user}/.claude/skills/status.md`

---

## Task 3: CLAUDE.md 업데이트

**Files:**
- Modify: `CLAUDE.md` (line 23 근처 — `progress.md` 참조 블록)

- [ ] **Step 1: CLAUDE.md의 참조 블록에 `admin-spec.md` + `/status` 줄 추가**

현재 `CLAUDE.md:23-25` 내용:
```markdown
> 기능 명세 대비 구현 체크리스트는 **[progress.md](./progress.md)** 를 참조한다.
>
> admin 프로젝트의 UI 컴포넌트를 생성 / 수정 / 삭제하는 작업 전에는 **[docs/hero-ui.txt](./docs/hero-ui.txt)** 를 먼저 참조하여 사용 가능한 HeroUI v3 컴포넌트와 사용법을 확인한다.
```

교체 후:
```markdown
> 기능 명세 대비 구현 체크리스트는 **[progress.md](./progress.md)** 를 참조한다.
>
> 어드민 기획 원문 명세는 **[docs/admin-spec.md](./docs/admin-spec.md)** 를 참조한다. `/status` 커맨드를 실행하면 이 명세와 `progress.md`, 핵심 코드 파일을 교차 분석하여 영역별 완료율 + 다음 작업 Top 3를 리포트한다.
>
> admin 프로젝트의 UI 컴포넌트를 생성 / 수정 / 삭제하는 작업 전에는 **[docs/hero-ui.txt](./docs/hero-ui.txt)** 를 먼저 참조하여 사용 가능한 HeroUI v3 컴포넌트와 사용법을 확인한다.
```

- [ ] **Step 2: 변경 확인**

```bash
grep -n "admin-spec\|/status" CLAUDE.md
```

기대 출력: `admin-spec.md` 와 `/status` 가 언급된 라인 번호 출력.

- [ ] **Step 3: 커밋**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md에 admin-spec.md 참조 및 /status 커맨드 설명 추가"
```

---

## Task 4: 동작 검증

- [ ] **Step 1: Claude Code에서 `/status` 실행**

새 대화를 열고 `/status` 를 입력한다.

기대 동작:
1. `docs/admin-spec.md` 읽기 시작 (파일 읽기 허가 요청 또는 자동 진행)
2. `progress.md` 읽기
3. 고정 코드 파일 8개 읽기
4. 마크다운 리포트 출력 — "# 어드민 구현 현황 — YYYY-MM-DD" 헤더 포함

- [ ] **Step 2: 리포트 품질 확인**

다음 항목이 리포트에 포함되어 있는지 확인한다:
- [ ] 영역별 현황 테이블 (7개 영역 모두 행 존재)
- [ ] 코드 검증 결과 섹션 (불일치 또는 "검증 통과")
- [ ] 다음 작업 Top 3 (각 항목에 `파일:라인` 참조 포함)
- [ ] 백엔드 의존 항목(개별 발송 등)이 Top 3에서 제외됨
