import { earlyNotificationAPI } from "@ddd/api";
import { ensureApiConfigured } from "./config";
import { fetchActiveCohortId } from "./cohort";

export async function subscribeEarlyNotification(
  email: string,
  cohortId: number,
): Promise<void> {
  ensureApiConfigured();
  await earlyNotificationAPI.subscribeEarlyNotification({
    payload: { email, cohortId },
  });
}

export async function subscribeGeneralEarlyNotification(email: string): Promise<void> {
  ensureApiConfigured();
  await earlyNotificationAPI.subscribeGeneralEarlyNotification({
    payload: { email },
  });
}

/**
 * 활성 기수가 있으면 기수별 사전 알림, 없으면 대기열(general) 사전 알림으로 폴백한다.
 */
export async function subscribeEarlyNotificationWithActiveCohort(
  email: string,
): Promise<void> {
  const activeCohortId = await fetchActiveCohortId();
  if (activeCohortId) {
    await subscribeEarlyNotification(email, activeCohortId);
    return;
  }
  await subscribeGeneralEarlyNotification(email);
}
