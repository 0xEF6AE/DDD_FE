import { applicationAPI, type PostSubmitApplicationRequest } from "@ddd/api";
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
