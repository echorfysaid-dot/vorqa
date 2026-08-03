import type { Employee, EmployeeInput } from "@/lib/models";
import { isUuid, organizationRest } from "./organizationSupabaseRest";
import { organizationSupabaseAdapter } from "./organizationSupabaseAdapter";
import { departmentSupabaseAdapter } from "./departmentSupabaseAdapter";
import { mapEmployeeInputToSupabase, mapSupabaseEmployeeToDomain, type SupabaseEmployeeRecord } from "./employeeMapper";

async function resolveOrganizationId(organizationId: string) {
  if (isUuid(organizationId)) return organizationId;
  const organization = await organizationSupabaseAdapter.getOrganization(organizationId);
  return organization.data?.id;
}

async function departmentBelongsToOrganization(organizationId: string, departmentId?: string) {
  if (!departmentId) return true;
  const department = await departmentSupabaseAdapter.getDepartmentById(organizationId, departmentId);
  return Boolean(department.data);
}

const employeeSelect = "*,departments(id,name),profiles(id,email,full_name,avatar_url),manager:employees!employees_manager_id_fkey(id,first_name,last_name)";

export const employeeSupabaseAdapter = {
  async getEmployees(organizationId: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: [] as Employee[], source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const result = await organizationRest<SupabaseEmployeeRecord[]>(
      `/employees?organization_id=eq.${encodeURIComponent(resolvedId)}&select=${encodeURIComponent(employeeSelect)}&order=created_at.asc`
    );
    if (result.error) return { data: [] as Employee[], source: "supabase" as const, isFallback: false, error: result.error };
    return { data: (result.data || []).map(mapSupabaseEmployeeToDomain), source: "supabase" as const, isFallback: false };
  },

  async getEmployee(organizationId: string, employeeId: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: undefined as Employee | undefined, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const encodedEmployee = encodeURIComponent(employeeId);
    const filter = isUuid(employeeId) ? `id=eq.${encodedEmployee}` : `employee_number=eq.${encodedEmployee}`;
    const result = await organizationRest<SupabaseEmployeeRecord[]>(
      `/employees?organization_id=eq.${encodeURIComponent(resolvedId)}&${filter}&select=${encodeURIComponent(employeeSelect)}&limit=1`
    );
    if (result.error) return { data: undefined as Employee | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseEmployeeToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async employeeNumberExists(organizationId: string, employeeNumber: string, excludeId?: string) {
    const resolvedId = await resolveOrganizationId(organizationId);
    if (!resolvedId) return { data: false, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    const result = await organizationRest<Array<{ id: string }>>(
      `/employees?organization_id=eq.${encodeURIComponent(resolvedId)}&employee_number=eq.${encodeURIComponent(employeeNumber)}&select=id&limit=1`
    );
    if (result.error) return { data: false, source: "supabase" as const, isFallback: false, error: result.error };
    const match = result.data?.[0];
    return { data: Boolean(match && match.id !== excludeId), source: "supabase" as const, isFallback: false };
  },

  async createEmployee(input: EmployeeInput) {
    const resolvedId = await resolveOrganizationId(input.organizationId);
    if (!resolvedId) return { data: undefined as Employee | undefined, source: "supabase" as const, isFallback: false, error: "Organization not found." };
    if (!(await departmentBelongsToOrganization(resolvedId, input.departmentId))) {
      return { data: undefined as Employee | undefined, source: "supabase" as const, isFallback: false, error: "Department does not belong to this organization." };
    }
    const result = await organizationRest<SupabaseEmployeeRecord[]>("/employees", {
      method: "POST",
      body: JSON.stringify(mapEmployeeInputToSupabase({ ...input, organizationId: resolvedId }))
    });
    if (result.error) return { data: undefined as Employee | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseEmployeeToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async updateEmployee(employeeId: string, input: Partial<EmployeeInput>) {
    if (input.departmentId && input.organizationId && !(await departmentBelongsToOrganization(input.organizationId, input.departmentId))) {
      return { data: undefined as Employee | undefined, source: "supabase" as const, isFallback: false, error: "Department does not belong to this organization." };
    }
    const result = await organizationRest<SupabaseEmployeeRecord[]>(`/employees?id=eq.${encodeURIComponent(employeeId)}`, {
      method: "PATCH",
      body: JSON.stringify(mapEmployeeInputToSupabase(input))
    });
    if (result.error) return { data: undefined as Employee | undefined, source: "supabase" as const, isFallback: false, error: result.error };
    const record = result.data?.[0];
    return { data: record ? mapSupabaseEmployeeToDomain(record) : undefined, source: "supabase" as const, isFallback: false };
  },

  async archiveEmployee(employeeId: string) {
    const result = await this.updateEmployee(employeeId, { status: "Archived" });
    return {
      data: Boolean(result.data),
      source: "supabase" as const,
      isFallback: false,
      error: "error" in result ? result.error : undefined
    };
  }
};
