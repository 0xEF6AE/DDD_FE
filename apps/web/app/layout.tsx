import type { Metadata } from 'next';
import { PreAlertModal } from '@/components/modals/PreAlertModal';
import { RecruitStatusProvider } from "@/components/providers/RecruitStatusProvider";
import { getActiveCohort } from "@/lib/api/activeCohort.server";
import { getApiPreconnectOrigin } from "@/lib/api/config";
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
  const apiOrigin = getApiPreconnectOrigin();

  return (
    <html lang="ko">
      <body>
        {/*
          API 도메인에 미리 연결해둔다 (React 가 <head> 로 hoist 한다).
          지원서 인증번호 발송처럼 클릭 직후 나가는 요청이 핸드셰이크부터 시작하지
          않게 하려는 것이다. `use-credentials` 는 실제 요청(`credentials: "include"`)
          과 자격증명 모드를 맞추려는 것으로, anonymous 로 두면 브라우저가 다른
          커넥션 풀에 넣어 preconnect 한 소켓을 재사용하지 못한다.
        */}
        {apiOrigin ? (
          <link rel="preconnect" href={apiOrigin} crossOrigin="use-credentials" />
        ) : null}
        <RecruitStatusProvider recruitStatus={recruitStatus}>{children}</RecruitStatusProvider>
        <PreAlertModal cohortName={getPreNotificationCohortName(activeCohort)} />
      </body>
    </html>
  );
}
