"use client";

export type AnalysisPhase = "idle" | "reading" | "validating" | "preparing" | "running" | "structuring" | "success" | "error";

export function getAnalysisErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const safeError = record.safeError && typeof record.safeError === "object" ? record.safeError as Record<string, unknown> : undefined;
    if (typeof safeError?.message === "string" && safeError.message.trim()) return safeError.message;
    if (Array.isArray(record.errors)) {
      const first = record.errors.find((entry) => entry && typeof entry === "object") as Record<string, unknown> | undefined;
      if (typeof first?.message === "string" && first.message.trim()) return first.message;
    }
    if (typeof record.error === "string" && record.error.trim()) return record.error;
  }
  return fallback;
}

export function analysisPhaseLabel(phase: AnalysisPhase) {
  const labels: Record<AnalysisPhase, string> = {
    idle: "Ready",
    reading: "Reading file",
    validating: "Validating input",
    preparing: "Preparing analysis",
    running: "Running VORA Intelligence",
    structuring: "Structuring results",
    success: "Complete",
    error: "Needs attention"
  };
  return labels[phase];
}

export function printCurrentReport() {
  if (typeof window !== "undefined") window.print();
}
