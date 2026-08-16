import { cache } from "react";
import { fetchActiveCohort } from "./cohort";

/**
 * 서버 렌더 1회당 활성 기수 조회를 1회로 합친 버전.
 *
 * 루트 레이아웃(모집 상태 CTA) 과 /recruit 의 generateMetadata / 페이지 본문이
 * 각각 같은 엔드포인트를 호출하기 때문에, 그대로 두면 요청 1건에 GET
 * /api/v1/cohorts/active 가 3번 나간다. openapi-fetch 가 커스텀 fetch 로
 * `credentials: "include"` 를 붙여 호출하는 탓에 Next 의 fetch 메모이제이션이
 * 걸리지 않아, React `cache` 로 직접 요청 단위 중복을 제거한다.
 *
 * `cache` 는 서버 컴포넌트 전용이므로 클라이언트에서 쓰는 경로(PreAlertModal →
 * fetchActiveCohortId 등) 는 계속 lib/api/cohort 의 원본을 호출해야 한다.
 * 이 모듈을 클라이언트 컴포넌트에서 import 하지 말 것.
 */
export const getActiveCohort = cache(fetchActiveCohort);
