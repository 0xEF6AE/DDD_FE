import { api } from "../fetchClient";
import type { FileUploadDto, PostUploadFileParams } from "./types";

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
};
