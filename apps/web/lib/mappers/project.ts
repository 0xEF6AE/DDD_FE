import type { ProjectDto, ProjectPlatform } from "@ddd/api";
import type { ProjectItem } from "@/constants/projects";
import { toStringValue } from "./shared";

function toProjectCategory(platforms: ProjectPlatform[] | undefined): ProjectItem["category"] {
  if (!platforms || platforms.length === 0) return "WEB";
  const raw = String(platforms[0]).toUpperCase();
  if (raw === "IOS") return "iOS";
  if (raw === "AOS") return "AOS";
  return "WEB";
}

export function mapProject(item: ProjectDto): ProjectItem {
  const participants = (item.members ?? [])
    .map((member) => {
      const name = toStringValue(member.name);
      const role = toStringValue(member.part);
      if (!name || !role) return null;
      return { name, role };
    })
    .filter((member): member is { name: string; role: string } => Boolean(member));

  return {
    id: String(item.id),
    title: item.name,
    description: item.description,
    category: toProjectCategory(item.platforms),
    generation: toStringValue((item as ProjectDto & { cohortName?: unknown }).cohortName, "DDD"),
    thumbnail: toStringValue(item.thumbnailUrl),
    banner: toStringValue(item.thumbnailUrl),
    pdf: toStringValue(item.pdfUrl),
    detailTitle: item.name,
    longDescription: item.description,
    participants,
  };
}
