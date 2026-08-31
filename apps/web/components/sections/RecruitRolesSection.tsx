"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { colors, fontWeights } from "@/constants/tokens";
import { recruitParts } from "@/constants/recruit";

const Section = styled.section({
  background: colors.background,
  padding: "80px 80px",

  "@media (max-width: 1024px)": { padding: "80px 80px" },
  "@media (max-width: 768px)": { padding: "80px 40px" },
  "@media (max-width: 767px)": { padding: "40px 16px" },
});

const Inner = styled.div({
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
});

const Title = styled.h2({
  margin: 0,
  textAlign: "center",
  color: colors.textInverse,
  fontSize: "40px",
  lineHeight: "50px",
  fontWeight: fontWeights.bold,
  "@media (max-width: 1024px)": {
    fontSize: "34px",
    lineHeight: "45px",
  },
  "@media (max-width: 768px)": {
    fontSize: "30px",
    lineHeight: "38px",
  },
  "@media (max-width: 767px)": {
    fontSize: "20px",
    lineHeight: "25px",
  },
});

const Grid = styled.div({
  marginTop: "40px",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "24px",

  "@media (max-width: 768px)": {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  // 375 프레임은 카드가 마진(16)을 뺀 전체 폭을 쓰는 1열이다.
  "@media (max-width: 767px)": {
    gridTemplateColumns: "1fr",
    gap: "12px",
  },
});

const Card = styled.article({
  borderRadius: "30px",
  padding: "40px",
  background: colors.backgroundDark,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  transition: "background 0.2s ease",

  // iOS Safari 는 탭 후 :hover 가 남아 카드가 파란 채로 굳는다. hover 를 실제로
  // 지원하는 기기에서만 배경을 바꾼다.
  "@media (hover: hover)": {
    "&:hover": { background: colors.primary },
  },

  "&:focus-visible": {
    background: colors.primary,
  },

  // 터치 기기에는 hover 가 없다. 탭한 카드에 is-open 을 붙여 hover 와 같은
  // 상태로 만든다. pointer 커서는 iOS Safari 가 비대화형 요소의 click 을
  // 무시하지 않게 하는 조건이라 함께 둔다.
  "@media (hover: none)": {
    cursor: "pointer",

    "&.is-open": {
      background: colors.primary,
    },
  },

  "@media (max-width: 767px)": {
    padding: "20px",
    borderRadius: "24px",
  },
});

const RoleName = styled.h3({
  margin: 0,
  color: colors.textInverse,
  fontSize: "28px",
  lineHeight: "32px",
  fontWeight: fontWeights.semiBold,
  "@media (max-width: 1024px)": { fontSize: "24px", lineHeight: "30px" },
  "@media (max-width: 768px)": { fontSize: "20px", lineHeight: "25px" },
  "@media (max-width: 767px)": { fontSize: "16px", lineHeight: "20px" },
});

const RoleDescription = styled.p({
  margin: 0,
  color: colors.mainLight,
  fontSize: "20px",
  lineHeight: "28px",
  fontWeight: fontWeights.medium,
  maxHeight: 0,
  opacity: 0,
  overflow: "hidden",
  transition: "max-height 0.2s ease, opacity 0.15s ease, margin-top 0.2s ease",
  marginTop: 0,

  "@media (hover: hover)": {
    ".role-card:hover &": {
      // 실제 높이가 아니라 상한이다. 3단 그리드가 가장 좁아지는 1024 폭에서
      // 가장 긴 설명이 6줄(≈138px)까지 가므로 120px 면 잘린다.
      maxHeight: "240px",
      opacity: 1,
      marginTop: "12px",
    },
  },

  ".role-card:focus-visible &": {
    maxHeight: "240px",
    opacity: 1,
    marginTop: "12px",
  },

  // 터치 기기에는 hover 가 없다. 탭한 카드만 hover 처럼 소개를 펼친다.
  "@media (hover: none)": {
    ".role-card.is-open &": {
      maxHeight: "240px",
      opacity: 1,
      marginTop: "12px",
    },
  },

  "@media (max-width: 1024px)": { fontSize: "18px", lineHeight: "23px" },
  "@media (max-width: 768px)": { fontSize: "16px", lineHeight: "20px" },
  "@media (max-width: 767px)": { fontSize: "14px", lineHeight: "18px" },
});

export const RecruitRolesSection = () => {
  const [openPart, setOpenPart] = useState<string | null>(null);

  return (
    <Section>
      <Inner>
        <Title>6개의 직군을 모집 하고 있어요.</Title>
        <Grid>
          {recruitParts.map((part) => {
            const isOpen = openPart === part.name;

            return (
              // 카드에 CTA 가 없어 설명은 hover 로 열린다. 키보드 사용자는
              // 포커스로, 터치 사용자는 탭으로 같은 상태에 도달한다.
              <Card
                key={part.name}
                className={isOpen ? "role-card is-open" : "role-card"}
                tabIndex={0}
                onClick={() => setOpenPart(isOpen ? null : part.name)}
              >
                <RoleName>{part.name}</RoleName>
                <RoleDescription>{part.description}</RoleDescription>
              </Card>
            );
          })}
        </Grid>
      </Inner>
    </Section>
  );
};
