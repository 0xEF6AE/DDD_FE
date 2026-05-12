import { api } from "../fetchClient";
import type {
  GetProjectsParams,
  GetProjectsResponse,
  GetProjectParams,
  GetProjectResponse,
  GetAdminProjectsResponse,
  GetAdminProjectParams,
  GetAdminProjectResponse,
  PostCreateProjectRequest,
  PostCreateProjectResponse,
  PatchUpdateProjectParams,
  PatchUpdateProjectRequest,
  PatchUpdateProjectResponse,
  DeleteProjectParams,
  PutUpdateProjectMembersParams,
  PutUpdateProjectMembersRequest,
  PutUpdateProjectMembersResponse,
} from "./types";

export const projectAPI = {
  /** 공개 프로젝트 목록 (cursor 페이지네이션) - GET /api/v1/projects */
  getProjects: ({ params }: { params: GetProjectsParams }) =>
    api.get("/api/v1/projects", {
      params: { query: params },
    }) as unknown as Promise<GetProjectsResponse>,

  /** 공개 프로젝트 단건 - GET /api/v1/projects/{id} */
  getProject: ({ params }: { params: GetProjectParams }) =>
    api.get("/api/v1/projects/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<GetProjectResponse>,

  /** 어드민 프로젝트 전체 목록 - GET /api/v1/admin/projects */
  getAdminProjects: () =>
    api.get("/api/v1/admin/projects") as unknown as Promise<GetAdminProjectsResponse>,

  /** 어드민 프로젝트 단건 - GET /api/v1/admin/projects/{id} */
  getAdminProject: ({ params }: { params: GetAdminProjectParams }) =>
    api.get("/api/v1/admin/projects/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<GetAdminProjectResponse>,

  /** 어드민 프로젝트 생성 - POST /api/v1/admin/projects */
  createProject: ({ payload }: { payload: PostCreateProjectRequest }) =>
    api.post("/api/v1/admin/projects", {
      body: payload,
    }) as unknown as Promise<PostCreateProjectResponse>,

  /** 어드민 프로젝트 수정 - PATCH /api/v1/admin/projects/{id} */
  updateProject: ({
    params,
    payload,
  }: {
    params: PatchUpdateProjectParams;
    payload: PatchUpdateProjectRequest;
  }) =>
    api.patch("/api/v1/admin/projects/{id}", {
      params: { path: { id: params.id } },
      body: payload,
    }) as unknown as Promise<PatchUpdateProjectResponse>,

  /** 어드민 프로젝트 삭제 - DELETE /api/v1/admin/projects/{id} */
  deleteProject: ({ params }: { params: DeleteProjectParams }) =>
    api.delete("/api/v1/admin/projects/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<void>,

  /** 어드민 프로젝트 참여자 수정 - PUT /api/v1/admin/projects/{id}/members */
  updateProjectMembers: ({
    params,
    payload,
  }: {
    params: PutUpdateProjectMembersParams;
    payload: PutUpdateProjectMembersRequest;
  }) =>
    api.put("/api/v1/admin/projects/{id}/members", {
      params: { path: { id: params.id } },
      body: payload,
    }) as unknown as Promise<PutUpdateProjectMembersResponse>,
};
