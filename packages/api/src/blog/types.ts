import type { components, paths } from "../generated/api";

// Request DTO
export type CreateBlogPostRequestDto = components["schemas"]["CreateBlogPostRequestDto"];
export type UpdateBlogPostRequestDto = components["schemas"]["UpdateBlogPostRequestDto"];

// GET /api/v1/blog-posts - 공개 목록 조회
export type GetBlogPostsParams =
  paths["/api/v1/blog-posts"]["get"]["parameters"]["query"];
export type GetBlogPostsResponse = BlogPostListDto;

// 무한 스크롤용 (cursor 는 useInfiniteQuery pageParam 이 관리)
export type GetInfiniteBlogPostsParams = Omit<NonNullable<GetBlogPostsParams>, "cursor">;

// GET /api/v1/admin/blog-posts - 어드민 전체 목록 (BE 는 envelope 없이 배열을 반환)
export type GetAdminBlogPostsResponse = BlogPostDto[];

// GET /api/v1/admin/blog-posts/{id} - 어드민 단건
export type GetAdminBlogPostParams = { id: number };
export type GetAdminBlogPostResponse = BlogPostDto;

// POST /api/v1/admin/blog-posts - 어드민 생성
export type PostCreateBlogPostRequest = CreateBlogPostRequestDto;
export type PostCreateBlogPostResponse = BlogPostDto;

// PATCH /api/v1/admin/blog-posts/{id} - 어드민 수정
export type PatchUpdateBlogPostParams = { id: number };
export type PatchUpdateBlogPostRequest = UpdateBlogPostRequestDto;
export type PatchUpdateBlogPostResponse = BlogPostDto;

// DELETE /api/v1/admin/blog-posts/{id} - 어드민 삭제
export type DeleteBlogPostParams = { id: number };
export type DeleteBlogPostResponse = void;

// 엔티티 타입 (BE 응답 schema 미정의 → 수동 정의)
export interface BlogPostDto {
  id: number;
  title: string;
  excerpt: string;
  thumbnail?: string;
  externalUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPostListDto {
  items: BlogPostDto[];
  nextCursor?: string;
  hasMore: boolean;
}
