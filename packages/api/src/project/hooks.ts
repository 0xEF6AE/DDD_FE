/**
 * @deprecated 이 모듈의 wrapper hook 들은 더 이상 사용하지 않는다.
 *
 * 컴포넌트·흐름 훅에서는 `xxxQueries` / `xxxMutations` 옵션 팩토리를
 * `useQuery` / `useMutation` 에 직접 전달한다 (CODE_RULES §3.3 #5).
 * 모든 사용처가 옵션 팩토리로 치환되면 이 파일은 삭제된다.
 */

import {
  useQuery,
  useMutation,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { projectQueries, projectMutations } from "./queries";
import type {
  GetProjectsParams,
  GetProjectParams,
  GetInfiniteProjectsParams,
  GetAdminProjectParams,
} from "./types";

/**
 * 프로젝트 공개 목록 조회 훅
 *
 * @param {GetProjectsParams} params - 조회 파라미터
 * @param {ProjectPlatform} [params.platform] - 플랫폼 필터 (선택)
 * @param {string} [params.cursor] - 다음 페이지 커서(base64url) (선택)
 * @param {number} [params.limit] - 페이지 크기 (1-100, 선택)
 *
 * @example
 * const { data: projects, isLoading } = useProjects({ params: { platform: 'WEB' } })
 */
export const useProjects = ({ params }: { params: GetProjectsParams }) =>
  useQuery(projectQueries.getProjects({ params }));

/**
 * 프로젝트 무한 스크롤 목록 조회 훅
 *
 * @param {GetInfiniteProjectsParams} params - 조회 파라미터 (cursor 제외)
 * @param {ProjectPlatform} [params.platform] - 플랫폼 필터 (선택)
 * @param {number} [params.limit] - 페이지 크기 (1-100, 선택)
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
 *   useInfiniteProjects({ params: { limit: 20 } })
 * const items = data?.pages.flatMap((p) => p.items) ?? []
 */
export const useInfiniteProjects = ({
  params,
}: {
  params: GetInfiniteProjectsParams;
}) => useInfiniteQuery(projectQueries.getInfiniteProjects({ params }));

/**
 * 프로젝트 단일 조회 훅
 *
 * @param {GetProjectParams} params - 조회 파라미터
 * @param {number} params.id - 프로젝트 ID
 *
 * @example
 * const { data: project, isLoading } = useProject({ params: { id: 1 } })
 */
export const useProject = ({ params }: { params: GetProjectParams }) =>
  useQuery(projectQueries.getProject({ params }));

/**
 * 어드민 프로젝트 무한 스크롤 목록 조회 훅 (GET /admin/projects)
 *
 * 어드민 관리 페이지에서 사용. 인증된 어드민 API 엔드포인트를 호출한다.
 *
 * @param {GetInfiniteProjectsParams} params - 조회 파라미터 (cursor 제외)
 * @param {number} [params.limit] - 페이지 크기 (선택)
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
 *   useAdminInfiniteProjects({ params: { limit: 20 } })
 * const items = data?.pages.flatMap((p) => p.items) ?? []
 */
export const useAdminInfiniteProjects = ({
  params,
}: {
  params: GetInfiniteProjectsParams;
}) => useInfiniteQuery(projectQueries.getAdminInfiniteProjects({ params }));

/**
 * 어드민 프로젝트 전체 목록 조회 훅 (단일 호출)
 *
 * @example
 * const { data: projects } = useAdminProjects()
 */
export const useAdminProjects = () =>
  useQuery(projectQueries.getAdminProjects());

/**
 * 어드민 프로젝트 단건 조회 훅 (GET /admin/projects/{id})
 *
 * @param {GetAdminProjectParams} params - 조회 파라미터
 * @param {number} params.id - 프로젝트 ID
 *
 * @example
 * const { data: project, isLoading } = useAdminProject({ params: { id: 1 } })
 */
export const useAdminProject = ({ params }: { params: GetAdminProjectParams }) =>
  useQuery(projectQueries.getAdminProject({ params }));

/**
 * 프로젝트 생성 훅 (어드민)
 *
 * @example
 * const { mutate: createProject, isPending } = useCreateProject()
 * createProject({ payload: { cohortId: 1, platforms: ['WEB'], name: '...', description: '...' } })
 */
export const useCreateProject = () =>
  useMutation(projectMutations.createProject());

/**
 * 프로젝트 수정 훅 (어드민)
 *
 * @example
 * const { mutate: updateProject, isPending } = useUpdateProject()
 * updateProject({ params: { id: 1 }, payload: { name: '수정된 이름' } })
 */
export const useUpdateProject = () =>
  useMutation(projectMutations.updateProject());

/**
 * 프로젝트 삭제 훅 (어드민)
 *
 * @example
 * const { mutate: deleteProject, isPending } = useDeleteProject()
 * deleteProject({ params: { id: 1 } })
 */
export const useDeleteProject = () =>
  useMutation(projectMutations.deleteProject());

/**
 * 프로젝트 참여자 수정 훅 (어드민)
 *
 * @example
 * const { mutate: updateMembers, isPending } = useUpdateProjectMembers()
 * updateMembers({ params: { id: 1 }, payload: { members: [{ name: '홍길동', part: 'FE' }] } })
 */
export const useUpdateProjectMembers = () =>
  useMutation(projectMutations.updateProjectMembers());
