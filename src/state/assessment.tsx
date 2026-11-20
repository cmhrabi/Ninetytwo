"use client";

import { createContext, useContext, useReducer, useRef, type ReactNode } from "react";
import type { SampleId } from "@/shared";
import { api, ApiClientError } from "@/lib/api";
import { checkFile, initialSetup, setupReducer, type SetupState } from "./assessmentReducer";

type AssessmentContextValue = {
  state: SetupState;
  chooseSample: (id: SampleId) => void;
  uploadFile: (file: File) => void;
  setConsent: (value: boolean) => void;
  run: () => void;
  clearDocument: () => void;
  reset: () => void;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

const codeOf = (err: unknown) => (err instanceof ApiClientError ? err.code : "internal");

/** Holds the chosen document in browser memory so it survives /assess → /report. */
export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(setupReducer, initialSetup);
  const nextId = useRef(0);
  const newId = () => ++nextId.current;

  const chooseSample = (id: SampleId) => {
    const requestId = newId();
    dispatch({ type: "load/start", requestId, source: { kind: "sample", id } });
    api.getSample(id).then(
      (document) => dispatch({ type: "load/success", requestId, document }),
      (err: unknown) => dispatch({ type: "load/failure", requestId, code: codeOf(err) }),
    );
  };

  const uploadFile = (file: File) => {
    const requestId = newId();
    const rejected = checkFile(file);
    if (rejected) {
      dispatch({ type: "reject", requestId, code: rejected });
      return;
    }
    dispatch({ type: "load/start", requestId, source: { kind: "upload", fileName: file.name } });
    api.extract(file).then(
      (document) => dispatch({ type: "load/success", requestId, document }),
      (err: unknown) => dispatch({ type: "load/failure", requestId, code: codeOf(err) }),
    );
  };

  const value: AssessmentContextValue = {
    state,
    chooseSample,
    uploadFile,
    setConsent: (v) => dispatch({ type: "consent", value: v }),
    run: () => dispatch({ type: "run" }),
    clearDocument: () => dispatch({ type: "clear", requestId: newId() }),
    reset: () => dispatch({ type: "reset", requestId: newId() }),
  };

  return <AssessmentContext value={value}>{children}</AssessmentContext>;
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used inside AssessmentProvider");
  return ctx;
}
