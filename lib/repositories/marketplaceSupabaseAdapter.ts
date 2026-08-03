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
import { getValidSession } from "@/lib/auth-client";
import { organizationRest } from "./organizationSupabaseRest";
import {
  buildMarketplaceKpis,
  buildMarketplaceDashboardWidgets,
  enterpriseMarketplaceCategories,
  filterMarketplaceCompanies,
  mapConnectionInputToSupabase,
  mapFavoriteInputToSupabase,
  mapMarketplaceCompanyInputToSupabase,
  mapMessageInputToSupabase,
  mapPortfolioInputToSupabase,
  mapReviewInputToSupabase,
  mapSupabaseConnectionToDomain,
  mapSupabaseFavoriteToDomain,
  mapSupabaseMarketplaceCompanyToDomain,
  mapSupabaseMessageToDomain,
  mapSupabasePortfolioToDomain,
  mapSupabaseReviewToDomain,
  type SupabaseMarketplaceCompanyRecord,
  type SupabaseMarketplaceConnectionRecord,
  type SupabaseMarketplaceFavoriteRecord,
  type SupabaseMarketplaceMessageRecord,
  type SupabaseMarketplacePortfolioRecord,
  type SupabaseMarketplaceReviewRecord
} from "./marketplaceMapper";

const marketplaceSelect = [
  "id",
  "organization_id",
  "slug",
  "name",
  "logo",
  "logo_url",
  "cover_image",
  "description",
  "about",
  "category",
  "business_categories",
  "specialties",
  "country",
  "city",
  "address",
  "website",
  "phone",
  "email",
  "years_of_experience",
  "employees",
  "active_projects",
  "completed_projects",
  "partners",
  "certifications",
  "languages",
  "services",
  "service_areas",
  "response_time",
  "response_rate",
  "verification_status",
  "verified",
  "availability",
  "rating",
  "review_count",
  "status",
  "legal_status",
  "metadata",
  "created_at",
  "updated_at"
].join(",");

function rangeFor(filters: MarketplaceFilters = {}) {
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 50));
  const page = Math.max(1, filters.page || 1);
  const from = (page - 1) * pageSize;
  return `&limit=${pageSize}&offset=${from}`;
}

async function currentProfileId() {
  const session = await getValidSession();
  return session?.user?.id;
}

function compactPayload<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function mapMarketplaceCompanyUpdate(input: Partial<MarketplaceCompanyInput>) {
  return compactPayload({
    name: input.name,
    logo: input.logo,
    logo_url: input.logoUrl,
    cover_image: input.coverImage,
    description: input.description,
    about: input.about,
    category: input.category,
    business_categories: input.businessCategories,
    specialties: input.specialties,
    country: input.country,
    city: input.city,
    address: input.address,
    website: input.website,
    phone: input.phone,
    email: input.email,
    years_of_experience: input.yearsInBusiness,
    employees: input.employees,
    services: input.services,
    service_areas: input.serviceAreas,
    languages: input.languages,
    certifications: input.certifications,
    availability: input.availability,
    legal_status: input.legalStatus,
    metadata: input.metadata,
    updated_at: new Date().toISOString()
  });
}

async function loadCompanies(filters: MarketplaceFilters = {}) {
  const result = await organizationRest<SupabaseMarketplaceCompanyRecord[]>(
    `/marketplace_companies?select=${encodeURIComponent(marketplaceSelect)}&order=updated_at.desc${rangeFor(filters)}`
  );
  if (result.error) {
    return { data: [] as MarketplaceCompany[], source: "supabase" as const, isFallback: false, error: result.error };
  }
  return {
    data: (result.data || []).map(mapSupabaseMarketplaceCompanyToDomain),
    source: "supabase" as const,
    isFallback: false
  };
}

export const marketplaceSupabaseAdapter = {
  getCategories() {
    return {
      data: enterpriseMarketplaceCategories,
      source: "supabase" as const,
      isFallback: false
    };
  },

  async getCompanies(filters: MarketplaceFilters = {}) {
    const result = await loadCompanies(filters);
    if (result.error) return result;
    return {
      ...result,
      data: filterMarketplaceCompanies(result.data, filters)
    };
  },

  async getCompany(slug: string) {
    const result = await organizationRest<SupabaseMarketplaceCompanyRecord[]>(
      `/marketplace_companies?slug=eq.${encodeURIComponent(slug)}&select=${encodeURIComponent(marketplaceSelect)}&limit=1`
    );
    if (result.error) {
      return { data: undefined as MarketplaceCompany | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    }
    const record = result.data?.[0];
    return {
      data: record ? mapSupabaseMarketplaceCompanyToDomain(record) : undefined,
      source: "supabase" as const,
      isFallback: false
    };
  },

  async searchCompanies(filters: MarketplaceFilters = {}) {
    return this.getCompanies(filters);
  },

  async getFeatured(limit = 4) {
    const result = await this.getCompanies({ sort: "recommended" });
    return {
      ...result,
      data: result.data.slice(0, limit)
    };
  },

  async getDashboardWidgets() {
    const result = await loadCompanies();
    const connections = await this.getConnections();
    const favorites = await this.getFavorites();
    const messages = connections.data.length ? await this.getMessages(connections.data[0].id) : { data: [] as MarketplaceMessage[], source: "supabase" as const, isFallback: false };
    if (result.error) {
      return {
        data: buildMarketplaceDashboardWidgets([]),
        source: "supabase" as const,
        isFallback: false,
        error: result.error
      };
    }
    return {
      data: {
        ...buildMarketplaceDashboardWidgets(result.data),
        kpis: buildMarketplaceKpis(result.data, connections.data, favorites.data, messages.data, result.data.flatMap((company) => company.reviews)),
        connections: connections.data,
        favorites: favorites.data,
        messages: messages.data,
        reviews: result.data.flatMap((company) => company.reviews).slice(0, 5)
      },
      source: "supabase" as const,
      isFallback: false
    };
  },

  async createCompany(input: MarketplaceCompanyInput) {
    const profileId = await currentProfileId();
    if (!profileId) return { data: undefined as MarketplaceCompany | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to create a marketplace company." };
    const result = await organizationRest<SupabaseMarketplaceCompanyRecord[]>("/marketplace_companies", {
      method: "POST",
      body: JSON.stringify(mapMarketplaceCompanyInputToSupabase(input, profileId))
    });
    if (result.error) return { data: undefined as MarketplaceCompany | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMarketplaceCompanyToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateCompany(slug: string, input: Partial<MarketplaceCompanyInput>) {
    const result = await organizationRest<SupabaseMarketplaceCompanyRecord[]>(`/marketplace_companies?slug=eq.${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(mapMarketplaceCompanyUpdate(input))
    });
    if (result.error) return { data: undefined as MarketplaceCompany | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMarketplaceCompanyToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async createConnection(input: MarketplaceConnectionInput) {
    const profileId = await currentProfileId();
    if (!profileId) return { data: undefined as MarketplaceConnection | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to create a marketplace connection." };
    const result = await organizationRest<SupabaseMarketplaceConnectionRecord[]>("/marketplace_connections", {
      method: "POST",
      body: JSON.stringify(mapConnectionInputToSupabase(input, profileId))
    });
    if (result.error) return { data: undefined as MarketplaceConnection | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseConnectionToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async getConnections() {
    const result = await organizationRest<SupabaseMarketplaceConnectionRecord[]>("/marketplace_connections?select=*&order=updated_at.desc");
    if (result.error) return { data: [] as MarketplaceConnection[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseConnectionToDomain), source: "supabase" as const, isFallback: false };
  },

  async getMessages(connectionId: string) {
    const result = await organizationRest<SupabaseMarketplaceMessageRecord[]>(`/marketplace_messages?connection_id=eq.${encodeURIComponent(connectionId)}&select=*&order=created_at.asc`);
    if (result.error) return { data: [] as MarketplaceMessage[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseMessageToDomain), source: "supabase" as const, isFallback: false };
  },

  async sendMessage(input: MarketplaceMessageInput) {
    const profileId = await currentProfileId();
    if (!profileId) return { data: undefined as MarketplaceMessage | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to send marketplace messages." };
    const result = await organizationRest<SupabaseMarketplaceMessageRecord[]>("/marketplace_messages", {
      method: "POST",
      body: JSON.stringify(mapMessageInputToSupabase(input, profileId))
    });
    if (result.error) return { data: undefined as MarketplaceMessage | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseMessageToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async addFavorite(input: MarketplaceFavoriteInput) {
    const profileId = await currentProfileId();
    if (!profileId) return { data: undefined as MarketplaceFavorite | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to save marketplace favorites." };
    const result = await organizationRest<SupabaseMarketplaceFavoriteRecord[]>("/marketplace_favorites", {
      method: "POST",
      body: JSON.stringify(mapFavoriteInputToSupabase(input, profileId))
    });
    if (result.error) return { data: undefined as MarketplaceFavorite | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseFavoriteToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async getFavorites() {
    const result = await organizationRest<SupabaseMarketplaceFavoriteRecord[]>("/marketplace_favorites?select=*&order=created_at.desc");
    if (result.error) return { data: [] as MarketplaceFavorite[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseFavoriteToDomain), source: "supabase" as const, isFallback: false };
  },

  async createReview(input: MarketplaceReviewInput) {
    const profileId = await currentProfileId();
    if (!profileId) return { data: undefined as MarketplaceReview | undefined, source: "supabase" as const, isFallback: false, error: "Authentication is required to create marketplace reviews." };
    const result = await organizationRest<SupabaseMarketplaceReviewRecord[]>("/marketplace_reviews", {
      method: "POST",
      body: JSON.stringify(mapReviewInputToSupabase(input, profileId))
    });
    if (result.error) return { data: undefined as MarketplaceReview | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseReviewToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async createPortfolio(input: MarketplacePortfolioInput) {
    const result = await organizationRest<SupabaseMarketplacePortfolioRecord[]>("/marketplace_portfolios", {
      method: "POST",
      body: JSON.stringify(mapPortfolioInputToSupabase(input))
    });
    if (result.error) return { data: undefined as MarketplacePortfolio | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabasePortfolioToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  }
};
