import type { Organization, OrganizationRole, OrganizationStatus, OrganizationType } from "@/lib/models";
import { demoOrganizations } from "@/lib/data";

export type DemoOrganization = (typeof demoOrganizations)[number];

export type SupabaseOrganizationRecord = {
  id: string;
  owner_id?: string;
  name?: string;
  slug?: string | null;
  legal_name?: string | null;
  registration_number?: string | null;
  tax_number?: string | null;
  logo?: string | null;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  address?: Record<string, unknown> | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  currency?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  company_size?: string | null;
  organization_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type OrganizationMutationInput = {
  name?: string;
  slug?: string;
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  website?: string;
  logo?: string;
  industry?: string;
  companySize?: string;
  organizationType?: OrganizationType;
  address?: Record<string, unknown>;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: OrganizationStatus;
};

function parseLocation(location: string) {
  const [city, country] = location.split(",").map((part) => part.trim());
  return { city, country };
}

function toOrganizationRole(role: string): OrganizationRole {
  if (role === "Owner" || role === "Admin" || role === "Member" || role === "Guest") return role;
  return "Member";
}

function toOrganizationStatus(status: string): OrganizationStatus {
  if (status === "Active" || status === "Pending invitation" || status === "Suspended organization" || status === "Archived") return status;
  if (status === "active") return "Active";
  if (status === "invited") return "Pending invitation";
  if (status === "suspended") return "Suspended organization";
  if (status === "archived") return "Archived";
  return "Active";
}

function toOrganizationType(value?: string | null): OrganizationType {
  if (value === "engineering_office" || value === "architecture_studio" || value === "supplier_company" || value === "real_estate_developer") return value;
  return "construction_company";
}

export function mapDemoOrganizationToDomain(organization: DemoOrganization): Organization {
  const parsed = parseLocation(organization.location);
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.id,
    legalName: organization.name,
    logo: organization.logo,
    industry: organization.industry,
    type: toOrganizationType(organization.industry),
    location: organization.location,
    city: parsed.city,
    country: parsed.country,
    timezone: "Africa/Casablanca",
    currency: "MAD",
    employees: organization.employees,
    activeProjects: organization.activeProjects,
    role: toOrganizationRole(organization.role),
    status: toOrganizationStatus(organization.status),
    workspace: organization.workspace,
    recentProjects: organization.recentProjects,
    teamSummary: organization.teamSummary
  };
}

export function mapSupabaseOrganizationToDomain(record: SupabaseOrganizationRecord): Organization {
  return {
    id: record.id,
    ownerId: record.owner_id,
    name: record.name || record.legal_name || "Untitled organization",
    slug: record.slug || undefined,
    legalName: record.legal_name || undefined,
    registrationNumber: record.registration_number || undefined,
    taxNumber: record.tax_number || undefined,
    logo: record.logo_url || record.logo || undefined,
    website: record.website || undefined,
    industry: record.industry || "Unspecified",
    location: record.location || [record.city, record.country].filter(Boolean).join(", ") || "Unspecified",
    city: record.city || undefined,
    country: record.country || undefined,
    timezone: record.timezone || undefined,
    currency: record.currency || undefined,
    contactEmail: record.contact_email || undefined,
    contactPhone: record.contact_phone || undefined,
    companySize: record.company_size || undefined,
    type: toOrganizationType(record.organization_type),
    employees: 0,
    activeProjects: 0,
    role: "Member",
    status: toOrganizationStatus(record.status || "active"),
    workspace: "Organization workspace",
    createdAt: record.created_at || undefined,
    updatedAt: record.updated_at || undefined
  };
}

function toDatabaseStatus(status?: OrganizationStatus) {
  if (status === "Archived") return "archived";
  if (status === "Pending invitation") return "invited";
  if (status === "Suspended organization") return "suspended";
  return "active";
}

export function mapOrganizationInputToSupabase(input: OrganizationMutationInput, ownerId?: string) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.legalName !== undefined ? { legal_name: input.legalName || null } : {}),
    ...(input.registrationNumber !== undefined ? { registration_number: input.registrationNumber || null } : {}),
    ...(input.taxNumber !== undefined ? { tax_number: input.taxNumber || null } : {}),
    ...(input.website !== undefined ? { website: input.website || null } : {}),
    ...(input.logo !== undefined ? { logo_url: input.logo || null } : {}),
    ...(input.industry !== undefined ? { industry: input.industry || null } : {}),
    ...(input.companySize !== undefined ? { company_size: input.companySize || null } : {}),
    ...(input.organizationType !== undefined ? { organization_type: input.organizationType } : {}),
    ...(input.address !== undefined ? { address: input.address } : {}),
    ...(input.city !== undefined ? { city: input.city || null } : {}),
    ...(input.country !== undefined ? { country: input.country || null } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone || "Africa/Casablanca" } : {}),
    ...(input.currency !== undefined ? { currency: input.currency || "MAD" } : {}),
    ...(input.contactEmail !== undefined ? { contact_email: input.contactEmail || null } : {}),
    ...(input.contactPhone !== undefined ? { contact_phone: input.contactPhone || null } : {}),
    ...(input.status !== undefined ? { status: toDatabaseStatus(input.status) } : {}),
    ...(ownerId ? { owner_id: ownerId } : {})
  };
}
