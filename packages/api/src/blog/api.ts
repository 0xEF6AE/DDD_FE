import { api } from "../fetchClient";
import type {
  GetBlogPostsParams,
  GetBlogPostsResponse,
  GetAdminBlogPostsResponse,
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
  /** 공개 블로그 게시글 목록 (cursor 페이지네이션) - GET /api/v1/blog-posts */
  getBlogPosts: ({ params }: { params: GetBlogPostsParams }) =>
    api.get("/api/v1/blog-posts", {
      params: { query: params },
    }) as unknown as Promise<GetBlogPostsResponse>,

  /** 어드민 블로그 전체 목록 - GET /api/v1/admin/blog-posts */
  getAdminBlogPosts: () =>
    api.get("/api/v1/admin/blog-posts") as unknown as Promise<GetAdminBlogPostsResponse>,

  /** 어드민 블로그 단건 - GET /api/v1/admin/blog-posts/{id} */
  getAdminBlogPost: ({ params }: { params: GetAdminBlogPostParams }) =>
    api.get("/api/v1/admin/blog-posts/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<GetAdminBlogPostResponse>,

  /** 어드민 블로그 생성 - POST /api/v1/admin/blog-posts */
  createBlogPost: ({ payload }: { payload: PostCreateBlogPostRequest }) =>
    api.post("/api/v1/admin/blog-posts", {
      body: payload,
    }) as unknown as Promise<PostCreateBlogPostResponse>,

  /** 어드민 블로그 수정 - PATCH /api/v1/admin/blog-posts/{id} */
  updateBlogPost: ({
    params,
    payload,
  }: {
    params: PatchUpdateBlogPostParams;
    payload: PatchUpdateBlogPostRequest;
  }) =>
    api.patch("/api/v1/admin/blog-posts/{id}", {
      params: { path: { id: params.id } },
      body: payload,
    }) as unknown as Promise<PatchUpdateBlogPostResponse>,

  /** 어드민 블로그 삭제 - DELETE /api/v1/admin/blog-posts/{id} */
  deleteBlogPost: ({ params }: { params: DeleteBlogPostParams }) =>
    api.delete("/api/v1/admin/blog-posts/{id}", {
      params: { path: { id: params.id } },
    }) as unknown as Promise<void>,
};
