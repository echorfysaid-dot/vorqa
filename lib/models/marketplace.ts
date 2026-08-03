import type { Address, ContactInfo, EntityId, IsoTimestamp, OwnedEntity, Timestamped, VerificationStatus } from "./common";

export type MarketplaceCategory =
  | "Contractors"
  | "Engineering Firms"
  | "Architecture Studios"
  | "Material Suppliers"
  | "Logistics Companies"
  | "Equipment Rental"
  | "Consultants"
  | "General Contractor"
  | "Subcontractor"
  | "Supplier"
  | "Engineering Office"
  | "Architect"
  | "Interior Designer"
  | "Surveyor"
  | "Project Management"
  | "HVAC"
  | "Electrical"
  | "Mechanical"
  | "Concrete"
  | "Steel"
  | "Roads"
  | "Infrastructure"
  | "Landscape"
  | "Safety"
  | "Logistics"
  | "Other";

export type MarketplaceAvailability = "Available" | "Limited slots" | "Unavailable" | "By request";
export type MarketplaceSort = "recommended" | "rating" | "experience" | "completed-projects" | "response-time" | "newest";

export interface MarketplaceLocation {
  country: string;
  city: string;
  address?: string;
  serviceAreas?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MarketplaceService {
  id?: EntityId;
  title: string;
  description: string;
  category?: MarketplaceCategory | string;
  delivery?: string;
  availability: MarketplaceAvailability | string;
}

export interface MarketplaceReview {
  id?: EntityId;
  name: string;
  company?: string;
  rating: number;
  text: string;
  createdAt?: IsoTimestamp;
  verified?: boolean;
}

export interface MarketplacePortfolio {
  id?: EntityId;
  title: string;
  location: string;
  type: string;
  status: string;
  budget?: string;
  date?: string;
  gallery?: string[];
  documents?: string[];
  beforeAfter?: {
    before?: string;
    after?: string;
  };
}

export interface MarketplaceCertification {
  id?: EntityId;
  title: string;
  issuer?: string;
  issuedAt?: IsoTimestamp;
  expiresAt?: IsoTimestamp;
  documentUrl?: string;
  status?: VerificationStatus;
}

export interface MarketplaceProject extends MarketplacePortfolio {
  completedAt?: IsoTimestamp;
  clientName?: string;
}

export interface MarketplaceFilters {
  query?: string;
  country?: string;
  city?: string;
  category?: string;
  experience?: string;
  rating?: number;
  verified?: boolean;
  availability?: string;
  languages?: string[];
  services?: string[];
  sort?: MarketplaceSort;
  page?: number;
  pageSize?: number;
}

export interface MarketplaceCompany extends Timestamped {
  id?: EntityId;
  organizationId?: EntityId;
  slug: string;
  name: string;
  logo: string;
  logoUrl?: string;
  coverImage?: string;
  category: MarketplaceCategory | string;
  businessCategories?: Array<MarketplaceCategory | string>;
  specialties?: string[];
  verified: boolean;
  verificationStatus?: VerificationStatus;
  rating: number;
  reviewCount?: number;
  country: string;
  city: string;
  location?: MarketplaceLocation;
  address?: Address;
  activeProjects: number;
  completedProjects: number;
  employees: number;
  partners: number;
  responseRate: string;
  responseTime: string;
  yearsInBusiness: number;
  description: string;
  about: string;
  status: string;
  availability?: MarketplaceAvailability | string;
  services: string[];
  serviceCards: MarketplaceService[];
  industries: string[];
  serviceAreas: string[];
  languages: string[];
  certifications: string[];
  certificationRecords?: MarketplaceCertification[];
  legalStatus: string;
  contact: ContactInfo;
  portfolio: MarketplacePortfolio[];
  projects?: MarketplaceProject[];
  team: Array<{
    name: string;
    role: string;
    skills: string;
  }>;
  documents: string[];
  reviews: MarketplaceReview[];
  insights: {
    fit: number;
    reliability: string;
    capacity: string;
    risks: string[];
    useCases: string[];
    comparison: string;
  };
  metadata?: Record<string, unknown>;
}

export interface MarketplaceCompanyInput extends OwnedEntity {
  slug: string;
  name: string;
  logo?: string;
  logoUrl?: string;
  coverImage?: string;
  description?: string;
  about?: string;
  category?: MarketplaceCategory | string;
  businessCategories?: string[];
  specialties?: string[];
  country?: string;
  city?: string;
  address?: Address;
  website?: string;
  phone?: string;
  email?: string;
  yearsInBusiness?: number;
  employees?: number;
  services?: string[];
  serviceAreas?: string[];
  languages?: string[];
  certifications?: string[];
  availability?: MarketplaceAvailability | string;
  legalStatus?: string;
  metadata?: Record<string, unknown>;
}

export interface MarketplacePortfolioInput {
  companyId: EntityId;
  organizationId?: EntityId;
  projectId?: EntityId;
  title: string;
  description?: string;
  location?: string;
  type?: string;
  status?: string;
  budget?: string;
  completedAt?: string;
  gallery?: string[];
  documents?: string[];
  beforeAfter?: {
    before?: string;
    after?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface MarketplaceReviewInput {
  companyId: EntityId;
  projectId?: EntityId;
  rating: number;
  review: string;
  reviewerName?: string;
  reviewerCompany?: string;
  verified?: boolean;
  metadata?: Record<string, unknown>;
}

export type MarketplaceConnectionStatus = "pending" | "accepted" | "declined" | "archived";

export interface MarketplaceConnection extends Timestamped {
  id: EntityId;
  requesterOrganizationId?: EntityId;
  targetCompanyId: EntityId;
  requestedBy?: EntityId;
  projectId?: EntityId;
  status: MarketplaceConnectionStatus | string;
  intent?: string;
  notes?: string;
  lastMessage?: string;
  lastMessageAt?: IsoTimestamp;
  unreadCount?: number;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceConnectionInput {
  targetCompanyId: EntityId;
  requesterOrganizationId?: EntityId;
  projectId?: EntityId;
  intent?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceMessage extends Timestamped {
  id: EntityId;
  connectionId: EntityId;
  senderProfileId?: EntityId;
  senderOrganizationId?: EntityId;
  recipientOrganizationId?: EntityId;
  body: string;
  readAt?: IsoTimestamp;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceMessageInput {
  connectionId: EntityId;
  senderOrganizationId?: EntityId;
  recipientOrganizationId?: EntityId;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceFavorite extends Timestamped {
  id: EntityId;
  profileId?: EntityId;
  organizationId?: EntityId;
  companyId: EntityId;
  notes?: string;
  priority?: "low" | "medium" | "high";
  intendedProjectId?: EntityId;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceFavoriteInput {
  companyId: EntityId;
  organizationId?: EntityId;
  notes?: string;
  priority?: "low" | "medium" | "high";
  intendedProjectId?: EntityId;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceDashboardWidgets {
  recentlyAdded: MarketplaceCompany[];
  topRated: MarketplaceCompany[];
  verifiedCompanies: MarketplaceCompany[];
  nearbyCompanies: MarketplaceCompany[];
  recommendedPartners: MarketplaceCompany[];
  kpis?: MarketplaceKpis;
  connections?: MarketplaceConnection[];
  favorites?: MarketplaceFavorite[];
  messages?: MarketplaceMessage[];
  reviews?: MarketplaceReview[];
}

export interface MarketplaceKpis {
  companies: number;
  connections: number;
  favorites: number;
  messages: number;
  reviews: number;
  verifiedCompanies: number;
}
