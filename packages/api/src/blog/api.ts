import {
  blogGetAdminList,
  blogGetAdminById,
  blogCreateAdmin,
  blogUpdateAdminById,
  blogDeleteAdminById,
} from "../generated/admin-blog/admin-blog";
import { blogGetPublicList as blogGetPublicListFn } from "../generated/blog/blog";
import type {
  GetBlogPostsParams,
  GetBlogPostsResponse,
  GetAdminBlogPostParams,
  GetAdminBlogPostResponse,
  PostCreateBlogPostRequest,
  PostCreateBlogPostResponse,
  PatchUpdateBlogPostParams,
  PatchUpdateBlogPostRequest,
  PatchUpdateBlogPostResponse,
  DeleteBlogPostParams,
} from "./types";

export const blogAPI = {
  /** 공개 블로그 게시글 목록 조회 (커서 기반 페이지네이션) */
  // NOTE: BE OpenAPI 가 페이지네이션 응답 schema 를 명시하지 않아 generated 가 apiFetch<void>
  // 로 호출됨 → 응답 타입을 캐스팅으로 보강. BE spec 보강 시 제거.
  getBlogPosts: ({ params }: { params: GetBlogPostsParams }) =>
    blogGetPublicListFn(params) as unknown as Promise<GetBlogPostsResponse>,

  /** 어드민 블로그 게시글 전체 목록 조회 */
  getAdminBlogPosts: () =>
    blogGetAdminList() as unknown as Promise<GetBlogPostsResponse>,

  /** 어드민 블로그 게시글 단건 조회 */
  getAdminBlogPost: ({ params }: { params: GetAdminBlogPostParams }) =>
    blogGetAdminById(params.id),

  /** 블로그 게시글 생성 (어드민) */
  createBlogPost: ({ payload }: { payload: PostCreateBlogPostRequest }) =>
    blogCreateAdmin(payload),

  /** 블로그 게시글 수정 (어드민) */
  updateBlogPost: ({
    params,
    payload,
  }: {
    params: PatchUpdateBlogPostParams;
    payload: PatchUpdateBlogPostRequest;
  }) => blogUpdateAdminById(params.id, payload),

  /** 블로그 게시글 삭제 (어드민) */
  deleteBlogPost: ({ params }: { params: DeleteBlogPostParams }) =>
    blogDeleteAdminById(params.id),
};
