import { configureApi } from "@ddd/api";

function resolveBaseUrl(): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  return baseUrl;
}

// 설정값은 항상 같은데 매 호출마다 configure 하면 openapi-fetch 클라이언트를 새로
// 만들어 버린다. 한 번 맞춰둔 클라이언트를 계속 쓴다.
let configuredBaseUrl: string | null = null;

/**
 * @ddd/api 의 ApiClient 를 최초 호출 시점에 1회 configure 한다.
 *
 * Next.js Server Component / Client Component 양쪽에서 모듈이 캐시되므로
 * 사실상 idempotent 하다. 부트스트랩 1회 호출로 치환하는 작업은 별도 PR.
 */
export function ensureApiConfigured(): void {
  const baseUrl = resolveBaseUrl();
  if (configuredBaseUrl === baseUrl) return;
  // 지원자 세션(이메일 인증 쿠키)에는 refresh 계약이 없다. 기본값대로 두면 401 마다
  // /auth/refresh 를 찔러보고 원 요청까지 재시도해 실패가 3배로 늘어난다.
  configureApi(baseUrl, { refreshTokenPath: null });
  configuredBaseUrl = baseUrl;
}

/**
 * 브라우저가 미리 연결해둘 API 오리진. same-origin 이거나 상대 경로면 null.
 *
 * 첫 API 호출이 DNS·TCP·TLS 를 처음부터 맺으면 그 왕복이 그대로 응답 지연이 된다.
 * 문서 파싱 단계에서 커넥션을 열어두면 그만큼을 응답 대기에서 뺄 수 있다.
 */
export function getApiPreconnectOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    const { origin } = new URL(raw);
    return origin;
  } catch {
    // "/api" 같은 상대 경로 — 문서와 같은 오리진이라 preconnect 할 대상이 없다.
    return null;
  }
}
