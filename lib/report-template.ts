import type { ExportReadyReport, ExportReadyReportSection } from "@/lib/analysis-hardening";
import { vorqaReportBranding, type ReportBranding } from "@/lib/report-branding";

export type ProfessionalReportMetadata = Readonly<{
  projectName?: string;
  projectId?: string;
  client?: string;
  organization?: string;
  analysisType?: string;
  healthScore?: string;
  confidenceScore?: number;
  generatedAt?: string;
}>;

export type ProfessionalReportSection = ExportReadyReportSection;

export type ProfessionalReport = Readonly<{
  title: string;
  metadata: Required<ProfessionalReportMetadata>;
  summary: readonly string[];
  findings: readonly string[];
  recommendations: readonly string[];
  risks: readonly string[];
  sections: readonly ProfessionalReportSection[];
  warnings: readonly string[];
  branding: ReportBranding;
}>;

function normalizeText(value: unknown, fallback = "Unavailable") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeLines(values: readonly string[] | undefined, fallback: string) {
  const lines = (values || []).map((line) => normalizeText(line, "")).filter(Boolean);
  return lines.length ? Object.freeze(lines) : Object.freeze([fallback]);
}

function sectionText(report: ExportReadyReport, ids: readonly string[]) {
  return report.sections
    .filter((section) => ids.some((id) => section.id.toLowerCase().includes(id) || section.title.toLowerCase().includes(id)))
    .flatMap((section) => section.content)
    .filter(Boolean);
}

export function createProfessionalReportTemplate(input: {
  report: ExportReadyReport;
  metadata?: ProfessionalReportMetadata;
  branding?: ReportBranding;
}): ProfessionalReport {
  const report = input.report;
  const metadata = input.metadata || {};
  const findings = sectionText(report, ["finding", "clause", "overview", "detail"]);
  const recommendations = sectionText(report, ["recommend", "action", "next"]);
  const risks = sectionText(report, ["risk", "warning"]);
  const summary = sectionText(report, ["summary", "executive"]);

  return Object.freeze({
    title: normalizeText(report.title, "Vorqa AI Report"),
    metadata: Object.freeze({
      projectName: normalizeText(metadata.projectName || report.projectTitle, "Project"),
      projectId: normalizeText(metadata.projectId || report.projectId, "Unassigned"),
      client: normalizeText(metadata.client, "Client not specified"),
      organization: normalizeText(metadata.organization, "Organization not specified"),
      analysisType: normalizeText(metadata.analysisType || report.source.replace(/_/g, " "), "Construction Intelligence"),
      healthScore: normalizeText(metadata.healthScore, "Needs Review"),
      confidenceScore: typeof metadata.confidenceScore === "number" ? Math.max(0, Math.min(100, Math.round(metadata.confidenceScore))) : 0,
      generatedAt: normalizeText(metadata.generatedAt || report.generatedAt, new Date().toISOString())
    }),
    summary: normalizeLines(summary, "No executive summary was provided."),
    findings: normalizeLines(findings, "No detailed findings were provided."),
    recommendations: normalizeLines(recommendations, "No recommendations were provided."),
    risks: normalizeLines(risks, "No risk indicators were provided."),
    sections: Object.freeze(report.sections.map((section) => Object.freeze({
      ...section,
      content: normalizeLines(section.content, "No content available.")
    }))),
    warnings: normalizeLines(report.warnings, "Review all outputs with a qualified project professional before decision-making."),
    branding: input.branding || vorqaReportBranding
  });
}

export function renderReportPlainText(report: ProfessionalReport) {
  const lines = [
    report.branding.logoText,
    report.title,
    report.branding.generatedBy,
    "",
    `Project: ${report.metadata.projectName}`,
    `Project ID: ${report.metadata.projectId}`,
    `Client: ${report.metadata.client}`,
    `Organization: ${report.metadata.organization}`,
    `Generated: ${report.metadata.generatedAt}`,
    `Analysis Type: ${report.metadata.analysisType}`,
    `Health: ${report.metadata.healthScore}`,
    `Confidence: ${report.metadata.confidenceScore}%`,
    "",
    "Summary",
    ...report.summary,
    "",
    "Detailed Findings",
    ...report.findings.map((item) => `- ${item}`),
    "",
    "Recommendations",
    ...report.recommendations.map((item) => `- ${item}`),
    "",
    "Risk Indicators",
    ...report.risks.map((item) => `- ${item}`),
    "",
    ...report.sections.flatMap((section) => [section.title, ...section.content, ""]),
    "Warnings",
    ...report.warnings.map((item) => `- ${item}`),
    "",
    report.branding.footer
  ];
  return lines.join("\n");
}

