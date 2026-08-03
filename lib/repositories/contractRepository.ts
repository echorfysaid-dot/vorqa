import { getDataSourceMode, type DataSourceUsed } from "@/lib/data-source";
import type { Contract, ContractFilters, ContractSummary } from "@/lib/models";
import { contractDemoAdapter } from "./contractDemoAdapter";
import { contractSupabaseAdapter } from "./contractSupabaseAdapter";
import { cachedRepositoryCall } from "./repositoryCache";

export type DemoContract = Contract;

export type ContractRepositoryResult<T> = {
  data: T;
  source: DataSourceUsed;
  error?: string;
  isFallback: boolean;
};

async function withMode<T>(
  demo: () => ContractRepositoryResult<T> | Promise<ContractRepositoryResult<T>>,
  supabase: () => ContractRepositoryResult<T> | Promise<ContractRepositoryResult<T>>
): Promise<ContractRepositoryResult<T>> {
  const mode = getDataSourceMode();
  if (mode === "demo") return demo();
  const result = await supabase();
  if (mode === "supabase") return result;
  if (!result.error) return result;
  const fallback = await demo();
  return { ...fallback, source: "demo-fallback", isFallback: true, error: result.error };
}

export const contractRepository = {
  list(): Contract[] {
    return contractDemoAdapter.getContracts().data;
  },

  getById(id: string): Contract | undefined {
    return contractDemoAdapter.getContract(id).data;
  },

  getSummarySync(): ContractSummary {
    return contractDemoAdapter.getSummary().data;
  },

  async getContracts(filters: ContractFilters = {}): Promise<ContractRepositoryResult<Contract[]>> {
    return withMode(() => contractDemoAdapter.getContracts(filters), () => contractSupabaseAdapter.getContracts(filters));
  },

  async getContract(id: string): Promise<ContractRepositoryResult<Contract | undefined>> {
    return withMode(() => contractDemoAdapter.getContract(id), () => contractSupabaseAdapter.getContract(id));
  },

  async getSummary(): Promise<ContractRepositoryResult<ContractSummary>> {
    return cachedRepositoryCall("contracts:summary", 20_000, () => withMode(() => contractDemoAdapter.getSummary(), () => contractSupabaseAdapter.getSummary()));
  }
};
