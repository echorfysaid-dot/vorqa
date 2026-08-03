import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type {
  MarketplaceCompany,
  MarketplaceCompanyInput,
  MarketplaceConnection,
  MarketplaceConnectionInput,
  MarketplaceDashboardWidgets,
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
import { organizationRepository } from "./organizationRepository";
import { marketplaceDemoAdapter } from "./marketplaceDemoAdapter";
import { marketplaceSupabaseAdapter } from "./marketplaceSupabaseAdapter";
import { cachedRepositoryCall } from "./repositoryCache";

export type DemoMarketplaceCompany = MarketplaceCompany;

export type MarketplaceRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => MarketplaceRepositoryResult<T> | Promise<MarketplaceRepositoryResult<T>>,
  supabase: () => MarketplaceRepositoryResult<T> | Promise<MarketplaceRepositoryResult<T>>
): Promise<MarketplaceRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const marketplaceRepository = {
  listCategories() {
    return marketplaceDemoAdapter.getCategories().data;
  },

  async getCategories() {
    return withMode(() => marketplaceDemoAdapter.getCategories(), () => marketplaceSupabaseAdapter.getCategories());
  },

  listCompanies(): MarketplaceCompany[] {
    return marketplaceDemoAdapter.getCompanies().data;
  },

  async getCompanies(filters: MarketplaceFilters = {}): Promise<MarketplaceRepositoryResult<MarketplaceCompany[]>> {
    return withMode(() => marketplaceDemoAdapter.getCompanies(filters), () => marketplaceSupabaseAdapter.getCompanies(filters));
  },

  getCompanyBySlug(slug: string): MarketplaceCompany | undefined {
    return marketplaceDemoAdapter.getCompany(slug).data;
  },

  async getCompany(slug: string): Promise<MarketplaceRepositoryResult<MarketplaceCompany | undefined>> {
    return withMode(() => marketplaceDemoAdapter.getCompany(slug), () => marketplaceSupabaseAdapter.getCompany(slug));
  },

  async searchCompanies(filters: MarketplaceFilters = {}) {
    return this.getCompanies(filters);
  },

  listFeatured(limit = 4): MarketplaceCompany[] {
    return marketplaceDemoAdapter.getFeatured(limit).data;
  },

  async getFeatured(limit = 4): Promise<MarketplaceRepositoryResult<MarketplaceCompany[]>> {
    return withMode(() => marketplaceDemoAdapter.getFeatured(limit), () => marketplaceSupabaseAdapter.getFeatured(limit));
  },

  async getDashboardWidgets(): Promise<MarketplaceRepositoryResult<MarketplaceDashboardWidgets>> {
    return cachedRepositoryCall("marketplace:dashboard-widgets", 20_000, () =>
      withMode(() => marketplaceDemoAdapter.getDashboardWidgets(), () => marketplaceSupabaseAdapter.getDashboardWidgets())
    );
  },

  async createCompany(input: MarketplaceCompanyInput): Promise<MarketplaceRepositoryResult<MarketplaceCompany | undefined>> {
    return withMode(() => marketplaceDemoAdapter.createCompany(input), () => marketplaceSupabaseAdapter.createCompany(input));
  },

  async updateCompany(slug: string, input: Partial<MarketplaceCompanyInput>): Promise<MarketplaceRepositoryResult<MarketplaceCompany | undefined>> {
    return withMode(() => marketplaceDemoAdapter.updateCompany(slug, input), () => marketplaceSupabaseAdapter.updateCompany(slug, input));
  },

  async createConnection(input: MarketplaceConnectionInput): Promise<MarketplaceRepositoryResult<MarketplaceConnection | undefined>> {
    return withMode(() => marketplaceDemoAdapter.createConnection(input), () => marketplaceSupabaseAdapter.createConnection(input));
  },

  async getConnections(): Promise<MarketplaceRepositoryResult<MarketplaceConnection[]>> {
    return withMode(() => marketplaceDemoAdapter.getConnections(), () => marketplaceSupabaseAdapter.getConnections());
  },

  async getMessages(connectionId: string): Promise<MarketplaceRepositoryResult<MarketplaceMessage[]>> {
    return withMode(() => marketplaceDemoAdapter.getMessages(connectionId), () => marketplaceSupabaseAdapter.getMessages(connectionId));
  },

  async sendMessage(input: MarketplaceMessageInput): Promise<MarketplaceRepositoryResult<MarketplaceMessage | undefined>> {
    return withMode(() => marketplaceDemoAdapter.sendMessage(input), () => marketplaceSupabaseAdapter.sendMessage(input));
  },

  async addFavorite(input: MarketplaceFavoriteInput): Promise<MarketplaceRepositoryResult<MarketplaceFavorite | undefined>> {
    return withMode(() => marketplaceDemoAdapter.addFavorite(input), () => marketplaceSupabaseAdapter.addFavorite(input));
  },

  async getFavorites(): Promise<MarketplaceRepositoryResult<MarketplaceFavorite[]>> {
    return withMode(() => marketplaceDemoAdapter.getFavorites(), () => marketplaceSupabaseAdapter.getFavorites());
  },

  async createReview(input: MarketplaceReviewInput): Promise<MarketplaceRepositoryResult<MarketplaceReview | undefined>> {
    return withMode(() => marketplaceDemoAdapter.createReview(input), () => marketplaceSupabaseAdapter.createReview(input));
  },

  async createPortfolio(input: MarketplacePortfolioInput): Promise<MarketplaceRepositoryResult<MarketplacePortfolio | undefined>> {
    return withMode(() => marketplaceDemoAdapter.createPortfolio(input), () => marketplaceSupabaseAdapter.createPortfolio(input));
  },

  getLinkedOrganization(companySlug: string) {
    if (companySlug === "atlas-construction") return organizationRepository.getById("atlas");
    if (companySlug === "northbuild-engineering") return organizationRepository.getById("northbuild");
    if (companySlug === "urbanform-architects") return organizationRepository.getById("urbanform");
    if (companySlug === "maghreb-logistics") return organizationRepository.getById("maghreb-logistics");
    return undefined;
  }
};
