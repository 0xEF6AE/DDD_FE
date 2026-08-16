import { api } from "../fetchClient";
import type {
  FileUploadDto,
  PostCreateSignedUrlRequest,
  PostCreateSignedUrlResponse,
  PostUploadFileParams,
} from "./types";

/**
 * 파일 업로드 - POST /api/v1/admin/files/upload
 *
 * BE OpenAPI 가 multipart body 와 201 응답 schema 를 명시하지 않아 타입 캐스트가 필요.
 * 런타임은 openapi-fetch 가 FormData 를 자동 감지해 그대로 전송. BE spec 보강 시 캐스트 제거.
 */
export const storageApi = {
  uploadFile: ({
    params,
    payload,
  }: {
    params: PostUploadFileParams;
    payload: FormData;
  }): Promise<FileUploadDto> =>
    api.post("/api/v1/admin/files/upload", {
      params: { query: { category: params.category } },
      body: payload,
    } as never) as unknown as Promise<FileUploadDto>,

  /**
   * 서명 URL 생성 - POST /api/v1/admin/files/signed-url
   *
   * `action: "read"` 로 다운로드용 URL 을 받는다. `path` 는 카테고리 prefix 로
   * 시작해야 하며(BE spec), 기본 만료는 600초·최대 3600초다.
   *
   * BE OpenAPI 가 200 응답 schema 를 명시하지 않아 캐스트가 필요하다.
   */
  createSignedUrl: ({
    payload,
  }: {
    payload: PostCreateSignedUrlRequest;
  }): Promise<PostCreateSignedUrlResponse> =>
    api.post("/api/v1/admin/files/signed-url", {
      body: payload,
    }) as unknown as Promise<PostCreateSignedUrlResponse>,
};
