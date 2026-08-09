import { getReportMetadataRows, type ProfessionalReport } from "@/lib/report-template";

export type DocxExportResult = Readonly<{
  format: "docx";
  filename: string;
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  bytes: Uint8Array;
  partCount: number;
}>;

const encoder = new TextEncoder();

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function directionXml(report: ProfessionalReport) {
  return report.direction === "rtl" ? "<w:bidi/><w:jc w:val=\"right\"/>" : "<w:jc w:val=\"left\"/>";
}

function paragraph(report: ProfessionalReport, text: string, style?: "Title" | "Heading1" | "Heading2" | "Footer") {
  const styleXml = style ? `<w:pStyle w:val="${style}"/>` : "";
  const lang = report.language === "ar" ? "ar-MA" : report.language === "fr" ? "fr-FR" : "en-GB";
  const rtl = report.direction === "rtl" ? "<w:rtl/>" : "";
  return `<w:p><w:pPr>${styleXml}${directionXml(report)}</w:pPr><w:r><w:rPr>${rtl}<w:lang w:val="${lang}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function bullet(report: ProfessionalReport, text: string) {
  return `<w:p><w:pPr>${directionXml(report)}<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:rPr>${report.direction === "rtl" ? "<w:rtl/>" : ""}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function table(report: ProfessionalReport, rows: readonly (readonly [string, string])[]) {
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>${rows
    .map(([label, value]) => `<w:tr><w:tc>${paragraph(report, label)}</w:tc><w:tc>${paragraph(report, value)}</w:tc></w:tr>`)
    .join("")}</w:tbl>`;
}

function documentXml(report: ProfessionalReport) {
  const body = [
    ...(report.options.includeLogo ? [paragraph(report, report.branding.logoText, "Heading2")] : []),
    paragraph(report, report.title, "Title"),
    paragraph(report, report.branding.generatedBy),
    '<w:p><w:r><w:br w:type="page"/></w:r></w:p>',
    ...(getReportMetadataRows(report).length ? [table(report, getReportMetadataRows(report))] : []),
    ...(report.summary.length ? [paragraph(report, report.labels.summary, "Heading1"), ...report.summary.map((item) => paragraph(report, item))] : []),
    ...(report.findings.length ? [paragraph(report, report.labels.findings, "Heading1"), ...report.findings.map((item) => bullet(report, item))] : []),
    ...(report.recommendations.length ? [paragraph(report, report.labels.recommendations, "Heading1"), ...report.recommendations.map((item) => bullet(report, item))] : []),
    ...(report.risks.length ? [paragraph(report, report.labels.risks, "Heading1"), ...report.risks.map((item) => bullet(report, item))] : []),
    ...(report.readiness?.available ? [paragraph(report, report.labels.readiness, "Heading1"), ...(typeof report.readiness.overall === "number" ? [paragraph(report, `${report.labels.readiness}: ${report.readiness.overall}%`)] : []), ...report.readiness.metrics.filter((item) => typeof item.score === "number").map((item) => paragraph(report, `${item.category}: ${item.score}%`))] : []),
    ...(report.timeline.length ? [paragraph(report, report.labels.timeline, "Heading1"), ...report.timeline.map((item) => paragraph(report, `${item.occurredAt} · ${item.toolType.replace(/_/g, " ")} · ${report.labels.version} ${item.version}`))] : []),
    ...(report.evidenceReferences.length ? [paragraph(report, report.labels.evidence, "Heading1"), ...report.evidenceReferences.map((item) => bullet(report, `${item.label}${item.reference ? ` — ${item.reference}` : ""}`))] : []),
    ...(report.missingInformation.length ? [paragraph(report, report.labels.missingInformation, "Heading1"), ...report.missingInformation.map((item) => bullet(report, item))] : []),
    ...report.sections.flatMap((section) => [paragraph(report, section.title, "Heading2"), ...section.content.map((item) => paragraph(report, item))]),
    ...(report.warnings.length ? [paragraph(report, report.labels.warnings, "Heading1"), ...report.warnings.map((item) => bullet(report, item))] : []),
    '<w:sectPr><w:footerReference w:type="default" r:id="rId1"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}</w:body></w:document>`;
}

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;
const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>`;
const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:color w:val="111827"/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:color w:val="111827"/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:color w:val="D6B36A"/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="Footer"/><w:rPr><w:color w:val="64748B"/><w:sz w:val="18"/></w:rPr></w:style></w:styles>`;

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function concat(parts: readonly Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function zip(files: readonly { name: string; content: string }[]) {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
      ...name,
      ...data
    ]);
    locals.push(local);
    centrals.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ...name
    ]));
    offset += local.length;
  }
  const central = concat(centrals);
  const local = concat(locals);
  const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(central.length), ...u32(local.length), ...u16(0)]);
  return concat([local, central, end]);
}

export function generateDocxReport(report: ProfessionalReport, filename = "vorqa-report.docx"): DocxExportResult {
  const footer = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>${xmlEscape(report.branding.footer)} · ${xmlEscape(report.labels.page)} </w:t></w:r><w:fldSimple w:instr="PAGE"/><w:r><w:t> ${xmlEscape(report.labels.of)} </w:t></w:r><w:fldSimple w:instr="NUMPAGES"/></w:p></w:ftr>`;
  const files = [
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rootRels },
    { name: "word/_rels/document.xml.rels", content: docRels },
    { name: "word/document.xml", content: documentXml(report) },
    { name: "word/styles.xml", content: styles },
    { name: "word/footer1.xml", content: footer }
  ];
  return Object.freeze({
    format: "docx",
    filename,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: zip(files),
    partCount: files.length
  });
}
