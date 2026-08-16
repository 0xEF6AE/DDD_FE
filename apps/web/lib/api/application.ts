import {
  ApiError,
  APPLICATION_ATTACHMENT_MAX_BYTES,
  APPLICATION_ATTACHMENT_MIME,
  applicationAPI,
  ErrorMessage,
  type ApplicationAttachmentDto,
  type PostSubmitApplicationRequest,
} from "@ddd/api";
import { ensureApiConfigured } from "./config";

/**
 * 임시저장 응답 안의 answers 를 꺼낸다.
 *
 * BE OpenAPI 가 GET /applications/draft/{cohortPartId} 의 응답 schema 를
 * 정의하지 않아 generated 타입이 `void` 다. 실제 응답에는 `answers` 필드가 있어
 * 여기서 unknown 으로 받아 좁힌다.
 */
export async function fetchApplicationDraftAnswers(
  cohortPartId: number,
): Promise<Record<string, unknown> | null> {
  ensureApiConfigured();
  try {
    const data = (await applicationAPI.getApplicationDraft({
      params: { cohortPartId },
    })) as unknown as { answers?: unknown } | null;
    const answers = data?.answers;
    if (answers && typeof answers === "object") {
      return answers as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveRecruitApplicationDraft(
  cohortPartId: number,
  answers: Record<string, unknown>,
): Promise<void> {
  ensureApiConfigured();
  await applicationAPI.saveApplicationDraft({
    payload: { cohortPartId, answers },
  });
}

export async function submitRecruitApplication(
  payload: PostSubmitApplicationRequest,
): Promise<void> {
  ensureApiConfigured();
  await applicationAPI.submitApplication({ payload });
}

/**
 * 지원서 첨부 PDF 업로드.
 *
 * 파일 타입·용량은 BE 도 검사하지만, 20MB 를 다 올린 뒤 413 으로 되돌려받는 왕복을
 * 없애려고 같은 규칙으로 먼저 거른다.
 *
 * 반환한 객체를 그대로 `answers[질문키]` 에 넣으면 된다. 업로드 즉시 저장되므로
 * 사용자가 파일을 교체해도 이전 파일은 스토리지에 남는다 — 최종 answers 에 담긴
 * 것만 유효하다.
 */
export async function uploadApplicationAttachment(
  file: File,
): Promise<ApplicationAttachmentDto> {
  if (file.type !== APPLICATION_ATTACHMENT_MIME || !/\.pdf$/i.test(file.name)) {
    throw new ApiError("FILE_TYPE_NOT_ALLOWED", ErrorMessage.FILE_TYPE_NOT_ALLOWED);
  }
  if (file.size > APPLICATION_ATTACHMENT_MAX_BYTES) {
    throw new ApiError("FILE_SIZE_EXCEEDED", ErrorMessage.FILE_SIZE_EXCEEDED);
  }

  ensureApiConfigured();
  const formData = new FormData();
  formData.append("file", file);
  return applicationAPI.uploadApplicationAttachment({ payload: formData });
}

/**
 * 첨부를 새 탭으로 연다.
 *
 * 서명 URL 은 10분 만료라 저장해두면 안 된다 — 열람 버튼을 누른 시점에 발급받는다.
 * 팝업 차단을 피하려고 사용자 제스처 안에서 빈 창을 먼저 열고 URL 을 나중에 채운다.
 */
export async function openApplicationAttachment(path: string): Promise<void> {
  const popup = window.open("", "_blank");
  try {
    ensureApiConfigured();
    const { url } = await applicationAPI.getApplicationAttachmentSignedUrl({
      params: { path },
    });
    if (popup) {
      popup.location.href = url;
      return;
    }
    window.location.href = url;
  } catch (e) {
    popup?.close();
    throw e;
  }
}
