/**
 * 프로젝트 PDF 는 GCS(`storage.googleapis.com`) 버킷에 저장되는데 버킷에 CORS 설정이 없다.
 * pdf.js 는 브라우저에서 직접 PDF 를 fetch 하므로 원본 URL 을 그대로 넘기면 CORS 에 막힌다.
 * 같은 오리진의 라우트 핸들러(`app/api/project-pdf/route.ts`)를 경유해 받아온다.
 */
const PDF_PROXY_PATH = "/api/project-pdf";

const ALLOWED_PDF_ORIGINS = ["https://storage.googleapis.com"];

export function isProxyablePdfUrl(src: string): boolean {
  try {
    return ALLOWED_PDF_ORIGINS.includes(new URL(src).origin);
  } catch {
    return false;
  }
}

/** 허용 오리진이 아니면(= 상대 경로·동일 오리진) 그대로 반환한다. */
export function toProxiedPdfUrl(src: string): string {
  if (!isProxyablePdfUrl(src)) return src;
  return `${PDF_PROXY_PATH}?url=${encodeURIComponent(src)}`;
}
