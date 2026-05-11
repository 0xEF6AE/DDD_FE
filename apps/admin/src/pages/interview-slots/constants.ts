/** 파트 필터에서 "전체" 를 의미하는 sentinel */
export const ALL_PARTS = "all" as const

export type PartFilterValue = number | typeof ALL_PARTS
