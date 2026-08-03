import type {
  AwardRecommendation,
  Quotation,
  QuotationComparison,
  QuotationComparisonRow,
  QuotationDashboardSummary,
  QuotationDocument,
  QuotationEvaluation,
  QuotationFilters,
  QuotationInput,
  QuotationItem,
  QuotationScore,
  QuotationStatus
} from "@/lib/models";
import { demoQuotations, demoRfqs } from "@/lib/data";
import { marketplaceRepository } from "./marketplaceRepository";

export type DemoQuotationRecord = (typeof demoQuotations)[number];

export type SupabaseQuotationRecord = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  project_id?: string | null;
  rfq_id?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  supplier_slug?: string | null;
  currency?: string | null;
  total_price?: number | null;
  status?: string | null;
  submission_date?: string | null;
  expiration_date?: string | null;
  lead_time?: string | null;
  delivery_terms?: string | null;
  payment_terms?: string | null;
  warranty?: string | null;
  commercial_notes?: string | null;
  technical_notes?: string | null;
  attachments?: unknown[] | null;
  items?: unknown[] | null;
  evaluation?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const scoreLabels: Record<string, string> = {
  approach: "Technical approach",
  team: "Team capability",
  experience: "Relevant experience",
  delivery: "Delivery plan",
  quality: "Quality assurance",
  safety: "Safety compliance",
  documentation: "Documentation quality",
  price: "Price competitiveness",
  payment: "Payment terms",
  warranty: "Warranty",
  schedule: "Schedule",
  flexibility: "Contract flexibility",
  stability: "Financial stability"
};

function parseDurationWeeks(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 999;
}

function money(value: number, currency = "MAD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function calculateQuotationItem(description: string, amount: number, quotationId: string, index: number): QuotationItem {
  const tax = Math.round(amount * 0.1);
  const subtotal = Math.max(0, amount - tax);
  return {
    id: `${quotationId}-item-${index + 1}`,
    quotationId,
    description,
    quantity: 1,
    unit: "package",
    unitPrice: subtotal,
    discount: 0,
    tax,
    subtotal,
    total: amount,
    remarks: `${description} cost component from supplier quotation.`
  };
}

export function calculateQuotationTotals(items: QuotationItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const tax = items.reduce((sum, item) => sum + (item.tax || 0), 0);
  const total = items.reduce((sum, item) => sum + item.total, 0);
  return { subtotal, discount, tax, total };
}

function criteriaFromScores(scores: Record<string, number>): QuotationScore[] {
  return Object.entries(scores).map(([key, value]) => ({
    label: scoreLabels[key] || key,
    value,
    weight: key === "price" || key === "approach" || key === "delivery" ? 18 : 12
  }));
}

function evaluationFor(quote: DemoQuotationRecord, quotationId: string): QuotationEvaluation {
  const technicalCriteria = criteriaFromScores(quote.technicalScores);
  const commercialCriteria = criteriaFromScores(quote.commercialScores);
  const technicalScore = Math.round(technicalCriteria.reduce((sum, item) => sum + item.value, 0) / Math.max(1, technicalCriteria.length));
  const commercialScore = Math.round(commercialCriteria.reduce((sum, item) => sum + item.value, 0) / Math.max(1, commercialCriteria.length));
  const riskScore = quote.riskLevel === "Lowest" ? 12 : quote.riskLevel === "Low" ? 18 : quote.riskLevel === "Medium" ? 42 : 64;
  const overallScore = Math.round((technicalScore * 0.42) + (commercialScore * 0.34) + (quote.voraFit * 0.18) + ((100 - riskScore) * 0.06));
  return {
    technicalScore,
    commercialScore,
    riskScore,
    overallScore,
    weightedScore: overallScore,
    reviewerNotes: `${quote.company} has a ${quote.riskLevel.toLowerCase()} risk profile and ${quote.badge.toLowerCase()} positioning.`,
    technicalCriteria,
    commercialCriteria,
    createdAt: "2026-07-18T10:30:00.000Z",
    updatedAt: "2026-07-18T10:30:00.000Z"
  };
}

function documentsFor(quote: DemoQuotationRecord, quotationId: string): QuotationDocument[] {
  return [
    { id: `${quotationId}-doc-technical`, quotationId, name: `${quote.logo || "Supplier"} Technical Proposal.pdf`, type: "Technical", mimeType: "application/pdf", size: 2400000, uploadedAt: "2026-07-16T09:00:00.000Z" },
    { id: `${quotationId}-doc-commercial`, quotationId, name: `${quote.logo || "Supplier"} Commercial Offer.xlsx`, type: "Commercial", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 920000, uploadedAt: "2026-07-16T09:10:00.000Z" },
    { id: `${quotationId}-doc-compliance`, quotationId, name: `${quote.logo || "Supplier"} Compliance Certificates.zip`, type: "Compliance", size: 1100000, uploadedAt: "2026-07-16T09:20:00.000Z" }
  ];
}

export function mapDemoQuotationToManagedQuotation(quote: DemoQuotationRecord, index = 0, rfqId = "RFQ-1001"): Quotation {
  const rfq = demoRfqs.find((item) => item.id === rfqId) || demoRfqs[0];
  const id = `QTN-${1001 + index}`;
  const company = marketplaceRepository.listCompanies().find((item) => item.name === quote.company);
  const items = Object.entries(quote.costBreakdown).map(([key, value], itemIndex) => calculateQuotationItem(scoreLabels[key] || key, value, id, itemIndex));
  const totals = calculateQuotationTotals(items);
  const evaluation = evaluationFor(quote, id);

  return {
    ...quote,
    id,
    rfqId,
    rfqTitle: rfq.title,
    ownerId: "demo-user",
    organizationId: "atlas",
    projectId: rfq.project === "Luxury Villa Casablanca" ? "PRJ-1048" : undefined,
    projectName: rfq.project,
    supplierId: company?.id || company?.slug || quote.company,
    supplierSlug: company?.slug,
    supplier: {
      id: company?.id || company?.slug || quote.company,
      name: quote.company,
      slug: company?.slug,
      logo: quote.logo,
      category: company?.category || rfq.category,
      country: company?.country,
      city: company?.city,
      rating: quote.rating,
      responseTime: quote.responseTime,
      verificationStatus: company?.verificationStatus
    },
    category: company?.category || rfq.category,
    country: company?.country,
    city: company?.city,
    price: money(totals.total, "MAD"),
    totalPrice: totals.total,
    currency: "MAD",
    status: quote.badge === "Recommended" ? "Shortlisted" : "Submitted",
    submissionDate: "2026-07-16T09:00:00.000Z",
    expirationDate: "2026-08-16",
    leadTime: quote.duration,
    deliveryTerms: quote.deliveryCost === "Included" ? "Delivery included in supplier scope" : `${quote.deliveryCost} delivery allowance`,
    commercialNotes: quote.notes,
    technicalNotes: `${quote.technicalCompliance}% technical compliance with submitted RFQ requirements.`,
    attachments: documentsFor(quote, id),
    items,
    evaluation,
    recommendationTags: [quote.badge],
    createdAt: "2026-07-16T09:00:00.000Z",
    updatedAt: "2026-07-18T10:30:00.000Z",
    metadata: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      rfqCategory: rfq.category
    }
  };
}

function normalizeStatus(status?: string | null): QuotationStatus {
  if (status === "Submitted" || status === "Under review" || status === "Shortlisted" || status === "Rejected" || status === "Awarded") return status;
  return "Submitted";
}

export function mapSupabaseQuotationToDomain(record: SupabaseQuotationRecord): Quotation {
  const items = Array.isArray(record.items) ? record.items as QuotationItem[] : [];
  const totals = calculateQuotationTotals(items);
  const totalPrice = record.total_price || totals.total || 0;
  return {
    id: record.id,
    ownerId: record.owner_id || undefined,
    organizationId: record.organization_id || undefined,
    projectId: record.project_id || undefined,
    rfqId: record.rfq_id || undefined,
    supplierId: record.supplier_id || undefined,
    supplierSlug: record.supplier_slug || undefined,
    company: record.supplier_name || "Supplier",
    price: money(totalPrice, record.currency || "MAD"),
    totalPrice,
    currency: record.currency === "USD" || record.currency === "EUR" || record.currency === "GBP" ? record.currency : "MAD",
    taxes: money(totals.tax || Number(record.metadata?.tax || 0), record.currency || "MAD"),
    deliveryCost: String(record.metadata?.deliveryCost || "Not specified"),
    paymentTerms: record.payment_terms || "Not specified",
    duration: record.lead_time || "Not specified",
    startAvailability: String(record.metadata?.startAvailability || "Not specified"),
    warranty: record.warranty || "Not specified",
    technicalCompliance: Number(record.metadata?.technicalCompliance || 0),
    commercialCompliance: Number(record.metadata?.commercialCompliance || 0),
    certifications: Array.isArray(record.metadata?.certifications) ? record.metadata.certifications as string[] : [],
    capacity: String(record.metadata?.capacity || "Not specified"),
    responseTime: String(record.metadata?.responseTime || "Not specified"),
    reliability: String(record.metadata?.reliability || "Not scored"),
    rating: Number(record.metadata?.rating || 0),
    badge: String(record.metadata?.badge || "Submitted"),
    status: normalizeStatus(record.status),
    voraFit: Number(record.metadata?.voraFit || 0),
    riskLevel: String(record.metadata?.riskLevel || "Unknown"),
    costBreakdown: typeof record.metadata?.costBreakdown === "object" && record.metadata.costBreakdown ? record.metadata.costBreakdown as Record<string, number> : {},
    technicalScores: typeof record.metadata?.technicalScores === "object" && record.metadata.technicalScores ? record.metadata.technicalScores as Record<string, number> : {},
    commercialScores: typeof record.metadata?.commercialScores === "object" && record.metadata.commercialScores ? record.metadata.commercialScores as Record<string, number> : {},
    submissionDate: record.submission_date || undefined,
    expirationDate: record.expiration_date || undefined,
    leadTime: record.lead_time || undefined,
    deliveryTerms: record.delivery_terms || undefined,
    commercialNotes: record.commercial_notes || undefined,
    technicalNotes: record.technical_notes || undefined,
    attachments: Array.isArray(record.attachments) ? record.attachments as QuotationDocument[] : [],
    items,
    evaluation: record.evaluation as QuotationEvaluation | undefined,
    notes: record.commercial_notes || "Production quotation loaded from repository adapter.",
    createdAt: record.created_at || undefined,
    updatedAt: record.updated_at || undefined,
    metadata: record.metadata || {}
  };
}

export function mapQuotationInputToSupabase(input: QuotationInput) {
  const totals = calculateQuotationTotals(input.items);
  return {
    owner_id: input.ownerId,
    organization_id: input.organizationId,
    project_id: input.projectId,
    rfq_id: input.rfqId,
    supplier_id: input.supplier.id,
    supplier_name: input.supplier.name,
    supplier_slug: input.supplier.slug,
    currency: input.currency || "MAD",
    total_price: totals.total,
    status: input.status || "Submitted",
    submission_date: input.submissionDate,
    expiration_date: input.expirationDate,
    lead_time: input.leadTime,
    delivery_terms: input.deliveryTerms,
    payment_terms: input.paymentTerms,
    warranty: input.warranty,
    commercial_notes: input.commercialNotes,
    technical_notes: input.technicalNotes,
    attachments: input.attachments || [],
    items: input.items,
    metadata: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax
    }
  };
}

export function filterQuotations(quotations: Quotation[], filters: QuotationFilters = {}) {
  const query = String(filters.query || "").toLowerCase().trim();
  return quotations.filter((quotation) => {
    const search = `${quotation.id || ""} ${quotation.company} ${quotation.rfqId || ""} ${quotation.rfqTitle || ""} ${quotation.projectName || ""} ${quotation.badge} ${quotation.notes}`.toLowerCase();
    return (!query || search.includes(query))
      && (!filters.rfqId || quotation.rfqId === filters.rfqId)
      && (!filters.supplier || filters.supplier === "All suppliers" || quotation.company === filters.supplier)
      && (!filters.status || filters.status === "All statuses" || quotation.status === filters.status)
      && (!filters.category || filters.category === "All categories" || quotation.category === filters.category)
      && (!filters.recommendation || filters.recommendation === "All recommendations" || quotation.recommendationTags?.includes(filters.recommendation));
  });
}

function comparisonValue(quotations: Quotation[], label: string, valueFor: (quote: Quotation) => string | number, bestFor?: (quote: Quotation) => number, lowerIsBetter = false): QuotationComparisonRow {
  const scores = bestFor ? quotations.map(bestFor) : [];
  const best = scores.length ? (lowerIsBetter ? Math.min(...scores) : Math.max(...scores)) : undefined;
  return {
    label,
    values: quotations.map((quotation) => {
      const score = bestFor?.(quotation);
      return {
        quotationId: quotation.id || quotation.company,
        supplierName: quotation.company,
        value: valueFor(quotation),
        highlight: score !== undefined && score === best ? "best" : quotation.riskLevel === "High" ? "risk" : "neutral"
      };
    })
  };
}

export function buildQuotationComparison(quotations: Quotation[], rfqId = "RFQ-1001"): QuotationComparison {
  const selected = filterQuotations(quotations, { rfqId });
  const candidates = selected.length ? selected : quotations;
  if (!candidates.length) {
    return {
      id: `CMP-${rfqId}`,
      rfqId,
      generatedAt: new Date().toISOString(),
      quotations: [],
      matrix: [],
      recommendations: [],
      voraInsights: {
        summary: "No quotations are available for comparison yet.",
        anomalies: [],
        risks: [],
        preferredSupplier: "N/A",
        executiveSummary: "Invite suppliers and collect quotation responses before running comparison."
      }
    };
  }
  const lowestPrice = [...candidates].sort((a, b) => a.totalPrice - b.totalPrice)[0];
  const bestTechnical = [...candidates].sort((a, b) => b.technicalCompliance - a.technicalCompliance)[0];
  const bestValue = [...candidates].sort((a, b) => (b.evaluation?.overallScore || b.voraFit) - (a.evaluation?.overallScore || a.voraFit))[0];
  const fastestDelivery = [...candidates].sort((a, b) => parseDurationWeeks(a.duration) - parseDurationWeeks(b.duration))[0];
  const balanced = bestValue || candidates[0];
  const recommendations: AwardRecommendation[] = [
    { type: "Lowest Price", quotationId: lowestPrice?.id || "", supplierName: lowestPrice?.company || "N/A", score: lowestPrice ? 100 - Math.round((lowestPrice.totalPrice / Math.max(...candidates.map((item) => item.totalPrice))) * 100) : 0, reason: `${lowestPrice?.company || "Supplier"} has the lowest submitted total.` },
    { type: "Best Technical", quotationId: bestTechnical?.id || "", supplierName: bestTechnical?.company || "N/A", score: bestTechnical?.technicalCompliance || 0, reason: `${bestTechnical?.company || "Supplier"} has the strongest technical compliance score.` },
    { type: "Best Value", quotationId: bestValue?.id || "", supplierName: bestValue?.company || "N/A", score: bestValue?.evaluation?.overallScore || bestValue?.voraFit || 0, reason: `${bestValue?.company || "Supplier"} balances commercial, technical, and risk factors.` },
    { type: "Fastest Delivery", quotationId: fastestDelivery?.id || "", supplierName: fastestDelivery?.company || "N/A", score: fastestDelivery ? Math.max(0, 100 - parseDurationWeeks(fastestDelivery.duration)) : 0, reason: `${fastestDelivery?.company || "Supplier"} has the shortest stated lead time.` },
    { type: "Balanced Recommendation", quotationId: balanced?.id || "", supplierName: balanced?.company || "N/A", score: balanced?.evaluation?.weightedScore || balanced?.voraFit || 0, reason: `${balanced?.company || "Supplier"} is the safest balanced recommendation for executive review.`, risks: ["Confirm final scope exclusions", "Negotiate payment terms before award"], negotiationPoints: ["Target stronger warranty language", "Request final mobilization schedule"] }
  ];

  return {
    id: `CMP-${rfqId}`,
    rfqId,
    generatedAt: "2026-07-18T12:00:00.000Z",
    quotations: candidates,
    matrix: [
      comparisonValue(candidates, "Total Price", (quote) => money(quote.totalPrice, quote.currency || "MAD"), (quote) => quote.totalPrice, true),
      comparisonValue(candidates, "Delivery Time", (quote) => quote.duration, (quote) => parseDurationWeeks(quote.duration), true),
      comparisonValue(candidates, "Warranty", (quote) => quote.warranty),
      comparisonValue(candidates, "Payment Terms", (quote) => quote.paymentTerms),
      comparisonValue(candidates, "Technical Compliance", (quote) => formatPercent(quote.technicalCompliance), (quote) => quote.technicalCompliance),
      comparisonValue(candidates, "Commercial Compliance", (quote) => formatPercent(quote.commercialCompliance), (quote) => quote.commercialCompliance),
      comparisonValue(candidates, "Supplier Rating", (quote) => quote.rating, (quote) => quote.rating),
      comparisonValue(candidates, "Response Time", (quote) => quote.responseTime),
      comparisonValue(candidates, "Risk Level", (quote) => quote.riskLevel),
      comparisonValue(candidates, "VORA Fit", (quote) => formatPercent(quote.voraFit), (quote) => quote.voraFit)
    ],
    recommendations,
    voraInsights: {
      summary: `VORA compared ${candidates.length} supplier quotations for ${rfqId} across cost, compliance, delivery, and risk.`,
      anomalies: candidates.filter((quote) => quote.totalPrice < 1000000 || quote.riskLevel === "Medium").map((quote) => `${quote.company}: review scope assumptions and cost completeness.`),
      risks: ["Normalize scope exclusions before award", "Validate taxes and delivery costs against contract terms", "Request final certificate copies for shortlisted suppliers"],
      preferredSupplier: balanced?.company || "No supplier selected",
      executiveSummary: `${balanced?.company || "The leading supplier"} is recommended for balanced award review, while ${lowestPrice?.company || "the lowest bidder"} should be checked for scope completeness before any price-led decision.`
    }
  };
}

export function buildQuotationDashboardSummary(quotations: Quotation[]): QuotationDashboardSummary {
  const comparison = buildQuotationComparison(quotations);
  return {
    pending: quotations.filter((quote) => quote.status === "Submitted" || quote.status === "Under review").length,
    compared: quotations.length,
    bestOffers: [...quotations].sort((a, b) => b.voraFit - a.voraFit).slice(0, 3),
    awardRecommendations: comparison.recommendations.slice(0, 3),
    recentEvaluations: [...quotations].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))).slice(0, 4)
  };
}
