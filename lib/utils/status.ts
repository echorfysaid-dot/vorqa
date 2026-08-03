import { statusToneMap } from "@/lib/constants";

export type StatusTone = "default" | "success" | "warning" | "danger" | "gold" | "blue";

export function getStatusTone(status: string): StatusTone {
  return (statusToneMap as Record<string, StatusTone>)[status] ?? "default";
}

export function isInactiveStatus(status: string): boolean {
  return ["Archived", "Closed", "Inactive", "Suspended organization"].includes(status);
}
