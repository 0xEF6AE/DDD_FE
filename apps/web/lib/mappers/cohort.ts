import type { CohortDto, CohortPartConfigDto, CohortPartName } from "@ddd/api";
import type { RecruitStatus } from "@/constants/recruit";
import type { ApplyPartOption } from "@/lib/api/cohort";

export function parseRecruitStatus(cohort: CohortDto | null | undefined): RecruitStatus {
  if (!cohort) return "closed";
  return cohort.status === "RECRUITING" ? "open" : "closed";
}

export function getActiveCohortId(cohort: CohortDto | null | undefined): number | null {
  return cohort?.id ?? null;
}

export function getActiveCohortPartId(cohort: CohortDto | null | undefined): number | null {
  const parts = cohort?.parts ?? [];
  const opened = parts.find((p) => p.isOpen && typeof p.id === "number");
  if (opened?.id != null) return opened.id;
  const first = parts.find((p) => typeof p.id === "number");
  return first?.id ?? null;
}

/** BE partName enum → 웹에서 노출하는 ApplyPartOption */
const PART_NAME_TO_APPLY: Record<CohortPartName, ApplyPartOption> = {
  IOS: "iOS",
  AND: "AOS",
  FE: "FE",
  BE: "BE",
  PM: "PM",
  PD: "PD",
};

export function buildApplyPartIdMap(
  cohort: CohortDto | null | undefined,
): Partial<Record<ApplyPartOption, number>> {
  const map: Partial<Record<ApplyPartOption, number>> = {};
  const parts: CohortPartConfigDto[] = cohort?.parts ?? [];
  for (const part of parts) {
    if (!part.isOpen) continue;
    if (typeof part.id !== "number") continue;
    const key = PART_NAME_TO_APPLY[part.partName];
    if (!key) continue;
    map[key] = part.id;
  }
  return map;
}
