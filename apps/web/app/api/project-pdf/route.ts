import type { NextRequest } from "next/server";
import { isProxyablePdfUrl } from "@/lib/pdfProxy";

/** 업스트림에서 그대로 흘려보낼 헤더. `accept-ranges`/`content-range` 를 넘겨야 pdf.js 가 부분 로딩을 한다. */
const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-length",
  "content-range",
  "accept-ranges",
  "etag",
  "last-modified",
];

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");

  if (!target || !isProxyablePdfUrl(target)) {
    return new Response("Unsupported pdf url", { status: 400 });
  }

  // pdf.js 는 range 요청으로 페이지 단위 스트리밍을 시도한다. 그대로 위임한다.
  const range = request.headers.get("range");
  const upstream = await fetch(target, {
    headers: range ? { Range: range } : undefined,
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new Response("Failed to load pdf", { status: 502 });
  }

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has("content-type")) headers.set("content-type", "application/pdf");
  headers.set("cache-control", "public, max-age=3600");

  return new Response(upstream.body, { status: upstream.status, headers });
}
