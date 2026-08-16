import type { components, paths } from "../generated/api";

// POST /api/v1/admin/files/upload - 파일 업로드
export type PostUploadFileParams =
  paths["/api/v1/admin/files/upload"]["post"]["parameters"]["query"];
export type PostUploadFileResponse = FileUploadDto;

// 카테고리 (OpenAPI 스펙의 query enum 으로부터 추출)
export type FileUploadCategory = PostUploadFileParams["category"];

// POST /api/v1/admin/files/signed-url - 서명 URL 생성 (action=read 가 다운로드용)
export type PostCreateSignedUrlRequest =
  components["schemas"]["SignedUrlRequestDto"];
export type PostCreateSignedUrlResponse = SignedUrlDto;

// 엔티티 타입 (BE 응답 schema 미정의 → 수동 정의)
export interface FileUploadDto {
  url: string;
  key: string;
}

export interface SignedUrlDto {
  url: string;
  expiresAt?: string;
}
