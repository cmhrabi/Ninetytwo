"use client";

import { useDropzone } from "react-dropzone";
import { CircleCheck, LoaderCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssessment } from "@/state/assessment";

const accept = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

/** Drag-and-drop or browse. Files are checked in the browser, then read in server memory only. */
export function Dropzone({ className }: { className?: string }) {
  const { state, uploadFile, clearDocument } = useAssessment();
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    // Rejected files still go through uploadFile so checkFile gives the friendly message.
    onDrop: (accepted, rejected) => {
      const file = accepted[0] ?? rejected[0]?.file;
      if (file) uploadFile(file);
    },
  });

  const upload = state.source?.kind === "upload" ? state.source : null;
  const extracting = state.loading === "extract";
  const loaded = upload && state.document;

  return (
    <div
      {...getRootProps({
        className: cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragActive ? "border-gold-edge bg-gold-wash" : "border-border bg-surface/60",
          loaded && "border-solid border-status-addressed/40 bg-status-addressed-bg/50",
          className,
        ),
      })}
    >
      <input {...getInputProps({ "aria-label": "Upload a policy file" })} />
      {extracting ? (
        <>
          <LoaderCircle className="size-8 animate-spin text-indigo" aria-hidden />
          <p className="font-medium text-midnight">Reading {upload?.fileName}…</p>
        </>
      ) : loaded ? (
        <>
          <CircleCheck className="size-8 text-status-addressed" aria-hidden />
          <div>
            <p className="font-medium break-all text-midnight">{upload.fileName}</p>
            <p className="text-sm text-muted-foreground">{state.document?.paragraphs.length} paragraphs read</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={open}>
              Replace file
            </Button>
            <Button variant="ghost" size="sm" onClick={clearDocument}>
              <X data-icon="inline-start" aria-hidden /> Remove
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className="flex size-12 items-center justify-center rounded-full bg-white ring-1 ring-border">
            <Upload className="size-5 text-midnight" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-midnight">{isDragActive ? "Drop it here" : "Drag your policy here"}</p>
            <p className="text-sm text-muted-foreground">PDF, DOCX or TXT, up to 4 MB</p>
          </div>
          <Button variant="outline" onClick={open}>
            Browse files
          </Button>
        </>
      )}
    </div>
  );
}
