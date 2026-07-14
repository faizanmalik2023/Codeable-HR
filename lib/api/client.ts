/**
 * HTTP client for the CodeableHR backend.
 *
 * - Reads `NEXT_PUBLIC_API_BASE_URL` (no version segment; endpoints sit under it).
 * - Unwraps the standard envelope `{ statusCode, data, error }`.
 * - Attaches `Authorization: Bearer <token>` on non-auth requests.
 * - On 401 (non-auth): single-flight refresh via `/auth/refresh-token`, then
 *   retries the original request once. On refresh failure → forced logout.
 */

import { authTokens, forceLogout, useAuthStore } from "@/stores/auth-store";
import type { ApiEnvelope, ApiError, AuthTokens } from "@/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://ec2-13-234-142-206.ap-south-1.compute.amazonaws.com/api";

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "Bad request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not found",
  429: "Too many attempts. Please try again shortly.",
  500: "Internal server error",
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: ApiError["details"];
  constructor(status: number, error?: ApiError | null) {
    super(error?.message || FALLBACK_MESSAGES[status] || "Something went wrong");
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error?.code;
    this.details = error?.details;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body (ignored for multipart). */
  body?: unknown;
  /** FormData for multipart uploads (sets no Content-Type). */
  form?: FormData;
  query?: Query;
  /** Skip bearer + refresh handling (auth endpoints). */
  auth?: boolean;
  signal?: AbortSignal;
}

const AUTH_PATHS = [
  "/auth/login",
  "/auth/google",
  "/auth/refresh-token",
  "/auth/forgot-password",
  "/auth/verify-otp",
  "/auth/reset-password",
];

const isAuthPath = (path: string) => AUTH_PATHS.some((p) => path.startsWith(p));

function buildUrl(path: string, query?: Query): string {
  const url = new URL(API_BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/* --------------------------- refresh (single-flight) --------------------------- */
let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshTokens(): Promise<AuthTokens> {
  const current = authTokens();
  if (!current?.refresh_token) throw new ApiRequestError(401);
  const res = await fetch(buildUrl("/auth/refresh-token"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: current.refresh_token }),
  });
  const json = (await res.json().catch(() => null)) as ApiEnvelope<{
    tokens: AuthTokens;
  }> | null;
  if (!res.ok || !json?.data?.tokens) throw new ApiRequestError(res.status, json?.error);
  useAuthStore.getState().setTokens(json.data.tokens);
  return json.data.tokens;
}

function ensureRefresh(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/* --------------------------------- core --------------------------------- */
async function raw<T>(path: string, opts: RequestOptions, retrying = false): Promise<T> {
  const skipAuth = opts.auth === false || isAuthPath(path);
  const headers: Record<string, string> = {};
  if (!opts.form) headers["Content-Type"] = "application/json";
  if (!skipAuth) {
    const t = authTokens()?.token;
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? "GET",
      headers,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
      signal: opts.signal,
    });
  } catch {
    throw new ApiRequestError(0, { code: "NETWORK_ERROR", message: "Network error. Check your connection." });
  }

  // Single-flight refresh on 401 for authed endpoints.
  if (res.status === 401 && !skipAuth && !retrying) {
    try {
      await ensureRefresh();
    } catch {
      forceLogout();
      throw new ApiRequestError(401);
    }
    return raw<T>(path, opts, true);
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || json?.error) {
    if (res.status === 401 && !skipAuth) forceLogout();
    throw new ApiRequestError(res.status, json?.error);
  }
  return (json?.data as T) ?? (null as T);
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    raw<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    raw<T>(path, { method: "POST", body, ...opts }),
  put: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    raw<T>(path, { method: "PUT", body, ...opts }),
  patch: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    raw<T>(path, { method: "PATCH", body, ...opts }),
  delete: <T>(path: string, opts?: Partial<RequestOptions>) =>
    raw<T>(path, { method: "DELETE", ...opts }),
  /** Multipart upload helper → `POST /uploads`. */
  upload: <T>(path: string, form: FormData) => raw<T>(path, { method: "POST", form }),
};
