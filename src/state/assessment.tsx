"use client";

import { createContext, useContext, useReducer, useRef, type ReactNode } from "react";
import type { DocumentText, ErrorCode, Paragraph, SampleId, ScanResult } from "@/shared";
import { api, ApiClientError, isAbort } from "@/lib/api";
import { canRun, checkFile, initialSetup, selectedIds, setupReducer, type SetupState } from "./assessmentReducer";
import { initialRun, runReducer, type RunState } from "./runReducer";

type AssessmentContextValue = {
  state: SetupState;
  run: RunState;
  chooseSample: (id: SampleId) => void;
  uploadFile: (file: File) => void;
  setConsent: (value: boolean) => void;
  /** Which criteria the next run checks (ids, rubric order not required). */
  setCriteria: (ids: string[]) => void;
  /** Starts scan → judges for the loaded document. Returns false if it can't run yet. */
  startAssessment: () => boolean;
  /** Runs the same document again from the scan. */
  rerun: () => void;
  retryCard: (criterion: string) => void;
  clearDocument: () => void;
  reset: () => void;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

const RATE_LIMIT_RETRY_MS = 3000;

const codeOf = (err: unknown): ErrorCode => (err instanceof ApiClientError ? err.code : "internal");
const isNetwork = (err: unknown) => err instanceof ApiClientError && err.network;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Holds the chosen document and the run in browser memory so they survive /assess → /report.
 * A reload loses both. Document text is never logged.
 */
export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(setupReducer, initialSetup);
  const [run, dispatchRun] = useReducer(runReducer, initialRun);
  const nextId = useRef(0);
  const nextRunId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const newId = () => ++nextId.current;

  /** Aborts any run in flight. */
  const abortRun = () => {
    controller.current?.abort();
    controller.current = null;
  };

  const judgeOne = async (
    runId: number,
    criterion: string,
    paragraphs: Paragraph[],
    scan: ScanResult,
    signal: AbortSignal,
    retried = false,
  ): Promise<void> => {
    try {
      const result = await api.judge(criterion, { paragraphs, scan }, signal);
      dispatchRun({ type: "card/done", runId, result });
    } catch (err) {
      if (isAbort(err) || signal.aborted) return;
      if (err instanceof ApiClientError && err.status === 501) {
        dispatchRun({ type: "card/unavailable", runId, criterion });
        return;
      }
      if (codeOf(err) === "rate_limited" && !retried) {
        dispatchRun({ type: "card/retrying", runId, criterion });
        await wait(RATE_LIMIT_RETRY_MS);
        if (signal.aborted) return;
        return judgeOne(runId, criterion, paragraphs, scan, signal, true);
      }
      dispatchRun({ type: "card/error", runId, criterion, code: codeOf(err), network: isNetwork(err) });
    }
  };

  const startRun = async (document: DocumentText, selection: SetupState["criteria"]) => {
    abortRun();
    const ctrl = new AbortController();
    controller.current = ctrl;
    const runId = ++nextRunId.current;
    const { paragraphs } = document;
    dispatchRun({ type: "run/start", runId });

    let scan: ScanResult;
    try {
      const [scanResult, rubric] = await Promise.all([
        api.scan(paragraphs, ctrl.signal),
        api.getRubric(ctrl.signal),
      ]);
      scan = scanResult;
      // Only the selected criteria are judged, shown and scored: the run sees a rubric scoped to them.
      const ids = selectedIds({ criteria: selection }, rubric.criteria.map((c) => c.id));
      const scoped = { ...rubric, criteria: rubric.criteria.filter((c) => ids.includes(c.id)) };
      dispatchRun({ type: "run/scanned", runId, scan, rubric: scoped });
      // One judge per criterion, in parallel; each card lands on its own.
      for (const c of scoped.criteria) void judgeOne(runId, c.id, paragraphs, scan, ctrl.signal);
    } catch (err) {
      if (isAbort(err) || ctrl.signal.aborted) return;
      dispatchRun({ type: "run/failed", runId, code: codeOf(err), network: isNetwork(err) });
    }
  };

  const resetRun = () => {
    abortRun();
    dispatchRun({ type: "run/reset", runId: ++nextRunId.current });
  };

  const chooseSample = (id: SampleId) => {
    resetRun();
    const requestId = newId();
    dispatch({ type: "load/start", requestId, source: { kind: "sample", id } });
    api.getSample(id).then(
      (document) => dispatch({ type: "load/success", requestId, document }),
      (err: unknown) => dispatch({ type: "load/failure", requestId, code: codeOf(err) }),
    );
  };

  const uploadFile = (file: File) => {
    resetRun();
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

  const startAssessment = () => {
    if (!canRun(state) || !state.document) return false;
    dispatch({ type: "run" });
    void startRun(state.document, state.criteria);
    return true;
  };

  const rerun = () => {
    if (state.document) void startRun(state.document, state.criteria);
  };

  const retryCard = (criterion: string) => {
    const signal = controller.current?.signal;
    if (!state.document || !run.scan || !signal) return;
    dispatchRun({ type: "card/pending", runId: run.runId, criterion });
    void judgeOne(run.runId, criterion, state.document.paragraphs, run.scan, signal);
  };

  const value: AssessmentContextValue = {
    state,
    run,
    chooseSample,
    uploadFile,
    setConsent: (v) => dispatch({ type: "consent", value: v }),
    setCriteria: (ids) => dispatch({ type: "criteria", ids }),
    startAssessment,
    rerun,
    retryCard,
    clearDocument: () => {
      resetRun();
      dispatch({ type: "clear", requestId: newId() });
    },
    reset: () => {
      resetRun();
      dispatch({ type: "reset", requestId: newId() });
    },
  };

  return <AssessmentContext value={value}>{children}</AssessmentContext>;
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used inside AssessmentProvider");
  return ctx;
}
