// Pure state for the Assess setup screen. No React, no I/O, so it is unit-tested directly.
import type { DocumentText, ErrorCode, SampleId } from "@/shared";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // the server re-checks (Vercel caps bodies at 4.5 MB)
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

export type DocType = "hiring" | "leadership" | "consultation" | "procurement" | "education";

export type Source = { kind: "sample"; id: SampleId } | { kind: "upload"; fileName: string };

export type SetupState = {
  docType: DocType;
  source: Source | null;
  document: DocumentText | null;
  loading: "sample" | "extract" | null;
  error: ErrorCode | null;
  consent: boolean;
  ready: boolean; // Run pressed; the progress view replaces this in the next pass
  requestId: number; // only the latest load may land
};

export type SetupAction =
  | { type: "load/start"; requestId: number; source: Source }
  | { type: "load/success"; requestId: number; document: DocumentText }
  | { type: "load/failure"; requestId: number; code: ErrorCode }
  | { type: "reject"; requestId: number; code: ErrorCode } // client-side file check failed
  | { type: "consent"; value: boolean }
  | { type: "run" }
  | { type: "clear"; requestId: number }
  | { type: "reset"; requestId: number };

export const initialSetup: SetupState = {
  docType: "hiring",
  source: null,
  document: null,
  loading: null,
  error: null,
  consent: false,
  ready: false,
  requestId: 0,
};

export function setupReducer(state: SetupState, action: SetupAction): SetupState {
  switch (action.type) {
    case "load/start":
      return {
        ...state,
        requestId: action.requestId,
        source: action.source,
        document: null,
        loading: action.source.kind === "sample" ? "sample" : "extract",
        error: null,
        ready: false,
      };
    case "load/success":
      if (action.requestId !== state.requestId) return state;
      return { ...state, document: action.document, loading: null, error: null };
    case "load/failure":
      if (action.requestId !== state.requestId) return state;
      return { ...state, document: null, source: null, loading: null, error: action.code };
    case "reject":
      return {
        ...state,
        requestId: action.requestId,
        document: null,
        source: null,
        loading: null,
        error: action.code,
        ready: false,
      };
    case "consent":
      return { ...state, consent: action.value, ready: action.value && state.ready };
    case "run":
      return canRun(state) ? { ...state, ready: true } : state;
    case "clear":
      return { ...state, requestId: action.requestId, source: null, document: null, loading: null, error: null, ready: false };
    case "reset":
      return { ...initialSetup, requestId: action.requestId };
  }
}

export const canRun = (s: SetupState) => s.document !== null && s.consent && s.loading === null;

/** Why Run is disabled, or null when it can run. */
export function runBlocker(s: SetupState): string | null {
  if (s.loading) return "Reading your document…";
  if (!s.document) return "Choose a document or a sample first.";
  if (!s.consent) return "Tick the consent box to continue.";
  return null;
}

/** Client-side check before upload. Returns an ErrorCode, or null if the file looks fine. */
export function checkFile(file: { name: string; size: number }): ErrorCode | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) return "unsupported_type";
  if (file.size > MAX_UPLOAD_BYTES) return "too_large";
  return null;
}
