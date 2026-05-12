import {
  projectGetPublicList,
  projectGetPublicById,
} from "../generated/project/project";
import {
  projectGetAdminList,
  projectGetAdminById,
  projectCreateAdmin,
  projectUpdateAdminById,
  projectDeleteAdminById,
  projectUpdateMembersAdmin,
} from "../generated/admin-project/admin-project";
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
  /** 공개 프로젝트 목록 조회 (커서 기반 페이지네이션) */
  // NOTE: BE OpenAPI 가 페이지네이션 응답 schema 를 명시하지 않아 generated 가 apiFetch<void>
  // 로 호출됨 → 응답 타입을 캐스팅으로 보강. BE spec 보강 시 제거.
  getProjects: ({ params }: { params: GetProjectsParams }) =>
    projectGetPublicList(params) as unknown as Promise<GetProjectsResponse>,

  /** 공개 프로젝트 단건 조회 */
  getProject: ({ params }: { params: GetProjectParams }) =>
    projectGetPublicById(params.id),

  /** 어드민 프로젝트 전체 목록 조회 */
  getAdminProjects: () =>
    projectGetAdminList() as unknown as Promise<GetAdminProjectsResponse>,

  /** 어드민 프로젝트 단건 조회 */
  getAdminProject: ({ params }: { params: GetAdminProjectParams }) =>
    projectGetAdminById(params.id),

  /** 프로젝트 생성 (어드민) */
  createProject: ({ payload }: { payload: PostCreateProjectRequest }) =>
    projectCreateAdmin(payload),

  /** 프로젝트 수정 (어드민) - PATCH /admin/projects/{id} */
  updateProject: ({
    params,
    payload,
  }: {
    params: PatchUpdateProjectParams;
    payload: PatchUpdateProjectRequest;
  }) => projectUpdateAdminById(params.id, payload),

  /** 프로젝트 삭제 (어드민) */
  deleteProject: ({ params }: { params: DeleteProjectParams }) =>
    projectDeleteAdminById(params.id),

  /** 프로젝트 참여자 수정 (어드민) - PUT /admin/projects/{id}/members */
  updateProjectMembers: ({
    params,
    payload,
  }: {
    params: PutUpdateProjectMembersParams;
    payload: PutUpdateProjectMembersRequest;
  }) => projectUpdateMembersAdmin(params.id, payload),
};
