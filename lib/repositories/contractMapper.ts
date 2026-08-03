import type {
  Contract,
  ContractApproval,
  ContractAward,
  ContractDeliverable,
  ContractDocument,
  ContractFilters,
  ContractMilestone,
  ContractPayment,
  ContractStatus,
  ContractSummary
} from "@/lib/models";
import { demoContracts } from "@/lib/data";
import { quotationRepository } from "./quotationRepository";
import { marketplaceRepository } from "./marketplaceRepository";

export type DemoContractRecord = (typeof demoContracts)[number];

export type SupabaseContractRecord = {
  id: string;
  owner_id?: string | null;
  organization_id?: string | null;
  project_id?: string | null;
  rfq_id?: string | null;
  quotation_id?: string | null;
  supplier_id?: string | null;
  supplier_name?: string | null;
  supplier_slug?: string | null;
  contract_number?: string | null;
  title?: string | null;
  description?: string | null;
  contract_type?: string | null;
  status?: string | null;
  value_amount?: number | null;
  currency?: string | null;
  retention?: string | null;
  warranty?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  milestones?: unknown[] | null;
  deliverables?: unknown[] | null;
  payments?: unknown[] | null;
  parties?: Record<string, unknown> | null;
  approvals?: unknown[] | null;
  amendments?: unknown[] | null;
  documents?: unknown[] | null;
  timeline?: unknown[] | null;
  activity?: unknown[] | null;
  insights?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function parseMoney(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return 0;
  if (value.toUpperCase().includes("M")) return number * 1000000;
  if (value.toUpperCase().includes("K")) return number * 1000;
  return number;
}

function money(value: number, currency = "MAD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function normalizeStatus(status?: string | null): ContractStatus {
  if (status === "Draft" || status === "Internal Review" || status === "Approved" || status === "Rejected" || status === "Executed" || status === "Active" || status === "Expiring" || status === "Completed" || status === "Closed" || status === "Archived") return status;
  return "Draft";
}

function deliverablesFor(contract: DemoContractRecord): ContractDeliverable[] {
  return contract.deliverables.map((description, index) => ({
    id: `${contract.id}-deliverable-${index + 1}`,
    description,
    owner: contract.winningCompany,
    dueDate: contract.endDate,
    status: contract.status === "Completed" ? "Accepted" : index === 0 && contract.status === "Active" ? "In progress" : "Pending",
    evidence: index === 0 ? ["Progress report metadata", "Inspection evidence metadata"] : [],
    acceptanceStatus: contract.status === "Completed" ? "Accepted" : "Pending"
  }));
}

function milestonesFor(contract: DemoContractRecord, deliverables: ContractDeliverable[]): ContractMilestone[] {
  return contract.milestones.map((milestone, index) => ({
    id: `${contract.id}-milestone-${index + 1}`,
    title: milestone.title,
    description: `${milestone.title} for ${contract.title}.`,
    date: milestone.date,
    dueDate: milestone.date,
    status: milestone.status,
    progress: milestone.progress,
    linkedDeliverables: index === contract.milestones.length - 1 ? deliverables.slice(-2) : deliverables.slice(0, 1)
  }));
}

function paymentsFor(contract: DemoContractRecord): ContractPayment[] {
  return contract.payments.map((payment, index) => ({
    id: `${contract.id}-payment-${index + 1}`,
    label: payment.label,
    amount: payment.amount,
    amountValue: parseMoney(payment.amount),
    due: payment.due,
    status: payment.status,
    currency: "MAD",
    type: index === 0 ? "Advance Payment" : index === contract.payments.length - 1 ? "Final Payment" : "Milestone Payment",
    taxValue: Math.round(parseMoney(payment.amount) * 0.1)
  }));
}

function documentsFor(contract: DemoContractRecord): ContractDocument[] {
  return [
    { id: `${contract.id}-doc-contract`, name: `${contract.id} Draft Contract.pdf`, type: "Contract", mimeType: "application/pdf", size: 1800000, uploadedAt: "2026-07-18T12:00:00.000Z" },
    { id: `${contract.id}-doc-award`, name: `${contract.linkedRfq} Award Memo.pdf`, type: "Attachment", mimeType: "application/pdf", size: 860000, uploadedAt: "2026-07-18T12:10:00.000Z" }
  ];
}

function approvalsFor(contract: DemoContractRecord): ContractApproval[] {
  const base: ContractApproval[] = [
    { id: `${contract.id}-approval-1`, status: "Draft" as const, reviewer: "Procurement Manager", reviewerRole: "Procurement", notes: "Draft package assembled.", createdAt: "2026-07-18T09:00:00.000Z" },
    { id: `${contract.id}-approval-2`, status: contract.status === "Draft" ? "Internal Review" as const : "Approved" as const, reviewer: "Finance Manager", reviewerRole: "Finance", notes: contract.status === "Draft" ? "Awaiting budget validation." : "Commercial package approved.", createdAt: "2026-07-18T10:00:00.000Z" }
  ];
  if (contract.status === "Completed" || contract.status === "Active" || contract.status === "Expiring") {
    base.push({ id: `${contract.id}-approval-3`, status: "Executed", reviewer: "CEO", reviewerRole: "Executive", notes: "Approved for execution.", createdAt: "2026-07-18T11:00:00.000Z" });
  }
  return base;
}

function awardFor(contract: DemoContractRecord): ContractAward {
  const quotation = quotationRepository.list().find((item) => item.company === contract.winningCompany);
  return {
    id: `AWD-${contract.id.replace("CON-", "")}`,
    contractId: contract.id,
    ownerId: "demo-user",
    organizationId: "atlas",
    rfqId: contract.linkedRfq,
    quotationId: quotation?.id || "QTN-1001",
    supplierId: quotation?.supplierId,
    supplierName: contract.winningCompany,
    awardDate: "2026-07-18",
    awardReason: quotation?.badge ? `${quotation.badge} quotation with strong VORA fit.` : "Selected supplier after executive review.",
    approvalNotes: "Demo award prepared for procurement lifecycle walkthrough.",
    awardValue: parseMoney(contract.value),
    currency: "MAD",
    projectId: quotation?.projectId,
    projectName: contract.project,
    createdAt: "2026-07-18T12:00:00.000Z",
    updatedAt: "2026-07-18T12:00:00.000Z"
  };
}

export function mapDemoContractToDomain(contract: DemoContractRecord): Contract {
  const deliverables = deliverablesFor(contract);
  const milestones = milestonesFor(contract, deliverables);
  const payments = paymentsFor(contract);
  const supplier = marketplaceRepository.listCompanies().find((company) => company.name === contract.winningCompany);
  return {
    id: contract.id,
    contractNumber: contract.id,
    title: contract.title,
    description: contract.summary,
    linkedRfq: contract.linkedRfq,
    quotationId: awardFor(contract).quotationId,
    winningCompany: contract.winningCompany,
    supplierId: supplier?.id || supplier?.slug,
    supplierSlug: supplier?.slug,
    project: contract.project,
    projectId: contract.project === "Luxury Villa Casablanca" ? "PRJ-1048" : undefined,
    organization: "Atlas Construction Group",
    organizationId: "atlas",
    ownerId: "demo-user",
    value: contract.value,
    valueAmount: parseMoney(contract.value),
    currency: "MAD",
    retention: contract.status === "Draft" ? "To be confirmed" : "5% retention until final acceptance",
    warranty: contract.winningCompany === "Atlas Construction Group" ? "24 months" : "12 months",
    contractType: contract.category,
    startDate: contract.startDate,
    endDate: contract.endDate,
    status: normalizeStatus(contract.status),
    category: contract.category,
    expiringIn: contract.expiringIn,
    summary: contract.summary,
    award: awardFor(contract),
    milestones,
    deliverables,
    payments,
    parties: contract.parties,
    approvals: approvalsFor(contract),
    amendments: [
      { id: `${contract.id}-amendment-placeholder`, type: "Scope change", title: "No approved amendments", description: "Amendment workflow is prepared for a future sprint.", status: "Draft", version: "v1.0", changeLog: [], createdAt: "2026-07-18T12:00:00.000Z" }
    ],
    documents: documentsFor(contract),
    timeline: contract.timeline.map((item, index) => ({ id: `${contract.id}-timeline-${index + 1}`, ...item, type: index === 0 ? "signature" : index === 1 ? "kickoff" : index === contract.timeline.length - 1 ? "warranty" : "milestone" })),
    activity: contract.activity,
    insights: {
      ...contract.insights,
      executiveSummary: `${contract.title} connects ${contract.linkedRfq} to ${contract.winningCompany} with ${contract.value} value and ${contract.status.toLowerCase()} status.`,
      paymentReview: payments.length ? `${payments.length} payment events require milestone-linked acceptance controls.` : "Payment schedule is not yet populated.",
      milestoneReview: milestones.length ? `${milestones.length} milestones are defined for execution monitoring.` : "Milestones should be added before execution.",
      checklist: ["Confirm signature authority", "Validate payment conditions", "Review milestone acceptance", "Attach compliance documents", "Schedule closeout checkpoint"]
    },
    metadata: {
      source: "demo",
      approvalStage: contract.status === "Draft" ? "Internal Review" : "Executed"
    },
    createdAt: "2026-07-18T12:00:00.000Z",
    updatedAt: "2026-07-18T12:00:00.000Z"
  };
}

export function mapSupabaseContractToDomain(record: SupabaseContractRecord): Contract {
  const valueAmount = record.value_amount || 0;
  const parties = record.parties || {};
  const client = parties.client && typeof parties.client === "object" ? parties.client as Contract["parties"]["client"] : { name: "Client", contact: "N/A", responsibilities: [] };
  const contractor = parties.contractor && typeof parties.contractor === "object" ? parties.contractor as Contract["parties"]["contractor"] : { name: record.supplier_name || "Supplier", contact: "N/A", responsibilities: [] };
  const insights = record.insights || {};
  return {
    id: record.id,
    contractNumber: record.contract_number || record.id,
    title: record.title || "Untitled contract",
    description: record.description || undefined,
    linkedRfq: record.rfq_id || "RFQ",
    quotationId: record.quotation_id || undefined,
    winningCompany: record.supplier_name || "Supplier",
    supplierId: record.supplier_id || undefined,
    supplierSlug: record.supplier_slug || undefined,
    project: String(record.metadata?.projectName || "Project"),
    projectId: record.project_id || undefined,
    organizationId: record.organization_id || undefined,
    ownerId: record.owner_id || undefined,
    value: money(valueAmount, record.currency || "MAD"),
    valueAmount,
    currency: record.currency === "USD" || record.currency === "EUR" || record.currency === "GBP" ? record.currency : "MAD",
    retention: record.retention || undefined,
    warranty: record.warranty || undefined,
    contractType: record.contract_type || undefined,
    startDate: record.start_date || "Not scheduled",
    endDate: record.end_date || "Not scheduled",
    status: normalizeStatus(record.status),
    category: record.contract_type || "Contract",
    summary: record.description || "Production contract loaded from repository adapter.",
    milestones: Array.isArray(record.milestones) ? record.milestones as ContractMilestone[] : [],
    deliverables: Array.isArray(record.deliverables) ? record.deliverables as ContractDeliverable[] : [],
    payments: Array.isArray(record.payments) ? record.payments as ContractPayment[] : [],
    parties: { client, contractor },
    approvals: Array.isArray(record.approvals) ? record.approvals as ContractApproval[] : [],
    amendments: Array.isArray(record.amendments) ? record.amendments as Contract["amendments"] : [],
    documents: Array.isArray(record.documents) ? record.documents as ContractDocument[] : [],
    timeline: Array.isArray(record.timeline) ? record.timeline as Contract["timeline"] : [],
    activity: Array.isArray(record.activity) ? record.activity as string[] : [],
    insights: {
      missingClauses: Array.isArray(insights.missingClauses) ? insights.missingClauses as string[] : [],
      deliveryRisks: Array.isArray(insights.deliveryRisks) ? insights.deliveryRisks as string[] : [],
      budgetRisks: Array.isArray(insights.budgetRisks) ? insights.budgetRisks as string[] : [],
      checkpoints: Array.isArray(insights.checkpoints) ? insights.checkpoints as string[] : [],
      compliance: typeof insights.compliance === "string" ? insights.compliance : "Production contract requires VORA review."
    },
    metadata: record.metadata || {},
    createdAt: record.created_at || undefined,
    updatedAt: record.updated_at || undefined
  };
}

export function filterContracts(contracts: Contract[], filters: ContractFilters = {}) {
  const query = String(filters.query || "").toLowerCase().trim();
  return contracts.filter((contract) => {
    const searchText = `${contract.id} ${contract.title} ${contract.project} ${contract.winningCompany} ${contract.linkedRfq} ${contract.category || ""}`.toLowerCase();
    return (!query || searchText.includes(query))
      && (!filters.status || filters.status === "All statuses" || contract.status === filters.status)
      && (!filters.category || filters.category === "All categories" || contract.category === filters.category)
      && (!filters.supplier || filters.supplier === "All suppliers" || contract.winningCompany === filters.supplier)
      && (!filters.projectId || contract.projectId === filters.projectId)
      && (!filters.organizationId || contract.organizationId === filters.organizationId);
  });
}

export function buildContractSummary(contracts: Contract[]): ContractSummary {
  const upcomingPayments = contracts.flatMap((contract) => contract.payments.filter((payment) => payment.status !== "Paid").slice(0, 2));
  const recentAwards = contracts.map((contract) => contract.award).filter(Boolean) as ContractAward[];
  return {
    active: contracts.filter((contract) => contract.status === "Active" || contract.status === "Executed").length,
    awaitingApproval: contracts.filter((contract) => contract.status === "Draft" || contract.status === "Internal Review" || contract.status === "Approved").length,
    upcomingMilestones: contracts.filter((contract) => contract.milestones.some((milestone) => milestone.status !== "Complete")).slice(0, 3),
    upcomingPayments,
    recentAwards: recentAwards.slice(0, 4),
    riskIndicators: contracts.flatMap((contract) => [
      ...contract.insights.deliveryRisks.map((risk, index) => ({ id: `${contract.id}-delivery-${index}`, title: risk, level: "Medium" as const, contractId: contract.id })),
      ...contract.insights.budgetRisks.map((risk, index) => ({ id: `${contract.id}-budget-${index}`, title: risk, level: "High" as const, contractId: contract.id }))
    ]).slice(0, 5),
    totalValue: contracts.reduce((sum, contract) => sum + (contract.valueAmount || 0), 0),
    currency: "MAD"
  };
}
