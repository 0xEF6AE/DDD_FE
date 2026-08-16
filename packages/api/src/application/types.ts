import type { components, paths } from "../generated/api";

// Request DTO 재노출
//
// BE OpenAPI 가 `answers` 를 `Record<string, never>` (빈 객체) 로 정의해두어
// 실제 응답/요청 (자유 폼) 과 충돌한다. cohort 의 `process` / `curriculum` 패턴
// 처럼 FE 에서 `Record<string, unknown>` 으로 완화한다.
export type UpdateApplicationStatusRequestDto =
  components["schemas"]["UpdateApplicationStatusRequestDto"];
export type SaveApplicationDraftRequestDto = Omit<
  components["schemas"]["SaveApplicationDraftRequestDto"],
  "answers"
> & { answers: Record<string, unknown> };
export type SubmitApplicationRequestDto = Omit<
  components["schemas"]["SubmitApplicationRequestDto"],
  "answers"
> & { answers: Record<string, unknown> };

// GET /api/v1/admin/applications - 어드민 지원서 목록 조회
export type ApplicationGetAdminListParams =
  paths["/api/v1/admin/applications"]["get"]["parameters"]["query"];
export type GetAdminApplicationsParams = ApplicationGetAdminListParams;
export type GetAdminApplicationsResponse = ApplicationDto[];

// GET /api/v1/admin/applications/{id} - 어드민 지원서 단건 조회
export type GetAdminApplicationParams = { id: number };
export type GetAdminApplicationResponse = ApplicationDto;

// PATCH /api/v1/admin/applications/{id}/status - 상태 변경
export type PatchApplicationStatusParams = { id: number };
export type PatchApplicationStatusRequest = UpdateApplicationStatusRequestDto;
export type PatchApplicationStatusResponse = void;

// POST /api/v1/applications/draft - 임시 저장
export type PostSaveApplicationDraftRequest = SaveApplicationDraftRequestDto;
export type PostSaveApplicationDraftResponse = void;

// GET /api/v1/applications/draft/{cohortPartId} - 임시저장 단건 조회
export type GetApplicationDraftParams = { cohortPartId: number };
export type GetApplicationDraftResponse = void;

// POST /api/v1/applications - 지원서 제출
export type PostSubmitApplicationRequest = SubmitApplicationRequestDto;
export type PostSubmitApplicationResponse = void;

// ---------- 지원서 첨부 (PDF) ----------
//
// 2026-08-16 배포분. BE OpenAPI 에 아직 두 경로가 없어 generated `paths` 로 좁힐 수
// 없다. `pnpm gen:api` 로 스펙이 갱신되면 아래 수동 정의를 generated 타입으로 교체한다.

/** 파일 업로드 제약 — BE 규칙과 동일 (PDF · 20MB) */
export const APPLICATION_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const APPLICATION_ATTACHMENT_MIME = "application/pdf";

/**
 * 업로드 응답이자 `answers` 에 그대로 싣는 값.
 *
 * 다운로드 URL 은 응답에 없다 — 첨부는 개인정보라 공개 URL 을 저장하지 않고,
 * 열람이 필요할 때마다 signed-url 을 발급받는다. 서버가 실제로 쓰는 값은 `path` 이고
 * `originalName` 은 화면 표시용이다.
 */
export interface ApplicationAttachmentDto {
  path: string;
  originalName: string;
  size: number;
}

// POST /api/v1/applications/attachments - PDF 업로드
export type PostApplicationAttachmentResponse = ApplicationAttachmentDto;

// GET /api/v1/applications/attachments/signed-url - 본인 첨부 열람용 임시 URL
export type GetApplicationAttachmentSignedUrlParams = { path: string };
export interface ApplicationAttachmentSignedUrlDto {
  url: string;
  /** ISO 8601. 발급 후 10분 — 상태·DB 에 담지 말고 필요할 때 재발급한다. */
  expiresAt: string;
}
export type GetApplicationAttachmentSignedUrlResponse =
  ApplicationAttachmentSignedUrlDto;

/**
 * answers 의 값이 첨부 객체인지 판별한다.
 *
 * answers 는 자유 폼(`Record<string, unknown>`)이라 텍스트 답변과 첨부가 같은 맵에
 * 섞인다. 렌더·복원 시 이 가드로 분기한다.
 */
export function isApplicationAttachment(
  value: unknown,
): value is ApplicationAttachmentDto {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.path === "string" &&
    typeof o.originalName === "string" &&
    typeof o.size === "number"
  );
}

// 엔티티 타입 (BE 응답 schema 미정의 → 수동 정의)
export type ApplicationStatus =
  NonNullable<ApplicationGetAdminListParams>["status"];
export type ApplicationStatusUpdate = UpdateApplicationStatusRequestDto["status"];

export interface ApplicationDto {
  id: number;
  cohortId: number;
  cohortPartId: number;
  applicantName: string;
  applicantPhone?: string;
  applicantBirthDate?: string;
  applicantRegion?: string;
  answers: Record<string, unknown>;
  status: ApplicationStatus;
  privacyAgreed?: boolean;
  privacyAgreedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
