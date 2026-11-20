// Typed client for /api/*. The only place in the UI that calls fetch.
import type {
  CriterionResult,
  DocumentText,
  ErrorCode,
  Health,
  JudgeRequest,
  Paragraph,
  Rubric,
  Sample,
  SampleId,
  ScanResult,
} from "@/shared";

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    /** True when the request never got a response (offline, DNS, timeout). */
    readonly network = false,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface Api {
  getHealth(): Promise<Health>;
  getRubric(signal?: AbortSignal): Promise<Rubric>;
  listSamples(): Promise<Sample[]>;
  getSample(id: SampleId): Promise<DocumentText>;
  extract(file: File): Promise<DocumentText>;
  scan(paragraphs: Paragraph[], signal?: AbortSignal): Promise<ScanResult>;
  judge(criterion: string, body: JudgeRequest, signal?: AbortSignal): Promise<CriterionResult>;
}

const ERROR_CODES: readonly ErrorCode[] = [
  "bad_request",
  "not_found",
  "unsupported_type",
  "too_large",
  "no_text",
  "rate_limited",
  "ai_failed",
  "internal",
];

const isErrorCode = (v: unknown): v is ErrorCode => ERROR_CODES.includes(v as ErrorCode);

/** Turns a non-2xx Response into an ApiClientError, using the ApiError body when there is one. */
export async function toApiClientError(res: Response): Promise<ApiClientError> {
  try {
    const body = (await res.json()) as { error?: { code?: unknown; message?: unknown } };
    const code = body.error?.code;
    const message = body.error?.message;
    if (isErrorCode(code)) {
      return new ApiClientError(res.status, code, typeof message === "string" ? message : code);
    }
  } catch {
    // body was not JSON; fall through
  }
  if (res.status === 413) return new ApiClientError(413, "too_large", "File too large");
  return new ApiClientError(res.status, "internal", `Request failed (${res.status})`);
}

/** Client-side cap per judge call: the server's maxDuration is 60 s. */
export const JUDGE_TIMEOUT_MS = 65_000;

/** True when the caller aborted on purpose (New assessment, reset). Callers ignore these. */
export const isAbort = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

/** The caller's signal plus a timeout, so either one ends the request. */
const withTimeout = (ms: number, signal?: AbortSignal) =>
  signal ? AbortSignal.any([signal, AbortSignal.timeout(ms)]) : AbortSignal.timeout(ms);

async function request<T>(path: string, init?: RequestInit, callerSignal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (err) {
    // A deliberate abort is rethrown as is; a timeout or no connection is a network error.
    if (callerSignal?.aborted) throw callerSignal.reason ?? err;
    const timedOut = err instanceof DOMException && err.name === "TimeoutError";
    throw new ApiClientError(0, "internal", timedOut ? "Request timed out" : "Network error", true);
  }
  if (!res.ok) throw await toApiClientError(res);
  return (await res.json()) as T;
}

const postJson = <T>(path: string, body: unknown, signal?: AbortSignal, timeoutMs?: number) =>
  request<T>(
    path,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      ...(timeoutMs ? { signal: withTimeout(timeoutMs, signal) } : signal ? { signal } : {}),
    },
    signal,
  );

export const realApi: Api = {
  getHealth: () => request<Health>("/api/health"),
  getRubric: (signal) => request<Rubric>("/api/rubric", signal ? { signal } : undefined, signal),
  listSamples: () => request<Sample[]>("/api/samples"),
  getSample: (id) => request<DocumentText>(`/api/samples/${encodeURIComponent(id)}`),
  extract: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request<DocumentText>("/api/extract", { method: "POST", body: form });
  },
  scan: (paragraphs, signal) => postJson<ScanResult>("/api/scan", { paragraphs }, signal, JUDGE_TIMEOUT_MS),
  judge: (criterion, body, signal) =>
    postJson<CriterionResult>(`/api/judge/${encodeURIComponent(criterion)}`, body, signal, JUDGE_TIMEOUT_MS),
};

export const api: Api = realApi;
