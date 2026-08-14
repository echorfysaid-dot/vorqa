"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Building2, BriefcaseBusiness, FolderKanban, Mail, Phone, Plus, Save, ShieldCheck, Trash2, UserPlus, UsersRound } from "lucide-react";
import { Badge, Button, Dropdown, EmptyState, GlassCard, Input, ProgressBar, Tabs } from "@/components/ui";
import { useOrganizationMembersRepository, useOrganizationRepository, useOrganizationRolesRepository } from "@/lib/repositories/organizationHooks";
import { useDepartmentsRepository } from "@/lib/repositories/departmentHooks";
import { useEmployeesRepository } from "@/lib/repositories/employeeHooks";
import { departmentRepository, employeeRepository, organizationMemberRepository, organizationRepository, organizationRoleRepository } from "@/lib/repositories";
import type { Department, DepartmentInput, DepartmentStatus, Employee, EmployeeInput, EmployeeStatus, Organization, OrganizationMember, OrganizationMemberStatus, OrganizationPermissions, OrganizationRoleInput, OrganizationRoleRecord } from "@/lib/models";
import type { OrganizationMutationInput } from "@/lib/repositories/organizationMapper";
import { organizationPermissionLabels, supportedOrganizationPermissions } from "@/lib/repositories/organizationRoleMapper";
import { slugifyDepartment } from "@/lib/repositories/departmentMapper";
import { AutoLocalizedContent } from "@/components/auto-localized-content";
import { useI18n } from "@/components/i18n-provider";
import { formatDate } from "@/lib/utils/format";

const statusOptions = ["Active", "Suspended organization", "Archived"];
const departmentStatusOptions: DepartmentStatus[] = ["Active", "Suspended", "Archived"];
const employeeStatusOptions: EmployeeStatus[] = ["Active", "Away", "Pending", "Inactive", "Archived"];
const employmentTypeOptions = ["Full-time", "Part-time", "Contractor", "Consultant", "Temporary"];
const memberStatusOptions: OrganizationMemberStatus[] = ["Active", "Pending invitation", "Suspended", "Removed"];
const timezoneOptions = ["Africa/Casablanca", "Europe/Paris", "UTC"];
const currencyOptions = ["MAD", "EUR", "USD"];
const tabs = [
  { value: "overview", label: "Overview" },
  { value: "projects", label: "Projects" },
  { value: "team", label: "Team" },
  { value: "activity", label: "Activity" },
  { value: "settings", label: "Settings" }
];

const teamSections = [
  { value: "members", label: "Members" },
  { value: "employees", label: "Employees" },
  { value: "departments", label: "Departments" },
  { value: "roles", label: "Roles & Permissions" }
];

export default function OrganizationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const organizationId = decodeURIComponent(params.id);
  const { data: organization, loading, error, isFallback, source } = useOrganizationRepository(organizationId);
  const membersState = useOrganizationMembersRepository(organization?.id || organizationId);
  const rolesState = useOrganizationRolesRepository(organization?.id || organizationId);
  const departmentsState = useDepartmentsRepository(organization?.id || organizationId);
  const employeesState = useEmployeesRepository(organization?.id || organizationId);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeTeamSection, setActiveTeamSection] = useState("members");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<OrganizationMutationInput>({});
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<OrganizationRoleRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [departmentStatus, setDepartmentStatus] = useState("All");
  const [departmentForm, setDepartmentForm] = useState<DepartmentInput>({
    organizationId,
    name: "",
    slug: "",
    description: "",
    leadUserId: "",
    status: "Active"
  });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeStatus, setEmployeeStatus] = useState("All");
  const [employeeDepartment, setEmployeeDepartment] = useState("All");
  const [employeeJobTitle, setEmployeeJobTitle] = useState("All");
  const [employeeForm, setEmployeeForm] = useState<EmployeeInput>({
    organizationId,
    firstName: "",
    lastName: "",
    employeeNumber: "",
    departmentId: "",
    managerId: "",
    jobTitle: "",
    phone: "",
    email: "",
    employmentType: "Full-time",
    status: "Active"
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatus, setMemberStatus] = useState("All");
  const [memberRole, setMemberRole] = useState("All");
  const [newMember, setNewMember] = useState({ userId: "", roleId: "", status: "Active" as OrganizationMemberStatus });
  const [roleForm, setRoleForm] = useState<OrganizationRoleInput>({
    organizationId,
    name: "",
    description: "",
    permissions: {}
  });

  useEffect(() => setMembers(membersState.data), [membersState.data]);
  useEffect(() => setRoles(rolesState.data), [rolesState.data]);
  useEffect(() => setDepartments(departmentsState.data), [departmentsState.data]);
  useEffect(() => setEmployees(employeesState.data), [employeesState.data]);
  useEffect(() => {
    if (organization) {
      setRoleForm((current) => ({ ...current, organizationId: organization.id }));
      setDepartmentForm((current) => ({ ...current, organizationId: organization.id }));
      setEmployeeForm((current) => ({ ...current, organizationId: organization.id }));
    }
  }, [organization]);

  const canManage = organization?.role === "Owner" || organization?.role === "Admin";
  const canManageMembers = canManage;
  const canManageRoles = canManage;
  const archived = organization?.status === "Archived";
  const editValue = useMemo(() => ({
    logo: form.logo ?? organization?.logo ?? "",
    website: form.website ?? organization?.website ?? "",
    contactEmail: form.contactEmail ?? organization?.contactEmail ?? "",
    contactPhone: form.contactPhone ?? organization?.contactPhone ?? "",
    timezone: form.timezone ?? organization?.timezone ?? "Africa/Casablanca",
    currency: form.currency ?? organization?.currency ?? "MAD",
    status: form.status ?? organization?.status ?? "Active",
    addressText: typeof form.address?.line1 === "string" ? form.address.line1 : ""
  }), [form, organization]);

  const filteredMembers = members.filter((member) => {
    const searchTarget = [member.fullName, member.email, member.userId, member.roleName].filter(Boolean).join(" ").toLowerCase();
    return (
      searchTarget.includes(memberSearch.toLowerCase()) &&
      (memberStatus === "All" || member.status === memberStatus) &&
      (memberRole === "All" || member.roleId === memberRole)
    );
  });

  const filteredDepartments = departments.filter((department) => {
    const searchTarget = [department.name, department.description, department.leadName, department.lead, department.slug].filter(Boolean).join(" ").toLowerCase();
    return searchTarget.includes(departmentSearch.toLowerCase()) && (departmentStatus === "All" || department.status === departmentStatus);
  });

  const filteredEmployees = employees.filter((employee) => {
    const searchTarget = [employee.fullName, employee.name, employee.email, employee.phone, employee.employeeNumber, employee.jobTitle, employee.departmentName, employee.department].filter(Boolean).join(" ").toLowerCase();
    return (
      searchTarget.includes(employeeSearch.toLowerCase()) &&
      (employeeStatus === "All" || employee.status === employeeStatus) &&
      (employeeDepartment === "All" || employee.departmentId === employeeDepartment || employee.department === employeeDepartment) &&
      (employeeJobTitle === "All" || employee.jobTitle === employeeJobTitle || employee.role === employeeJobTitle)
    );
  });

  function update<K extends keyof OrganizationMutationInput>(key: K, value: OrganizationMutationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!organization) return;
    setSaving(true);
    setMessage("");
    const result = await organizationRepository.updateOrganization(organization.slug || organization.id, form);
    setSaving(false);
    const resultError = "error" in result ? result.error : "";
    if (resultError) return setMessage(toFriendlyError(resultError));
    setMessage(result.isFallback ? "Demo update preview saved. Demo mode does not persist changes." : "Organization updated successfully.");
    setEditing(false);
  }

  async function archiveOrganization() {
    if (!organization) return;
    const confirmed = window.confirm("Archive this organization? This is a soft delete when supported.");
    if (!confirmed) return;
    setDeleting(true);
    setMessage("");
    const result = await organizationRepository.deleteOrganization(organization.slug || organization.id);
    setDeleting(false);
    const resultError = "error" in result ? result.error : "";
    if (resultError) return setMessage(toFriendlyError(resultError));
    router.push("/organizations");
  }

  async function createRole() {
    if (!organization || !roleForm.name.trim()) return setMessage("Role name is required.");
    const result = await organizationRoleRepository.createOrganizationRole({ ...roleForm, organizationId: organization.id, name: roleForm.name.trim() });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to create role."));
    setRoles((current) => [result.data!, ...current]);
    setRoleForm({ organizationId: organization.id, name: "", description: "", permissions: {} });
    setMessage(result.isFallback ? "Demo role preview created. Demo mode does not persist changes." : "Role created successfully.");
  }

  async function updateRole(role: OrganizationRoleRecord) {
    const result = await organizationRoleRepository.updateOrganizationRole(role.id, {
      organizationId: role.organizationId,
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to update role."));
    setRoles((current) => current.map((item) => (item.id === role.id ? result.data! : item)));
    setMessage(result.isFallback ? "Demo role update preview saved." : "Role updated successfully.");
  }

  async function deleteRole(role: OrganizationRoleRecord) {
    if (role.isBuiltIn || (role.assignedMemberCount || 0) > 0) return setMessage("Built-in or assigned roles cannot be deleted.");
    if (!window.confirm(`Delete ${role.name}?`)) return;
    const result = await organizationRoleRepository.deleteOrganizationRole(role.id);
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to delete role."));
    setRoles((current) => current.filter((item) => item.id !== role.id));
    setMessage(result.isFallback ? "Demo role deletion preview completed." : "Role deleted successfully.");
  }

  async function addMember() {
    if (!organization || !newMember.userId.trim()) return setMessage("Existing profile/user ID is required.");
    const result = await organizationMemberRepository.addOrganizationMember({
      organizationId: organization.id,
      userId: newMember.userId.trim(),
      roleId: newMember.roleId || undefined,
      status: newMember.status
    });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to add member."));
    setMembers((current) => [result.data!, ...current]);
    setNewMember({ userId: "", roleId: "", status: "Active" });
    setMessage(result.isFallback ? "Demo member preview added. Demo mode does not persist changes." : "Member added successfully.");
  }

  async function updateMember(member: OrganizationMember, patch: Partial<OrganizationMember>) {
    if (member.roleName === "Owner") return setMessage("Owner membership cannot be modified here.");
    const result = await organizationMemberRepository.updateOrganizationMember(member.id, {
      organizationId: member.organizationId,
      roleId: patch.roleId ?? member.roleId,
      status: patch.status ?? member.status
    });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to update member."));
    setMembers((current) => current.map((item) => (item.id === member.id ? result.data! : item)));
    setMessage(result.isFallback ? "Demo member update preview saved." : "Member updated successfully.");
  }

  async function removeMember(member: OrganizationMember) {
    if (member.roleName === "Owner") return setMessage("Owner membership cannot be removed.");
    if (!window.confirm(`Remove ${member.fullName || member.email || member.userId}?`)) return;
    const result = await organizationMemberRepository.removeOrganizationMember(member.id);
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to remove member."));
    setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, status: "Removed" } : item)));
    setMessage(result.isFallback ? "Demo member removal preview completed." : "Member removed successfully.");
  }

  async function createDepartment() {
    if (!organization) return;
    if (archived) return setMessage("Archived organizations cannot create departments.");
    const slug = departmentForm.slug || slugifyDepartment(departmentForm.name);
    if (!departmentForm.name.trim()) return setMessage("Department name is required.");
    if (!slug) return setMessage("Department slug is required.");
    if (!/^[a-z0-9-]{3,64}$/.test(slug)) return setMessage("Department slug must use 3-64 lowercase letters, numbers, or hyphens.");
    const duplicate = await departmentRepository.slugExists(organization.id, slug);
    if (duplicate.data) return setMessage("This department slug is already used inside the organization.");
    if ("error" in duplicate && duplicate.error) return setMessage(toFriendlyError(duplicate.error));

    const result = await departmentRepository.createDepartment({ ...departmentForm, organizationId: organization.id, slug, name: departmentForm.name.trim() });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to create department."));
    setDepartments((current) => [result.data!, ...current]);
    setDepartmentForm({ organizationId: organization.id, name: "", slug: "", description: "", leadUserId: "", status: "Active" });
    setMessage(result.isFallback ? "Demo department preview created. Demo mode does not persist changes." : "Department created successfully.");
  }

  async function updateDepartment(department: Department) {
    const result = await departmentRepository.updateDepartment(department.id, {
      organizationId: organization?.id || department.organizationId || organizationId,
      name: department.name,
      slug: department.slug || slugifyDepartment(department.name),
      description: department.description,
      leadUserId: department.leadUserId,
      status: department.status as DepartmentStatus,
      metadata: department.metadata
    });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to update department."));
    setDepartments((current) => current.map((item) => (item.id === department.id ? result.data! : item)));
    setMessage(result.isFallback ? "Demo department update preview saved." : "Department updated successfully.");
  }

  async function archiveDepartment(department: Department) {
    if (!window.confirm(`Archive ${department.name}?`)) return;
    const result = await departmentRepository.archiveDepartment(department.id);
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to archive department."));
    setDepartments((current) => current.map((item) => (item.id === department.id ? { ...item, status: "Archived" } : item)));
    setMessage(result.isFallback ? "Demo department archive preview completed." : "Department archived successfully.");
  }

  async function createEmployee() {
    if (!organization) return;
    if (archived) return setMessage("Archived organizations cannot create employees.");
    if (!employeeForm.firstName.trim() || !employeeForm.lastName.trim()) return setMessage("First and last name are required.");
    if (employeeForm.employeeNumber) {
      const duplicate = await employeeRepository.employeeNumberExists(organization.id, employeeForm.employeeNumber);
      if (duplicate.data) return setMessage("This employee number already exists inside the organization.");
      if ("error" in duplicate && duplicate.error) return setMessage(toFriendlyError(duplicate.error));
    }
    if (employeeForm.departmentId && !departments.some((department) => department.id === employeeForm.departmentId)) {
      return setMessage("Selected department does not belong to this organization.");
    }

    const result = await employeeRepository.createEmployee({ ...employeeForm, organizationId: organization.id });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to create employee."));
    setEmployees((current) => [result.data!, ...current]);
    setEmployeeForm({
      organizationId: organization.id,
      firstName: "",
      lastName: "",
      employeeNumber: "",
      departmentId: "",
      managerId: "",
      jobTitle: "",
      phone: "",
      email: "",
      employmentType: "Full-time",
      status: "Active"
    });
    setMessage(result.isFallback ? "Demo employee preview created. Demo mode does not persist changes." : "Employee created successfully.");
  }

  async function updateEmployee(employee: Employee) {
    if (employee.departmentId && !departments.some((department) => department.id === employee.departmentId)) {
      return setMessage("Selected department does not belong to this organization.");
    }
    const result = await employeeRepository.updateEmployee(employee.id, {
      organizationId: organization?.id || employee.organizationId || organizationId,
      departmentId: employee.departmentId,
      managerId: employee.managerId,
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName || employee.name,
      lastName: employee.lastName || "",
      jobTitle: employee.jobTitle || String(employee.role || ""),
      phone: employee.phone,
      employmentType: employee.employmentType,
      status: employee.status as EmployeeStatus,
      hireDate: employee.hireDate,
      avatarUrl: employee.avatarUrl,
      metadata: employee.metadata
    });
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to update employee."));
    setEmployees((current) => current.map((item) => (item.id === employee.id ? result.data! : item)));
    setMessage(result.isFallback ? "Demo employee update preview saved." : "Employee updated successfully.");
  }

  async function archiveEmployee(employee: Employee) {
    if (!window.confirm(`Archive ${employee.fullName || employee.name}?`)) return;
    const result = await employeeRepository.archiveEmployee(employee.id);
    const resultError = "error" in result ? result.error : "";
    if (resultError || !result.data) return setMessage(toFriendlyError(resultError || "Unable to archive employee."));
    setEmployees((current) => current.map((item) => (item.id === employee.id ? { ...item, status: "Archived" } : item)));
    setMessage(result.isFallback ? "Demo employee archive preview completed." : "Employee archived successfully.");
  }

  if (loading) {
    return (<AutoLocalizedContent>
      <div className="space-y-6">
        <GlassCard className="h-72 animate-pulse p-6"><span className="sr-only">Loading organization</span></GlassCard>
        <GlassCard className="h-96 animate-pulse p-6"><span className="sr-only">Loading organization details</span></GlassCard>
      </div>
    </AutoLocalizedContent>);
  }

  if (!organization) {
    return (<AutoLocalizedContent>
      <GlassCard className="p-6">
        <Link href="/organizations" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-gold hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to organizations
        </Link>
        <h1 className="text-3xl font-black text-white">Organization not found</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ds-text/58">
          {error || "This organization is not available for the current data source or account."}
        </p>
      </GlassCard>
    </AutoLocalizedContent>);
  }

  return (<AutoLocalizedContent>
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="border-b border-ds-token-border pb-5">
        <Link href="/organizations" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ds-token-muted hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> Back to organizations
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-ds-md border border-ds-token-gold/25 bg-ds-token-gold/10 text-lg font-bold text-gold">
              {organization.logo || organization.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-ds-token-text sm:text-3xl">{organization.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={organization.status === "Active" ? "success" : organization.status === "Archived" ? "neutral" : "warning"}>{organization.status}</Badge>
                <Badge tone={organization.role === "Owner" ? "gold" : organization.role === "Admin" ? "blue" : "neutral"}>{organization.role}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { setActiveTab("team"); setActiveTeamSection("members"); }} icon={<UsersRound className="h-4 w-4" />}>Members</Button>
            <Button variant="danger" onClick={archiveOrganization} disabled={!canManage || deleting || archived} icon={<Trash2 className="h-4 w-4" />}>{deleting ? "Archiving..." : "Archive"}</Button>
          </div>
        </div>
        {isFallback && <p className="mt-4 text-sm font-bold text-ds-text/50">Demo fallback is active because production organization data is unavailable.</p>}
        {archived && <p className="mt-4 rounded-2xl border border-[#FFB020]/20 bg-[#FFB020]/10 p-3 text-sm font-bold text-[#FFD28A]">This organization is archived. Management actions are disabled by default.</p>}
      </header>

      <div className="overflow-x-auto pb-1"><Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} /></div>
      {message && <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm font-bold text-ds-text/68">{message}</p>}

      {activeTab === "overview" && <OverviewSection organization={organization} />}
      {activeTab === "projects" && (
        <GlassCard className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-semibold text-ds-token-text">Active projects</h2></div>
            <Link href="/projects"><Button icon={<FolderKanban className="h-4 w-4" />}>Open projects</Button></Link>
          </div>
        </GlassCard>
      )}
      {activeTab === "activity" && <EmptyState title="Recent activity" description="No data available" />}
      {activeTab === "team" && <div className="space-y-5">
        <div className="flex flex-wrap gap-2 border-b border-ds-token-border pb-3">
          {teamSections.map((section) => <Button key={section.value} size="sm" variant={activeTeamSection === section.value ? "primary" : "ghost"} onClick={() => setActiveTeamSection(section.value)}>{section.label}</Button>)}
        </div>
      {activeTeamSection === "departments" && (
        <DepartmentsSection
          loading={departmentsState.loading}
          error={departmentsState.error}
          departments={filteredDepartments}
          allDepartments={departments}
          canManage={canManage && !archived}
          departmentSearch={departmentSearch}
          setDepartmentSearch={setDepartmentSearch}
          departmentStatus={departmentStatus}
          setDepartmentStatus={setDepartmentStatus}
          departmentForm={departmentForm}
          setDepartmentForm={setDepartmentForm}
          createDepartment={createDepartment}
          updateDepartment={updateDepartment}
          archiveDepartment={archiveDepartment}
        />
      )}
      {activeTeamSection === "employees" && (
        <EmployeesSection
          loading={employeesState.loading}
          error={employeesState.error}
          employees={filteredEmployees}
          allEmployees={employees}
          departments={departments}
          canManage={canManage && !archived}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          employeeStatus={employeeStatus}
          setEmployeeStatus={setEmployeeStatus}
          employeeDepartment={employeeDepartment}
          setEmployeeDepartment={setEmployeeDepartment}
          employeeJobTitle={employeeJobTitle}
          setEmployeeJobTitle={setEmployeeJobTitle}
          employeeForm={employeeForm}
          setEmployeeForm={setEmployeeForm}
          createEmployee={createEmployee}
          updateEmployee={updateEmployee}
          archiveEmployee={archiveEmployee}
        />
      )}
      {activeTeamSection === "members" && (
        <MembersSection
          loading={membersState.loading}
          error={membersState.error}
          members={filteredMembers}
          roles={roles}
          allMembers={members}
          canManage={canManageMembers && !archived}
          memberSearch={memberSearch}
          setMemberSearch={setMemberSearch}
          memberStatus={memberStatus}
          setMemberStatus={setMemberStatus}
          memberRole={memberRole}
          setMemberRole={setMemberRole}
          newMember={newMember}
          setNewMember={setNewMember}
          addMember={addMember}
          updateMember={updateMember}
          removeMember={removeMember}
        />
      )}
      {activeTeamSection === "roles" && (
        <RolesSection
          loading={rolesState.loading}
          error={rolesState.error}
          roles={roles}
          canManage={canManageRoles && !archived}
          roleForm={roleForm}
          setRoleForm={setRoleForm}
          createRole={createRole}
          updateRole={updateRole}
          deleteRole={deleteRole}
        />
      )}
      </div>}
      {activeTab === "settings" && (
        <SettingsSection
          organization={organization}
          canManage={canManage && !archived}
          editing={editing}
          setEditing={setEditing}
          saving={saving}
          save={save}
          editValue={editValue}
          update={update}
        />
      )}
    </div>
  </AutoLocalizedContent>);
}

function OverviewSection({ organization }: { organization: Organization }) {
  return (<AutoLocalizedContent>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <GlassCard className="p-5">
        <h2 className="text-lg font-semibold text-ds-token-text">Company Profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoCard label="Legal name" value={organization.legalName || organization.name} />
          <InfoCard label="Contact email" value={organization.contactEmail || "-"} />
          <InfoCard label="Status" value={organization.status} />
          <InfoCard label="Active projects" value={String(organization.activeProjects)} />
        </div>
      </GlassCard>

      <div className="space-y-5">
        <GlassCard className="p-5">
          <h2 className="text-lg font-semibold text-ds-token-text">Next step</h2>
          <Link href="/projects" className="mt-4 inline-flex"><Button size="sm" icon={<FolderKanban className="h-4 w-4" />}>Open projects</Button></Link>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-gold" /><h2 className="text-lg font-semibold text-ds-token-text">Recent activity</h2></div>
          <p className="mt-3 text-sm leading-6 text-ds-token-muted">No data available</p>
        </GlassCard>
      </div>
    </div>
  </AutoLocalizedContent>);
}

function EmployeesSection(props: {
  loading: boolean;
  error?: string;
  employees: Employee[];
  allEmployees: Employee[];
  departments: Department[];
  canManage: boolean;
  employeeSearch: string;
  setEmployeeSearch: (value: string) => void;
  employeeStatus: string;
  setEmployeeStatus: (value: string) => void;
  employeeDepartment: string;
  setEmployeeDepartment: (value: string) => void;
  employeeJobTitle: string;
  setEmployeeJobTitle: (value: string) => void;
  employeeForm: EmployeeInput;
  setEmployeeForm: React.Dispatch<React.SetStateAction<EmployeeInput>>;
  createEmployee: () => void;
  updateEmployee: (employee: Employee) => void;
  archiveEmployee: (employee: Employee) => void;
}) {
  if (props.loading) return (<AutoLocalizedContent><GlassCard className="h-80 animate-pulse p-5"><span className="sr-only">Loading employees</span></GlassCard></AutoLocalizedContent>);
  const activeCount = props.allEmployees.filter((employee) => employee.status === "Active").length;
  const jobTitles = Array.from(new Set(props.allEmployees.map((employee) => employee.jobTitle || String(employee.role)).filter(Boolean)));
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge tone="blue">Organization employees</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">Employee directory.</h2>
            <p className="mt-2 text-sm leading-7 text-ds-text/58">Employees are organization-scoped, optionally linked to departments and user profiles.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[720px] xl:grid-cols-4">
            <SearchInput value={props.employeeSearch} onChange={props.setEmployeeSearch} placeholder="Search employees..." />
            <Dropdown label="Status" value={props.employeeStatus} options={["All", ...employeeStatusOptions]} onChange={props.setEmployeeStatus} />
            <Dropdown label="Department" value={props.employeeDepartment} options={["All", ...props.departments.map((department) => department.id)]} onChange={props.setEmployeeDepartment} />
            <Dropdown label="Job title" value={props.employeeJobTitle} options={["All", ...jobTitles]} onChange={props.setEmployeeJobTitle} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoCard label="Total employees" value={String(props.allEmployees.length)} />
          <InfoCard label="Active employees" value={String(activeCount)} />
          <InfoCard label="Departments available" value={String(props.departments.length)} />
        </div>
        {props.error && <p className="mt-4 rounded-2xl border border-[#FFB020]/20 bg-[#FFB020]/10 p-3 text-sm font-bold text-[#FFD28A]">{toFriendlyError(props.error)}</p>}
      </GlassCard>

      {props.canManage && (
        <GlassCard className="p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <Input label="First name" value={props.employeeForm.firstName} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, firstName: event.target.value }))} />
            <Input label="Last name" value={props.employeeForm.lastName} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, lastName: event.target.value }))} />
            <Input label="Employee number" value={props.employeeForm.employeeNumber || ""} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, employeeNumber: event.target.value }))} />
            <Dropdown label="Department" value={props.employeeForm.departmentId} options={["", ...props.departments.map((department) => department.id)]} onChange={(value) => props.setEmployeeForm((current) => ({ ...current, departmentId: value }))} />
            <Input label="Job title" value={props.employeeForm.jobTitle || ""} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, jobTitle: event.target.value }))} />
            <Input label="Phone" value={props.employeeForm.phone || ""} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, phone: event.target.value }))} />
            <Input label="Linked profile ID" value={props.employeeForm.profileId || ""} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, profileId: event.target.value }))} />
            <Input label="Manager employee ID" value={props.employeeForm.managerId || ""} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, managerId: event.target.value }))} />
            <Dropdown label="Employment type" value={props.employeeForm.employmentType} options={employmentTypeOptions} onChange={(value) => props.setEmployeeForm((current) => ({ ...current, employmentType: value }))} />
            <Dropdown label="Status" value={props.employeeForm.status} options={employeeStatusOptions} onChange={(value) => props.setEmployeeForm((current) => ({ ...current, status: value as EmployeeStatus }))} />
            <Input label="Email note" value={props.employeeForm.email || ""} onChange={(event) => props.setEmployeeForm((current) => ({ ...current, email: event.target.value }))} />
            <div className="flex items-end"><Button onClick={props.createEmployee} icon={<Plus className="h-4 w-4" />}>Create employee</Button></div>
          </div>
        </GlassCard>
      )}

      {!props.employees.length ? (
        <EmptyState title="No employees found" description={props.allEmployees.length ? "Adjust search or filters to see employees." : "Employees will appear here once they exist for this organization."} />
      ) : (
        <div className="grid gap-4">
          {props.employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} departments={props.departments} canManage={props.canManage} updateEmployee={props.updateEmployee} archiveEmployee={props.archiveEmployee} />
          ))}
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}

function EmployeeCard({ employee, departments, canManage, updateEmployee, archiveEmployee }: { employee: Employee; departments: Department[]; canManage: boolean; updateEmployee: (employee: Employee) => void; archiveEmployee: (employee: Employee) => void }) {
  const [draft, setDraft] = useState(employee);
  useEffect(() => setDraft(employee), [employee]);
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 font-black text-gold">
            {(draft.fullName || draft.name).split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-black text-white">{draft.fullName || draft.name}</h3>
              <Badge tone={draft.status === "Active" ? "success" : draft.status === "Archived" ? "neutral" : "warning"}>{draft.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-ds-text/58">{draft.jobTitle || draft.role} - {draft.departmentName || draft.department}</p>
            <div className="mt-3 grid gap-2 text-sm text-ds-text/56 sm:grid-cols-2">
              <span>{draft.email || "No linked profile email"}</span>
              <span>{draft.phone || "No phone"}</span>
              <span>Manager: {draft.managerName || draft.managerId || "Unassigned"}</span>
              <span>Employee no: {draft.employeeNumber || "-"}</span>
            </div>
          </div>
        </div>
        <div>
          <ProgressBar value={draft.workload || 0} label="Workload" tone={(draft.workload || 0) > 80 ? "warning" : "blue"} />
          <p className="mt-3 text-sm font-bold text-ds-text/50">Active projects: {draft.activeProjects ?? 0}</p>
        </div>
      </div>

      {canManage && (
        <div className="mt-5 grid gap-3 border-t border-white/10 pt-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Dropdown label="Department" value={draft.departmentId || ""} options={["", ...departments.map((department) => department.id)]} onChange={(value) => setDraft((current) => ({ ...current, departmentId: value }))} />
            <Input label="Job title" value={draft.jobTitle || String(draft.role || "")} onChange={(event) => setDraft((current) => ({ ...current, jobTitle: event.target.value, role: event.target.value }))} />
            <Input label="Phone" value={draft.phone || ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />
            <Input label="Manager employee ID" value={draft.managerId || ""} onChange={(event) => setDraft((current) => ({ ...current, managerId: event.target.value }))} />
            <Dropdown label="Employment type" value={draft.employmentType || "Full-time"} options={employmentTypeOptions} onChange={(value) => setDraft((current) => ({ ...current, employmentType: value }))} />
            <Dropdown label="Status" value={draft.status} options={employeeStatusOptions} onChange={(value) => setDraft((current) => ({ ...current, status: value as EmployeeStatus }))} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => updateEmployee(draft)}>Save employee</Button>
            <Button size="sm" variant="danger" disabled={draft.status === "Archived"} onClick={() => archiveEmployee(draft)}>Archive</Button>
          </div>
        </div>
      )}
    </GlassCard>
  </AutoLocalizedContent>);
}

function DepartmentsSection(props: {
  loading: boolean;
  error?: string;
  departments: Department[];
  allDepartments: Department[];
  canManage: boolean;
  departmentSearch: string;
  setDepartmentSearch: (value: string) => void;
  departmentStatus: string;
  setDepartmentStatus: (value: string) => void;
  departmentForm: DepartmentInput;
  setDepartmentForm: React.Dispatch<React.SetStateAction<DepartmentInput>>;
  createDepartment: () => void;
  updateDepartment: (department: Department) => void;
  archiveDepartment: (department: Department) => void;
}) {
  if (props.loading) return (<AutoLocalizedContent><GlassCard className="h-80 animate-pulse p-5"><span className="sr-only">Loading departments</span></GlassCard></AutoLocalizedContent>);
  const activeCount = props.allDepartments.filter((department) => department.status !== "Archived").length;
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="gold">Organization departments</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">Departments foundation.</h2>
            <p className="mt-2 text-sm leading-7 text-ds-text/58">Production departments are scoped to the current organization and secured by organization RLS.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
            <SearchInput value={props.departmentSearch} onChange={props.setDepartmentSearch} placeholder="Search departments..." />
            <Dropdown label="Status" value={props.departmentStatus} options={["All", ...departmentStatusOptions]} onChange={props.setDepartmentStatus} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoCard label="Total departments" value={String(props.allDepartments.length)} />
          <InfoCard label="Active departments" value={String(activeCount)} />
          <InfoCard label="Aggregate source" value="Repository" />
        </div>
        {props.error && <p className="mt-4 rounded-2xl border border-[#FFB020]/20 bg-[#FFB020]/10 p-3 text-sm font-bold text-[#FFD28A]">{toFriendlyError(props.error)}</p>}
      </GlassCard>

      {props.canManage && (
        <GlassCard className="p-5">
          <div className="grid gap-4 lg:grid-cols-[220px_220px_minmax(0,1fr)]">
            <Input
              label="Department name"
              value={props.departmentForm.name}
              onChange={(event) => {
                const name = event.target.value;
                props.setDepartmentForm((current) => ({ ...current, name, slug: current.slug || slugifyDepartment(name) }));
              }}
            />
            <Input label="Slug" value={props.departmentForm.slug} onChange={(event) => props.setDepartmentForm((current) => ({ ...current, slug: slugifyDepartment(event.target.value) }))} />
            <Input label="Description" value={props.departmentForm.description || ""} onChange={(event) => props.setDepartmentForm((current) => ({ ...current, description: event.target.value }))} />
            <Input label="Lead profile/user ID" value={props.departmentForm.leadUserId || ""} onChange={(event) => props.setDepartmentForm((current) => ({ ...current, leadUserId: event.target.value }))} />
            <Dropdown label="Status" value={props.departmentForm.status} options={departmentStatusOptions} onChange={(value) => props.setDepartmentForm((current) => ({ ...current, status: value as DepartmentStatus }))} />
            <div className="flex items-end"><Button onClick={props.createDepartment} icon={<Plus className="h-4 w-4" />}>Create department</Button></div>
          </div>
        </GlassCard>
      )}

      {!props.departments.length ? (
        <EmptyState title="No departments found" description={props.allDepartments.length ? "Adjust search or filters to see departments." : "Departments will appear here once they exist for this organization."} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {props.departments.map((department) => (
            <DepartmentCard key={department.id} department={department} canManage={props.canManage} updateDepartment={props.updateDepartment} archiveDepartment={props.archiveDepartment} />
          ))}
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}

function DepartmentCard({ department, canManage, updateDepartment, archiveDepartment }: { department: Department; canManage: boolean; updateDepartment: (department: Department) => void; archiveDepartment: (department: Department) => void }) {
  const { locale } = useI18n();
  const [draft, setDraft] = useState(department);
  useEffect(() => setDraft(department), [department]);
  const workload = draft.workload || 0;
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={draft.status === "Active" || draft.status === "Healthy" ? "success" : draft.status === "Archived" ? "neutral" : "warning"}>{draft.status}</Badge>
          <h3 className="mt-3 truncate text-xl font-black text-white">{draft.name}</h3>
          <p className="mt-2 text-sm leading-7 text-ds-text/58">{draft.description || "No description provided."}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 font-black text-gold">
          {draft.name.slice(0, 2).toUpperCase()}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoCard label="Lead" value={draft.leadName || draft.lead || "Unassigned"} />
        <InfoCard label="Members" value={String(draft.memberCount ?? draft.employees ?? 0)} />
        <InfoCard label="Active projects" value={String(draft.activeProjectCount ?? draft.activeProjects ?? 0)} />
        <InfoCard label="Created" value={draft.createdAt ? formatDate(draft.createdAt, locale) : "-"} />
      </div>
      <div className="mt-5"><ProgressBar value={workload} label="Workload" tone={workload > 80 ? "warning" : workload > 65 ? "blue" : "success"} /></div>
      {(draft.priorities || []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(draft.priorities || []).slice(0, 4).map((priority) => <Badge key={priority} tone="neutral">{priority}</Badge>)}
        </div>
      )}

      {canManage && (
        <div className="mt-5 grid gap-3 border-t border-white/10 pt-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value, slug: current.slug || slugifyDepartment(event.target.value) }))} />
            <Input label="Slug" value={draft.slug || ""} onChange={(event) => setDraft((current) => ({ ...current, slug: slugifyDepartment(event.target.value) }))} />
            <Input label="Description" value={draft.description || ""} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
            <Input label="Lead profile/user ID" value={draft.leadUserId || ""} onChange={(event) => setDraft((current) => ({ ...current, leadUserId: event.target.value }))} />
            <Dropdown label="Status" value={draft.status} options={departmentStatusOptions} onChange={(value) => setDraft((current) => ({ ...current, status: value as DepartmentStatus }))} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="secondary" onClick={() => updateDepartment(draft)}>Save department</Button>
            <Button size="sm" variant="danger" disabled={draft.status === "Archived"} onClick={() => archiveDepartment(draft)}>Archive</Button>
          </div>
        </div>
      )}
    </GlassCard>
  </AutoLocalizedContent>);
}

function MembersSection(props: {
  loading: boolean;
  error?: string;
  members: OrganizationMember[];
  allMembers: OrganizationMember[];
  roles: OrganizationRoleRecord[];
  canManage: boolean;
  memberSearch: string;
  setMemberSearch: (value: string) => void;
  memberStatus: string;
  setMemberStatus: (value: string) => void;
  memberRole: string;
  setMemberRole: (value: string) => void;
  newMember: { userId: string; roleId: string; status: OrganizationMemberStatus };
  setNewMember: React.Dispatch<React.SetStateAction<{ userId: string; roleId: string; status: OrganizationMemberStatus }>>;
  addMember: () => void;
  updateMember: (member: OrganizationMember, patch: Partial<OrganizationMember>) => void;
  removeMember: (member: OrganizationMember) => void;
}) {
  if (props.loading) return (<AutoLocalizedContent><GlassCard className="h-80 animate-pulse p-5"><span className="sr-only">Loading members</span></GlassCard></AutoLocalizedContent>);
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="blue">Organization members</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">Members and access.</h2>
            <p className="mt-2 text-sm leading-7 text-ds-text/58">Add existing users by profile ID. Email invitations require a future invitation table.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[620px]">
            <SearchInput value={props.memberSearch} onChange={props.setMemberSearch} />
            <Dropdown label="Status" value={props.memberStatus} options={["All", ...memberStatusOptions]} onChange={props.setMemberStatus} />
            <Dropdown label="Role" value={props.memberRole} options={["All", ...props.roles.map((role) => role.id)]} onChange={props.setMemberRole} />
          </div>
        </div>
        {props.error && <p className="mt-4 rounded-2xl border border-[#FFB020]/20 bg-[#FFB020]/10 p-3 text-sm font-bold text-[#FFD28A]">{toFriendlyError(props.error)}</p>}
      </GlassCard>

      {props.canManage && (
        <GlassCard className="p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto] lg:items-end">
            <Input label="Existing profile/user ID" value={props.newMember.userId} onChange={(event) => props.setNewMember((current) => ({ ...current, userId: event.target.value }))} />
            <Dropdown label="Role" value={props.newMember.roleId} options={["", ...props.roles.map((role) => role.id)]} onChange={(value) => props.setNewMember((current) => ({ ...current, roleId: value }))} />
            <Dropdown label="Status" value={props.newMember.status} options={memberStatusOptions} onChange={(value) => props.setNewMember((current) => ({ ...current, status: value as OrganizationMemberStatus }))} />
            <Button onClick={props.addMember} icon={<UserPlus className="h-4 w-4" />}>Add existing user</Button>
          </div>
        </GlassCard>
      )}

      {!props.members.length ? (
        <EmptyState title="No members found" description={props.allMembers.length ? "Adjust search or filters to see members." : "Members will appear here when the repository returns organization memberships."} />
      ) : (
        <div className="grid gap-4">
          {props.members.map((member) => (
            <GlassCard key={member.id} className="p-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-white">{member.fullName || member.email || member.userId}</p>
                  <p className="mt-1 truncate text-sm text-ds-text/58">{member.email || member.userId}</p>
                </div>
                <Badge tone={member.status === "Active" ? "success" : member.status === "Suspended" ? "warning" : "neutral"}>{member.status}</Badge>
                <Dropdown label="Role" value={member.roleId || ""} options={["", ...props.roles.map((role) => role.id)]} onChange={(value) => props.updateMember(member, { roleId: value })} />
                <div className="flex flex-wrap gap-2">
                  <Dropdown label="Status" value={member.status} options={memberStatusOptions} onChange={(value) => props.updateMember(member, { status: value as OrganizationMemberStatus })} />
                  <Button variant="danger" size="sm" disabled={!props.canManage || member.roleName === "Owner"} onClick={() => props.removeMember(member)}>Remove</Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}

function RolesSection(props: {
  loading: boolean;
  error?: string;
  roles: OrganizationRoleRecord[];
  canManage: boolean;
  roleForm: OrganizationRoleInput;
  setRoleForm: React.Dispatch<React.SetStateAction<OrganizationRoleInput>>;
  createRole: () => void;
  updateRole: (role: OrganizationRoleRecord) => void;
  deleteRole: (role: OrganizationRoleRecord) => void;
}) {
  if (props.loading) return (<AutoLocalizedContent><GlassCard className="h-80 animate-pulse p-5"><span className="sr-only">Loading roles</span></GlassCard></AutoLocalizedContent>);
  return (<AutoLocalizedContent>
    <div className="space-y-6">
      <GlassCard className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge tone="gold">Organization roles</Badge>
            <h2 className="mt-3 text-2xl font-black text-white">Roles and permissions.</h2>
            <p className="mt-2 text-sm leading-7 text-ds-text/58">Permissions match the current RLS keys and remain extensible for future modules.</p>
          </div>
          {!props.canManage && <Badge tone="warning">Management disabled by role or RLS</Badge>}
        </div>
        {props.error && <p className="mt-4 rounded-2xl border border-[#FFB020]/20 bg-[#FFB020]/10 p-3 text-sm font-bold text-[#FFD28A]">{toFriendlyError(props.error)}</p>}
      </GlassCard>

      {props.canManage && (
        <GlassCard className="p-5">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
            <Input label="Role name" value={props.roleForm.name} onChange={(event) => props.setRoleForm((current) => ({ ...current, name: event.target.value }))} />
            <Input label="Description" value={props.roleForm.description || ""} onChange={(event) => props.setRoleForm((current) => ({ ...current, description: event.target.value }))} />
            <Button onClick={props.createRole} icon={<Plus className="h-4 w-4" />}>Create role</Button>
          </div>
          <PermissionPicker permissions={props.roleForm.permissions || {}} onChange={(permissions) => props.setRoleForm((current) => ({ ...current, permissions }))} />
        </GlassCard>
      )}

      {!props.roles.length ? (
        <EmptyState title="No roles found" description="Roles will appear here when the repository returns organization role records." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {props.roles.map((role) => (
            <RoleCard key={role.id} role={role} canManage={props.canManage} updateRole={props.updateRole} deleteRole={props.deleteRole} />
          ))}
        </div>
      )}
    </div>
  </AutoLocalizedContent>);
}

function RoleCard({ role, canManage, updateRole, deleteRole }: { role: OrganizationRoleRecord; canManage: boolean; updateRole: (role: OrganizationRoleRecord) => void; deleteRole: (role: OrganizationRoleRecord) => void }) {
  const [draft, setDraft] = useState(role);
  useEffect(() => setDraft(role), [role]);
  const permissionCount = Object.values(draft.permissions).filter(Boolean).length;
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge tone={draft.isBuiltIn ? "gold" : "blue"}>{draft.isBuiltIn ? "Built-in" : "Custom"}</Badge>
          <h3 className="mt-3 text-xl font-black text-white">{draft.name}</h3>
          <p className="mt-2 text-sm leading-7 text-ds-text/58">{draft.description || "No description provided."}</p>
        </div>
        <Badge tone="neutral">{permissionCount} permissions</Badge>
      </div>
      <div className="mt-5 grid gap-3">
        <Input label="Name" value={draft.name} disabled={!canManage || draft.name === "Owner"} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        <Input label="Description" value={draft.description || ""} disabled={!canManage} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
        <PermissionPicker disabled={!canManage} permissions={draft.permissions} onChange={(permissions) => setDraft((current) => ({ ...current, permissions }))} />
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
        <span className="text-sm font-bold text-ds-text/54">{draft.assignedMemberCount || 0} assigned members</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" disabled={!canManage} onClick={() => updateRole(draft)}>Save</Button>
          <Button size="sm" variant="danger" disabled={!canManage || draft.isBuiltIn || Boolean(draft.assignedMemberCount)} onClick={() => deleteRole(draft)}>Delete</Button>
        </div>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function PermissionPicker({ permissions, onChange, disabled = false }: { permissions: OrganizationPermissions; onChange: (permissions: OrganizationPermissions) => void; disabled?: boolean }) {
  return (<AutoLocalizedContent>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {supportedOrganizationPermissions.map((permission) => (
        <label key={permission} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-sm font-black text-ds-text/72">
          <input
            type="checkbox"
            disabled={disabled}
            checked={Boolean(permissions[permission])}
            onChange={(event) => onChange({ ...permissions, [permission]: event.target.checked })}
            className="h-4 w-4 accent-[#D4AF37]"
          />
          {organizationPermissionLabels[permission]}
        </label>
      ))}
    </div>
  </AutoLocalizedContent>);
}

function SettingsSection(props: {
  organization: Organization;
  canManage: boolean;
  editing: boolean;
  setEditing: (value: boolean | ((value: boolean) => boolean)) => void;
  saving: boolean;
  save: () => void;
  editValue: { logo: string; website: string; contactEmail: string; contactPhone: string; timezone: string; currency: string; status: string; addressText: string };
  update: <K extends keyof OrganizationMutationInput>(key: K, value: OrganizationMutationInput[K]) => void;
}) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge tone="blue">Settings</Badge>
          <h2 className="mt-3 text-2xl font-black text-white">Organization management settings</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!props.canManage} onClick={() => props.setEditing((value) => !value)}>Edit organization</Button>
          {props.editing && <Button onClick={props.save} disabled={props.saving} icon={<Save className="h-4 w-4" />}>{props.saving ? "Saving..." : "Save changes"}</Button>}
        </div>
      </div>
      {!props.canManage && <p className="mb-5 rounded-2xl border border-[#FFB020]/20 bg-[#FFB020]/10 p-3 text-sm font-bold text-[#FFD28A]">Management controls are disabled. Supabase RLS remains the final security authority.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Logo initials / URL" disabled={!props.editing} value={props.editValue.logo} onChange={(event) => props.update("logo", event.target.value)} icon={<Building2 className="h-4 w-4" />} />
        <Input label="Website" disabled={!props.editing} value={props.editValue.website} onChange={(event) => props.update("website", event.target.value)} />
        <Input label="Contact email" disabled={!props.editing} value={props.editValue.contactEmail} onChange={(event) => props.update("contactEmail", event.target.value)} icon={<Mail className="h-4 w-4" />} />
        <Input label="Phone" disabled={!props.editing} value={props.editValue.contactPhone} onChange={(event) => props.update("contactPhone", event.target.value)} icon={<Phone className="h-4 w-4" />} />
        <Input label="Address" disabled={!props.editing} value={props.editValue.addressText} onChange={(event) => props.update("address", { line1: event.target.value })} />
        <Dropdown label="Timezone" value={props.editValue.timezone} options={timezoneOptions} onChange={(value) => props.update("timezone", value)} />
        <Dropdown label="Currency" value={props.editValue.currency} options={currencyOptions} onChange={(value) => props.update("currency", value)} />
        <Dropdown label="Status" value={props.editValue.status} options={statusOptions} onChange={(value) => props.update("status", value as OrganizationMutationInput["status"])} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function SearchInput({ value, onChange, placeholder = "Search members..." }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (<AutoLocalizedContent>
    <Input label="Search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  </AutoLocalizedContent>);
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p>
      <p className="mt-2 break-words font-black text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

function toFriendlyError(error: string) {
  const normalized = error.toLowerCase();
  if (normalized.includes("permission") || normalized.includes("policy") || normalized.includes("rls")) {
    return "You do not have permission to perform this organization action.";
  }
  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return "This organization record already exists.";
  }
  if (normalized.includes("auth")) {
    return "Sign in is required for this organization action.";
  }
  return error;
}
