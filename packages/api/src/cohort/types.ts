import type { components } from "../generated/api";

// ---------- Runtime enum (consumers reference *.PM, *.UPCOMING 등) ----------
export const CohortPartConfigDtoName = {
  PM: "PM",
  PD: "PD",
  BE: "BE",
  FE: "FE",
  IOS: "IOS",
  AND: "AND",
} as const;
export type CohortPartConfigDtoName =
  (typeof CohortPartConfigDtoName)[keyof typeof CohortPartConfigDtoName];

export const CreateCohortRequestDtoStatus = {
  UPCOMING: "UPCOMING",
  RECRUITING: "RECRUITING",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;
export type CreateCohortRequestDtoStatus =
  (typeof CreateCohortRequestDtoStatus)[keyof typeof CreateCohortRequestDtoStatus];

// UpdateCohortRequestDtoStatus 는 Create 와 동일 값이지만 별도 타입 노출 (기존 호환)
export type UpdateCohortRequestDtoStatus = CreateCohortRequestDtoStatus;

// ---------- Request DTO 재노출 ----------
export type CreateCohortRequestDto = components["schemas"]["CreateCohortRequestDto"];
export type UpdateCohortRequestDto = components["schemas"]["UpdateCohortRequestDto"];
export type UpdateCohortPartsRequestDto =
  components["schemas"]["UpdateCohortPartsRequestDto"];

// ---------- 엔드포인트 시그니처 ----------

// POST /api/v1/admin/cohorts - 기수 생성
export type PostCreateCohortRequest = CreateCohortRequestDto;
export type PostCreateCohortResponse = CohortDto;

// GET /api/v1/admin/cohorts - 기수 목록 조회
export type GetCohortsResponse = CohortDto[];

// GET /api/v1/admin/cohorts/{id} - 기수 단건 조회
export type GetCohortParams = { id: number };
export type GetCohortResponse = CohortDto;

// PATCH /api/v1/admin/cohorts/{id} - 기수 정보 및 상태 수정
export type PatchUpdateCohortParams = { id: number };
export type PatchUpdateCohortRequest = UpdateCohortRequestDto;
export type PatchUpdateCohortResponse = CohortDto;

// DELETE /api/v1/admin/cohorts/{id} - 기수 삭제
export type DeleteCohortParams = { id: number };
export type DeleteCohortResponse = void;

// PUT /api/v1/admin/cohorts/{id}/parts - 기수 파트 모집 설정
export type PutUpdateCohortPartsParams = { id: number };
export type PutUpdateCohortPartsRequest = UpdateCohortPartsRequestDto;
export type PutUpdateCohortPartsResponse = CohortDto;

// GET /api/v1/cohorts/active - 현재 활성 기수 조회 (public)
export type GetActiveCohortResponse = CohortDto;

// ---------- 엔티티 타입 (BE 응답 schema 미정의 → 수동 정의) ----------
export type CohortStatus = CreateCohortRequestDtoStatus;
export type CohortPartName = CohortPartConfigDtoName;
export type UpdateCohortStatus = UpdateCohortRequestDtoStatus;

export interface CohortPartConfig {
  id: number;
  partName: CohortPartName;
  isOpen: boolean;
  applicationSchema: Record<string, unknown>;
}
export type CohortPartConfigDto = CohortPartConfig;

export interface CohortDto {
  id: number;
  name: string;
  recruitStartAt: string;
  recruitEndAt: string;
  status: CohortStatus;
  process?: Record<string, unknown>;
  curriculum?: Record<string, unknown>[];
  applicationForm?: Record<string, unknown>;
  parts?: CohortPartConfig[];
  createdAt: string;
  updatedAt: string;
}
