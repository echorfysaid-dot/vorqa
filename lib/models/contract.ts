import type { CurrencyCode, EntityId, IsoTimestamp, OwnedEntity, Timestamped } from "./common";

export type ContractStatus = "Draft" | "Internal Review" | "Approved" | "Rejected" | "Executed" | "Active" | "Expiring" | "Completed" | "Closed" | "Archived";
export type ContractPaymentStatus = "Draft" | "Pending approval" | "Planned" | "Due" | "Paid" | "Overdue" | "Retained";
export type ContractApprovalStatus = "Draft" | "Internal Review" | "Approved" | "Rejected" | "Executed" | "Closed";
export type ContractDeliverableStatus = "Pending" | "In progress" | "Submitted" | "Accepted" | "Rejected";
export type ContractMilestoneStatus = "Pending" | "Scheduled" | "Complete" | "Delayed";

export interface ContractAward extends Timestamped, OwnedEntity {
  id: EntityId;
  contractId?: EntityId;
  rfqId: EntityId;
  quotationId: EntityId;
  supplierId?: EntityId;
  supplierName: string;
  awardDate: string;
  awardReason: string;
  approvalNotes?: string;
  awardValue: number;
  currency: CurrencyCode;
  projectId?: EntityId;
  projectName?: string;
}

export interface ContractParty {
  id?: EntityId;
  type?: "Client" | "Contractor" | "Supplier" | "Consultant";
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  responsibilities: string[];
}

export interface ContractDeliverable {
  id: EntityId;
  description: string;
  owner?: string;
  dueDate?: string;
  status: ContractDeliverableStatus;
  evidence?: string[];
  acceptanceStatus?: "Pending" | "Accepted" | "Rejected" | "Needs revision";
}

export interface ContractMilestone {
  id: EntityId;
  title: string;
  description?: string;
  date: string;
  dueDate?: string;
  status: ContractMilestoneStatus | string;
  progress: number;
  linkedDeliverables?: ContractDeliverable[];
}

export interface ContractPayment {
  id: EntityId;
  label: string;
  amount: string;
  amountValue?: number;
  due: string;
  status: ContractPaymentStatus | string;
  currency?: CurrencyCode;
  type?: "Advance Payment" | "Milestone Payment" | "Final Payment" | "Retention" | "Tax";
  taxValue?: number;
}

export interface ContractAmendment extends Timestamped {
  id: EntityId;
  type: "Scope change" | "Budget change" | "Duration extension" | "Other";
  title: string;
  description?: string;
  status: "Draft" | "Under review" | "Approved" | "Rejected";
  version?: string;
  changeLog?: string[];
}

export interface ContractDocument {
  id: EntityId;
  name: string;
  type: "Contract" | "Attachment" | "Certificate" | "Payment" | "Amendment" | "Other";
  mimeType?: string;
  size?: number;
  storagePath?: string;
  uploadedAt?: IsoTimestamp;
  metadata?: Record<string, unknown>;
}

export interface ContractApproval extends Timestamped {
  id: EntityId;
  status: ContractApprovalStatus;
  reviewer: string;
  reviewerRole?: string;
  notes?: string;
}

export interface ContractTimeline {
  id: EntityId;
  title: string;
  date: string;
  text: string;
  type?: "signature" | "kickoff" | "milestone" | "payment" | "approval" | "completion" | "warranty";
}

export interface ContractSummary {
  active: number;
  awaitingApproval: number;
  upcomingMilestones: Contract[];
  upcomingPayments: ContractPayment[];
  recentAwards: ContractAward[];
  riskIndicators: Array<{ id: EntityId; title: string; level: "Low" | "Medium" | "High"; contractId?: EntityId }>;
  totalValue: number;
  currency: CurrencyCode;
}

export interface Contract extends Timestamped, OwnedEntity {
  id: EntityId;
  contractNumber?: string;
  title: string;
  description?: string;
  linkedRfq: string;
  quotationId?: EntityId;
  winningCompany: string;
  supplierId?: EntityId;
  supplierSlug?: string;
  project: string;
  projectId?: EntityId;
  organization?: string;
  value: string;
  valueAmount?: number;
  currency?: CurrencyCode;
  retention?: string;
  warranty?: string;
  contractType?: string;
  startDate: string;
  endDate: string;
  status: ContractStatus | string;
  category?: string;
  expiringIn?: string;
  summary?: string;
  award?: ContractAward;
  milestones: ContractMilestone[];
  deliverables: ContractDeliverable[] | string[];
  payments: ContractPayment[];
  parties: {
    client: ContractParty;
    contractor: ContractParty;
  };
  approvals?: ContractApproval[];
  amendments?: ContractAmendment[];
  documents?: ContractDocument[];
  timeline: ContractTimeline[];
  activity: string[];
  insights: {
    missingClauses: string[];
    deliveryRisks: string[];
    budgetRisks: string[];
    checkpoints: string[];
    compliance: string;
    executiveSummary?: string;
    paymentReview?: string;
    milestoneReview?: string;
    checklist?: string[];
  };
  metadata?: Record<string, unknown>;
}

export interface ContractFilters {
  query?: string;
  status?: string;
  category?: string;
  supplier?: string;
  projectId?: EntityId;
  organizationId?: EntityId;
}
