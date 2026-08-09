import type { ExportReadyReport } from "@/lib/analysis-hardening";
import { generateDocxReport, type DocxExportResult } from "@/lib/docx-export";
import { generateHtmlReport, type HtmlExportResult } from "@/lib/html-export";
import { generatePdfReport, type PdfExportResult } from "@/lib/pdf-export";
import { createProfessionalReportTemplate, type ProfessionalReportMetadata } from "@/lib/report-template";
import { vorqaReportBranding } from "@/lib/report-branding";
import type { ReportExportContext, ReportExportFormat, ReportExportOptions } from "@/types/report-export";

export type DocumentExportFormat = ReportExportFormat;

export type DocumentExportStatus = Readonly<{
  ok: boolean;
  format: DocumentExportFormat;
  filename?: string;
  mimeType?: string;
  byteLength?: number;
  pageCount?: number;
  partCount?: number;
  error?: string;
}>;

export type DocumentExportResult = (PdfExportResult | DocxExportResult | HtmlExportResult) & Readonly<{
  base64: string;
  status: DocumentExportStatus;
}>;

export function sanitizeReportFilename(value: string) {
  const safe = value
    .normalize("NFKD")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\.\.+/g, "-")
    .replace(/[^a-zA-Z0-9\u0600-\u06ff_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return safe || "vorqa-report";
}

function toBase64(bytes: Uint8Array) {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function createReportFilename(report: ExportReadyReport, format: DocumentExportFormat) {
  return `${sanitizeReportFilename(report.projectId || report.projectTitle || report.title)}-${sanitizeReportFilename(report.source)}.${format}`;
}

export function exportProfessionalReport(input: {
  report: ExportReadyReport;
  format: DocumentExportFormat;
  metadata?: ProfessionalReportMetadata;
  context?: ReportExportContext;
  options?: Partial<ReportExportOptions>;
}): DocumentExportResult {
  const professionalReport = createProfessionalReportTemplate({
    report: input.report,
    metadata: input.metadata,
    context: input.context,
    options: input.options,
    branding: vorqaReportBranding
  });
  const filename = createReportFilename(input.report, input.format);
  const result = input.format === "pdf" ? generatePdfReport(professionalReport, filename)
    : input.format === "docx" ? generateDocxReport(professionalReport, filename)
      : generateHtmlReport(professionalReport, filename);
  return Object.freeze({
    ...result,
    base64: toBase64(result.bytes),
    status: Object.freeze({
      ok: true,
      format: input.format,
      filename: result.filename,
      mimeType: result.mimeType,
      byteLength: result.bytes.length,
      ...("pageCount" in result ? { pageCount: result.pageCount } : {}),
      ...("partCount" in result ? { partCount: result.partCount } : {})
    })
  });
}

export function exportProfessionalReportSafe(input: {
  report: ExportReadyReport;
  format: DocumentExportFormat;
  metadata?: ProfessionalReportMetadata;
  context?: ReportExportContext;
  options?: Partial<ReportExportOptions>;
}): DocumentExportResult | { status: DocumentExportStatus } {
  try {
    return exportProfessionalReport(input);
  } catch {
    return {
      status: Object.freeze({
        ok: false,
        format: input.format,
        error: "The report could not be exported. Please try again."
      })
    };
  }
}
