import { configureApi, webApi } from "@ddd/api";
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

export async function subscribeEarlyNotification(email: string, cohortId: number): Promise<void> {
  ensureApiConfigured();
  await webApi.subscribeEarlyNotification({ email, cohortId });
}

export async function subscribeGeneralEarlyNotification(email: string): Promise<void> {
  ensureApiConfigured();
  await webApi.subscribeGeneralEarlyNotification({ email });
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

function extractActiveCohortParts(active: unknown): unknown[] {
  const roots: unknown[] = [];
  if (isObject(active)) {
    roots.push(active);
    if (isObject(active.data)) roots.push(active.data);
    if (isObject(active.cohort)) roots.push(active.cohort);
    const inner = active.result;
    if (isObject(inner)) roots.push(inner);
  }
  for (const node of roots) {
    if (!isObject(node)) continue;
    if (Array.isArray(node.parts)) return node.parts;
    if (Array.isArray(node.cohortParts)) return node.cohortParts;
    if (Array.isArray(node.recruitmentParts)) return node.recruitmentParts;
  }
  return [];
}

/** 백엔드가 id를 문자열로 주는 경우 등을 흡수합니다. */
function parseCohortPartRowId(raw: JsonObject): number | null {
  const candidates: unknown[] = [raw.id, raw.cohortPartId, raw.partId];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function parseActiveCohortId(payload: unknown): number | null {
  if (!isObject(payload)) return null;
  for (const key of ["id", "cohortId"] as const) {
    const v = payload[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function parseActiveCohortPartId(payload: unknown): number | null {
  if (!isObject(payload)) return null;

  const directPartIdCandidates = [payload.cohortPartId, payload.partId, payload.activePartId];
  for (const candidate of directPartIdCandidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string" && candidate.trim() !== "") {
      const n = Number(candidate);
      if (Number.isFinite(n)) return n;
    }
  }

  const parts = extractActiveCohortParts(payload);
  const openedPart = parts.find((part) => isObject(part) && part.isOpen === true);
  if (isObject(openedPart)) {
    const id = parseCohortPartRowId(openedPart);
    if (id !== null) return id;
  }

  const firstPart = parts.find((part) => isObject(part) && parseCohortPartRowId(part) !== null);
  if (isObject(firstPart)) {
    const id = parseCohortPartRowId(firstPart);
    if (id !== null) return id;
  }

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
  if (activeCohortId) {
    await subscribeEarlyNotification(email, activeCohortId);
    return;
  }
  await subscribeGeneralEarlyNotification(email);
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
    { option: "iOS", aliases: ["IOS", "IPHONE", "SWIFT", "아이폰", "아이오에스"] },
    {
      option: "AOS",
      aliases: ["AOS", "ANDROID", "KOTLIN", "AND", "안드로이드", "안드", "코틀린"],
    },
    {
      option: "FE",
      aliases: ["FE", "FRONTEND", "FRONT", "프론트", "프론트엔드", "웹프론트", "웹", "리액트"],
    },
    { option: "BE", aliases: ["BE", "BACKEND", "SERVER", "백엔드", "서버", "API"] },
    { option: "PM", aliases: ["PM", "PRODUCTMANAGER", "기획", "기획자", "프로덕트매니저", "서비스기획"] },
    {
      option: "PD",
      aliases: ["PD", "PRODUCTDESIGNER", "DESIGNER", "UX", "UI", "디자인", "디자이너", "UXUI"],
    },
  ];

  for (const { option, aliases } of groups) {
    if (aliases.some((alias) => token === normalizePartToken(alias))) return option;
  }
  for (const { option, aliases } of groups) {
    if (
      aliases.some((alias) => {
        const a = normalizePartToken(alias);
        return a.length >= 3 && token.includes(a);
      })
    ) {
      return option;
    }
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
  const parts = extractActiveCohortParts(active);
  const map: Partial<Record<ApplyPartOption, number>> = {};

  for (const raw of parts) {
    if (!isObject(raw)) continue;
    const id = parseCohortPartRowId(raw);
    if (id === null) continue;
    if (raw.isOpen === false) continue;

    const candidates = [
      toStringValue(raw.name),
      toStringValue(raw.code),
      toStringValue(raw.key),
      toStringValue(raw.slug),
      toStringValue(raw.type),
      toStringValue(raw.part),
      toStringValue(raw.track),
      toStringValue(raw.role),
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
