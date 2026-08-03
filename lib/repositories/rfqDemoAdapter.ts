import { awardSteps, demoQuotations, demoRfqs, rfqWizardSteps } from "@/lib/data";
import type { RFQ, RFQFilters, RFQInput } from "@/lib/models";
import { filterRfqs, mapDemoRfqToDomain, mapQuotationToDomain, summarizeRfqs } from "./rfqMapper";

function rfqs(): RFQ[] {
  return demoRfqs.map(mapDemoRfqToDomain);
}

export const rfqDemoAdapter = {
  getRfqs(filters: RFQFilters = {}) {
    return { data: filterRfqs(rfqs(), filters), source: "demo" as const, isFallback: false };
  },

  getRfq(id: string) {
    return { data: rfqs().find((rfq) => rfq.id === id), source: "demo" as const, isFallback: false };
  },

  createRfq(input: RFQInput) {
    const now = new Date().toISOString();
    const rfq: RFQ = {
      id: `RFQ-${Date.now()}`,
      ownerId: "demo-user",
      organizationId: input.organizationId || "atlas",
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      project: input.project || "Unassigned project",
      status: "Draft",
      category: input.category || "General Contractor",
      budget: input.budgetRange || "Not specified",
      budgetRange: input.budgetRange,
      currency: input.currency || "MAD",
      timeline: input.deliveryDate || "Not scheduled",
      companies: input.suppliers?.map((supplier) => supplier.companyName) || [],
      dueDate: input.submissionDeadline || "Not scheduled",
      submissionDeadline: input.submissionDeadline,
      deliveryDate: input.deliveryDate,
      priority: input.priority || "Medium",
      visibility: input.visibility || "Invited Suppliers",
      scopeOfWork: input.scopeOfWork,
      technicalRequirements: input.technicalRequirements || [],
      items: input.items || [],
      attachments: input.attachments || [],
      suppliers: input.suppliers || [],
      responses: [],
      rfqTimeline: {
        createdAt: now,
        submissionDeadline: input.submissionDeadline || "Not scheduled",
        deliveryDate: input.deliveryDate,
        events: [{ id: "created", title: "RFQ created", date: now, type: "created" }]
      },
      activity: [{ id: "created", title: "RFQ draft created", date: now, type: "created" }],
      voraInsights: {
        summary: "Draft RFQ created in demo mode.",
        missingInformation: ["Review final supplier list", "Attach technical documents"],
        supplierSuggestions: input.suppliers?.map((supplier) => supplier.companyName).slice(0, 3) || [],
        risks: ["Submission deadline should be confirmed"],
        executiveSummary: "VORA recommends completing requirements before publishing."
      },
      createdAt: now,
      updatedAt: now
    };
    return { data: rfq, source: "demo" as const, isFallback: false };
  },

  updateRfq(id: string, input: Partial<RFQInput>) {
    const rfq = rfqs().find((item) => item.id === id);
    if (!rfq) return { data: undefined as RFQ | undefined, source: "demo" as const, isFallback: false, error: "RFQ not found in demo data." };
    return { data: { ...rfq, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  getSummary() {
    return { data: summarizeRfqs(rfqs()), source: "demo" as const, isFallback: false };
  },

  getQuotations() {
    return { data: demoQuotations.map(mapQuotationToDomain), source: "demo" as const, isFallback: false };
  },

  getWizardSteps() {
    return { data: [...rfqWizardSteps], source: "demo" as const, isFallback: false };
  },

  getAwardSteps() {
    return { data: [...awardSteps], source: "demo" as const, isFallback: false };
  }
};
