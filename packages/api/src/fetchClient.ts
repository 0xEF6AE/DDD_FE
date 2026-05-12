import createClient, {
  type Client,
  type ClientPathsWithMethod,
  type FetchOptions,
  type MethodResponse,
} from "openapi-fetch";

import { ApiError, type ErrorMessageKey } from "./errors";
import type { paths } from "./generated/api";

export interface ApiConfig {
  baseUrl: string;
  credentials?: RequestCredentials;
  refreshTokenPath?: string;
  onUnauthorized?: () => void;
}

type OpenApiClient = Client<paths>;
type PathsWith<M extends "get" | "post" | "put" | "patch" | "delete"> =
  ClientPathsWithMethod<OpenApiClient, M>;

interface BeWrapper {
  code?: string;
  message?: string;
  data?: unknown;
}

export type UnwrapData<T> = T extends { data?: infer U }
  ? Exclude<NonNullable<U>, undefined>
  : T;

function isBeWrapper(value: unknown): value is BeWrapper {
  return (
    typeof value === "object" &&
    value !== null &&
    ("code" in value || "message" in value || "data" in value)
  );
}

function toErrorCode(code: string | undefined): ErrorMessageKey {
  return (code ?? "UNKNOWN_ERROR") as ErrorMessageKey;
}

class ApiClient {
  private client: OpenApiClient | null = null;

  // 401 refresh 큐 — 동시에 여러 요청이 401 을 받아도 refresh 는 한 번만 수행.
  private isRefreshing = false;
  private waitQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

  configure(config: ApiConfig): void {
    const credentials = config.credentials ?? "include";
    const refreshTokenPath = config.refreshTokenPath ?? "/api/v1/auth/refresh";
    const baseUrl = config.baseUrl;
    const origin =
      baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const refreshUrl = new URL(refreshTokenPath, origin).toString();
    const onUnauthorized = config.onUnauthorized;

    const doRefresh = async (): Promise<void> => {
      const res = await fetch(refreshUrl, { method: "POST", credentials });
      if (!res.ok) throw new Error("Token refresh failed");
    };

    const waitForRefresh = async (): Promise<void> => {
      if (this.isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          this.waitQueue.push({ resolve, reject });
        });
      }
      this.isRefreshing = true;
      try {
        await doRefresh();
        this.waitQueue.forEach(({ resolve }) => resolve());
      } catch (err) {
        this.waitQueue.forEach(({ reject }) => reject(err));
        throw err;
      } finally {
        this.isRefreshing = false;
        this.waitQueue = [];
      }
    };

    const customFetch: typeof globalThis.fetch = async (input, init) => {
      const res = await fetch(input, init);
      if (res.status !== 401) return res;
      try {
        await waitForRefresh();
      } catch {
        onUnauthorized?.();
        return res;
      }
      const retry = await fetch(input, init);
      if (retry.status === 401) onUnauthorized?.();
      return retry;
    };

    this.client = createClient<paths>({ baseUrl, credentials, fetch: customFetch });
  }

  get = <P extends PathsWith<"get">>(
    url: P,
    init?: FetchOptions<paths[P]["get"]>,
  ): Promise<UnwrapData<MethodResponse<OpenApiClient, "get", P>>> =>
    this.unwrap(this.ensure().GET(url, init as never));

  post = <P extends PathsWith<"post">>(
    url: P,
    init?: FetchOptions<paths[P]["post"]>,
  ): Promise<UnwrapData<MethodResponse<OpenApiClient, "post", P>>> =>
    this.unwrap(this.ensure().POST(url, init as never));

  put = <P extends PathsWith<"put">>(
    url: P,
    init?: FetchOptions<paths[P]["put"]>,
  ): Promise<UnwrapData<MethodResponse<OpenApiClient, "put", P>>> =>
    this.unwrap(this.ensure().PUT(url, init as never));

  patch = <P extends PathsWith<"patch">>(
    url: P,
    init?: FetchOptions<paths[P]["patch"]>,
  ): Promise<UnwrapData<MethodResponse<OpenApiClient, "patch", P>>> =>
    this.unwrap(this.ensure().PATCH(url, init as never));

  delete = <P extends PathsWith<"delete">>(
    url: P,
    init?: FetchOptions<paths[P]["delete"]>,
  ): Promise<UnwrapData<MethodResponse<OpenApiClient, "delete", P>>> =>
    this.unwrap(this.ensure().DELETE(url, init as never));

  private ensure(): OpenApiClient {
    if (!this.client) {
      throw new Error(
        "api is not configured. Call api.configure({ baseUrl }) (or configureApi) at app bootstrap.",
      );
    }
    return this.client;
  }

  private async unwrap<R>(
    promise: Promise<{ data?: unknown; error?: unknown; response: Response }>,
  ): Promise<R> {
    const { data, error, response } = await promise;

    if (error !== undefined) {
      if (isBeWrapper(error)) {
        throw new ApiError(
          toErrorCode(error.code),
          error.message ?? `Request failed with status ${response.status}`,
        );
      }
      throw new ApiError(
        "UNKNOWN_ERROR",
        error instanceof Error
          ? error.message
          : `Request failed with status ${response.status}`,
      );
    }

    if (data === undefined) return null as R;
    if (!isBeWrapper(data)) return data as R;

    if (data.code && data.code !== "SUCCESS") {
      throw new ApiError(toErrorCode(data.code), data.message ?? "Request failed");
    }
    return (data.data ?? null) as R;
  }
}

export const api = new ApiClient();

/**
 * 어플리케이션 부트스트랩 시점에 1회 호출 — `api.configure({ baseUrl, ...options })` 와 동일.
 *
 * @example
 * configureApi("/api", { onUnauthorized: () => router.navigate("/login") })
 */
export function configureApi(
  baseUrl: string,
  options?: Omit<ApiConfig, "baseUrl">,
): void {
  api.configure({ baseUrl, ...options });
}
