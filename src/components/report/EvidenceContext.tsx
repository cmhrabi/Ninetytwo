"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

/** The paragraph to show; `nonce` changes on every click so the same paragraph pulses again. */
export type EvidenceTarget = { id: string; nonce: number };

type EvidenceContextValue = {
  open: boolean;
  target: EvidenceTarget | null;
  /** Opens the viewer at a paragraph. `opener` gets focus back when the viewer closes. */
  openAt: (paragraphId: string, opener?: HTMLElement | null) => void;
  toggle: (opener?: HTMLElement | null) => void;
  close: () => void;
};

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

/** Report-local UI state for the evidence viewer. The document itself stays in the assessment state. */
export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<EvidenceTarget | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const nonce = useRef(0);

  const value: EvidenceContextValue = {
    open,
    target,
    openAt: (id, el) => {
      opener.current = el ?? null;
      setTarget({ id, nonce: ++nonce.current });
      setOpen(true);
    },
    toggle: (el) => {
      opener.current = el ?? null;
      setOpen((o) => !o);
    },
    close: () => {
      setOpen(false);
      const el = opener.current;
      opener.current = null;
      if (el?.isConnected) requestAnimationFrame(() => el.focus());
    },
  };

  return <EvidenceContext value={value}>{children}</EvidenceContext>;
}

/** The viewer controls, or null outside a report (quotes then render as plain text). */
export const useEvidence = () => useContext(EvidenceContext);
