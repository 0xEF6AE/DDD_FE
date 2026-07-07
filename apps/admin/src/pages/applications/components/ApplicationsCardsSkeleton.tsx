import { Skeleton } from "@heroui/react"

import { GridBox } from "@/shared/ui/GridBox"

const CARD_COUNT = 5

export const ApplicationsCardsSkeleton = () => {
  return (
    <GridBox className="grid-cols-5 gap-5">
      {Array.from({ length: CARD_COUNT }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg bg-white p-5 shadow">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-7 w-14 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      ))}
    </GridBox>
  )
}
