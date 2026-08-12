import type { RFQ, RFQFilters, RFQResponse, RFQStatus, Quotation } from "@/lib/models";
import { demoQuotations, demoRfqs } from "@/lib/data";
import { marketplaceRepository } from "./marketplaceRepository";

export type DemoRfq = (typeof demoRfqs)[number];
export type DemoQuotation = (typeof demoQuotations)[number];

export type SupabaseRfqRecord = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  project_id?: string | null;
  title?: string | null;
  description?: string | null;
  project_name?: string | null;
  category?: string | null;
  scope_of_work?: string | null;
  technical_requirements?: string[] | null;
  budget_range?: string | null;
  currency?: string | null;
  submission_deadline?: string | null;
  delivery_date?: string | null;
  priority?: string | null;
  visibility?: string | null;
  status?: string | null;
  attachments?: unknown[] | null;
  suppliers?: unknown[] | null;
  items?: unknown[] | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function toStatus(status?: string | null): RFQStatus | "Open" {
  if (status === "Draft" || status === "Published" || status === "Pending Responses" || status === "Under Review" || status === "Awarded" || status === "Cancelled" || status === "Closed" || status === "Open") return status;
  if (status === "draft") return "Draft";
  if (status === "published") return "Published";
  if (status === "pending_responses") return "Pending Responses";
  if (status === "under_review") return "Under Review";
  if (status === "awarded") return "Awarded";
  if (status === "cancelled") return "Cancelled";
  if (status === "closed") return "Closed";
  return "Draft";
}

function progressForStatus(status: string) {
  const values: Record<string, number> = {
    Draft: 18,
    Published: 42,
    Open: 52,
    "Pending Responses": 58,
    "Under Review": 74,
    Awarded: 100,
    Cancelled: 0,
    Closed: 88
  };
  return values[status] ?? 24;
}

function supplierFromName(name: string, index: number) {
  const company = marketplaceRepository.listCompanies().find((item) => item.name === name);
  return {
    id: company?.id || company?.slug || `supplier-${index + 1}`,
    companySlug: company?.slug,
    companyName: name,
    category: company?.category,
    country: company?.country,
    city: company?.city,
    verified: company?.verified,
    rating: company?.rating,
    status: index === 0 ? "Recommended" as const : "Invited" as const
  };
}

export function mapDemoRfqToDomain(rfq: DemoRfq): RFQ {
  const status = toStatus(rfq.status);
  const suppliers = rfq.companies.map(supplierFromName);
  return {
    ...rfq,
    status,
    ownerId: "demo-user",
    organizationId: "atlas",
    organization: "Atlas Construction Group",
    projectId: rfq.project === "Luxury Villa Casablanca" ? "PRJ-1048" : undefined,
    budgetRange: rfq.budget,
    currency: "MAD",
    submissionDeadline: rfq.dueDate,
    deliveryDate: rfq.dueDate === "Closed" ? undefined : "2026-09-15",
    priority: rfq.status === "Open" ? "High" : rfq.status === "Draft" ? "Medium" : "Low",
    visibility: "Invited Suppliers",
    scopeOfWork: rfq.description,
    technicalRequirements: [
      "Submit technical methodology and execution plan.",
      "Include team capacity and mobilization assumptions.",
      "Attach required certificates and compliance documents."
    ],
    items: [
      { id: `${rfq.id}-item-1`, title: rfq.category, description: rfq.description, quantity: 1, unit: "package", category: rfq.category }
    ],
    attachments: [
      { id: `${rfq.id}-doc-1`, name: "Scope of Work.pdf", type: "application/pdf", category: "Scope" },
      { id: `${rfq.id}-doc-2`, name: "Technical Requirements.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", category: "Requirements" }
    ],
    suppliers,
    responses: demoQuotations.slice(0, Math.min(4, suppliers.length)).map((quote, index) => mapDemoQuotationToResponse(quote, rfq.id, suppliers[index]?.id || `supplier-${index + 1}`)),
    rfqTimeline: {
      createdAt: "2026-07-12T09:00:00.000Z",
      publishedAt: status === "Draft" ? undefined : "2026-07-14T09:00:00.000Z",
      submissionDeadline: rfq.dueDate,
      deliveryDate: rfq.dueDate === "Closed" ? undefined : "2026-09-15",
      events: [
        { id: `${rfq.id}-event-1`, title: "RFQ draft created", description: "Procurement workspace prepared the first RFQ draft.", date: "2026-07-12", type: "created" },
        { id: `${rfq.id}-event-2`, title: "Suppliers selected", description: `${rfq.companies.length} suppliers added from Marketplace.`, date: "2026-07-13", type: "supplier" },
        { id: `${rfq.id}-event-3`, title: "VORA scope review", description: "VORA highlighted scope completeness and supplier fit.", date: "2026-07-14", type: "review" }
      ]
    },
    activity: [
      { id: `${rfq.id}-activity-1`, title: "RFQ reviewed by procurement", date: "2026-07-14", type: "activity" },
      { id: `${rfq.id}-activity-2`, title: "VORA generated supplier suggestions", date: "2026-07-14", type: "activity" }
    ],
    voraInsights: {
      summary: `${rfq.title} is ready for supplier evaluation with ${rfq.companies.length} invited companies.`,
      missingInformation: status === "Draft" ? ["Attach final BOQ", "Confirm delivery location", "Confirm approval workflow"] : ["Confirm commercial evaluation weights"],
      supplierSuggestions: suppliers.map((supplier) => supplier.companyName).slice(0, 3),
      risks: ["Deadline pressure may reduce supplier response quality", "Scope assumptions should be clarified before award"],
      executiveSummary: `VORA recommends validating scope completeness, comparing supplier capacity, and preparing an executive award memo before final decision.`
    },
    metadata: {
      progress: progressForStatus(status),
      titleKey: rfq.titleKey,
      descriptionKey: rfq.descriptionKey,
      demo: true
    },
    createdAt: "2026-07-12T09:00:00.000Z",
    updatedAt: "2026-07-18T11:00:00.000Z"
  };
}

export function mapDemoQuotationToResponse(quote: DemoQuotation, rfqId = "RFQ-1001", supplierId = quote.company): RFQResponse {
  return {
    id: `${rfqId}-${supplierId}-response`,
    rfqId,
    supplierId,
    supplierName: quote.company,
    status: quote.badge === "Recommended" ? "Shortlisted" : "Submitted",
    price: quote.price,
    totalPrice: quote.totalPrice,
    currency: "MAD",
    duration: quote.duration,
    notes: quote.notes,
    voraFit: quote.voraFit,
    createdAt: "2026-07-16T09:00:00.000Z",
    updatedAt: "2026-07-18T09:00:00.000Z"
  };
}

export function mapSupabaseRfqToDomain(record: SupabaseRfqRecord): RFQ {
  const status = toStatus(record.status);
  const suppliers = Array.isArray(record.suppliers) ? record.suppliers.map((supplier, index) => {
    const value = supplier as Record<string, unknown>;
    return {
      id: String(value.id || `supplier-${index + 1}`),
      companySlug: typeof value.companySlug === "string" ? value.companySlug : undefined,
      companyName: String(value.companyName || value.name || "Supplier"),
      category: typeof value.category === "string" ? value.category : undefined,
      country: typeof value.country === "string" ? value.country : undefined,
      city: typeof value.city === "string" ? value.city : undefined,
      verified: Boolean(value.verified),
      rating: typeof value.rating === "number" ? value.rating : undefined,
      status: "Invited" as const
    };
  }) : [];
  return {
    id: record.id,
    ownerId: record.owner_id || undefined,
    organizationId: record.organization_id || undefined,
    projectId: record.project_id || undefined,
    title: record.title || "Untitled RFQ",
    description: record.description || undefined,
    project: record.project_name || "Unassigned project",
    status,
    category: record.category || "General Contractor",
    budget: record.budget_range || "Not specified",
    budgetRange: record.budget_range || undefined,
    currency: record.currency === "USD" || record.currency === "EUR" || record.currency === "GBP" ? record.currency : "MAD",
    timeline: record.delivery_date || "Not scheduled",
    companies: suppliers.map((supplier) => supplier.companyName),
    dueDate: record.submission_deadline || "Not scheduled",
    submissionDeadline: record.submission_deadline || undefined,
    deliveryDate: record.delivery_date || undefined,
    priority: record.priority || "Medium",
    visibility: record.visibility === "Marketplace" || record.visibility === "Private" ? record.visibility : "Invited Suppliers",
    scopeOfWork: record.scope_of_work || undefined,
    technicalRequirements: record.technical_requirements || [],
    items: Array.isArray(record.items) ? record.items as RFQ["items"] : [],
    attachments: Array.isArray(record.attachments) ? record.attachments as RFQ["attachments"] : [],
    suppliers,
    responses: [],
    rfqTimeline: {
      createdAt: record.created_at || undefined,
      submissionDeadline: record.submission_deadline || "Not scheduled",
      deliveryDate: record.delivery_date || undefined,
      events: []
    },
    activity: [],
    voraInsights: {
      summary: "RFQ loaded from production data.",
      missingInformation: [],
      supplierSuggestions: suppliers.map((supplier) => supplier.companyName).slice(0, 3),
      risks: [],
      executiveSummary: "Production RFQ is ready for future VORA review."
    },
    metadata: record.metadata || {},
    createdAt: record.created_at || undefined,
    updatedAt: record.updated_at || undefined
  };
}

export function filterRfqs(rfqs: RFQ[], filters: RFQFilters = {}) {
  const query = String(filters.query || "").toLowerCase().trim();
  return rfqs.filter((rfq) => {
    const searchText = `${rfq.id} ${rfq.title} ${rfq.project} ${rfq.category} ${rfq.description || ""} ${rfq.companies.join(" ")}`.toLowerCase();
    return (!query || searchText.includes(query))
      && (!filters.status || filters.status === "All statuses" || rfq.status === filters.status)
      && (!filters.category || filters.category === "All categories" || rfq.category === filters.category)
      && (!filters.projectId || rfq.projectId === filters.projectId)
      && (!filters.organizationId || rfq.organizationId === filters.organizationId)
      && (!filters.priority || filters.priority === "All priorities" || rfq.priority === filters.priority)
      && (!filters.supplier || filters.supplier === "All suppliers" || rfq.companies.includes(filters.supplier));
  });
}

export function summarizeRfqs(rfqs: RFQ[]) {
  const byStatus = (status: string) => rfqs.filter((rfq) => rfq.status === status).length;
  return {
    draft: byStatus("Draft"),
    published: byStatus("Published") + byStatus("Open"),
    pendingResponses: byStatus("Pending Responses"),
    underReview: byStatus("Under Review"),
    awarded: byStatus("Awarded"),
    cancelled: byStatus("Cancelled"),
    closed: byStatus("Closed"),
    upcomingDeadlines: rfqs.filter((rfq) => rfq.dueDate !== "Closed").slice(0, 4),
    recentlyCreated: [...rfqs].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 4)
  };
}

export function mapQuotationToDomain(quote: DemoQuotation): Quotation {
  return {
    ...quote,
    currency: "MAD",
    status: quote.badge === "Recommended" ? "Shortlisted" : "Submitted"
  };
}
