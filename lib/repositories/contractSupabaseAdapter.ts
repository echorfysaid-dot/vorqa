import type { Contract, ContractFilters } from "@/lib/models";
import { organizationRest } from "./organizationSupabaseRest";
import { buildContractSummary, filterContracts, mapSupabaseContractToDomain, type SupabaseContractRecord } from "./contractMapper";

const contractSelect = [
  "id",
  "owner_id",
  "organization_id",
  "project_id",
  "rfq_id",
  "quotation_id",
  "supplier_id",
  "supplier_name",
  "supplier_slug",
  "contract_number",
  "title",
  "description",
  "contract_type",
  "status",
  "value_amount",
  "currency",
  "retention",
  "warranty",
  "start_date",
  "end_date",
  "milestones",
  "deliverables",
  "payments",
  "parties",
  "approvals",
  "amendments",
  "documents",
  "timeline",
  "activity",
  "insights",
  "metadata",
  "created_at",
  "updated_at"
].join(",");

async function loadContracts() {
  const result = await organizationRest<SupabaseContractRecord[]>(`/contracts?select=${encodeURIComponent(contractSelect)}&order=updated_at.desc`);
  if (result.error) return { data: [] as Contract[], source: "supabase" as const, isFallback: false, error: result.error };
  return { data: (result.data || []).map(mapSupabaseContractToDomain), source: "supabase" as const, isFallback: false };
}

export const contractSupabaseAdapter = {
  async getContracts(filters: ContractFilters = {}) {
    const result = await loadContracts();
    if (result.error) return result;
    return { ...result, data: filterContracts(result.data, filters) };
  },

  async getContract(id: string) {
    const result = await organizationRest<SupabaseContractRecord[]>(`/contracts?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(contractSelect)}&limit=1`);
    if (result.error) return { data: undefined as Contract | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseContractToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async getSummary() {
    const result = await loadContracts();
    if (result.error) return { data: buildContractSummary([]), source: "supabase" as const, isFallback: false, error: result.error };
    return { data: buildContractSummary(result.data), source: "supabase" as const, isFallback: false };
  }
};
