import { mutationOptions } from "@tanstack/react-query";
import { storageApi } from "./api";
import type { PostCreateSignedUrlRequest, PostUploadFileParams } from "./types";

export const storageMutations = {
  /**
   * 파일 업로드 mutation
   *
   * @returns {MutationOptions} TanStack Query Mutation 옵션 객체
   *
   * @example
   * const mutation = useMutation(storageMutations.uploadFile())
   * const formData = new FormData()
   * formData.append('file', file)
   * mutation.mutate({ params: { category: 'project-thumbnail' }, payload: formData })
   */
  uploadFile: () =>
    mutationOptions({
      mutationFn: ({
        params,
        payload,
      }: {
        params: PostUploadFileParams;
        payload: FormData;
      }) => storageApi.uploadFile({ params, payload }),
    }),

  /**
   * 서명 URL 발급 mutation
   *
   * 발급된 URL 은 만료가 있어(기본 600초) 캐싱하면 안 된다. query 가 아니라
   * mutation 으로 두어 열람 시점에만 발급받는다.
   *
   * @example
   * const mutation = useMutation(storageMutations.createSignedUrl())
   * const { url } = await mutation.mutateAsync({ payload: { path, action: 'read' } })
   */
  createSignedUrl: () =>
    mutationOptions({
      mutationFn: ({ payload }: { payload: PostCreateSignedUrlRequest }) =>
        storageApi.createSignedUrl({ payload }),
    }),
};
