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
  PostApplicationAttachmentResponse,
  GetApplicationAttachmentSignedUrlParams,
  GetApplicationAttachmentSignedUrlResponse,
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
  saveApplicationDraft: ({ payload }: { payload: PostSaveApplicationDraftRequest }) =>
    api.post("/api/v1/applications/draft", {
      body: payload as never,
    }) as unknown as Promise<void>,

  /** 임시저장 단건 조회 - GET /api/v1/applications/draft/{cohortPartId} */
  getApplicationDraft: ({ params }: { params: GetApplicationDraftParams }) =>
    api.get("/api/v1/applications/draft/{cohortPartId}", {
      params: { path: { cohortPartId: params.cohortPartId } },
    }) as unknown as Promise<void>,

  /** 지원서 최종 제출 - POST /api/v1/applications */
  submitApplication: ({ payload }: { payload: PostSubmitApplicationRequest }) =>
    api.post("/api/v1/applications", {
      body: payload as never,
    }) as unknown as Promise<void>,

  /**
   * 지원서 첨부 PDF 업로드 - POST /api/v1/applications/attachments
   *
   * 응답 객체를 통째로 보관했다가 `answers[질문키]` 에 그대로 넣는다.
   * 업로드 즉시 저장되므로 파일을 교체해도 이전 파일은 남는다 — 최종 answers 에
   * 담긴 것만 유효하다.
   *
   * 런타임은 openapi-fetch 가 FormData 를 감지해 그대로 전송한다
   * (Content-Type 수동 지정 금지).
   */
  uploadApplicationAttachment: ({
    payload,
  }: {
    payload: FormData;
  }): Promise<PostApplicationAttachmentResponse> =>
    api.post("/api/v1/applications/attachments", {
      body: payload as never,
    }),

  /**
   * 첨부 열람용 임시 URL 발급 - GET /api/v1/applications/attachments/signed-url
   *
   * 본인이 업로드한 첨부만 발급된다(타인 path 는 403 ATTACHMENT_NOT_OWNED).
   * URL 은 10분 후 만료되므로 캐싱·저장하지 말고 열람 시점마다 호출한다.
   */
  getApplicationAttachmentSignedUrl: ({
    params,
  }: {
    params: GetApplicationAttachmentSignedUrlParams;
  }): Promise<GetApplicationAttachmentSignedUrlResponse> =>
    api.get("/api/v1/applications/attachments/signed-url", {
      params: { query: { path: params.path } },
    }),
};
