import type { ApiError, ErrorCode } from "@/shared";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (what: string) => new HttpError(404, "not_found", `${what} not found`);
export const badRequest = (message: string) => new HttpError(400, "bad_request", message);

/** Every non-2xx body is an ApiError. Unknown errors are logged, never echoed. */
export function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    const body: ApiError = { error: { code: err.code, message: err.message } };
    return Response.json(body, { status: err.status });
  }
  console.error(err);
  const body: ApiError = { error: { code: "internal", message: "Something went wrong" } };
  return Response.json(body, { status: 500 });
}
