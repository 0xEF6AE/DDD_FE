export type ProjectCategory = "전체" | "iOS" | "AOS" | "WEB";

export type ProjectItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: Exclude<ProjectCategory, "전체">;
  generation: string;
  banner: string;
  pdf: string;
  detailTitle: string;
  longDescription: string;
  participants: Array<{ name: string; role: string }>;
};
