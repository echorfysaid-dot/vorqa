import type { Document, DocumentUploadInput, ProjectDocumentInput } from "@/lib/models";
import { documentCategories, cleanDocumentFileName } from "./documentMapper";

const demoFiles = [
  ["Architectural Drawings", "Villa Casablanca - Architectural package.pdf", "application/pdf", 18400000],
  ["Structural Drawings", "Structural framing drawings.pdf", "application/pdf", 12600000],
  ["BOQ", "Bill of Quantities - Rev B.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 2400000],
  ["Specifications", "Technical specifications.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1800000],
  ["Contracts", "Main contractor agreement.pdf", "application/pdf", 5200000],
  ["Permits", "Municipal permit approval.pdf", "application/pdf", 3100000],
  ["Inspection Reports", "Foundation inspection report.pdf", "application/pdf", 1600000],
  ["Invoices", "Concrete supplier invoice.pdf", "application/pdf", 900000],
  ["Safety Documents", "Site safety plan.pdf", "application/pdf", 2100000],
  ["QA Reports", "QA checklist - July.md", "text/markdown", 18000]
] as const;

async function makeDocuments(projectId: string): Promise<Document[]> {
  return demoFiles.map(([category, filename, mimeType, fileSize], index) => ({
    id: `${projectId}-document-${index + 1}`,
    projectId,
    organizationId: "atlas",
    departmentId: index % 2 === 0 ? "atlas-department-1" : "atlas-department-2",
    departmentName: index % 2 === 0 ? "Engineering" : "Architecture",
    uploaderId: "demo-user",
    uploaderName: index % 2 === 0 ? "Project Manager" : "Architect",
    title: filename.replace(/\.[^.]+$/, ""),
    type: "project_file",
    status: "Saved",
    content: mimeType === "text/markdown" ? "# QA checklist\n\n- Site access verified\n- Foundation inspection complete\n- Pending concrete cube test results\n" : "",
    category,
    version: `v${index % 3 + 1}`,
    filename,
    storagePath: `demo/${projectId}/${filename}`,
    fileSize,
    mimeType,
    tags: [category.toLowerCase().split(" ")[0], index % 2 === 0 ? "approved" : "review"],
    archived: false,
    metadata: {},
    createdAt: `2026-07-${String(index + 3).padStart(2, "0")}T09:00:00.000Z`,
    updatedAt: "2026-07-18T09:00:00.000Z"
  }));
}

export const documentDemoAdapter = {
  async getDocuments(projectId: string) {
    return { data: await makeDocuments(projectId), source: "demo" as const, isFallback: false };
  },

  async getDocument(documentId: string) {
    const projectId = documentId.split("-document-")[0] || "PRJ-1048";
    const document = (await makeDocuments(projectId)).find((item) => item.id === documentId);
    return { data: document, source: "demo" as const, isFallback: false };
  },

  async uploadDocument(input: DocumentUploadInput) {
    const filename = cleanDocumentFileName(input.file.name);
    const document: Document = {
      id: `${input.projectId}-document-preview-${Date.now()}`,
      projectId: input.projectId,
      organizationId: input.organizationId || "atlas",
      departmentId: input.departmentId,
      title: filename.replace(/\.[^.]+$/, ""),
      type: "project_file",
      status: "Saved",
      category: input.category || "Other",
      version: input.version || "v1",
      filename,
      storagePath: `demo/${input.projectId}/${filename}`,
      fileSize: input.file.size,
      mimeType: input.file.type || "application/octet-stream",
      tags: input.tags || [],
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: document, source: "demo" as const, isFallback: false };
  },

  async updateDocument(documentId: string, input: Partial<ProjectDocumentInput>) {
    const projectId = input.projectId || documentId.split("-document-")[0] || "PRJ-1048";
    const document = (await makeDocuments(projectId)).find((item) => item.id === documentId);
    if (!document) return { data: undefined as Document | undefined, source: "demo" as const, isFallback: false, error: "Document not found in demo data." };
    return { data: { ...document, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  async archiveDocument(documentId: string) {
    return { data: Boolean(documentId), source: "demo" as const, isFallback: false };
  },

  async deleteDocument(documentId: string) {
    return { data: Boolean(documentId), source: "demo" as const, isFallback: false };
  },

  async downloadDocument(document: Document) {
    const content = document.content || `Demo file: ${document.filename || document.title}`;
    return { data: new Blob([content], { type: document.mimeType || "text/plain" }), source: "demo" as const, isFallback: false };
  },

  listCategories() {
    return [...documentCategories];
  }
};
