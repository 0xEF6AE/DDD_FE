# 어드민 기능 구현 현황

> 기준일: 2026-05-08
> 기준 문서: 어드민 기능 명세서 v1 (3.1 ~ 3.5)
> 백엔드: 별도 레포 (스키마·엔드포인트는 백엔드 구현 상태를 우선으로 따른다)
> 프론트엔드: `apps/admin` (이 레포)

---

## 범례

| 기호 | 의미 |
|------|------|
| ✅ | 구현 완료 |
| ⚠️ | 부분 구현 또는 명세와 다르게 구현 |
| ❌ | 미구현 |
| – | 해당 영역에서 처리 대상 아님 |

**처리 주체**: 항목을 구현해야 하는 쪽 (백엔드 / 프론트엔드 / 양쪽).
**비고**: 구현 위치, 관련 파일·엔드포인트, 명세와의 차이점.

---

## 3.1 기수 관리

### 상태 정의

| 명세 상태 | 실제 enum 값 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-------------|-----------|--------|-----------|------|
| 모집예정 | `UPCOMING` | 양쪽 | ✅ | ✅ | FE: `entities/cohort/model/statusFlow.ts` `STATUS_LABEL` |
| 모집중 | `RECRUITING` | 양쪽 | ✅ | ✅ | |
| 활동중 | `ACTIVE` | 양쪽 | ✅ | ✅ | |
| 활동종료 | `CLOSED` | 양쪽 | ✅ | ✅ | |

### 기능 목록

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 기수 등록 / 수정 / 삭제 / 목록 조회 | 양쪽 | ✅ | ✅ | BE: `POST/PATCH/DELETE/GET /admin/cohorts`. FE: `pages/semesters/SemestersPage.tsx` + `SemesterRegisterDrawer` + `DeleteCohortDialog` |
| 1개 기수만 모집예정·모집중 가능 제약 | 백엔드 | ✅ | ⚠️ | BE: 위반 시 `409 COHORT_ALREADY_EXISTS`. FE: 사전 가드 UI 없이 에러 toast 만 표시 |
| 모집기간 종료 시 자동으로 활동중 전환 | 백엔드 | ✅ | – | `CohortScheduler` 매일 자정 실행 |
| 모집예정 → 모집중 자동 전환 (recruitStartAt 도달) | 백엔드 | ✅ | – | `CohortScheduler.transitionUpcomingToRecruiting()` |
| 수동 상태 전환 (모집예정→모집중→활동중→활동종료) | 양쪽 | ✅ | ✅ | FE: `useTransitionCohortStatusFlow.ts` + `SemesterTableRow` "다음 단계 전환" 버튼 |
| 파트별 지원서 양식 설정 | 양쪽 | ✅ | ✅ | BE: `PUT /admin/cohorts/:id/parts` 단일 source. FE: `ApplicationFormSection` 에 key Input + label TextArea + required Checkbox + isOpen Switch. 저장된 key 는 readonly. `useCreateOrUpdateCohortFlow` 가 create/update 후 `updateCohortParts` 호출, 부분 실패는 `PartsSaveAfterCreateError` throw → 호출부 edit 모드 전환 |
| 파트별 면접 슬롯 설정 | 양쪽 | ✅ | ✅ | BE: `InterviewSlot` 도메인 분리. FE: `/interview-slots` 신설 페이지 + `InterviewSlotRegisterDrawer` (등록/수정 통합, 수정 모드는 기수/파트 readonly) + `DeleteInterviewSlotDialog` |
| process / curriculum / parts JSON 필드 | 양쪽 | ✅ | ✅ | FE: `ProcessSection` / `CurriculumSection` / `ApplicationFormSection` — `cohort.applicationForm` 은 dead 필드로 제거, 양식은 `cohort.parts` 단일 source ([정책](./admin-cohort-parts-policy.md)) |
| **모집중 전환 조건: 파트별 지원서 양식 필수 검증** | 양쪽 | ❌ | ✅ | BE: 검증 미구현. FE: `useTransitionCohortStatusFlow` 가 RECRUITING 분기에서 `validateCohortPartsForRecruiting` 호출 — `isOpen=true` 파트 0개이거나 그 중 `formSchema.questions` 가 비면 `TransitionBlockedDialog` 노출 → "수정 화면 열기" 시 해당 cohort edit Drawer 자동 오픈 |

---

## 3.2 사전 알림 신청 DB 관리

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 기수 + 이메일 저장 | 백엔드 | ✅ | – | BE: `EarlyNotification` 엔티티. (사용자 입력은 `apps/web` 영역) |
| 기수 미지정 대기열 신청 | 백엔드 | ✅ | – | `GeneralEarlyNotification` — 기수 생성 시 자동 승격 |
| 기수별 목록 조회 | 양쪽 | ✅ | ✅ | BE: `GET /admin/early-notifications?cohortId=`. FE: `pages/early-notification/EarlyNotificationDataView.tsx` |
| 검색 / 상태 필터 (전체·대기·발송완료) | 프론트엔드 | – | ✅ | FE: `EarlyNotificationToolbar` + 클라이언트 필터링 |
| 통계 카드 (전체/대기/발송완료) | 프론트엔드 | – | ✅ | FE: `EarlyNotificationStatsSection.tsx` |
| CSV 내보내기 | 양쪽 | ✅ | ✅ | BE: `GET /admin/early-notifications/export`. FE: `pages/early-notification/hooks/useDownloadEarlyNotificationsCsv.ts` + `lib/triggerCsvDownload.ts` |
| **기수 상태 → 모집중 변경 시 자동 이메일 발송** | 양쪽 | ⚠️ | ✅ | BE: 상태 변경 트리거 없음, `NotificationCampaign`(scheduledAt) 방식으로 우회 구현. FE: `NotificationCampaignSection` (`pages/early-notification/components/`) 으로 캠페인 목록·편집·PAUSED↔SCHEDULED 토글 제공. 운영자가 본문·시각을 손본 뒤 SCHEDULED 로 풀면 백엔드 스케줄러가 자동 발송. 즉시 발송이 필요할 때는 기존 `EarlyNotificationBulkSendDrawer` 사용 |

### NotificationCampaign 동작 방식 (현재 구현)

```
기수 생성
  → 기본 캠페인 자동 생성 (PAUSED, scheduledAt = recruitStartAt)
  → 관리자가 PAUSED → SCHEDULED 수동 전환
  → scheduledAt 도달 시 스케줄러가 자동 발송
```

> 두 가지 발송 흐름이 공존한다:
> - **즉시 일괄 발송** (`EarlyNotificationBulkSendDrawer` → `useSendBulkEarlyNotification`) — 예외 상황용
> - **예약 발송 캠페인** (`NotificationCampaignSection` → `useUpdateCampaignFlow` / `useToggleCampaignScheduleFlow`) — 평상시. PAUSED 캠페인을 SCHEDULED 로 풀면 백엔드 스케줄러가 `scheduledAt` 도달 시 자동 발송

---

## 3.3 지원 DB 관리

### 지원자 상태

| 명세 상태 | 실제 enum 값 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-------------|-----------|--------|-----------|------|
| 서류대기 | `서류심사대기` | 양쪽 | ✅ | ✅ | FE: `entities/application/model/constants.ts` `ApplicationStatus` |
| 서류불합격 | `서류불합격` | 양쪽 | ✅ | ✅ | |
| 서류합격 | `서류합격` | 양쪽 | ✅ | ✅ | |
| 최종불합격 | `최종불합격` | 양쪽 | ✅ | ✅ | |
| 최종합격 | `최종합격` | 양쪽 | ✅ | ✅ | |
| 활동중 | `활동중` | 양쪽 | ✅ | ✅ | |
| 활동완료 | `활동완료` | 양쪽 | ✅ | ✅ | |
| 활동중단 | `활동중단` | 양쪽 | ✅ | ✅ | |

### 상태 전이 규칙

```
서류심사대기 → 서류합격 | 서류불합격
서류합격     → 최종합격 | 최종불합격
최종합격     → 활동중
활동중       → 활동완료 | 활동중단
```

FE: `entities/application/model/constants.ts` `STATUS_BRANCH` 로 합격/불합격 분기 매핑.

### 지원자 목록 / 필터

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 지원자 목록 (기수·파트·이름·상태·면접일자) | 양쪽 | ✅ | ⚠️ | BE: `GET /admin/applications`. FE: `ApplicationsPage` + `ApplicationTable`. **면접일자 컬럼 미노출** (slot UI 미구현 영향) |
| 파트별 / 기수별 / 상태별 필터 | 프론트엔드 | – | ✅ | FE: `ApplicationFilters.tsx` (검색·기수·파트·상태) |
| 상태별 카운트 카드 | 프론트엔드 | – | ✅ | FE: `useApplicationsBoard` + `Sections.tsx` `CardSection` |
| 행 클릭 → 상세 진입 | 프론트엔드 | – | ✅ | FE: `Drawer` 형태로 진입 (페이지 전환 X) |

### 상태 변경 자동화

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 상태 변경 합격/불합격 분기 UI | 프론트엔드 | – | ✅ | FE: `ApplicationDetailDrawer` Footer 버튼 + `StatusChangeModal` |
| 서류불합격 → 불합격 이메일 자동 발송 | 백엔드 | ✅ | – | BE: `EmailEventHandler` `application.status_changed` 이벤트 |
| 서류합격 → 면접 일정 선택 링크 이메일 발송 | 백엔드 | ✅ | – | BE: 상태 변경 이벤트로 이메일 발송 |
| 최종불합격 → 불합격 이메일 자동 발송 | 백엔드 | ✅ | – | |
| 최종합격 → 합격 이메일 발송 | 백엔드 | ✅ | – | |
| **서류합격 시 슬롯 없으면 팝업 안내 → 슬롯 생성 페이지 이동** | 양쪽 | ⚠️ | ✅ | BE: `400 INTERVIEW_SLOTS_NOT_READY` 반환. FE: `StatusChangeModal` 이 분기 시 `InterviewSlotsRequiredModal` 노출 → "슬롯 등록하러 가기" 버튼이 `/interview-slots?cohortId=X&cohortPartId=Y` 로 navigate (필터 prefill) |
| **최종합격 이메일에 Discord OAuth 버튼 포함** | 백엔드 | ⚠️ | ⚠️ | BE: 이메일 템플릿에 Discord OAuth URL 포함 여부 미확인. FE: `StatusChangeModal` 안내 문구로 "Discord 연결 버튼 포함" 만 노출 (실제 메일 본문은 BE 영역) |
| PII 자동 파기 | 백엔드 | ✅ | – | `PiiPurgeScheduler` |

### 면접 예약 흐름

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 슬롯 중복 감지 (capacity 초과 / 지원자 중복) | 백엔드 | ✅ | – | BE: `400 INTERVIEW_SLOT_ALREADY_RESERVED` |
| 슬롯 중복 시 "이미 선택된 시간" 안내 | 양쪽 | ✅ | ❌ | BE: 에러 코드 반환. FE: 지원자용 일정 선택 페이지 자체가 admin 영역 아님(추후 `apps/web`) |
| 슬롯 생성 / 수정 / 삭제 관리 페이지 | 프론트엔드 | ✅ | ✅ | FE: `apps/admin/src/pages/interview-slots/` — 기수·파트 필터 + 테이블 + 등록/수정 Drawer + 삭제 Dialog. BE PR #57 후 응답 타입(`InterviewSlotResponseDto`) 좁아짐 |
| Google Calendar 이벤트 생성 | 백엔드 | ✅ | – | `GoogleCalendarClient` |
| **Google Meet 링크 생성** | 백엔드 | ⚠️ | – | Calendar 이벤트 생성 시 `conferenceData` 포함 여부 별도 확인 필요 |
| ICS 파일 첨부 이메일 발송 | 백엔드 | ✅ | – | |
| 예약 취소 시 Calendar 이벤트 삭제 | 백엔드 | ✅ | – | 실패 시 `OPS_ALERT_EMAIL` 알림 |
| 예약 취소 어드민 UI | 프론트엔드 | – | ✅ | FE: 슬롯 행 "예약/정원" 셀 → `ReservationsDrawer` 안 예약자 목록 → 행별 [취소] → `CancelReservationDialog` confirm → `useCancelReservationFlow` (`cancelInterviewReservation` mutation) |

### Discord 초대 흐름

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| Discord OAuth → 서버 자동 초대 | 백엔드 | ✅ | – | `DiscordBotClient.addGuildMember()` |
| 파트별 역할(Role) 자동 부여 | 백엔드 | ✅ | – | 환경변수 `DISCORD_ROLE_ID_*` |
| OAuth 실패 시 재시도 가능 | 양쪽 | ✅ | – | BE: `DiscordLink` 없으면 재시도 가능. FE 재시도 버튼은 지원자용(`apps/web`) 영역 |
| Discord 계정과 지원 이메일 분리 처리 | 백엔드 | ✅ | – | OAuth 기반 직접 연동 |

### 지원자 상세 페이지

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 상세 조회 API | 백엔드 | ✅ | – | BE: `GET /admin/applications/:id` |
| 지원 파트, 이름 표시 | 양쪽 | ✅ | ✅ | FE: `ApplicationDetailDrawer/index.tsx` |
| 휴대폰 가운데 번호 마스킹 | 프론트엔드 | – | ✅ | FE: `maskPhone()` |
| 생년월일, 거주지역 표시 | 양쪽 | ✅ | ✅ | |
| 지원서 답변 표시 | 양쪽 | ✅ | ✅ | FE: `AnswerList.tsx` |
| 제출 일자 표시 | 양쪽 | ✅ | ✅ | |
| 현재 상태 + 상태 변경 기능 | 양쪽 | ✅ | ✅ | FE: Footer 합격/불합격 버튼 |
| 개인정보 동의 여부 표시 | 양쪽 | ✅ | ✅ | FE: `privacyAgreed` |
| **개인정보 동의 일자 표시** | 양쪽 | ⚠️ | ✅ | FE: `ApplicationDetailDrawer` 에 동의 일자 `InfoRow` 추가, BE 응답 부재 시 `"-"` 폴백 |

---

## 3.4 프로젝트 DB 관리

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 목록 조회 (썸네일, 플랫폼, 서비스명, 한줄 설명, 기수, 참여자수) | 양쪽 | ✅ | ✅ | FE: `ProjectsPage` + `ProjectsToolbar` + `ProjectsTable` |
| 검색 / 플랫폼 / 기수 필터 | 프론트엔드 | – | ✅ | FE: `ProjectsToolbar.tsx` |
| 등록 / 수정 / 삭제 | 양쪽 | ✅ | ✅ | FE: `ProjectFormDrawer` + `DeleteProjectDialog` |
| 썸네일 업로드 | 양쪽 | ✅ | ✅ | BE: `useUploadFile`. FE: `ProjectFormDrawer/components/ThumbnailUploader.tsx` |
| 플랫폼 (iOS / AOS / WEB) 멀티 선택 | 양쪽 | ✅ | ✅ | `ProjectPlatform` enum + 토글 버튼 |
| 서비스명 / 한줄 설명 / 기수 입력 | 양쪽 | ✅ | ✅ | |
| 참여자 이름·파트 복수 입력 | 양쪽 | ✅ | ✅ | BE: `PUT /admin/projects/:id/members` 배열 교체. FE: `useFieldArray` + `MemberRow.tsx` |
| **참여자 후기(review) 필드** | 양쪽 | ❌ | ⚠️ | BE: `ProjectMember` 엔티티에 `review` 필드 없음. FE: `MemberRow` 에 후기 `TextArea` UI 는 있으나 `buildProjectFormDefaults` 가 항상 `review: undefined` 로 채우고 서버 페이로드에도 포함되지 않음 |
| PDF 업로드 (Phase 2) | 양쪽 | ❌ | ❌ | 양쪽 모두 미구현 |

---

## 3.5 블로그 DB 관리

| 명세 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 비고 |
|-----------|-----------|--------|-----------|------|
| 목록 조회 (썸네일, 제목, 본문 일부, 링크, 등록일) | 양쪽 | ✅ | ✅ | FE: `BlogPostsList.tsx` + `BlogPostsTable.tsx` |
| 검색 | 프론트엔드 | – | ✅ | FE: `BlogPostsToolbar.tsx` (제목 클라이언트 필터) |
| 등록 / 수정 / 삭제 | 양쪽 | ✅ | ✅ | FE: `BlogPostFormDrawer` + `DeleteBlogPostDialog` |
| 썸네일 업로드 | 양쪽 | ✅ | ✅ | BE: `useUploadFile` (`category=blog-thumbnail`). FE: 인라인 `ThumbnailUploader` |
| 제목 입력 | 양쪽 | ✅ | ✅ | |
| 본문 일부(excerpt) 입력 | 양쪽 | ✅ | ✅ | |
| 외부 링크 URL 입력 | 양쪽 | ✅ | ✅ | URL 형식 zod 검증 |

---

## 미구현 / 명세 불일치 항목 요약

| # | 도메인 | 항목 | 처리 주체 | 백엔드 | 프론트엔드 | 필요한 작업 |
|---|--------|------|-----------|--------|-----------|------------|
| 1 | 기수 | 모집중 전환 조건: 지원서 양식 필수 검증 | 양쪽 | ❌ | ✅ | BE: `updateCohort()` 에서 `RECRUITING` 전환 시 파트 양식 검증 미구현. FE: `validateCohortPartsForRecruiting` + `TransitionBlockedDialog` 로 사전 차단·수정 Drawer 자동 오픈 완료. 위반 파트 자동 스크롤·강조는 후속 PR |
| 2 | 기수 | 파트별 면접 슬롯 관리 UI | 프론트엔드 | ✅ | ✅ | FE: `apps/admin/src/pages/interview-slots/` 신설 — 페이지 + Drawer + Dialog 완성. 예약자 목록·예약 취소는 `ReservationsDrawer` + `CancelReservationDialog` 로 완료 (BE `reservations` nested + `cancelInterviewReservation` 활용) |
| 3 | 사전 알림 | 모집중 변경 시 **즉시** 이메일 발송 | 양쪽 | ⚠️ | ✅ | BE: 상태 변경 트리거 부재 — 캠페인 + scheduledAt 우회. FE: 캠페인 어드민 UI 연결 완료(`NotificationCampaignSection`). 명세상 "상태 변경 즉시" 발송은 BE 가 트리거를 도입해야 100% 충족 |
| 4 | 지원 | 서류합격 시 슬롯 없을 때 팝업 안내 | 양쪽 | ⚠️ | ✅ | FE: `InterviewSlotsRequiredModal` (HeroUI Modal) 노출 → `/interview-slots?cohortId&cohortPartId` 로 navigate. BE 측은 여전히 trigger 만 정상 |
| 5 | 지원 | 최종합격 이메일 내 Discord OAuth 버튼 | 백엔드 | ⚠️ | – | BE: `EmailEventHandler` 최종합격 템플릿 Discord OAuth URL 포함 확인 |
| 6 | 지원 | Google Meet 링크 생성 | 백엔드 | ⚠️ | – | BE: `GoogleCalendarClient` 이벤트 `conferenceData` 포함 확인 |
| 7 | 지원 | 면접일자 컬럼 / 슬롯 중복 안내 | 양쪽 | ✅ | ❌ | FE: 지원자 테이블에 면접 슬롯 일정 컬럼 추가, 슬롯 관리 UI 도입 후 연계 |
| 8 | 지원 | 개인정보 동의 일자 표시 | 양쪽 | ⚠️ | ✅ | FE: `ApplicationDetailDrawer` 에 동의 일자 `InfoRow` 추가 완료. BE: 상세 응답 `privacyAgreedAt` 포함 여부 확인 남음 |
| 9 | 프로젝트 | 참여자 후기(review) 필드 | 양쪽 | ❌ | ⚠️ | BE: `ProjectMember` 에 `review` 필드 추가 + 마이그레이션 + DTO 노출. FE: `buildProjectFormDefaults` 와 `useCreateOrUpdateProjectFlow` payload 에 `review` 반영 |
| 10 | 프로젝트 | PDF 업로드 (Phase 2) | 양쪽 | ❌ | ❌ | Phase 2 — 미착수 |
