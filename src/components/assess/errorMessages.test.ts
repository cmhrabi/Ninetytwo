import { describe, expect, it } from "vitest";
import type { ErrorCode } from "@/shared";
import { errorMessages } from "./errorMessages";

const codes: ErrorCode[] = [
  "bad_request",
  "not_found",
  "unsupported_type",
  "too_large",
  "no_text",
  "rate_limited",
  "ai_failed",
  "internal",
];

describe("errorMessages", () => {
  it.each(codes)("has a friendly message for %s", (code) => {
    expect(errorMessages[code].length).toBeGreaterThan(10);
    expect(errorMessages[code]).not.toMatch(/error:|stack|undefined/i);
  });

  it("explains scanned PDFs for no_text", () => {
    expect(errorMessages.no_text).toBe("Upload a text PDF or DOCX (scanned PDFs have no text).");
  });
});
