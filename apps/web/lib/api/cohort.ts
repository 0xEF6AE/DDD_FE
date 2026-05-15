import { cohortPublicAPI, type CohortPartConfigDto } from "@ddd/api";
import type { RecruitStatus } from "@/constants/recruit";
import {
  buildApplyPartIdMap,
  getActiveCohortId,
  getActiveCohortPartId,
  parseRecruitStatus,
} from "@/lib/mappers/cohort";
import { ensureApiConfigured } from "./config";

export const APPLY_PART_OPTIONS = ["iOS", "AOS", "FE", "BE", "PM", "PD"] as const;
export type ApplyPartOption = (typeof APPLY_PART_OPTIONS)[number];

export async function fetchRecruitStatus(): Promise<RecruitStatus> {
  try {
    ensureApiConfigured();
    const response = await cohortPublicAPI.getActiveCohort();
    return parseRecruitStatus(response);
  } catch {
    return "closed";
  }
}

export async function fetchActiveCohortId(): Promise<number | null> {
  try {
    ensureApiConfigured();
    const response = await cohortPublicAPI.getActiveCohort();
    return getActiveCohortId(response);
  } catch {
    return null;
  }
}

export async function fetchCohortPartByActiveCohortId(): Promise<CohortPartConfigDto | null> {
  try {
    ensureApiConfigured();
    const activeCohort = await cohortPublicAPI.getActiveCohort();
    const partId = getActiveCohortPartId(activeCohort);
    if (!partId) return null;
    return await cohortPublicAPI.getCohortPart({ params: { id: partId } });
  } catch {
    return null;
  }
}

export async function fetchApplyPartIdMap(): Promise<Partial<Record<ApplyPartOption, number>>> {
  ensureApiConfigured();
  const active = await cohortPublicAPI.getActiveCohort();
  return buildApplyPartIdMap(active);
}
