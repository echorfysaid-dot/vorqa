import fs from "node:fs";
import path from "node:path";
import { jsPDF } from "jspdf";
import { getReportMetadataRows, type ProfessionalReport } from "@/lib/report-template";

export type PdfExportResult = Readonly<{
  format: "pdf";
  filename: string;
  mimeType: "application/pdf";
  bytes: Uint8Array;
  pageCount: number;
}>;

const gold: [number, number, number] = [214, 179, 106];
const graphite: [number, number, number] = [17, 24, 39];
const muted: [number, number, number] = [71, 85, 105];
let fontBase64: string | undefined;

function getFont() {
  if (fontBase64) return fontBase64;
  const fontPath = path.join(process.cwd(), "assets", "fonts", "NotoSansArabic.ttf");
  fontBase64 = fs.readFileSync(fontPath).toString("base64");
  return fontBase64;
}

function addFont(document: jsPDF) {
  document.addFileToVFS("NotoSansArabic.ttf", getFont());
  document.addFont("NotoSansArabic.ttf", "NotoSansArabic", "normal");
  document.setFont("NotoSansArabic", "normal");
}

export function generatePdfReport(report: ProfessionalReport, filename = "vorqa-report.pdf"): PdfExportResult {
  const document = new jsPDF({ unit: "pt", format: "a4", compress: true, putOnlyUsedFonts: true });
  addFont(document);
  document.setR2L(report.direction === "rtl");
  const width = document.internal.pageSize.getWidth();
  const height = document.internal.pageSize.getHeight();
  const margin = 54;
  const contentWidth = width - margin * 2;
  const x = report.direction === "rtl" ? width - margin : margin;
  const align = report.direction === "rtl" ? "right" : "left";
  let y = margin;

  const ensure = (needed = 28) => {
    if (y + needed <= height - 64) return;
    document.addPage();
    addFont(document);
    document.setR2L(report.direction === "rtl");
    y = margin;
  };

  const write = (value: string, size = 10, color = graphite, gap = 8) => {
    const text = value.trim();
    if (!text) return;
    document.setFontSize(size);
    document.setTextColor(...color);
    const wrapped = document.splitTextToSize(text, contentWidth) as string[];
    const lineHeight = size * 1.55;
    ensure(wrapped.length * lineHeight + gap);
    document.text(wrapped, x, y, { align, baseline: "top" });
    y += wrapped.length * lineHeight + gap;
  };

  const heading = (value: string) => {
    ensure(40);
    y += 9;
    document.setDrawColor(...gold);
    document.setLineWidth(1.5);
    document.line(report.direction === "rtl" ? x - 42 : x, y, report.direction === "rtl" ? x : x + 42, y);
    y += 10;
    write(value, 15, graphite, 8);
  };

  document.setFillColor(...graphite);
  document.rect(0, 0, width, 220, "F");
  document.setTextColor(255, 255, 255);
  if (report.options.includeLogo) {
    document.setFontSize(16);
    document.text(report.branding.logoText, x, 54, { align });
  }
  document.setTextColor(...gold);
  document.setFontSize(25);
  const title = document.splitTextToSize(report.title, contentWidth) as string[];
  document.text(title, x, 100, { align, baseline: "top" });
  document.setTextColor(226, 232, 240);
  document.setFontSize(10);
  document.text(report.branding.generatedBy, x, 180, { align });
  y = 250;

  const metadata = getReportMetadataRows(report);
  if (metadata.length) {
    document.setFillColor(248, 250, 252);
    document.roundedRect(margin, y - 12, contentWidth, metadata.length * 27 + 18, 5, 5, "F");
    for (const [label, value] of metadata) {
      document.setFontSize(9);
      document.setTextColor(...muted);
      const row = `${label}: ${value}`;
      document.text(row, x + (report.direction === "rtl" ? -12 : 12), y, { align, baseline: "top" });
      y += 27;
    }
    y += 14;
  }

  const listSection = (titleValue: string, values: readonly string[]) => {
    if (!values.length) return;
    heading(titleValue);
    for (const value of values) write(`• ${value}`, 10, graphite, 5);
  };

  listSection(report.labels.summary, report.summary);
  listSection(report.labels.findings, report.findings);
  listSection(report.labels.risks, report.risks);
  listSection(report.labels.recommendations, report.recommendations);
  if (report.readiness?.available) {
    heading(report.labels.readiness);
    if (typeof report.readiness.overall === "number") write(`${report.labels.readiness}: ${report.readiness.overall}%`);
    for (const metric of report.readiness.metrics) if (typeof metric.score === "number") write(`${metric.category}: ${metric.score}%`);
  }
  if (report.timeline.length) {
    heading(report.labels.timeline);
    for (const event of report.timeline) write(`${event.occurredAt} · ${event.toolType.replace(/_/g, " ")} · ${report.labels.version} ${event.version} · ${event.status}`);
  }
  if (report.evidenceReferences.length) {
    heading(report.labels.evidence);
    for (const evidence of report.evidenceReferences) write(`• ${evidence.label}${evidence.reference ? ` — ${evidence.reference}` : ""}`);
  }
  listSection(report.labels.missingInformation, report.missingInformation);
  for (const section of report.sections) listSection(section.title, section.content);
  listSection(report.labels.warnings, report.warnings);

  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    addFont(document);
    document.setDrawColor(226, 232, 240);
    document.line(margin, height - 42, width - margin, height - 42);
    document.setFontSize(8);
    document.setTextColor(...muted);
    document.text(report.branding.footer, margin, height - 24, { align: "left" });
    document.text(`${report.labels.page} ${page} ${report.labels.of} ${pageCount}`, width - margin, height - 24, { align: "right" });
  }

  return Object.freeze({
    format: "pdf",
    filename,
    mimeType: "application/pdf",
    bytes: new Uint8Array(document.output("arraybuffer")),
    pageCount
  });
}
