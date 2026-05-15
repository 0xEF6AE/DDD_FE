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

// ---------- 엔티티 타입 ----------
//
// BE 실제 응답은 `{ id, partName, isOpen, applicationSchema }` 형태이나
// OpenAPI 스키마는 `{ name, isOpen, formSchema: Record<string, never> }` 로
// 아직 정합되지 않았다 (commit 06b4264 「BE 스키마 필드명 정합화 (partName /
// applicationSchema)」 이후 BE 측 schema 보강 대기 중).
// FE 는 BE 실제 응답을 기준으로 타입을 정의하고, generated payload 타입과
// 충돌하는 부분은 cohort/api.ts 안에서 `as never` cast 로 우회한다.
//
export type CohortStatus = CreateCohortRequestDtoStatus;
export type CohortPartName = CohortPartConfigDtoName;
export type UpdateCohortStatus = UpdateCohortRequestDtoStatus;

export interface CohortPartConfigDto {
  id?: number;
  partName: CohortPartName;
  isOpen: boolean;
  applicationSchema: Record<string, unknown>;
}

/** 기존 호환 alias (FE 내부에서 이 이름으로 참조 중) */
export type CohortPartConfig = CohortPartConfigDto;

// ---------- Request DTO (process/curriculum/parts 형태를 실제 사용에 맞게 완화) ----------
export type CreateCohortRequestDto = Omit<
  components["schemas"]["CreateCohortRequestDto"],
  "process" | "curriculum" | "applicationForm" | "parts"
> & {
  process?: Record<string, unknown>;
  curriculum?: Record<string, unknown>[];
  applicationForm?: Record<string, unknown>;
  parts?: CohortPartConfigDto[];
};

export type UpdateCohortRequestDto = Omit<
  components["schemas"]["UpdateCohortRequestDto"],
  "process" | "curriculum" | "applicationForm"
> & {
  process?: Record<string, unknown>;
  curriculum?: Record<string, unknown>[];
  applicationForm?: Record<string, unknown>;
};

export type UpdateCohortPartsRequestDto = {
  parts: CohortPartConfigDto[];
};

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

// GET /api/v1/cohorts/parts/{id} - 모집 파트 상세 조회 (public)
export type GetCohortPartParams = { id: number };
export type GetCohortPartResponse = CohortPartConfigDto;

// ---------- CohortDto 엔티티 (BE 응답 schema 미정의 → 수동 정의) ----------
export interface CohortDto {
  id: number;
  name: string;
  recruitStartAt: string;
  recruitEndAt: string;
  status: CohortStatus;
  process?: Record<string, unknown>;
  curriculum?: Record<string, unknown>[];
  applicationForm?: Record<string, unknown>;
  parts?: CohortPartConfigDto[];
  createdAt: string;
  updatedAt: string;
}
