"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Archive, BrainCircuit, Building2, CalendarClock, Plus, UserRound } from "lucide-react";
import { KnowledgeWorkspace } from "@/components/knowledge-workspace";
import { ProjectCreationWizard } from "@/components/project-creation-wizard";
import { useI18n } from "@/components/i18n-provider";
import { LocalizedContent } from "@/components/localized-content";
import { Alert, Button, Card, Dropdown, EmptyState, LoadingState, PageHeader, ProgressBar, SearchField, StatusChip } from "@/components/ui";
import { useProjectsRepository } from "@/lib/repositories/projectHooks";
import { useOrganizationsRepository } from "@/lib/repositories/organizationHooks";
import { useDepartmentsRepository } from "@/lib/repositories/departmentHooks";
import { useEmployeesRepository } from "@/lib/repositories/employeeHooks";
import { projectRepository } from "@/lib/repositories";
import type { Project, ProjectInput } from "@/lib/models";
import { slugifyProject } from "@/lib/repositories/projectMapper";
import { localizeProjectJourneySystemValue, localizeProjectJourneyTimestamp } from "@/lib/project-owner-journey";

export default function ProjectsPage() {
  const router = useRouter();
  const { dictionary: t, locale, translate } = useI18n();
  const { data: projectsData, loading, error, isFallback, source } = useProjectsRepository();
  const organizationsState = useOrganizationsRepository();
  const defaultOrganization = organizationsState.data[0];
  const departmentsState = useDepartmentsRepository(defaultOrganization?.id || "atlas");
  const employeesState = useEmployeesRepository(defaultOrganization?.id || "atlas");
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [organizationFilter, setOrganizationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recently updated");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => setProjects(projectsData), [projectsData]);

  const statuses = Array.from(new Set(projects.map((project) => String(project.status))));
  const organizationOptions = ["All", ...Array.from(new Set(projects.map((project) => project.organizationName || project.organizationId || "Unassigned")))];
  const filteredProjects = projects.filter((project) => {
    const searchTarget = [project.title, project.type, project.status, project.organizationName, project.departmentName, project.projectManagerName].filter(Boolean).join(" ").toLowerCase();
    return (
      searchTarget.includes(search.toLowerCase()) &&
      (statusFilter === "All" || project.status === statusFilter) &&
      (organizationFilter === "All" || project.organizationName === organizationFilter || project.organizationId === organizationFilter)
    );
  }).sort((a, b) => sortBy === "Progress" ? b.score - a.score : sortBy === "Project name" ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt));
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const visibleProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [search, statusFilter, organizationFilter, sortBy]);

  async function createProject(input: ProjectInput) {
    const organizationId = input.organizationId || defaultOrganization?.id || "atlas";
    const slug = input.slug || slugifyProject(input.title);
    if (!organizationId) return setMessage(translate("Organization is required."));
    if (!input.title.trim()) return setMessage(translate("Project name is required."));
    if (!slug || !/^[a-z0-9-]{3,64}$/.test(slug)) return setMessage(translate("Project slug must use 3-64 lowercase letters, numbers, or hyphens."));
    if (input.departmentId && !departmentsState.data.some((department) => department.id === input.departmentId)) return setMessage(translate("Selected department does not belong to the selected organization."));
    if (input.projectManagerId && !employeesState.data.some((employee) => employee.id === input.projectManagerId)) return setMessage(translate("Selected manager does not belong to the selected organization."));
    const duplicate = await projectRepository.slugExists(organizationId, slug);
    if (duplicate.data) return setMessage(translate("This project slug already exists inside the organization."));
    if (duplicate.error) return setMessage(translate(toFriendlyError(duplicate.error)));

    setCreating(true);
    try {
      const result = await projectRepository.createProject({ ...input, organizationId, slug, title: input.title.trim() });
      if (result.error || !result.data) {
        setMessage(translate(toFriendlyError(result.error || "Unable to create project.")));
        return;
      }
      setProjects((current) => [result.data!, ...current]);
      setMessage(translate(result.isFallback ? "Demo project preview created. Demo mode does not persist changes." : "Project created successfully."));
      setShowCreate(false);
      router.push(`/projects/${encodeURIComponent(result.data.id)}`);
    } finally {
      setCreating(false);
    }
  }

  async function archiveProject(project: Project) {
    if (!window.confirm(`${translate("Archive")} ${project.title}?`)) return;
    const result = await projectRepository.archiveProject(project.id);
    if (result.error || !result.data) return setMessage(translate(toFriendlyError(result.error || "Unable to archive project.")));
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, status: "Archived" } : item));
    setMessage(translate(result.isFallback ? "Demo project archive preview completed." : "Project archived successfully."));
  }

  return (
    <LocalizedContent locale={locale}><div className="space-y-6">
      <PageHeader eyebrow={translate("Project portfolio")} title={t.projects.title} description={t.projects.description} action={<Button onClick={() => setShowCreate((value) => !value)} icon={<Plus className="h-4 w-4" />}>{t.projects.newProject}</Button>} />

      {message && <Alert title={message} tone="blue" />}

      {showCreate ? (
        <ProjectCreationWizard
          defaultOrganizationId={defaultOrganization?.id || "atlas"}
          organizations={organizationsState.data.map((organization) => ({ id: organization.id, name: organization.name }))}
          departments={departmentsState.data.map((department) => ({ id: department.id, name: department.name }))}
          managers={employeesState.data.map((employee) => ({ id: employee.id, name: employee.fullName || employee.name }))}
          busy={creating}
          onCancel={() => setShowCreate(false)}
          onCreate={createProject}
        />
      ) : (
        <>
          <Card className="p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_220px_190px]">
              <SearchField label={t.projects.search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.projects.search} />
              <Dropdown label={translate("Status")} value={statusFilter} options={["All", ...statuses]} onChange={setStatusFilter} />
              <Dropdown label={translate("Organization")} value={organizationFilter} options={organizationOptions} onChange={setOrganizationFilter} />
              <Dropdown label={translate("Sort")} value={sortBy} options={["Recently updated", "Project name", "Progress"]} onChange={setSortBy} />
            </div>
          </Card>

          {error && isFallback && (
            <Alert title={translate("Demo fallback is active because production project data is unavailable.")} tone="warning">{translate("Showing demo projects because production project data is unavailable.")}</Alert>
          )}

          {loading ? (
            <LoadingState title={translate("Loading project")} />
          ) : filteredProjects.length ? (
            <>
              <Card className="divide-y divide-ds-token-border overflow-hidden">
                {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} archiveProject={archiveProject} localizeSystemData={source === "demo" || isFallback} />)}
              </Card>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-ds-token-muted">{translate("Page")} {page} / {pageCount}</p>
                <div className="flex gap-2"><Button size="sm" variant="secondary" className="min-h-11 sm:min-h-9" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{translate("Previous")}</Button><Button size="sm" variant="secondary" className="min-h-11 sm:min-h-9" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>{translate("Next")}</Button></div>
              </div>
            </>
          ) : (
            <EmptyState title={translate("No projects found")} description={translate(source === "supabase" ? "No projects are available for the current authenticated account." : "Adjust search or filters to show demo projects.")} action={<Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("All"); setOrganizationFilter("All"); }}>{translate("Reset filters")}</Button>} />
          )}

          <details id="knowledge" className="group rounded-ds-lg border border-ds-token-border bg-white/[0.025]">
            <summary className="cursor-pointer list-none px-5 py-4 font-bold text-ds-token-text">{translate("Knowledge")}</summary>
            <div className="border-t border-ds-token-border p-4"><KnowledgeWorkspace /></div>
          </details>
        </>
      )}
    </div></LocalizedContent>
  );
}

function ProjectCard({ project, archiveProject, localizeSystemData }: { project: Project; archiveProject: (project: Project) => void; localizeSystemData: boolean }) {
  const { locale, translate } = useI18n();
  const projectType = localizeSystemData ? localizeProjectJourneySystemValue(project.type, translate) : project.type;
  const updatedAt = localizeSystemData ? localizeProjectJourneyTimestamp(project.updatedAt, locale, translate) : project.updatedAt;
  return (
    <LocalizedContent locale={locale}><article className="group p-4 transition-colors hover:bg-white/[0.02] sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1.3fr)_minmax(320px,1fr)_180px_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><StatusChip tone={project.status === "Archived" ? "neutral" : "gold"}>{translate(String(project.status))}</StatusChip><span className="text-xs text-ds-token-muted">{projectType}</span></div>
          <h2 className="mt-2 truncate text-base font-semibold text-ds-token-text">{project.title}</h2>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-ds-token-muted"><Building2 className="h-3.5 w-3.5 shrink-0" />{project.organizationName || project.organizationId || translate("Unavailable")}</p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Info icon={<UserRound className="h-3.5 w-3.5" />} label={translate("Manager")} value={project.projectManagerName || translate("Unassigned")} />
          <Info icon={<CalendarClock className="h-3.5 w-3.5" />} label={translate("Updated")} value={updatedAt} />
        </div>
        <div><ProgressBar value={project.score} label={translate("Progress")} /></div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Button size="sm" variant="ghost" className="min-h-11 sm:min-h-9" disabled={project.status === "Archived"} onClick={() => archiveProject(project)} icon={<Archive className="h-4 w-4" />}>{translate("Archive")}</Button>
          <Link href={`/projects/${encodeURIComponent(project.id)}`} className="ds-focusable inline-flex min-h-11 items-center justify-center gap-2 rounded-ds-sm border border-ds-token-border bg-white/[0.04] px-3 text-sm font-semibold text-ds-token-text transition-colors hover:border-ds-token-gold/30 sm:min-h-10">
          {translate("Open project")} <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        </Link>
        <Link href={`/projects/${encodeURIComponent(project.id)}/intelligence`} aria-label={`${translate("Intelligence")} ${project.title}`} className="ds-focusable inline-grid h-10 w-10 place-items-center rounded-ds-sm border border-ds-token-border text-ds-token-muted transition-colors hover:text-ds-token-info">
          <BrainCircuit className="h-4 w-4" />
        </Link>
        </div>
      </div>
    </article></LocalizedContent>
  );
}

function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="text-ds-token-muted">{icon}</span>
      <p className="min-w-0 text-xs text-ds-token-muted"><span className="me-1">{label}:</span><span className="font-medium text-ds-token-text">{value}</span></p>
    </div>
  );
}

function toFriendlyError(error: string) {
  const normalized = error.toLowerCase();
  if (normalized.includes("permission") || normalized.includes("policy") || normalized.includes("rls")) return "You do not have permission to perform this project action.";
  if (normalized.includes("duplicate") || normalized.includes("unique")) return "This project already exists inside the organization.";
  if (normalized.includes("auth")) return "Sign in is required for this project action.";
  if (normalized.includes("organization") || normalized.includes("department") || normalized.includes("manager")) return error;
  return "The project action could not be completed. Please try again.";
}
