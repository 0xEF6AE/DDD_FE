import type { components, paths } from "../generated/api";

// Request DTO 재노출
export type UpdateApplicationStatusRequestDto =
  components["schemas"]["UpdateApplicationStatusRequestDto"];
export type SaveApplicationDraftRequestDto =
  components["schemas"]["SaveApplicationDraftRequestDto"];
export type SubmitApplicationRequestDto =
  components["schemas"]["SubmitApplicationRequestDto"];

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
