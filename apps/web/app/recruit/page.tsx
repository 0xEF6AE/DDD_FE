import type { Metadata } from "next";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { RecruitHeroSection } from "@/components/sections/RecruitHeroSection";
import { RecruitRolesSection } from "@/components/sections/RecruitRolesSection";
import { RecruitScheduleSection } from "@/components/sections/RecruitScheduleSection";
import { RecruitCurriculumSection } from "@/components/sections/RecruitCurriculumSection";
import { recruitPageMetaDescriptionByStatus } from "@/constants/recruit";
import { getActiveCohort } from "@/lib/api/activeCohort.server";
import { parseRecruitStatus } from "@/lib/mappers/cohort";
import { buildRecruitCurriculum, buildRecruitSchedules } from "@/lib/mappers/recruit";

export async function generateMetadata(): Promise<Metadata> {
  const activeCohort = await getActiveCohort();
  return {
    title: "DDD 모집 - 사이드 프로젝트 멤버 지원",
    description: recruitPageMetaDescriptionByStatus[parseRecruitStatus(activeCohort)],
  };
}

export default async function RecruitPage() {
  const activeCohort = await getActiveCohort();
  const cohortName = activeCohort?.name ?? null;

  return (
    <>
      <Navigation />
      <main>
        <RecruitHeroSection />
        <RecruitRolesSection />
        <RecruitScheduleSection
          cohortName={cohortName}
          schedules={buildRecruitSchedules(activeCohort)}
        />
        <RecruitCurriculumSection
          cohortName={cohortName}
          curriculum={buildRecruitCurriculum(activeCohort)}
        />
      </main>
      <Footer />
    </>
  );
}
