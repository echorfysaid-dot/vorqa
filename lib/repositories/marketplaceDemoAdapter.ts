import { marketplaceCategories, marketplaceCompanies } from "@/lib/data";
import type {
  MarketplaceCompany,
  MarketplaceCompanyInput,
  MarketplaceConnection,
  MarketplaceConnectionInput,
  MarketplaceFavorite,
  MarketplaceFavoriteInput,
  MarketplaceFilters,
  MarketplaceMessage,
  MarketplaceMessageInput,
  MarketplacePortfolio,
  MarketplacePortfolioInput,
  MarketplaceReview,
  MarketplaceReviewInput
} from "@/lib/models";
import {
  buildMarketplaceDashboardWidgets,
  buildMarketplaceKpis,
  enterpriseMarketplaceCategories,
  filterMarketplaceCompanies,
  mapDemoMarketplaceCompanyToDomain
} from "./marketplaceMapper";

function companies(): MarketplaceCompany[] {
  return marketplaceCompanies.map(mapDemoMarketplaceCompanyToDomain);
}

const demoConnections: MarketplaceConnection[] = [
  {
    id: "MCON-1001",
    requesterOrganizationId: "atlas",
    targetCompanyId: "atlas-construction",
    requestedBy: "demo-user",
    projectId: "PRJ-1048",
    status: "accepted",
    intent: "Request execution capacity confirmation",
    notes: "Connected from demo procurement flow.",
    lastMessage: "We can support the Villa Casablanca execution package.",
    lastMessageAt: "2026-07-18T13:30:00.000Z",
    unreadCount: 1,
    createdAt: "2026-07-18T12:00:00.000Z",
    updatedAt: "2026-07-18T13:30:00.000Z"
  }
];

const demoMessages: MarketplaceMessage[] = [
  {
    id: "MMSG-1001",
    connectionId: "MCON-1001",
    senderProfileId: "demo-user",
    senderOrganizationId: "atlas",
    body: "Please confirm execution capacity and reporting cadence for RFQ-1001.",
    createdAt: "2026-07-18T12:10:00.000Z"
  },
  {
    id: "MMSG-1002",
    connectionId: "MCON-1001",
    recipientOrganizationId: "atlas",
    body: "Capacity confirmed. We recommend weekly executive reporting and milestone-linked acceptance.",
    createdAt: "2026-07-18T13:30:00.000Z"
  }
];

const demoFavorites: MarketplaceFavorite[] = [
  { id: "MFAV-1001", profileId: "demo-user", organizationId: "atlas", companyId: "atlas-construction", priority: "high", notes: "Preferred execution partner for Villa Casablanca.", intendedProjectId: "PRJ-1048", createdAt: "2026-07-18T12:00:00.000Z" }
];

export const marketplaceDemoAdapter = {
  getCategories() {
    const legacyNames = new Set(marketplaceCategories.map((category) => category.name));
    const extended = enterpriseMarketplaceCategories.filter((category) => !legacyNames.has(String(category.name)));
    return {
      data: [...marketplaceCategories, ...extended],
      source: "demo" as const,
      isFallback: false
    };
  },

  getCompanies(filters: MarketplaceFilters = {}) {
    return {
      data: filterMarketplaceCompanies(companies(), filters),
      source: "demo" as const,
      isFallback: false
    };
  },

  getCompany(slug: string) {
    const company = companies().find((item) => item.slug === slug || item.id === slug);
    return {
      data: company,
      source: "demo" as const,
      isFallback: false
    };
  },

  searchCompanies(filters: MarketplaceFilters = {}) {
    return this.getCompanies(filters);
  },

  getFeatured(limit = 4) {
    return {
      data: companies().slice(0, limit),
      source: "demo" as const,
      isFallback: false
    };
  },

  getDashboardWidgets() {
    const companyList = companies();
    return {
      data: {
        ...buildMarketplaceDashboardWidgets(companyList),
        kpis: buildMarketplaceKpis(companyList, demoConnections, demoFavorites, demoMessages, companyList.flatMap((company) => company.reviews)),
        connections: demoConnections,
        favorites: demoFavorites,
        messages: demoMessages,
        reviews: companyList.flatMap((company) => company.reviews).slice(0, 5)
      },
      source: "demo" as const,
      isFallback: false
    };
  },

  createCompany(input: MarketplaceCompanyInput) {
    const now = new Date().toISOString();
    const company: MarketplaceCompany = {
      id: `demo-${input.slug}`,
      slug: input.slug,
      name: input.name,
      logo: input.logo || input.name.slice(0, 2).toUpperCase(),
      logoUrl: input.logoUrl,
      coverImage: input.coverImage,
      category: input.category || "Other",
      businessCategories: input.businessCategories || [input.category || "Other"],
      specialties: input.specialties || [],
      verified: false,
      verificationStatus: "Pending",
      rating: 0,
      reviewCount: 0,
      country: input.country || "Unspecified",
      city: input.city || "Unspecified",
      address: input.address,
      activeProjects: 0,
      completedProjects: 0,
      employees: input.employees || 0,
      partners: 0,
      responseRate: "Not available",
      responseTime: "Not available",
      yearsInBusiness: input.yearsInBusiness || 0,
      description: input.description || "Marketplace company profile.",
      about: input.about || input.description || "Marketplace company profile.",
      status: "draft",
      availability: input.availability || "By request",
      services: input.services || [],
      serviceCards: [],
      industries: [],
      serviceAreas: input.serviceAreas || [],
      languages: input.languages || [],
      certifications: input.certifications || [],
      legalStatus: input.legalStatus || "Pending verification",
      contact: { email: input.email, phone: input.phone, website: input.website },
      portfolio: [],
      team: [],
      documents: [],
      reviews: [],
      insights: { fit: 0, reliability: "Pending verification", capacity: "New demo profile", risks: ["Verification pending"], useCases: input.services || [], comparison: "New profile ready for review." },
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };
    return { data: company, source: "demo" as const, isFallback: false };
  },

  updateCompany(slug: string, input: Partial<MarketplaceCompanyInput>) {
    const company = companies().find((item) => item.slug === slug || item.id === slug);
    if (!company) return { data: undefined as MarketplaceCompany | undefined, source: "demo" as const, isFallback: false, error: "Company not found in demo data." };
    return { data: { ...company, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  createConnection(input: MarketplaceConnectionInput) {
    const connection: MarketplaceConnection = { id: `MCON-${Date.now()}`, status: "pending", targetCompanyId: input.targetCompanyId, requesterOrganizationId: input.requesterOrganizationId, projectId: input.projectId, intent: input.intent, notes: input.notes, metadata: input.metadata || {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return { data: connection, source: "demo" as const, isFallback: false };
  },

  getConnections() {
    return { data: demoConnections, source: "demo" as const, isFallback: false };
  },

  getMessages(connectionId: string) {
    return { data: demoMessages.filter((message) => message.connectionId === connectionId), source: "demo" as const, isFallback: false };
  },

  sendMessage(input: MarketplaceMessageInput) {
    const message: MarketplaceMessage = { id: `MMSG-${Date.now()}`, connectionId: input.connectionId, senderOrganizationId: input.senderOrganizationId, recipientOrganizationId: input.recipientOrganizationId, body: input.body, metadata: input.metadata || {}, createdAt: new Date().toISOString() };
    return { data: message, source: "demo" as const, isFallback: false };
  },

  addFavorite(input: MarketplaceFavoriteInput) {
    const favorite: MarketplaceFavorite = { id: `MFAV-${Date.now()}`, companyId: input.companyId, organizationId: input.organizationId, notes: input.notes, priority: input.priority || "medium", intendedProjectId: input.intendedProjectId, metadata: input.metadata || {}, createdAt: new Date().toISOString() };
    return { data: favorite, source: "demo" as const, isFallback: false };
  },

  getFavorites() {
    return { data: demoFavorites, source: "demo" as const, isFallback: false };
  },

  createReview(input: MarketplaceReviewInput) {
    const review: MarketplaceReview = { id: `MREV-${Date.now()}`, name: input.reviewerName || "Demo reviewer", company: input.reviewerCompany, rating: input.rating, text: input.review, verified: input.verified || false, createdAt: new Date().toISOString() };
    return { data: review, source: "demo" as const, isFallback: false };
  },

  createPortfolio(input: MarketplacePortfolioInput) {
    const portfolio: MarketplacePortfolio = { id: `MPOR-${Date.now()}`, title: input.title, location: input.location || "Unspecified", type: input.type || "Project", status: input.status || "published", budget: input.budget, date: input.completedAt, gallery: input.gallery || [], documents: input.documents || [], beforeAfter: input.beforeAfter };
    return { data: portfolio, source: "demo" as const, isFallback: false };
  }
};
