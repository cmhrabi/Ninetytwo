import type { ErrorCode } from "@/shared";

/** Friendly copy per ErrorCode. Describes the software only; never stack traces. */
export const errorMessages: Record<ErrorCode, string> = {
  bad_request: "Something about that request didn't look right. Try again.",
  not_found: "We couldn't find that document. Try another one.",
  unsupported_type: "That file type isn't supported. Upload a PDF, DOCX or TXT file.",
  too_large: "That file is over 4 MB. Upload a smaller file.",
  no_text: "Upload a text PDF or DOCX (scanned PDFs have no text).",
  rate_limited: "Busy, try again in a moment.",
  ai_failed: "The analysis didn't finish. Try again.",
  internal: "Something went wrong on our side. Try again.",
};

export const messageFor = (code: ErrorCode) => errorMessages[code];
