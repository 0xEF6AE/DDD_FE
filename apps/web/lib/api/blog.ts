import { blogAPI } from "@ddd/api";
import type { ArticleItem } from "@/constants/articles";
import { mapArticle } from "@/lib/mappers/article";
import { ensureApiConfigured } from "./config";

export type ArticleCursorPage = {
  items: ArticleItem[];
  nextCursor: string | null;
};

export async function fetchPublicArticles(): Promise<ArticleItem[]> {
  ensureApiConfigured();
  const response = await blogAPI.getBlogPosts({ params: { limit: 100 } });
  return response.items
    .map(mapArticle)
    .filter((item): item is ArticleItem => Boolean(item));
}

export async function fetchPublicArticlesPage(options?: {
  cursor?: string;
  limit?: number;
}): Promise<ArticleCursorPage> {
  ensureApiConfigured();
  const response = await blogAPI.getBlogPosts({
    params: {
      cursor: options?.cursor,
      limit: options?.limit ?? 4,
    },
  });
  return {
    items: response.items
      .map(mapArticle)
      .filter((item): item is ArticleItem => Boolean(item)),
    nextCursor: response.nextCursor ?? null,
  };
}
