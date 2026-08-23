"use client";

import { createContext, useContext } from "react";
import type { MouseEvent, ReactNode } from "react";
import type { RecruitStatus } from "@/constants/recruit";
import { recruitButtonLabelsByStatus } from "@/constants/recruit";
import { openPreAlertModal } from "@/components/modals/PreAlertModal";

type RecruitStatusContextValue = {
  recruitStatus: RecruitStatus;
  isRecruitOpen: boolean;
  isRecruitClosed: boolean;
  recruitButtonLabels: {
    navigation: string;
    hero: string;
  };
};

const RecruitStatusContext = createContext<RecruitStatusContextValue>({
  recruitStatus: "preNotification",
  isRecruitOpen: false,
  isRecruitClosed: false,
  recruitButtonLabels: recruitButtonLabelsByStatus.preNotification,
});

export const RecruitStatusProvider = ({
  recruitStatus,
  children,
}: {
  recruitStatus: RecruitStatus;
  children: ReactNode;
}) => {
  const value: RecruitStatusContextValue = {
    recruitStatus,
    isRecruitOpen: recruitStatus === "open",
    isRecruitClosed: recruitStatus === "closed",
    recruitButtonLabels: recruitButtonLabelsByStatus[recruitStatus],
  };

  return <RecruitStatusContext.Provider value={value}>{children}</RecruitStatusContext.Provider>;
};

export const useRecruitStatus = () => useContext(RecruitStatusContext);

/**
 * 모집 CTA 앵커의 클릭 동작 — 상태별 분기를 한 곳에서만 정의한다.
 *
 * - open: 기본 링크 이동 (지원서)
 * - preNotification: 이동을 막고 사전 알림 모달
 * - closed: 아무 동작도 하지 않는다 — [모집 종료] 는 비활성 버튼이다
 */
export const useRecruitCtaClick = () => {
  const { isRecruitOpen, isRecruitClosed } = useRecruitStatus();

  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (isRecruitOpen) return;
    event.preventDefault();
    if (isRecruitClosed) return;
    openPreAlertModal();
  };
};
