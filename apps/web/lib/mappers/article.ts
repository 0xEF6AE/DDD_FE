import type { BlogPostDto } from "@ddd/api";
import type { ArticleItem } from "@/constants/articles";
import { toStringValue } from "./shared";

export function mapArticle(item: BlogPostDto): ArticleItem | null {
  // 제목만 필수. 요약/썸네일이 비어 있어도 어드민에 등록된 글은 그대로 노출한다.
  const title = toStringValue(item.title);
  if (!title) return null;

  const description = toStringValue(
    item.excerpt,
    toStringValue((item as BlogPostDto & { description?: unknown }).description),
  );

  const thumbnail = toStringValue(
    item.thumbnail,
    toStringValue(
      (item as BlogPostDto & { thumbnailUrl?: unknown }).thumbnailUrl,
      toStringValue((item as BlogPostDto & { imageUrl?: unknown }).imageUrl),
    ),
  );

  const externalUrl = toStringValue(
    item.externalUrl,
    toStringValue(
      (item as BlogPostDto & { url?: unknown }).url,
      toStringValue((item as BlogPostDto & { link?: unknown }).link),
    ),
  );

  return {
    id: String(item.id),
    title,
    description,
    thumbnail,
    externalUrl,
  };
}
