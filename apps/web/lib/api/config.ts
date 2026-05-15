import { configureApi } from "@ddd/api";

/**
 * @ddd/api 의 ApiClient 를 매 호출 시점에 1회 configure 한다.
 *
 * Next.js Server Component / Client Component 양쪽에서 모듈이 캐시되므로
 * 사실상 idempotent 하다. 부트스트랩 1회 호출로 치환하는 작업은 별도 PR.
 */
export function ensureApiConfigured(): void {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  configureApi(baseUrl);
}
