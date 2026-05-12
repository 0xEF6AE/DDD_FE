import { api } from "../fetchClient";
import type {
  PostCreateCohortRequest,
  PostCreateCohortResponse,
  GetCohortsResponse,
  GetCohortParams,
  GetCohortResponse,
  PatchUpdateCohortParams,
  PatchUpdateCohortRequest,
  PatchUpdateCohortResponse,
  DeleteCohortParams,
  PutUpdateCohortPartsParams,
  PutUpdateCohortPartsRequest,
  PutUpdateCohortPartsResponse,
  GetActiveCohortResponse,
} from "./types";

/** 어드민 기수 API */
export const cohortAPI = {
  /** 새 기수 생성 - POST /api/v1/admin/cohorts */
  createCohort: ({ payload }: { payload: PostCreateCohortRequest }) =>
    api.post("/api/v1/admin/cohorts", {
      body: payload,
    }) as unknown as Promise<PostCreateCohortResponse>,

  /** 기수 전체 목록 - GET /api/v1/admin/cohorts */
  getCohorts: () =>
    api.get("/api/v1/admin/cohorts") as unknown as Promise<GetCohortsResponse>,

  /** 기수 단건 - GET /api/v1/admin/cohorts/{id} */
  getCohort: ({ params }: { params: GetCohortParams }) =>
    api.get("/api/v1/admin/cohorts/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<GetCohortResponse>,

  /** 기수 정보 및 상태 수정 - PATCH /api/v1/admin/cohorts/{id} */
  updateCohort: ({
    params,
    payload,
  }: {
    params: PatchUpdateCohortParams;
    payload: PatchUpdateCohortRequest;
  }) =>
    api.patch("/api/v1/admin/cohorts/{id}", {
      params: { path: { id: params.id } },
      body: payload,
    }) as unknown as Promise<PatchUpdateCohortResponse>,

  /** 기수 삭제 - DELETE /api/v1/admin/cohorts/{id} */
  deleteCohort: ({ params }: { params: DeleteCohortParams }) =>
    api.delete("/api/v1/admin/cohorts/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<void>,

  /** 기수 파트 모집 설정 - PUT /api/v1/admin/cohorts/{id}/parts */
  updateCohortParts: ({
    params,
    payload,
  }: {
    params: PutUpdateCohortPartsParams;
    payload: PutUpdateCohortPartsRequest;
  }) =>
    api.put("/api/v1/admin/cohorts/{id}/parts", {
      params: { path: { id: params.id } },
      body: payload,
    }) as unknown as Promise<PutUpdateCohortPartsResponse>,
};

/** 퍼블릭 기수 API */
export const cohortPublicAPI = {
  /** 현재 활성 기수 조회 - GET /api/v1/cohorts/active */
  getActiveCohort: () =>
    api.get("/api/v1/cohorts/active") as unknown as Promise<GetActiveCohortResponse>,
};
