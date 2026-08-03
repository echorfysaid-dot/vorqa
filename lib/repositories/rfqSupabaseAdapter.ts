import type { RFQ, RFQFilters, RFQInput } from "@/lib/models";
import { organizationRest } from "./organizationSupabaseRest";
import { filterRfqs, mapSupabaseRfqToDomain, summarizeRfqs, type SupabaseRfqRecord } from "./rfqMapper";

const rfqSelect = [
  "id",
  "owner_id",
  "organization_id",
  "project_id",
  "title",
  "description",
  "project_name",
  "category",
  "scope_of_work",
  "technical_requirements",
  "budget_range",
  "currency",
  "submission_deadline",
  "delivery_date",
  "priority",
  "visibility",
  "status",
  "attachments",
  "suppliers",
  "items",
  "metadata",
  "created_at",
  "updated_at"
].join(",");

async function loadRfqs() {
  const result = await organizationRest<SupabaseRfqRecord[]>(`/rfqs?select=${encodeURIComponent(rfqSelect)}&order=updated_at.desc`);
  if (result.error) return { data: [] as RFQ[], source: "supabase" as const, isFallback: false, error: result.error };
  return { data: (result.data || []).map(mapSupabaseRfqToDomain), source: "supabase" as const, isFallback: false };
}

function inputToSupabase(input: Partial<RFQInput>) {
  return {
    ...(input.organizationId !== undefined ? { organization_id: input.organizationId || null } : {}),
    ...(input.projectId !== undefined ? { project_id: input.projectId || null } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.project !== undefined ? { project_name: input.project || null } : {}),
    ...(input.category !== undefined ? { category: input.category || null } : {}),
    ...(input.scopeOfWork !== undefined ? { scope_of_work: input.scopeOfWork || null } : {}),
    ...(input.technicalRequirements !== undefined ? { technical_requirements: input.technicalRequirements || [] } : {}),
    ...(input.budgetRange !== undefined ? { budget_range: input.budgetRange || null } : {}),
    ...(input.currency !== undefined ? { currency: input.currency || "MAD" } : {}),
    ...(input.submissionDeadline !== undefined ? { submission_deadline: input.submissionDeadline || null } : {}),
    ...(input.deliveryDate !== undefined ? { delivery_date: input.deliveryDate || null } : {}),
    ...(input.priority !== undefined ? { priority: input.priority || "Medium" } : {}),
    ...(input.visibility !== undefined ? { visibility: input.visibility || "Invited Suppliers" } : {}),
    ...(input.attachments !== undefined ? { attachments: input.attachments || [] } : {}),
    ...(input.suppliers !== undefined ? { suppliers: input.suppliers || [] } : {}),
    ...(input.items !== undefined ? { items: input.items || [] } : {})
  };
}

export const rfqSupabaseAdapter = {
  async getRfqs(filters: RFQFilters = {}) {
    const result = await loadRfqs();
    if (result.error) return result;
    return { ...result, data: filterRfqs(result.data, filters) };
  },

  async getRfq(id: string) {
    const result = await organizationRest<SupabaseRfqRecord[]>(
      `/rfqs?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(rfqSelect)}&limit=1`
    );
    if (result.error) return { data: undefined as RFQ | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseRfqToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async createRfq(input: RFQInput) {
    const result = await organizationRest<SupabaseRfqRecord[]>("/rfqs", {
      method: "POST",
      body: JSON.stringify({ ...inputToSupabase(input), status: "draft" })
    });
    if (result.error) return { data: undefined as RFQ | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseRfqToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateRfq(id: string, input: Partial<RFQInput>) {
    const result = await organizationRest<SupabaseRfqRecord[]>(`/rfqs?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(inputToSupabase(input))
    });
    if (result.error) return { data: undefined as RFQ | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseRfqToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async getSummary() {
    const result = await loadRfqs();
    if (result.error) return { data: summarizeRfqs([]), source: "supabase" as const, isFallback: false, error: result.error };
    return { data: summarizeRfqs(result.data), source: "supabase" as const, isFallback: false };
  }
};
