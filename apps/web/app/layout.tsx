import type { Metadata } from 'next';
import { PreAlertModal } from '@/components/modals/PreAlertModal';
import { RecruitStatusProvider } from "@/components/providers/RecruitStatusProvider";
import { getActiveCohort } from "@/lib/api/activeCohort.server";
import { getPreNotificationCohortName, parseRecruitStatus } from "@/lib/mappers/cohort";
import './globals.css';

/**
 * 모집 상태는 요청 시점에 조회한다.
 *
 * 루트 레이아웃이 렌더하는 Navigation CTA 가 모집 상태에 따라 바뀌므로, 이 레이아웃이
 * 정적으로 프리렌더되면 빌드 시점의 모집 상태가 모든 페이지 HTML 에 박제된다.
 * 실제로 어드민에서 14기를 "모집중" 으로 전환해도 배포 전까지 홈페이지가 계속
 * "사전 알림 신청" 을 노출하던 원인이 이것이다.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: 'DDD - 사이드 프로젝트로 성장하는 개발자 커뮤니티',
    template: '%s | DDD',
  },
  description:
    '개발자, 디자이너, 기획자가 함께 사이드 프로젝트를 만들고 성장하는 커뮤니티 DDD. 실전 협업 경험을 쌓아보세요.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const activeCohort = await getActiveCohort();
  const recruitStatus = parseRecruitStatus(activeCohort);

  return (
    <html lang="ko">
      <body>
        <RecruitStatusProvider recruitStatus={recruitStatus}>{children}</RecruitStatusProvider>
        <PreAlertModal cohortName={getPreNotificationCohortName(activeCohort)} />
      </body>
    </html>
  );
}
