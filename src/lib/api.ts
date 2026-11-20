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
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface Api {
  getHealth(): Promise<Health>;
  getRubric(): Promise<Rubric>;
  listSamples(): Promise<Sample[]>;
  getSample(id: SampleId): Promise<DocumentText>;
  extract(file: File): Promise<DocumentText>;
  scan(paragraphs: Paragraph[]): Promise<ScanResult>;
  judge(criterion: string, body: JudgeRequest): Promise<CriterionResult>;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiClientError(0, "internal", "Network error");
  }
  if (!res.ok) throw await toApiClientError(res);
  return (await res.json()) as T;
}

const postJson = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const realApi: Api = {
  getHealth: () => request<Health>("/api/health"),
  getRubric: () => request<Rubric>("/api/rubric"),
  listSamples: () => request<Sample[]>("/api/samples"),
  getSample: (id) => request<DocumentText>(`/api/samples/${encodeURIComponent(id)}`),
  extract: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request<DocumentText>("/api/extract", { method: "POST", body: form });
  },
  scan: (paragraphs) => postJson<ScanResult>("/api/scan", { paragraphs }),
  judge: (criterion, body) =>
    postJson<CriterionResult>(`/api/judge/${encodeURIComponent(criterion)}`, body),
};

export const api: Api = realApi;
