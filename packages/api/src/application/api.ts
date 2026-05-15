import { api } from "../fetchClient";
import type {
  GetAdminApplicationsParams,
  GetAdminApplicationsResponse,
  GetAdminApplicationParams,
  GetAdminApplicationResponse,
  PatchApplicationStatusParams,
  PatchApplicationStatusRequest,
  PostSaveApplicationDraftRequest,
  GetApplicationDraftParams,
  PostSubmitApplicationRequest,
} from "./types";

export const applicationAPI = {
  /** 어드민 지원서 목록 - GET /api/v1/admin/applications */
  getAdminApplications: ({ params }: { params: GetAdminApplicationsParams }) =>
    api.get("/api/v1/admin/applications", {
      params: { query: params },
    }) as unknown as Promise<GetAdminApplicationsResponse>,

  /** 어드민 지원서 단건 - GET /api/v1/admin/applications/{id} */
  getAdminApplication: ({ params }: { params: GetAdminApplicationParams }) =>
    api.get("/api/v1/admin/applications/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<GetAdminApplicationResponse>,

  /** 지원서 상태 변경 - PATCH /api/v1/admin/applications/{id}/status */
  patchApplicationStatus: ({
    params,
    payload,
  }: {
    params: PatchApplicationStatusParams;
    payload: PatchApplicationStatusRequest;
  }) =>
    api.patch("/api/v1/admin/applications/{id}/status", {
      params: { path: { id: params.id } },
      body: payload,
    }) as unknown as Promise<void>,

  /** 지원서 임시저장 - POST /api/v1/applications/draft */
  saveApplicationDraft: ({
    payload,
  }: {
    payload: PostSaveApplicationDraftRequest;
  }) =>
    api.post("/api/v1/applications/draft", {
      body: payload as never,
    }) as unknown as Promise<void>,

  /** 임시저장 단건 조회 - GET /api/v1/applications/draft/{cohortPartId} */
  getApplicationDraft: ({ params }: { params: GetApplicationDraftParams }) =>
    api.get("/api/v1/applications/draft/{cohortPartId}", {
      params: { path: { cohortPartId: params.cohortPartId } },
    }) as unknown as Promise<void>,

  /** 지원서 최종 제출 - POST /api/v1/applications */
  submitApplication: ({
    payload,
  }: {
    payload: PostSubmitApplicationRequest;
  }) =>
    api.post("/api/v1/applications", {
      body: payload as never,
    }) as unknown as Promise<void>,
};
