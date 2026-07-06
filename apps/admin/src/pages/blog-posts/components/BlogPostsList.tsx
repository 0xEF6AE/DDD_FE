import { useMemo } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"

import { blogQueries, type BlogPostDto } from "@ddd/api"

import { EmptyState } from "@/shared/ui/EmptyState"
import { FlexBox } from "@/shared/ui/FlexBox"

import { BlogPostsTable } from "./BlogPostsTable"

type BlogPostsListProps = {
  searchText: string
  onEdit: (post: BlogPostDto) => void
  onDelete: (post: BlogPostDto) => void
}

export const BlogPostsList = ({
  searchText,
  onEdit,
  onDelete,
}: BlogPostsListProps) => {
  const { data } = useSuspenseQuery(blogQueries.getAdminBlogPosts())

  const allPosts = useMemo<BlogPostDto[]>(() => data ?? [], [data])

  const filteredPosts = useMemo(() => {
    if (searchText.length === 0) return allPosts
    return allPosts.filter((post) => post.title.includes(searchText))
  }, [allPosts, searchText])

  if (filteredPosts.length === 0) {
    return (
      <EmptyState>
        {allPosts.length === 0
          ? "등록된 블로그가 없습니다."
          : "조건에 맞는 블로그가 없습니다."}
      </EmptyState>
    )
  }

  return (
    <>
      <BlogPostsTable
        posts={filteredPosts}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      <FlexBox className="justify-between pt-2">
        <span className="text-muted-foreground text-xs">
          현재 {filteredPosts.length}개 표시
        </span>
      </FlexBox>
    </>
  )
}
