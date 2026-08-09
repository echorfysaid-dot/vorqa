import { getReportMetadataRows, type ProfessionalReport } from "@/lib/report-template";

export type HtmlExportResult = Readonly<{
  format: "html";
  filename: string;
  mimeType: "text/html;charset=utf-8";
  bytes: Uint8Array;
  pageCount: number;
}>;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function listSection(title: string, values: readonly string[]) {
  if (!values.length) return "";
  return `<section><h2>${escapeHtml(title)}</h2><ul>${values.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul></section>`;
}

export function renderPrintReadyHtml(report: ProfessionalReport) {
  const metadata = getReportMetadataRows(report);
  const readiness = report.readiness?.available ? `<section><h2>${escapeHtml(report.labels.readiness)}</h2><div class="metrics">${typeof report.readiness.overall === "number" ? `<div><strong>${escapeHtml(report.labels.readiness)}</strong><span>${report.readiness.overall}%</span></div>` : ""}${report.readiness.metrics.filter((item) => typeof item.score === "number").map((item) => `<div><strong>${escapeHtml(item.category)}</strong><span>${item.score}%</span></div>`).join("")}</div></section>` : "";
  const timeline = report.timeline.length ? `<section><h2>${escapeHtml(report.labels.timeline)}</h2><ol>${report.timeline.map((item) => `<li><time>${escapeHtml(item.occurredAt)}</time><strong>${escapeHtml(item.toolType.replace(/_/g, " "))}</strong><span>${escapeHtml(report.labels.version)} ${item.version}</span></li>`).join("")}</ol></section>` : "";
  return `<!doctype html><html lang="${report.language}" dir="${report.direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(report.title)}</title><style>
  :root{color-scheme:light;--ink:#111827;--muted:#64748b;--gold:#b68a32;--line:#dbe2ea}*{box-sizing:border-box}body{margin:0;background:#fff;color:var(--ink);font:11pt/1.65 Arial,"Noto Sans Arabic",sans-serif}main{max-width:900px;margin:auto;padding:48px}.cover{min-height:72vh;display:flex;flex-direction:column;justify-content:center;border-block-start:5px solid var(--gold);page-break-after:always}.brand{color:var(--gold);font-size:18pt;font-weight:700;letter-spacing:.08em}.cover h1{max-width:760px;font-size:34pt;line-height:1.2;margin:28px 0}.generated{color:var(--muted)}.metadata{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border:1px solid var(--line);margin-block-end:28px}.metadata div{padding:10px 14px;border-block-end:1px solid var(--line)}.metadata dt{color:var(--muted);font-size:9pt}.metadata dd{margin:2px 0 0;font-weight:600}section{break-inside:avoid-page;margin:0 0 28px}h2{font-size:17pt;border-block-end:2px solid var(--gold);padding-block-end:6px;margin:0 0 14px}ul,ol{margin:0;padding-inline-start:22px}li{margin-block-end:7px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.metrics div{border:1px solid var(--line);padding:12px}.metrics span{display:block;font-size:18pt;color:var(--gold)}footer{position:fixed;bottom:0;inset-inline:0;padding:8px 18mm;border-block-start:1px solid var(--line);background:#fff;color:var(--muted);font-size:8pt}.controls{position:fixed;inset-block-start:16px;inset-inline-end:16px}.controls button{border:0;background:var(--ink);color:#fff;padding:10px 16px;cursor:pointer}@page{size:A4;margin:18mm 16mm 20mm}@media print{main{max-width:none;padding:0}.controls{display:none}.cover{min-height:235mm}section{break-inside:avoid-page}footer{position:fixed}}
  </style></head><body><div class="controls"><button type="button" onclick="window.print()">Print</button></div><main><header class="cover">${report.options.includeLogo ? `<div class="brand">${escapeHtml(report.branding.logoText)}</div>` : ""}<h1>${escapeHtml(report.title)}</h1><p class="generated">${escapeHtml(report.branding.generatedBy)}</p></header>${metadata.length ? `<dl class="metadata">${metadata.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}${listSection(report.labels.summary, report.summary)}${listSection(report.labels.findings, report.findings)}${listSection(report.labels.risks, report.risks)}${listSection(report.labels.recommendations, report.recommendations)}${readiness}${timeline}${report.evidenceReferences.length ? `<section><h2>${escapeHtml(report.labels.evidence)}</h2><ul>${report.evidenceReferences.map((item) => `<li>${escapeHtml(item.label)}${item.reference ? ` — ${escapeHtml(item.reference)}` : ""}</li>`).join("")}</ul></section>` : ""}${listSection(report.labels.missingInformation, report.missingInformation)}${report.sections.map((section) => listSection(section.title, section.content)).join("")}${listSection(report.labels.warnings, report.warnings)}</main><footer>${escapeHtml(report.branding.footer)}</footer></body></html>`;
}

export function generateHtmlReport(report: ProfessionalReport, filename = "vorqa-report.html"): HtmlExportResult {
  const html = renderPrintReadyHtml(report);
  return Object.freeze({ format: "html", filename, mimeType: "text/html;charset=utf-8", bytes: new TextEncoder().encode(html), pageCount: 1 });
}
