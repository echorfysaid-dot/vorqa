import type { CurrencyCode, EntityId, IsoTimestamp, OwnedEntity, Timestamped } from "./common";
import type { QuotationDocument, QuotationEvaluation, QuotationItem, QuotationSupplier } from "./quotation";

export type RFQStatus = "Draft" | "Published" | "Pending Responses" | "Under Review" | "Awarded" | "Cancelled" | "Closed";
export type RfqStatus = RFQStatus | "Open";
export type QuotationStatus = "Submitted" | "Under review" | "Shortlisted" | "Rejected" | "Awarded";
export type RFQPriority = "Low" | "Medium" | "High" | "Critical";
export type RFQVisibility = "Private" | "Invited Suppliers" | "Marketplace";

export interface RFQItem {
  id: EntityId;
  title: string;
  description?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  technicalRequirements?: string[];
  estimatedBudget?: number;
}

export interface RFQDocument {
  id: EntityId;
  name: string;
  type: string;
  size?: number;
  category?: string;
  documentId?: EntityId;
  uploadedAt?: IsoTimestamp;
  metadata?: Record<string, unknown>;
}

export interface RFQSupplier {
  id: EntityId;
  companySlug?: string;
  companyName: string;
  category?: string;
  country?: string;
  city?: string;
  verified?: boolean;
  rating?: number;
  invitedAt?: IsoTimestamp;
  status?: "Recommended" | "Invited" | "Viewed" | "Responded" | "Declined" | "Awarded";
  responseId?: EntityId;
}

export interface RFQResponse extends Timestamped {
  id: EntityId;
  rfqId: EntityId;
  supplierId: EntityId;
  supplierName: string;
  status: QuotationStatus;
  price?: string;
  totalPrice?: number;
  currency?: CurrencyCode;
  duration?: string;
  notes?: string;
  voraFit?: number;
}

export interface RFQTimeline {
  createdAt?: IsoTimestamp;
  publishedAt?: IsoTimestamp;
  submissionDeadline: string;
  deliveryDate?: string;
  reviewDate?: string;
  awardedAt?: IsoTimestamp;
  closedAt?: IsoTimestamp;
  events: Array<{
    id: EntityId;
    title: string;
    description?: string;
    date: string;
    type: "created" | "published" | "supplier" | "response" | "review" | "award" | "closed" | "activity";
  }>;
}

export interface RFQSummary {
  draft: number;
  published: number;
  pendingResponses: number;
  underReview: number;
  awarded: number;
  cancelled: number;
  closed: number;
  upcomingDeadlines: RFQ[];
  recentlyCreated: RFQ[];
}

export interface RFQFilters {
  query?: string;
  status?: string;
  category?: string;
  projectId?: EntityId;
  organizationId?: EntityId;
  priority?: string;
  supplier?: string;
}

export interface RFQInput {
  title: string;
  description?: string;
  projectId?: EntityId;
  project?: string;
  organizationId?: EntityId;
  category?: string;
  scopeOfWork?: string;
  technicalRequirements?: string[];
  budgetRange?: string;
  currency?: CurrencyCode;
  submissionDeadline?: string;
  deliveryDate?: string;
  priority?: RFQPriority;
  visibility?: RFQVisibility;
  attachments?: RFQDocument[];
  suppliers?: RFQSupplier[];
  items?: RFQItem[];
}

export interface RFQ extends Timestamped, OwnedEntity {
  id: EntityId;
  title: string;
  description?: string;
  projectId?: EntityId;
  project: string;
  organization?: string;
  status: RfqStatus | string;
  category: string;
  budget: string;
  budgetRange?: string;
  currency?: CurrencyCode;
  timeline: string;
  companies: string[];
  dueDate: string;
  submissionDeadline?: string;
  deliveryDate?: string;
  priority: RFQPriority | string;
  visibility?: RFQVisibility;
  scopeOfWork?: string;
  technicalRequirements?: string[];
  items?: RFQItem[];
  attachments?: RFQDocument[];
  suppliers?: RFQSupplier[];
  responses?: RFQResponse[];
  rfqTimeline?: RFQTimeline;
  activity?: RFQTimeline["events"];
  voraInsights?: {
    summary: string;
    missingInformation: string[];
    supplierSuggestions: string[];
    risks: string[];
    executiveSummary: string;
  };
  metadata?: Record<string, unknown>;
}

export interface Quotation extends Timestamped, OwnedEntity {
  id?: EntityId;
  rfqId?: EntityId;
  rfqTitle?: string;
  projectId?: EntityId;
  projectName?: string;
  organizationId?: EntityId;
  supplierId?: EntityId;
  supplierSlug?: string;
  supplier?: QuotationSupplier;
  company: string;
  logo?: string;
  category?: string;
  country?: string;
  city?: string;
  price: string;
  totalPrice: number;
  currency?: CurrencyCode;
  taxes: string;
  deliveryCost: string;
  paymentTerms: string;
  duration: string;
  startAvailability: string;
  warranty: string;
  technicalCompliance: number;
  commercialCompliance: number;
  certifications: string[];
  capacity: string;
  responseTime: string;
  reliability: string;
  rating: number;
  badge: string;
  status?: QuotationStatus;
  voraFit: number;
  riskLevel: string;
  costBreakdown: Record<string, number>;
  technicalScores: Record<string, number>;
  commercialScores: Record<string, number>;
  submissionDate?: IsoTimestamp;
  expirationDate?: string;
  leadTime?: string;
  deliveryTerms?: string;
  commercialNotes?: string;
  technicalNotes?: string;
  attachments?: QuotationDocument[];
  items?: QuotationItem[];
  evaluation?: QuotationEvaluation;
  recommendationTags?: string[];
  notes: string;
  metadata?: Record<string, unknown>;
}
