import type { ProfessionalReport } from "@/lib/report-template";

export type PdfExportResult = Readonly<{
  format: "pdf";
  filename: string;
  mimeType: "application/pdf";
  bytes: Uint8Array;
  pageCount: number;
}>;

const pageWidth = 595;
const pageHeight = 842;
const margin = 54;
const lineHeight = 14;
const maxLinesPerPage = 48;

function ascii(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n\r\t]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdf(value: string) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrap(text: string, max = 92) {
  const words = ascii(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function reportLines(report: ProfessionalReport) {
  const lines: Array<{ text: string; size: number; heading?: boolean }> = [
    { text: report.branding.logoText, size: 20, heading: true },
    { text: report.title, size: 18, heading: true },
    { text: report.branding.generatedBy, size: 10 },
    { text: "", size: 10 },
    { text: `Project: ${report.metadata.projectName}`, size: 10 },
    { text: `Project ID: ${report.metadata.projectId}`, size: 10 },
    { text: `Client: ${report.metadata.client}`, size: 10 },
    { text: `Organization: ${report.metadata.organization}`, size: 10 },
    { text: `Generation Date: ${report.metadata.generatedAt}`, size: 10 },
    { text: `Analysis Type: ${report.metadata.analysisType}`, size: 10 },
    { text: `Health Score: ${report.metadata.healthScore}`, size: 10 },
    { text: `Confidence Score: ${report.metadata.confidenceScore}%`, size: 10 },
    { text: "", size: 10 },
    { text: "Summary", size: 14, heading: true },
    ...report.summary.flatMap((item) => wrap(item).map((text) => ({ text, size: 10 }))),
    { text: "", size: 10 },
    { text: "Detailed Findings", size: 14, heading: true },
    ...report.findings.flatMap((item) => wrap(`- ${item}`).map((text) => ({ text, size: 10 }))),
    { text: "", size: 10 },
    { text: "Recommendations", size: 14, heading: true },
    ...report.recommendations.flatMap((item) => wrap(`- ${item}`).map((text) => ({ text, size: 10 }))),
    { text: "", size: 10 },
    { text: "Risk Indicators", size: 14, heading: true },
    ...report.risks.flatMap((item) => wrap(`- ${item}`).map((text) => ({ text, size: 10 }))),
    { text: "", size: 10 }
  ];
  for (const section of report.sections) {
    lines.push({ text: section.title, size: 13, heading: true });
    for (const content of section.content) {
      for (const text of wrap(content)) lines.push({ text, size: 10 });
    }
    lines.push({ text: "", size: 10 });
  }
  lines.push({ text: "Warnings", size: 13, heading: true });
  for (const warning of report.warnings) {
    for (const text of wrap(`- ${warning}`)) lines.push({ text, size: 10 });
  }
  return lines;
}

function chunkPages(lines: ReturnType<typeof reportLines>) {
  const pages: typeof lines[] = [];
  for (let index = 0; index < lines.length; index += maxLinesPerPage) {
    pages.push(lines.slice(index, index + maxLinesPerPage));
  }
  return pages.length ? pages : [[{ text: "No report content.", size: 10 }]];
}

function textObject(lines: ReturnType<typeof reportLines>, pageNumber: number, pageCount: number, footer: string) {
  let y = pageHeight - margin;
  const parts = [
    "0.85 0.70 0.42 rg",
    `36 ${pageHeight - 42} 523 2 re f`,
    "0.07 0.09 0.15 rg",
    "BT"
  ];
  for (const line of lines) {
    const font = line.heading ? "F2" : "F1";
    parts.push(`/${font} ${line.size} Tf`);
    parts.push(`1 0 0 1 ${margin} ${y} Tm`);
    parts.push(`(${escapePdf(line.text)}) Tj`);
    y -= line.heading ? lineHeight + 4 : lineHeight;
  }
  parts.push("/F1 8 Tf");
  parts.push(`1 0 0 1 ${margin} 34 Tm`);
  parts.push(`(${escapePdf(footer)} - Page ${pageNumber} of ${pageCount}) Tj`);
  parts.push("ET");
  return parts.join("\n");
}

function toBytes(value: string) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) bytes[index] = value.charCodeAt(index) & 0xff;
  return bytes;
}

export function generatePdfReport(report: ProfessionalReport, filename = "vorqa-report.pdf"): PdfExportResult {
  const pages = chunkPages(reportLines(report));
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`
  ];

  pages.forEach((page, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R /F2 ${4 + pages.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    const stream = textObject(page, index + 1, pages.length, report.branding.footer);
    objects.push(`<< /Length ${toBytes(stream).length} >>\nstream\n${stream}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(toBytes(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = toBytes(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Object.freeze({
    format: "pdf",
    filename,
    mimeType: "application/pdf",
    bytes: toBytes(pdf),
    pageCount: pages.length
  });
}

