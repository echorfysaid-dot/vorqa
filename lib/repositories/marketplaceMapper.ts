import type {
  MarketplaceCompany,
  MarketplaceCompanyInput,
  MarketplaceConnection,
  MarketplaceConnectionInput,
  MarketplaceDashboardWidgets,
  MarketplaceFavorite,
  MarketplaceFavoriteInput,
  MarketplaceFilters,
  MarketplaceKpis,
  MarketplaceMessage,
  MarketplaceMessageInput,
  MarketplacePortfolio,
  MarketplacePortfolioInput,
  MarketplaceReview,
  MarketplaceReviewInput,
  MarketplaceSort,
  MarketplaceCategory,
  VerificationStatus
} from "@/lib/models";
import { marketplaceCompanies } from "@/lib/data";

export type DemoMarketplaceCompany = (typeof marketplaceCompanies)[number];

export type SupabaseMarketplaceCompanyRecord = {
  id: string;
  organization_id?: string | null;
  slug?: string | null;
  name?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  cover_image?: string | null;
  description?: string | null;
  about?: string | null;
  category?: string | null;
  business_categories?: string[] | null;
  specialties?: string[] | null;
  country?: string | null;
  city?: string | null;
  address?: Record<string, unknown> | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  years_of_experience?: number | null;
  employees?: number | null;
  active_projects?: number | null;
  completed_projects?: number | null;
  partners?: number | null;
  certifications?: string[] | null;
  languages?: string[] | null;
  services?: string[] | null;
  service_areas?: string[] | null;
  response_time?: string | null;
  response_rate?: string | null;
  verification_status?: string | null;
  verified?: boolean | null;
  availability?: string | null;
  rating?: number | null;
  review_count?: number | null;
  status?: string | null;
  legal_status?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupabaseMarketplacePortfolioRecord = {
  id: string;
  company_id: string;
  organization_id?: string | null;
  project_id?: string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  project_type?: string | null;
  status?: string | null;
  budget?: string | null;
  completed_at?: string | null;
  gallery?: unknown[] | null;
  documents?: unknown[] | null;
  before_after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupabaseMarketplaceReviewRecord = {
  id: string;
  company_id: string;
  project_id?: string | null;
  created_by?: string | null;
  reviewer_name?: string | null;
  reviewer_company?: string | null;
  rating?: number | null;
  review?: string | null;
  verified?: boolean | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupabaseMarketplaceConnectionRecord = {
  id: string;
  requester_organization_id?: string | null;
  target_company_id: string;
  requested_by?: string | null;
  project_id?: string | null;
  status?: string | null;
  intent?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type SupabaseMarketplaceMessageRecord = {
  id: string;
  connection_id: string;
  sender_profile_id?: string | null;
  sender_organization_id?: string | null;
  recipient_organization_id?: string | null;
  body?: string | null;
  read_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type SupabaseMarketplaceFavoriteRecord = {
  id: string;
  profile_id?: string | null;
  organization_id?: string | null;
  company_id: string;
  notes?: string | null;
  priority?: string | null;
  intended_project_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

export const enterpriseMarketplaceCategories: Array<{ name: MarketplaceCategory | string; count: number; description: string }> = [
  { name: "General Contractor", count: 42, description: "Full-scope construction delivery partners for residential, commercial, and industrial projects." },
  { name: "Subcontractor", count: 37, description: "Specialized execution teams for structural, finishing, MEP, facade, and site works." },
  { name: "Supplier", count: 56, description: "Material, concrete, steel, facade, finishing, and MEP supply partners." },
  { name: "Engineering Office", count: 31, description: "Civil, structural, MEP, BIM, and project engineering consultants." },
  { name: "Architect", count: 28, description: "Architecture studios for concepts, permits, BIM coordination, and design packages." },
  { name: "Interior Designer", count: 21, description: "Interior design and fit-out partners for premium residential and commercial projects." },
  { name: "Surveyor", count: 18, description: "Topography, quantity surveying, measurements, and site verification services." },
  { name: "Project Management", count: 24, description: "PMO, planning, controls, contract administration, and owner representation." },
  { name: "HVAC", count: 16, description: "Heating, ventilation, air conditioning, and MEP execution partners." },
  { name: "Electrical", count: 19, description: "Electrical design, installation, low-current systems, and testing providers." },
  { name: "Mechanical", count: 15, description: "Mechanical systems, plumbing, fire protection, and technical installation teams." },
  { name: "Concrete", count: 22, description: "Ready-mix concrete, pumping, testing, and structural material suppliers." },
  { name: "Steel", count: 17, description: "Steel fabrication, reinforcement supply, and structural steel partners." },
  { name: "Roads", count: 12, description: "Roadworks, paving, infrastructure access, drainage, and external works." },
  { name: "Infrastructure", count: 20, description: "Utilities, drainage, roads, site infrastructure, and enabling works specialists." },
  { name: "Landscape", count: 14, description: "Landscape design, planting, irrigation, and external environment execution." },
  { name: "Safety", count: 11, description: "HSE consultants, safety audits, training, and compliance support." },
  { name: "Equipment Rental", count: 19, description: "Cranes, lifts, site machinery, certified operators, and rental packages." },
  { name: "Logistics", count: 24, description: "Site deliveries, fleet coordination, port access, and construction logistics." },
  { name: "Other", count: 9, description: "Specialized construction services that do not fit the standard categories." }
];

function toVerificationStatus(value?: string | null, verified?: boolean | null): VerificationStatus {
  if (value === "Verified" || value === "Pending" || value === "Rejected" || value === "Unverified") return value;
  if (value === "verified") return "Verified";
  if (value === "pending") return "Pending";
  if (value === "rejected") return "Rejected";
  return verified ? "Verified" : "Unverified";
}

function toDemoBusinessCategories(company: DemoMarketplaceCompany) {
  const category = company.category;
  const aliases: Record<string, string[]> = {
    Contractors: ["General Contractor", "Project Management"],
    "Engineering Firms": ["Engineering Office", "Infrastructure"],
    "Architecture Studios": ["Architect", "Interior Designer"],
    "Material Suppliers": ["Supplier", "Concrete"],
    "Logistics Companies": ["Logistics", "Equipment Rental"],
    "Equipment Rental": ["Equipment Rental", "Safety"],
    Consultants: ["Project Management", "Surveyor"]
  };
  return aliases[category] || [category];
}

export function mapDemoMarketplaceCompanyToDomain(company: DemoMarketplaceCompany): MarketplaceCompany {
  const verificationStatus = toVerificationStatus(undefined, company.verified);
  return {
    ...company,
    id: company.slug,
    organizationId: company.slug,
    businessCategories: toDemoBusinessCategories(company),
    specialties: company.services,
    logoUrl: undefined,
    coverImage: undefined,
    location: {
      country: company.country,
      city: company.city,
      serviceAreas: company.serviceAreas
    },
    verificationStatus,
    reviewCount: company.reviews.length,
    availability: company.serviceCards.some((service) => service.availability === "Available") ? "Available" : "Limited slots",
    certificationRecords: company.certifications.map((title, index) => ({
      id: `${company.slug}-cert-${index + 1}`,
      title,
      status: verificationStatus
    })),
    projects: company.portfolio,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-18T12:00:00.000Z"
  };
}

export function mapSupabaseMarketplaceCompanyToDomain(record: SupabaseMarketplaceCompanyRecord): MarketplaceCompany {
  const services = record.services || [];
  const certifications = record.certifications || [];
  const languages = record.languages || [];
  const serviceAreas = record.service_areas || [];
  const verified = Boolean(record.verified || record.verification_status === "verified");
  return {
    id: record.id,
    organizationId: record.organization_id || undefined,
    slug: record.slug || record.id,
    name: record.name || "Untitled marketplace company",
    logo: record.logo || (record.name || "MC").slice(0, 2).toUpperCase(),
    logoUrl: record.logo_url || undefined,
    coverImage: record.cover_image || undefined,
    category: record.category || "Other",
    businessCategories: record.business_categories || [record.category || "Other"],
    specialties: record.specialties || services,
    verified,
    verificationStatus: toVerificationStatus(record.verification_status, verified),
    rating: Number(record.rating || 0),
    reviewCount: Number(record.review_count || 0),
    country: record.country || "Unspecified",
    city: record.city || "Unspecified",
    location: {
      country: record.country || "Unspecified",
      city: record.city || "Unspecified",
      address: typeof record.address?.line === "string" ? record.address.line : undefined,
      serviceAreas
    },
    address: {
      country: record.country || undefined,
      city: record.city || undefined,
      location: typeof record.address?.line === "string" ? record.address.line : undefined
    },
    activeProjects: Number(record.active_projects || 0),
    completedProjects: Number(record.completed_projects || 0),
    employees: Number(record.employees || 0),
    partners: Number(record.partners || 0),
    responseRate: record.response_rate || "Not available",
    responseTime: record.response_time || "Not available",
    yearsInBusiness: Number(record.years_of_experience || 0),
    description: record.description || "Marketplace company profile.",
    about: record.about || record.description || "Marketplace company profile.",
    status: record.status || (verified ? "Verified" : "Pending verification"),
    availability: record.availability || "By request",
    services,
    serviceCards: services.map((service, index) => ({
      id: `${record.id}-service-${index + 1}`,
      title: service,
      description: `${service} service capability.`,
      availability: record.availability || "By request"
    })),
    industries: Array.isArray(record.metadata?.industries) ? record.metadata.industries.map(String) : [],
    serviceAreas,
    languages,
    certifications,
    certificationRecords: certifications.map((title, index) => ({ id: `${record.id}-cert-${index + 1}`, title, status: toVerificationStatus(record.verification_status, verified) })),
    legalStatus: record.legal_status || "Verification information unavailable",
    contact: {
      email: record.email || undefined,
      phone: record.phone || undefined,
      website: record.website || undefined
    },
    portfolio: [],
    projects: [],
    team: [],
    documents: [],
    reviews: [],
    insights: {
      fit: Math.round(Number(record.rating || 0) * 18),
      reliability: verified ? "High" : "Pending verification",
      capacity: `${Number(record.employees || 0)} employees and ${Number(record.active_projects || 0)} active projects.`,
      risks: verified ? ["Capacity should be confirmed before award"] : ["Verification pending"],
      useCases: services.slice(0, 4),
      comparison: "Production marketplace profile ready for future VORA comparison."
    },
    metadata: record.metadata || {},
    createdAt: record.created_at || undefined,
    updatedAt: record.updated_at || undefined
  };
}

export function mapMarketplaceCompanyInputToSupabase(input: MarketplaceCompanyInput, ownerId?: string) {
  return {
    owner_id: input.ownerId || ownerId,
    organization_id: input.organizationId,
    slug: input.slug,
    name: input.name,
    logo: input.logo,
    logo_url: input.logoUrl,
    cover_image: input.coverImage,
    description: input.description,
    about: input.about,
    category: input.category || "Other",
    business_categories: input.businessCategories || [],
    specialties: input.specialties || [],
    country: input.country,
    city: input.city,
    address: input.address || {},
    website: input.website,
    phone: input.phone,
    email: input.email,
    years_of_experience: input.yearsInBusiness || 0,
    employees: input.employees || 0,
    services: input.services || [],
    service_areas: input.serviceAreas || [],
    languages: input.languages || [],
    certifications: input.certifications || [],
    availability: input.availability || "By request",
    legal_status: input.legalStatus,
    metadata: input.metadata || {}
  };
}

export function mapSupabasePortfolioToDomain(record: SupabaseMarketplacePortfolioRecord): MarketplacePortfolio {
  return {
    id: record.id,
    title: record.title || "Untitled portfolio project",
    location: record.location || "Unspecified",
    type: record.project_type || "Project",
    status: record.status || "published",
    budget: record.budget || undefined,
    date: record.completed_at || undefined,
    gallery: Array.isArray(record.gallery) ? record.gallery.map(String) : [],
    documents: Array.isArray(record.documents) ? record.documents.map(String) : [],
    beforeAfter: {
      before: typeof record.before_after?.before === "string" ? record.before_after.before : undefined,
      after: typeof record.before_after?.after === "string" ? record.before_after.after : undefined
    }
  };
}

export function mapPortfolioInputToSupabase(input: MarketplacePortfolioInput) {
  return {
    company_id: input.companyId,
    organization_id: input.organizationId,
    project_id: input.projectId,
    title: input.title,
    description: input.description,
    location: input.location,
    project_type: input.type,
    status: input.status || "published",
    budget: input.budget,
    completed_at: input.completedAt,
    gallery: input.gallery || [],
    documents: input.documents || [],
    before_after: input.beforeAfter || {},
    metadata: input.metadata || {}
  };
}

export function mapSupabaseReviewToDomain(record: SupabaseMarketplaceReviewRecord): MarketplaceReview {
  return {
    id: record.id,
    name: record.reviewer_name || "Verified client",
    company: record.reviewer_company || undefined,
    rating: Number(record.rating || 0),
    text: record.review || "",
    createdAt: record.created_at || undefined,
    verified: Boolean(record.verified)
  };
}

export function mapReviewInputToSupabase(input: MarketplaceReviewInput, profileId?: string) {
  return {
    company_id: input.companyId,
    project_id: input.projectId,
    created_by: profileId,
    reviewer_name: input.reviewerName,
    reviewer_company: input.reviewerCompany,
    rating: input.rating,
    review: input.review,
    verified: input.verified || false,
    metadata: input.metadata || {}
  };
}

export function mapSupabaseConnectionToDomain(record: SupabaseMarketplaceConnectionRecord): MarketplaceConnection {
  return {
    id: record.id,
    requesterOrganizationId: record.requester_organization_id || undefined,
    targetCompanyId: record.target_company_id,
    requestedBy: record.requested_by || undefined,
    projectId: record.project_id || undefined,
    status: record.status || "pending",
    intent: record.intent || undefined,
    notes: record.notes || undefined,
    lastMessage: typeof record.metadata?.lastMessage === "string" ? record.metadata.lastMessage : undefined,
    lastMessageAt: typeof record.metadata?.lastMessageAt === "string" ? record.metadata.lastMessageAt : undefined,
    unreadCount: typeof record.metadata?.unreadCount === "number" ? record.metadata.unreadCount : 0,
    metadata: record.metadata || {},
    createdAt: record.created_at || undefined,
    updatedAt: record.updated_at || undefined
  };
}

export function mapConnectionInputToSupabase(input: MarketplaceConnectionInput, profileId?: string) {
  return {
    requester_organization_id: input.requesterOrganizationId,
    target_company_id: input.targetCompanyId,
    requested_by: profileId,
    project_id: input.projectId,
    intent: input.intent,
    notes: input.notes,
    metadata: input.metadata || {}
  };
}

export function mapSupabaseMessageToDomain(record: SupabaseMarketplaceMessageRecord): MarketplaceMessage {
  return {
    id: record.id,
    connectionId: record.connection_id,
    senderProfileId: record.sender_profile_id || undefined,
    senderOrganizationId: record.sender_organization_id || undefined,
    recipientOrganizationId: record.recipient_organization_id || undefined,
    body: record.body || "",
    readAt: record.read_at || undefined,
    metadata: record.metadata || {},
    createdAt: record.created_at || undefined
  };
}

export function mapMessageInputToSupabase(input: MarketplaceMessageInput, profileId?: string) {
  return {
    connection_id: input.connectionId,
    sender_profile_id: profileId,
    sender_organization_id: input.senderOrganizationId,
    recipient_organization_id: input.recipientOrganizationId,
    body: input.body,
    metadata: input.metadata || {}
  };
}

export function mapSupabaseFavoriteToDomain(record: SupabaseMarketplaceFavoriteRecord): MarketplaceFavorite {
  return {
    id: record.id,
    profileId: record.profile_id || undefined,
    organizationId: record.organization_id || undefined,
    companyId: record.company_id,
    notes: record.notes || undefined,
    priority: record.priority === "low" || record.priority === "high" ? record.priority : "medium",
    intendedProjectId: record.intended_project_id || undefined,
    metadata: record.metadata || {},
    createdAt: record.created_at || undefined
  };
}

export function mapFavoriteInputToSupabase(input: MarketplaceFavoriteInput, profileId?: string) {
  return {
    profile_id: profileId,
    organization_id: input.organizationId,
    company_id: input.companyId,
    notes: input.notes,
    priority: input.priority || "medium",
    intended_project_id: input.intendedProjectId,
    metadata: input.metadata || {}
  };
}

function normalized(value: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

function includesAny(values: string[], selected?: string[]) {
  if (!selected?.length) return true;
  const valueSet = values.map(normalized);
  return selected.some((item) => valueSet.includes(normalized(item)));
}

export function filterMarketplaceCompanies(companies: MarketplaceCompany[], filters: MarketplaceFilters = {}) {
  const query = normalized(filters.query);
  let filtered = companies.filter((company) => {
    const searchable = [
      company.name,
      company.category,
      company.businessCategories?.join(" "),
      company.specialties?.join(" "),
      company.city,
      company.country,
      company.description,
      company.services.join(" "),
      company.languages.join(" "),
      company.serviceAreas.join(" ")
    ].join(" ");
    return (!query || normalized(searchable).includes(query))
      && (!filters.country || filters.country === "All countries" || company.country === filters.country)
      && (!filters.city || filters.city === "All cities" || company.city === filters.city)
      && (!filters.category || filters.category === "All categories" || company.category === filters.category || company.businessCategories?.includes(filters.category))
      && (!filters.experience || filters.experience === "All experience" || company.yearsInBusiness >= Number(filters.experience.replace("+ years", "")))
      && (!filters.rating || company.rating >= filters.rating)
      && (filters.verified === undefined || company.verified === filters.verified)
      && (!filters.availability || filters.availability === "All availability" || company.availability === filters.availability)
      && includesAny(company.languages, filters.languages)
      && includesAny([...company.services, ...(company.specialties || [])], filters.services);
  });

  const sort = filters.sort || "recommended";
  const sorters: Record<MarketplaceSort, (a: MarketplaceCompany, b: MarketplaceCompany) => number> = {
    recommended: (a, b) => b.insights.fit - a.insights.fit,
    rating: (a, b) => b.rating - a.rating,
    experience: (a, b) => b.yearsInBusiness - a.yearsInBusiness,
    "completed-projects": (a, b) => b.completedProjects - a.completedProjects,
    "response-time": (a, b) => a.responseTime.localeCompare(b.responseTime),
    newest: (a, b) => normalized(b.updatedAt).localeCompare(normalized(a.updatedAt))
  };
  filtered = [...filtered].sort(sorters[sort]);
  return filtered;
}

export function buildMarketplaceDashboardWidgets(companies: MarketplaceCompany[]): MarketplaceDashboardWidgets {
  return {
    recentlyAdded: [...companies].sort((a, b) => normalized(b.createdAt).localeCompare(normalized(a.createdAt))).slice(0, 4),
    topRated: [...companies].sort((a, b) => b.rating - a.rating).slice(0, 4),
    verifiedCompanies: companies.filter((company) => company.verified).slice(0, 4),
    nearbyCompanies: companies.filter((company) => company.country === "Morocco").slice(0, 4),
    recommendedPartners: [...companies].sort((a, b) => b.insights.fit - a.insights.fit).slice(0, 4),
    kpis: buildMarketplaceKpis(companies, [], [], [], companies.flatMap((company) => company.reviews))
  };
}

export function buildMarketplaceKpis(
  companies: MarketplaceCompany[],
  connections: MarketplaceConnection[] = [],
  favorites: MarketplaceFavorite[] = [],
  messages: MarketplaceMessage[] = [],
  reviews: MarketplaceReview[] = []
): MarketplaceKpis {
  return {
    companies: companies.length,
    connections: connections.length,
    favorites: favorites.length,
    messages: messages.length,
    reviews: reviews.length,
    verifiedCompanies: companies.filter((company) => company.verified).length
  };
}
