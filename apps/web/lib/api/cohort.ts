import { cohortPublicAPI, type PublicCohortDto, type PublicCohortPartDetail } from "@ddd/api";
import type { RecruitStatus } from "@/constants/recruit";
import {
  buildApplyParts,
  buildApplyQuestions,
  getActiveCohortId,
  getActiveCohortPartId,
  parseRecruitStatus,
  type ApplyPart,
  type ApplyQuestion,
} from "@/lib/mappers/cohort";
import { ensureApiConfigured } from "./config";

/**
 * 활성 기수 원본 응답 — 아래 파생 조회들의 단일 진입점.
 *
 * 활성 기수가 없거나 조회에 실패하면 null 을 돌려주고, 호출부는 각자의 안전한
 * 기본값으로 떨어진다. (모집 상태는 "preNotification", 일정/커리큘럼은 빈 목록)
 */
export async function fetchActiveCohort(): Promise<PublicCohortDto | null> {
  try {
    ensureApiConfigured();
    return await cohortPublicAPI.getActiveCohort();
  } catch {
    return null;
  }
}

export async function fetchRecruitStatus(): Promise<RecruitStatus> {
  return parseRecruitStatus(await fetchActiveCohort());
}

export async function fetchActiveCohortId(): Promise<number | null> {
  return getActiveCohortId(await fetchActiveCohort());
}

export async function fetchCohortPartByActiveCohortId(): Promise<PublicCohortPartDetail | null> {
  try {
    ensureApiConfigured();
    const partId = getActiveCohortPartId(await fetchActiveCohort());
    if (!partId) return null;
    return await cohortPublicAPI.getCohortPart({ params: { id: partId } });
  } catch {
    return null;
  }
}

export async function fetchApplyParts(): Promise<ApplyPart[]> {
  ensureApiConfigured();
  const active = await cohortPublicAPI.getActiveCohort();
  return buildApplyParts(active);
}

/**
 * 선택한 파트의 지원서 질문 목록.
 *
 * 제출 시 answers 의 키는 이 질문들의 `key` 여야 한다. 고정 키로 보내면
 * 400 INVALID_APPLICATION_ANSWERS 가 나므로 반드시 이 결과를 기준으로 렌더·제출한다.
 */
export async function fetchApplyQuestions(cohortPartId: number): Promise<ApplyQuestion[]> {
  ensureApiConfigured();
  const part = await cohortPublicAPI.getCohortPart({ params: { id: cohortPartId } });
  return buildApplyQuestions(part);
}
