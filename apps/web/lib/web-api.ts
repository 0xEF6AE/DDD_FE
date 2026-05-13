import { configureApi, webApi } from "@ddd/api";
import { ApiError } from "@ddd/api";
import type { SubmitApplicationRequest } from "@ddd/api";
import type { ArticleItem } from "@/constants/articles";
import type { ProjectItem } from "@/constants/projects";
import type { RecruitStatus } from "@/constants/recruit";

type JsonObject = Record<string, unknown>;

function ensureApiConfigured() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  configureApi(baseUrl);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

/** API가 `data: T[]` 또는 `data: { items, nextCursor }` 중 어떤 형태로 오든 목록을 꺼냅니다. */
function normalizeCursorListPayload(data: unknown): { items: unknown[]; nextCursor: string | null } {
  if (Array.isArray(data)) {
    return { items: data, nextCursor: null };
  }
  if (!isObject(data)) {
    return { items: [], nextCursor: null };
  }
  const items = Array.isArray(data.items) ? data.items : [];
  const nextCursor =
    typeof data.nextCursor === "string" && data.nextCursor ? data.nextCursor : null;
  return { items, nextCursor };
}

function toStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toProjectCategory(platforms: unknown): ProjectItem["category"] {
  if (!Array.isArray(platforms) || platforms.length === 0) return "WEB";
  const raw = String(platforms[0]).toUpperCase();
  if (raw === "IOS") return "iOS";
  if (raw === "AOS") return "AOS";
  return "WEB";
}

function mapProject(item: unknown): ProjectItem | null {
  if (!isObject(item)) return null;

  const id = item.id;
  const title = item.name;
  const description = item.description;
  if (typeof id !== "number" || typeof title !== "string" || typeof description !== "string") {
    return null;
  }

  const participants = Array.isArray(item.members)
    ? item.members
        .map((member) => {
          if (!isObject(member)) return null;
          const name = toStringValue(member.name);
          const role = toStringValue(member.part);
          if (!name || !role) return null;
          return { name, role };
        })
        .filter((member): member is { name: string; role: string } => Boolean(member))
    : [];

  return {
    id: String(id),
    title,
    description,
    category: toProjectCategory(item.platforms),
    generation: toStringValue(item.cohortName, "DDD"),
    thumbnail: toStringValue(item.thumbnailUrl),
    banner: toStringValue(item.thumbnailUrl),
    pdf: toStringValue(item.pdfUrl),
    detailTitle: title,
    longDescription: description,
    participants,
  };
}

type ProjectPlatform = "IOS" | "AOS" | "WEB";

function mapArticle(item: unknown): ArticleItem | null {
  if (!isObject(item)) return null;
  const id = item.id;
  const title = item.title;
  const description = toStringValue(item.excerpt, toStringValue(item.description));
  if (typeof id !== "number" || typeof title !== "string" || !description) {
    return null;
  }

  const thumbnail = toStringValue(
    item.thumbnail,
    toStringValue(item.thumbnailUrl, toStringValue(item.imageUrl)),
  );

  return {
    id: String(id),
    title,
    description,
    thumbnail,
  };
}

export async function fetchPublicProjects(): Promise<ProjectItem[]> {
  ensureApiConfigured();
  const response = await webApi.getProjects({ limit: 100 });
  const { items } = normalizeCursorListPayload(response);
  return items.map(mapProject).filter((item): item is ProjectItem => Boolean(item));
}

export type ProjectCursorPage = {
  items: ProjectItem[];
  nextCursor: string | null;
};

export async function fetchPublicProjectsPage(options?: {
  cursor?: string;
  limit?: number;
  platform?: ProjectPlatform;
}): Promise<ProjectCursorPage> {
  ensureApiConfigured();
  const response = await webApi.getProjects({
    cursor: options?.cursor,
    limit: options?.limit ?? 9,
    platform: options?.platform,
  });
  const { items, nextCursor } = normalizeCursorListPayload(response);
  const mapped = items.map(mapProject).filter((item): item is ProjectItem => Boolean(item));

  return { items: mapped, nextCursor };
}

export async function fetchPublicProjectById(id: string): Promise<ProjectItem | null> {
  ensureApiConfigured();
  const response = await webApi.getProjectById(Number(id));
  return mapProject(response);
}

export async function fetchPublicArticles(): Promise<ArticleItem[]> {
  ensureApiConfigured();
  const response = await webApi.getBlogPosts({ limit: 100 });
  const { items } = normalizeCursorListPayload(response);
  return items.map(mapArticle).filter((item): item is ArticleItem => Boolean(item));
}

export type ArticleCursorPage = {
  items: ArticleItem[];
  nextCursor: string | null;
};

export async function fetchPublicArticlesPage(
  options?: { cursor?: string; limit?: number },
): Promise<ArticleCursorPage> {
  ensureApiConfigured();
  const response = await webApi.getBlogPosts({
    cursor: options?.cursor,
    limit: options?.limit ?? 4,
  });

  const { items, nextCursor } = normalizeCursorListPayload(response);
  const mapped = items.map(mapArticle).filter((item): item is ArticleItem => Boolean(item));

  return { items: mapped, nextCursor };
}

export async function subscribeEarlyNotification(email: string, cohortId = 1): Promise<void> {
  ensureApiConfigured();
  await webApi.subscribeEarlyNotification({ email, cohortId });
}

function parseRecruitStatusFromActiveCohort(payload: unknown): RecruitStatus {
  if (!isObject(payload)) return "closed";

  const ctaStatus = toStringValue(payload.ctaButtonStatus).toUpperCase();
  if (ctaStatus) {
    if (["APPLY", "OPEN", "RECRUIT_OPEN", "ENABLED"].includes(ctaStatus)) return "open";
    if (["NOTIFY", "CLOSED", "DISABLED"].includes(ctaStatus)) return "closed";
  }

  const status = toStringValue(payload.status, toStringValue(payload.cohortStatus)).toUpperCase();
  if (status.includes("RECRUIT")) return "open";
  return "closed";
}

function parseActiveCohortId(payload: unknown): number | null {
  if (!isObject(payload)) return null;
  const id = payload.id;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  const cohortId = payload.cohortId;
  if (typeof cohortId === "number" && Number.isFinite(cohortId)) return cohortId;
  return null;
}

function parseActiveCohortPartId(payload: unknown): number | null {
  if (!isObject(payload)) return null;

  const directPartIdCandidates = [payload.cohortPartId, payload.partId, payload.activePartId];
  const directPartId = directPartIdCandidates.find(
    (candidate) => typeof candidate === "number" && Number.isFinite(candidate),
  );
  if (typeof directPartId === "number") return directPartId;

  const parts = Array.isArray(payload.parts) ? payload.parts : [];
  const openedPart = parts.find((part) => isObject(part) && part.isOpen === true);
  if (isObject(openedPart) && typeof openedPart.id === "number" && Number.isFinite(openedPart.id)) {
    return openedPart.id;
  }

  const firstPart = parts.find(
    (part) => isObject(part) && typeof part.id === "number" && Number.isFinite(part.id),
  );
  if (isObject(firstPart) && typeof firstPart.id === "number") return firstPart.id;

  return null;
}

export async function fetchRecruitStatus(): Promise<RecruitStatus> {
  try {
    ensureApiConfigured();
    const response = await webApi.getActiveCohort();
    return parseRecruitStatusFromActiveCohort(response);
  } catch {
    return "closed";
  }
}

export async function fetchActiveCohortId(): Promise<number | null> {
  try {
    ensureApiConfigured();
    const response = await webApi.getActiveCohort();
    return parseActiveCohortId(response);
  } catch {
    return null;
  }
}

export async function fetchCohortPartByActiveCohortId(): Promise<JsonObject | null> {
  try {
    ensureApiConfigured();
    const activeCohort = await webApi.getActiveCohort();
    const activeCohortPartId = parseActiveCohortPartId(activeCohort);
    if (!activeCohortPartId) return null;
    const response = await webApi.getCohortPartById(activeCohortPartId);
    if (!isObject(response)) return null;
    return response;
  } catch {
    return null;
  }
}

export async function subscribeEarlyNotificationWithActiveCohort(email: string): Promise<void> {
  const activeCohortId = await fetchActiveCohortId();
  if (!activeCohortId) {
    throw new ApiError(
      "BAD_REQUEST",
      "활성 기수 정보를 찾지 못했습니다. 잠시 후 다시 시도해주세요.",
    );
  }
  await subscribeEarlyNotification(email, activeCohortId);
}

export const APPLY_PART_OPTIONS = ["iOS", "AOS", "FE", "BE", "PM", "PD"] as const;
export type ApplyPartOption = (typeof APPLY_PART_OPTIONS)[number];

function normalizePartToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s._-]/g, "");
}

function labelToApplyPartOption(raw: string): ApplyPartOption | null {
  const token = normalizePartToken(raw);
  if (!token) return null;

  const groups: Array<{ option: ApplyPartOption; aliases: string[] }> = [
    { option: "iOS", aliases: ["IOS", "IPHONE", "SWIFT"] },
    { option: "AOS", aliases: ["AOS", "ANDROID", "KOTLIN", "AND"] },
    { option: "FE", aliases: ["FE", "FRONTEND", "FRONT"] },
    { option: "BE", aliases: ["BE", "BACKEND", "SERVER"] },
    { option: "PM", aliases: ["PM", "PRODUCTMANAGER"] },
    { option: "PD", aliases: ["PD", "PRODUCTDESIGNER", "DESIGNER", "UX", "UI"] },
  ];

  for (const { option, aliases } of groups) {
    if (aliases.some((alias) => token === alias)) return option;
  }
  for (const { option, aliases } of groups) {
    if (aliases.some((alias) => alias.length >= 4 && token.includes(alias))) return option;
  }

  const direct: Record<string, ApplyPartOption> = {
    IOS: "iOS",
    AND: "AOS",
    AOS: "AOS",
    FE: "FE",
    BE: "BE",
    PM: "PM",
    PD: "PD",
  };
  return direct[token] ?? null;
}

export async function fetchApplyPartIdMap(): Promise<Partial<Record<ApplyPartOption, number>>> {
  ensureApiConfigured();
  const active = await webApi.getActiveCohort();
  const parts = Array.isArray(active.parts) ? active.parts : [];
  const map: Partial<Record<ApplyPartOption, number>> = {};

  for (const raw of parts) {
    if (!isObject(raw)) continue;
    const id = raw.id;
    if (typeof id !== "number" || !Number.isFinite(id)) continue;
    if (raw.isOpen === false) continue;

    const candidates = [
      toStringValue(raw.track),
      toStringValue(raw.role),
      toStringValue(raw.part),
      toStringValue(raw.name),
      toStringValue(raw.partName),
      toStringValue(raw.title),
      toStringValue(raw.label),
    ].filter((value) => value.length > 0);

    let matched: ApplyPartOption | null = null;
    for (const candidate of candidates) {
      matched = labelToApplyPartOption(candidate);
      if (matched) break;
    }
    if (matched) map[matched] = id;
  }

  return map;
}

export async function fetchApplicationDraftAnswers(
  cohortPartId: number,
): Promise<Record<string, unknown> | null> {
  ensureApiConfigured();
  try {
    const data = await webApi.getApplicationDraftByPart(cohortPartId);
    if (!isObject(data)) return null;
    const answers = data.answers;
    if (isObject(answers)) return answers as Record<string, unknown>;
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
  await webApi.saveApplicationDraft({ cohortPartId, answers });
}

export async function submitRecruitApplication(payload: SubmitApplicationRequest): Promise<void> {
  ensureApiConfigured();
  await webApi.submitApplication(payload);
}

export function birthInputToApiDate(birth: string): string | undefined {
  const match = birth.trim().match(/^(\d{4})[/.-](\d{2})[/.-](\d{2})$/);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** OpenAPI `applicantPhone` 패턴(01x-…-xxxx)에 맞게 하이픈을 넣습니다. */
export function formatApplicantPhoneKorea(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && /^01[0-9]/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10 && /^01[0-9]/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return trimmed;
}
