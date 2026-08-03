import type { CurrencyCode, EntityId, IsoTimestamp, OwnedEntity, Timestamped } from "./common";
import type { Quotation, QuotationStatus } from "./rfq";

export type QuotationDocumentType = "Technical" | "Commercial" | "Compliance" | "Insurance" | "Warranty" | "Other";
export type RecommendationType = "Lowest Price" | "Best Technical" | "Best Value" | "Fastest Delivery" | "Balanced Recommendation";

export interface QuotationItem {
  id: EntityId;
  quotationId?: EntityId;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  tax?: number;
  subtotal: number;
  total: number;
  remarks?: string;
}

export interface QuotationSupplier {
  id: EntityId;
  name: string;
  slug?: string;
  logo?: string;
  category?: string;
  country?: string;
  city?: string;
  rating?: number;
  responseTime?: string;
  verificationStatus?: string;
}

export interface QuotationDocument {
  id: EntityId;
  quotationId?: EntityId;
  name: string;
  type: QuotationDocumentType;
  mimeType?: string;
  size?: number;
  storagePath?: string;
  uploadedAt?: IsoTimestamp;
  metadata?: Record<string, unknown>;
}

export interface QuotationScore {
  label: string;
  value: number;
  weight?: number;
  notes?: string;
}

export interface QuotationEvaluation extends Timestamped {
  technicalScore: number;
  commercialScore: number;
  riskScore: number;
  overallScore: number;
  weightedScore: number;
  reviewerNotes?: string;
  technicalCriteria: QuotationScore[];
  commercialCriteria: QuotationScore[];
}

export interface AwardRecommendation {
  type: RecommendationType;
  quotationId: EntityId;
  supplierName: string;
  score: number;
  reason: string;
  risks?: string[];
  negotiationPoints?: string[];
}

export interface QuotationComparisonRow {
  label: string;
  values: Array<{
    quotationId: EntityId;
    supplierName: string;
    value: string | number;
    highlight?: "best" | "risk" | "neutral";
  }>;
}

export interface QuotationComparison {
  id: EntityId;
  rfqId?: EntityId;
  generatedAt: IsoTimestamp;
  quotations: Quotation[];
  matrix: QuotationComparisonRow[];
  recommendations: AwardRecommendation[];
  voraInsights: {
    summary: string;
    anomalies: string[];
    risks: string[];
    preferredSupplier: string;
    executiveSummary: string;
  };
}

export interface QuotationFilters {
  query?: string;
  rfqId?: EntityId;
  supplier?: string;
  status?: QuotationStatus | "All statuses";
  category?: string;
  recommendation?: RecommendationType | "All recommendations";
}

export interface QuotationInput extends OwnedEntity {
  rfqId: EntityId;
  projectId?: EntityId;
  supplier: QuotationSupplier;
  currency?: CurrencyCode;
  submissionDate?: IsoTimestamp;
  expirationDate?: string;
  leadTime?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  warranty?: string;
  commercialNotes?: string;
  technicalNotes?: string;
  attachments?: QuotationDocument[];
  items: QuotationItem[];
  status?: QuotationStatus;
}

export interface QuotationDashboardSummary {
  pending: number;
  compared: number;
  bestOffers: Quotation[];
  awardRecommendations: AwardRecommendation[];
  recentEvaluations: Quotation[];
}
