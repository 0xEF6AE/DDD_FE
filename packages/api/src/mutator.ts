import { getApiClient, type ApiRequestOptions } from "./client";

type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export interface OrvalRequestConfig {
  url: string;
  method: HttpMethod;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  responseType?: "json" | "blob" | "text";
  signal?: AbortSignal;
}

function buildPath(url: string, params?: Record<string, unknown>): string {
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, String(item));
    } else {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

// 런타임은 client.ts/parseResponse 가 BE wrapper `{ code, message, data, meta }` 의 data 만 풀어 반환.
// 타입도 그에 맞춰 generated 응답 wrapper(`{ data?: T | null }`) 의 data 를 추출해 좁힘.
// wrapper 가 아닌 응답(void / Blob 등)은 그대로 흘려보냄.
type Unwrap<T> = T extends { data?: infer U | null } ? U : T;

export const apiFetch = <T>(
  config: OrvalRequestConfig
): Promise<Unwrap<T>> => {
  const client = getApiClient();
  const path = buildPath(config.url, config.params);
  const options: ApiRequestOptions = {
    headers: config.headers,
    responseType: config.responseType,
    signal: config.signal,
  };

  switch (config.method.toLowerCase() as Lowercase<HttpMethod>) {
    case "get":
      return client.get<Unwrap<T>>(path, options);
    case "delete":
      return client.delete<Unwrap<T>>(path, options);
    case "post":
      return client.post<Unwrap<T>>(path, config.data, options);
    case "put":
      return client.put<Unwrap<T>>(path, config.data, options);
    case "patch":
      return client.patch<Unwrap<T>>(path, config.data, options);
  }
};
