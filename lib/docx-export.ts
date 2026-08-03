import type { ProfessionalReport } from "@/lib/report-template";

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

function paragraph(text: string, style?: "Title" | "Heading1" | "Heading2" | "Footer") {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function bullet(text: string) {
  return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function table(rows: readonly [string, string][]) {
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/></w:tblPr>${rows
    .map(([label, value]) => `<w:tr><w:tc><w:p><w:r><w:b/><w:t>${xmlEscape(label)}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${xmlEscape(value)}</w:t></w:r></w:p></w:tc></w:tr>`)
    .join("")}</w:tbl>`;
}

function documentXml(report: ProfessionalReport) {
  const body = [
    paragraph(report.branding.logoText, "Heading2"),
    paragraph(report.title, "Title"),
    paragraph(report.branding.generatedBy),
    table([
      ["Project", report.metadata.projectName],
      ["Project ID", report.metadata.projectId],
      ["Client", report.metadata.client],
      ["Organization", report.metadata.organization],
      ["Generated", report.metadata.generatedAt],
      ["Analysis Type", report.metadata.analysisType],
      ["Health", report.metadata.healthScore],
      ["Confidence", `${report.metadata.confidenceScore}%`]
    ]),
    paragraph("Summary", "Heading1"),
    ...report.summary.map((item) => paragraph(item)),
    paragraph("Detailed Findings", "Heading1"),
    ...report.findings.map(bullet),
    paragraph("Recommendations", "Heading1"),
    ...report.recommendations.map(bullet),
    paragraph("Risk Indicators", "Heading1"),
    ...report.risks.map(bullet),
    ...report.sections.flatMap((section) => [paragraph(section.title, "Heading2"), ...section.content.map((item) => paragraph(item))]),
    paragraph("Warnings", "Heading1"),
    ...report.warnings.map(bullet),
    paragraph(report.branding.footer, "Footer"),
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
}

const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;
const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;
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
  const files = [
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rootRels },
    { name: "word/_rels/document.xml.rels", content: docRels },
    { name: "word/document.xml", content: documentXml(report) },
    { name: "word/styles.xml", content: styles }
  ];
  return Object.freeze({
    format: "docx",
    filename,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    bytes: zip(files),
    partCount: files.length
  });
}

