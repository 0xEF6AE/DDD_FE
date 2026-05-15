import type { BlogPostDto } from "@ddd/api";
import type { ArticleItem } from "@/constants/articles";
import { toStringValue } from "./shared";

export function mapArticle(item: BlogPostDto): ArticleItem | null {
  const description = toStringValue(
    item.excerpt,
    toStringValue((item as BlogPostDto & { description?: unknown }).description),
  );
  if (!description) return null;

  const thumbnail = toStringValue(
    item.thumbnail,
    toStringValue(
      (item as BlogPostDto & { thumbnailUrl?: unknown }).thumbnailUrl,
      toStringValue((item as BlogPostDto & { imageUrl?: unknown }).imageUrl),
    ),
  );

  return {
    id: String(item.id),
    title: item.title,
    description,
    thumbnail,
  };
}
