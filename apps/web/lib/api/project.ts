import { projectAPI, type ProjectPlatform } from "@ddd/api";
import type { ProjectItem } from "@/constants/projects";
import { mapProject } from "@/lib/mappers/project";
import { ensureApiConfigured } from "./config";

export type ProjectCursorPage = {
  items: ProjectItem[];
  nextCursor: string | null;
};

export async function fetchPublicProjects(): Promise<ProjectItem[]> {
  ensureApiConfigured();
  const response = await projectAPI.getProjects({ params: { limit: 100 } });
  return response.items.map(mapProject);
}

export async function fetchPublicProjectsPage(options?: {
  cursor?: string;
  limit?: number;
  platform?: ProjectPlatform;
}): Promise<ProjectCursorPage> {
  ensureApiConfigured();
  const response = await projectAPI.getProjects({
    params: {
      cursor: options?.cursor,
      limit: options?.limit ?? 9,
      platform: options?.platform,
    },
  });
  return {
    items: response.items.map(mapProject),
    nextCursor: response.nextCursor ?? null,
  };
}

export async function fetchPublicProjectById(id: string): Promise<ProjectItem | null> {
  ensureApiConfigured();
  const response = await projectAPI.getProject({ params: { id: Number(id) } });
  return mapProject(response);
}
