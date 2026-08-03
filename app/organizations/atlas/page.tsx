"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Mail,
  FileText,
  FolderKanban,
  KeyRound,
  LockKeyhole,
  MapPin,
  Network,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UsersRound
} from "lucide-react";
import { Badge, Button, EmptyState, GlassCard, ProgressBar, Tabs, TimelineCard } from "@/components/ui";
import { BlueprintOverlay, VoraVisual } from "@/components/vorqa-official-visuals";
import { employeeRepository, organizationRepository, projectRepository } from "@/lib/repositories";
import { AutoLocalizedContent } from "@/components/auto-localized-content";

const departments = organizationRepository.listDepartments();
const demoCompany = organizationRepository.getCurrent();
const demoUsers = employeeRepository.list();
const projects = projectRepository.list();
const recentActivity = projectRepository.listRecentActivity();
const savedGenerations = projectRepository.listSavedGenerations();

const tabs = [
  { value: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
  { value: "team", label: "Team", icon: <UsersRound className="h-4 w-4" /> },
  { value: "activity", label: "Activity", icon: <Activity className="h-4 w-4" /> },
  { value: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> }
];

const departmentWorkspaces = [
  {
    name: "Engineering",
    lead: "Nadia Benali",
    leadRole: "Project Manager",
    employees: 52,
    activeProjects: 4,
    workload: 82,
    status: "High workload",
    statusTone: "warning" as const,
    performance: "Delivery pressure",
    icon: Building2,
    priorities: ["Structural coordination", "MEP conflict resolution", "Site quality reports"],
    activity: ["Structural review completed for Casablanca villa", "MEP coordination risk raised", "Rabat permit comments assigned"],
    tasks: ["Finalize inspection package", "Review concrete curing checklist", "Approve MEP coordination notes"],
    documents: ["Engineering Review Pack.pdf", "Site Quality Register.xlsx", "MEP Clash Notes.docx"],
    members: ["Nadia Benali", "Omar Haddad", "Yassine El Mansouri"]
  },
  {
    name: "Architecture",
    lead: "Salma Idrissi",
    leadRole: "Architect",
    employees: 38,
    activeProjects: 3,
    workload: 71,
    status: "On track",
    statusTone: "success" as const,
    performance: "Stable",
    icon: BriefcaseBusiness,
    priorities: ["Facade package", "Client design comments", "Permit drawings"],
    activity: ["Rabat elevations updated", "Marrakech concept review prepared", "Villa finish palette aligned"],
    tasks: ["Update permit sheet index", "Prepare facade alternatives", "Validate material board"],
    documents: ["Architectural Permit Set.pdf", "Facade Options Deck.pdf", "Finish Schedule.xlsx"],
    members: ["Salma Idrissi", "Nadia Benali", "Hajar Amrani"]
  },
  {
    name: "Procurement",
    lead: "Karim Berrada",
    leadRole: "Procurement Manager",
    employees: 44,
    activeProjects: 4,
    workload: 76,
    status: "Watchlist",
    statusTone: "blue" as const,
    performance: "Supplier decisions pending",
    icon: ClipboardList,
    priorities: ["Steel award", "Marble supplier", "MEP long-lead items"],
    activity: ["Tangier supplier matrix updated", "Villa marble quotations received", "Budget variance flagged"],
    tasks: ["Shortlist steel suppliers", "Confirm marble samples", "Update procurement forecast"],
    documents: ["Supplier Comparison.xlsx", "Procurement Forecast.pdf", "Approved Vendor List.docx"],
    members: ["Karim Berrada", "Omar Haddad", "Salma Idrissi"]
  },
  {
    name: "Logistics",
    lead: "Hajar Amrani",
    leadRole: "Logistics Coordinator",
    employees: 29,
    activeProjects: 3,
    workload: 64,
    status: "Healthy",
    statusTone: "success" as const,
    performance: "Balanced",
    icon: Activity,
    priorities: ["Crane booking", "Port access", "Site delivery windows"],
    activity: ["Tangier delivery route confirmed", "Villa site access plan updated", "Warehouse crane slot reserved"],
    tasks: ["Confirm port clearances", "Align delivery windows", "Publish crane calendar"],
    documents: ["Logistics Plan.docx", "Delivery Calendar.xlsx", "Site Access Map.pdf"],
    members: ["Hajar Amrani", "Karim Berrada", "Omar Haddad"]
  },
  {
    name: "Finance",
    lead: "Yassine El Mansouri",
    leadRole: "CEO",
    employees: 31,
    activeProjects: 4,
    workload: 68,
    status: "Controlled",
    statusTone: "gold" as const,
    performance: "Forecast ready",
    icon: BarChart3,
    priorities: ["Cash flow forecast", "Budget variance", "Executive portfolio report"],
    activity: ["Portfolio budget health reviewed", "Residential complex forecast updated", "Executive dashboard prepared"],
    tasks: ["Review variance notes", "Approve cash-flow assumptions", "Prepare board summary"],
    documents: ["Budget Variance Report.pdf", "Cash Flow Forecast.xlsx", "Board Summary.docx"],
    members: ["Yassine El Mansouri", "Nadia Benali", "Karim Berrada"]
  }
];

type DepartmentWorkspace = (typeof departmentWorkspaces)[number];

const employeeWorkspaces = [
  {
    name: "Yassine El Mansouri",
    role: "CEO",
    department: "Executive",
    email: "yassine.elmansouri@atlas.example",
    phone: "+212 522 410 100",
    status: "Active",
    statusTone: "success" as const,
    availability: "Executive review",
    workload: 62,
    manager: "Board of Directors",
    assignedProjects: ["Luxury Villa Casablanca", "Residential Complex Rabat", "Office Tower Marrakech"],
    skills: ["Executive governance", "Portfolio strategy", "Investor relations"],
    certifications: ["Executive Construction Leadership", "Corporate Governance"],
    tasks: ["Approve portfolio forecast", "Review board report", "Resolve investor assumptions"],
    activity: ["Approved executive dashboard", "Reviewed Rabat forecast", "Prepared investor note"],
    performance: "Strong executive alignment across the active portfolio."
  },
  {
    name: "Nadia Benali",
    role: "Project Manager",
    department: "Engineering",
    email: "nadia.benali@atlas.example",
    phone: "+212 522 410 112",
    status: "Active",
    statusTone: "success" as const,
    availability: "Available this week",
    workload: 78,
    manager: "Yassine El Mansouri",
    assignedProjects: ["Luxury Villa Casablanca", "Residential Complex Rabat"],
    skills: ["Project controls", "Stakeholder coordination", "Execution planning"],
    certifications: ["PMP", "Lean Construction"],
    tasks: ["Coordinate weekly site review", "Finalize MEP checklist", "Approve timeline update"],
    activity: ["Updated Casablanca delivery plan", "Assigned permit blockers", "Validated weekly report"],
    performance: "Reliable delivery owner with moderate workload pressure."
  },
  {
    name: "Omar Haddad",
    role: "Site Engineer",
    department: "Engineering",
    email: "omar.haddad@atlas.example",
    phone: "+212 522 410 118",
    status: "Active",
    statusTone: "warning" as const,
    availability: "Limited capacity",
    workload: 86,
    manager: "Nadia Benali",
    assignedProjects: ["Luxury Villa Casablanca", "Industrial Warehouse Tangier"],
    skills: ["Site supervision", "Concrete works", "Quality inspections"],
    certifications: ["Site Safety", "Concrete Quality Control"],
    tasks: ["Inspect structural frame", "Review curing logs", "Close site quality notes"],
    activity: ["Raised curing delay risk", "Closed two inspection actions", "Uploaded site photos"],
    performance: "High field impact, currently overloaded by inspection demand."
  },
  {
    name: "Salma Idrissi",
    role: "Architect",
    department: "Architecture",
    email: "salma.idrissi@atlas.example",
    phone: "+212 522 410 125",
    status: "Active",
    statusTone: "success" as const,
    availability: "Available",
    workload: 70,
    manager: "Nadia Benali",
    assignedProjects: ["Residential Complex Rabat", "Office Tower Marrakech"],
    skills: ["Concept design", "Permit drawings", "Facade systems"],
    certifications: ["Licensed Architect", "BIM Coordination"],
    tasks: ["Revise Rabat elevations", "Prepare facade options", "Validate concept massing"],
    activity: ["Updated permit drawings", "Prepared concept package", "Reviewed finish palette"],
    performance: "Balanced design throughput with strong permit package ownership."
  },
  {
    name: "Karim Berrada",
    role: "Procurement Manager",
    department: "Procurement",
    email: "karim.berrada@atlas.example",
    phone: "+212 522 410 131",
    status: "Active",
    statusTone: "blue" as const,
    availability: "Supplier meetings",
    workload: 74,
    manager: "Yassine El Mansouri",
    assignedProjects: ["Luxury Villa Casablanca", "Industrial Warehouse Tangier"],
    skills: ["Vendor negotiation", "BOQ review", "Supplier risk"],
    certifications: ["Procurement Management", "Cost Control"],
    tasks: ["Award steel supplier", "Review marble quotations", "Update procurement forecast"],
    activity: ["Compared steel bids", "Flagged supplier delay", "Updated procurement matrix"],
    performance: "Good supplier control; watch steel award deadline."
  },
  {
    name: "Hajar Amrani",
    role: "Logistics Coordinator",
    department: "Logistics",
    email: "hajar.amrani@atlas.example",
    phone: "+212 522 410 146",
    status: "Active",
    statusTone: "success" as const,
    availability: "Available",
    workload: 58,
    manager: "Karim Berrada",
    assignedProjects: ["Industrial Warehouse Tangier", "Luxury Villa Casablanca"],
    skills: ["Delivery planning", "Site access", "Crane scheduling"],
    certifications: ["Logistics Operations", "Site Safety"],
    tasks: ["Publish crane calendar", "Confirm delivery routes", "Align port clearances"],
    activity: ["Reserved crane slot", "Updated delivery plan", "Confirmed access route"],
    performance: "Available capacity for procurement reporting support."
  },
  {
    name: "Imane Lahlou",
    role: "Finance Manager",
    department: "Finance",
    email: "imane.lahlou@atlas.example",
    phone: "+212 522 410 152",
    status: "Active",
    statusTone: "success" as const,
    availability: "Available",
    workload: 64,
    manager: "Yassine El Mansouri",
    assignedProjects: ["Residential Complex Rabat", "Office Tower Marrakech"],
    skills: ["Budget control", "Cash flow", "Variance analysis"],
    certifications: ["Certified Management Accountant", "Construction Finance"],
    tasks: ["Review Rabat variance", "Update cash-flow assumptions", "Prepare budget summary"],
    activity: ["Updated finance forecast", "Reviewed variance notes", "Prepared executive budget view"],
    performance: "Strong financial visibility and healthy capacity."
  },
  {
    name: "Meryem Alaoui",
    role: "HR Manager",
    department: "Human Resources",
    email: "meryem.alaoui@atlas.example",
    phone: "+212 522 410 160",
    status: "Active",
    statusTone: "success" as const,
    availability: "Available",
    workload: 52,
    manager: "Yassine El Mansouri",
    assignedProjects: ["Luxury Villa Casablanca"],
    skills: ["Recruitment", "Training", "Workforce planning"],
    certifications: ["HR Operations", "Workforce Planning"],
    tasks: ["Prepare site engineer shortlist", "Review training needs", "Update role coverage"],
    activity: ["Published hiring brief", "Reviewed workload distribution", "Prepared onboarding checklist"],
    performance: "Healthy availability for staffing support."
  },
  {
    name: "Amine Tazi",
    role: "BIM Engineer",
    department: "Architecture",
    email: "amine.tazi@atlas.example",
    phone: "+212 522 410 171",
    status: "Active",
    statusTone: "blue" as const,
    availability: "Model coordination",
    workload: 72,
    manager: "Salma Idrissi",
    assignedProjects: ["Residential Complex Rabat", "Office Tower Marrakech"],
    skills: ["Revit", "Clash detection", "Model coordination"],
    certifications: ["Autodesk BIM Professional", "ISO 19650 Fundamentals"],
    tasks: ["Run clash report", "Update Rabat model", "Export coordination views"],
    activity: ["Issued clash summary", "Updated tower model", "Shared BIM package"],
    performance: "Good model discipline; can support MEP coordination."
  },
  {
    name: "Rachid Kabbaj",
    role: "Quantity Surveyor",
    department: "Finance",
    email: "rachid.kabbaj@atlas.example",
    phone: "+212 522 410 183",
    status: "Active",
    statusTone: "warning" as const,
    availability: "Limited capacity",
    workload: 81,
    manager: "Imane Lahlou",
    assignedProjects: ["Luxury Villa Casablanca", "Industrial Warehouse Tangier", "Residential Complex Rabat"],
    skills: ["BOQ", "Cost estimation", "Contract measurement"],
    certifications: ["RICS Associate", "Quantity Surveying"],
    tasks: ["Validate BOQ summary", "Review cost forecast", "Measure variation claims"],
    activity: ["Updated warehouse BOQ", "Reviewed villa variations", "Prepared cost notes"],
    performance: "Critical cost owner with workload risk across three projects."
  }
];

type EmployeeWorkspace = (typeof employeeWorkspaces)[number];

const roleWorkspaces = [
  {
    name: "CEO",
    department: "Executive",
    users: ["Yassine El Mansouri"],
    permissionLevel: "Owner",
    levelTone: "gold" as const,
    scope: "Full organization and portfolio access",
    accessLevel: "Manage",
    status: "Active",
    responsibilities: ["Executive governance", "Portfolio approvals", "Organization settings", "Strategic reporting"],
    activity: ["Approved Finance access", "Reviewed portfolio permissions", "Updated executive report visibility"]
  },
  {
    name: "Operations Director",
    department: "Operations",
    users: ["Nadia Benali"],
    permissionLevel: "Admin",
    levelTone: "blue" as const,
    scope: "Projects, teams, reports, and delivery operations",
    accessLevel: "Manage",
    status: "Active",
    responsibilities: ["Delivery governance", "Department coordination", "Timeline approvals", "Operational reporting"],
    activity: ["Reviewed project access", "Assigned report approvers", "Updated delivery controls"]
  },
  {
    name: "Project Manager",
    department: "Engineering",
    users: ["Nadia Benali"],
    permissionLevel: "Manager",
    levelTone: "blue" as const,
    scope: "Assigned projects and project teams",
    accessLevel: "Approve",
    status: "Active",
    responsibilities: ["Project execution", "Task coordination", "Document review", "Weekly reporting"],
    activity: ["Approved site report", "Assigned project members", "Updated project budget view"]
  },
  {
    name: "Site Engineer",
    department: "Engineering",
    users: ["Omar Haddad"],
    permissionLevel: "Editor",
    levelTone: "success" as const,
    scope: "Assigned project field execution",
    accessLevel: "Edit",
    status: "Active",
    responsibilities: ["Site updates", "Inspection records", "Quality notes", "Field document uploads"],
    activity: ["Uploaded inspection notes", "Updated field tasks", "Viewed timeline risks"]
  },
  {
    name: "Architect",
    department: "Architecture",
    users: ["Salma Idrissi"],
    permissionLevel: "Editor",
    levelTone: "success" as const,
    scope: "Design documents and assigned projects",
    accessLevel: "Edit",
    status: "Active",
    responsibilities: ["Permit drawings", "Design review", "BIM coordination", "Client design comments"],
    activity: ["Edited permit package", "Viewed budget summary", "Created design report"]
  },
  {
    name: "Procurement Manager",
    department: "Procurement",
    users: ["Karim Berrada"],
    permissionLevel: "Manager",
    levelTone: "blue" as const,
    scope: "Procurement documents, budgets, and supplier reports",
    accessLevel: "Approve",
    status: "Active",
    responsibilities: ["Supplier approvals", "BOQ review", "Procurement reporting", "Cost risk updates"],
    activity: ["Approved supplier matrix", "Viewed finance reports", "Updated procurement risk"]
  },
  {
    name: "Logistics Coordinator",
    department: "Logistics",
    users: ["Hajar Amrani"],
    permissionLevel: "Contributor",
    levelTone: "neutral" as const,
    scope: "Logistics tasks and project delivery files",
    accessLevel: "Create",
    status: "Active",
    responsibilities: ["Delivery plans", "Site access coordination", "Crane schedules", "Logistics documents"],
    activity: ["Created delivery plan", "Viewed project timeline", "Uploaded logistics map"]
  },
  {
    name: "Finance Manager",
    department: "Finance",
    users: ["Imane Lahlou"],
    permissionLevel: "Manager",
    levelTone: "blue" as const,
    scope: "Budgets, reports, and financial documents",
    accessLevel: "Approve",
    status: "Active",
    responsibilities: ["Budget controls", "Cash flow review", "Variance approvals", "Financial reporting"],
    activity: ["Approved budget report", "Viewed project portfolio", "Updated finance dashboard"]
  },
  {
    name: "HR Manager",
    department: "Human Resources",
    users: ["Meryem Alaoui"],
    permissionLevel: "Admin",
    levelTone: "blue" as const,
    scope: "Employees, teams, and role assignment previews",
    accessLevel: "Manage",
    status: "Active",
    responsibilities: ["Employee directory", "Team structure", "Training records", "Workforce planning"],
    activity: ["Reviewed employee access", "Prepared invite list", "Updated role coverage"]
  },
  {
    name: "BIM Engineer",
    department: "Architecture",
    users: ["Amine Tazi"],
    permissionLevel: "Editor",
    levelTone: "success" as const,
    scope: "BIM documents and design coordination",
    accessLevel: "Edit",
    status: "Active",
    responsibilities: ["Model coordination", "Clash reports", "Document uploads", "Design issue tracking"],
    activity: ["Uploaded clash report", "Viewed AI workspace", "Updated BIM package"]
  },
  {
    name: "Quantity Surveyor",
    department: "Finance",
    users: ["Rachid Kabbaj"],
    permissionLevel: "Editor",
    levelTone: "warning" as const,
    scope: "Budget estimates, BOQ files, and cost reports",
    accessLevel: "Edit",
    status: "Active",
    responsibilities: ["BOQ measurement", "Cost estimates", "Variation tracking", "Budget support"],
    activity: ["Updated BOQ summary", "Viewed procurement reports", "Prepared cost notes"]
  }
];

type RoleWorkspace = (typeof roleWorkspaces)[number];

const permissionAreas = ["Dashboard", "Projects", "Documents", "Budget", "Reports", "Teams", "AI Workspace", "Organizations", "Employees", "Departments", "Marketplace"];
const permissionLevels = ["View", "Create", "Edit", "Delete", "Approve", "Manage"];
const roleLevelRank: Record<string, number> = { Contributor: 2, Editor: 3, Manager: 5, Admin: 6, Owner: 6 };

export default function AtlasOrganizationPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (<AutoLocalizedContent>
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-ds-token-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-ds-md border border-ds-token-gold/25 bg-ds-token-gold/10 text-lg font-bold text-gold">{demoCompany.name.slice(0, 2)}</div>
            <div className="min-w-0"><h1 className="truncate text-2xl font-bold text-ds-token-text sm:text-3xl">{demoCompany.name}</h1><div className="mt-2 flex flex-wrap gap-2"><Badge tone="success">Active</Badge><Badge tone="gold">Owner</Badge></div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/organizations"><Button variant="secondary">All organizations</Button></Link>
            <Link href="/projects"><Button icon={<FolderKanban className="h-4 w-4" />}>Open projects</Button></Link>
          </div>
      </header>

      <div className="overflow-x-auto pb-1"><Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} /></div>

      {activeTab === "overview" ? <Overview /> : activeTab === "team" ? <TeamHub /> : activeTab === "activity" ? <ActivityPanel /> : <TabScaffold tab={activeTab} />}
    </div>
  </AutoLocalizedContent>);
}

function TeamHub() {
  const [section, setSection] = useState("teams");
  return (<AutoLocalizedContent><div className="space-y-5">
    <div className="flex flex-wrap gap-2 border-b border-ds-token-border pb-3">
      {[{ value: "teams", label: "Members" }, { value: "employees", label: "Employees" }, { value: "departments", label: "Departments" }, { value: "roles", label: "Roles & Permissions" }].map((item) => <Button key={item.value} size="sm" variant={section === item.value ? "primary" : "ghost"} onClick={() => setSection(item.value)}>{item.label}</Button>)}
    </div>
    <TabScaffold tab={section} />
  </div></AutoLocalizedContent>);
}

function ActivityPanel() {
  return (<AutoLocalizedContent><GlassCard className="p-5"><h2 className="text-lg font-semibold text-ds-token-text">Recent activity</h2><div className="mt-4 grid gap-3">{recentActivity.slice(0, 5).map((item, index) => { const Icon = item.icon; return <TimelineCard key={item.title} index={index + 1} title={item.title} text={`${item.detail} · ${item.time}`} icon={<Icon className="h-4 w-4" />} />; })}</div></GlassCard></AutoLocalizedContent>);
}

function Overview() {
  return (<AutoLocalizedContent>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <GlassCard className="hidden p-5">
          <Badge tone="gold">Company Profile</Badge>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <ProfileKpi label="Departments" value={String(departments.length)} />
            <ProfileKpi label="Employees" value="248" />
            <ProfileKpi label="Active projects" value={String(projects.length)} />
            <ProfileKpi label="Portfolio" value="MAD 418M" />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-ds-token-text">Active projects</h2><Badge tone="neutral">{projects.length}</Badge></div>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/28 hover:bg-white/[0.065]">
                <div className="flex items-start justify-between gap-3"><div><Badge tone="gold">{project.status}</Badge><h3 className="mt-3 text-lg font-black text-white">{project.title}</h3><p className="mt-1 text-sm text-ds-text/48">{project.type} · {project.budget}</p></div><FolderKanban className="h-5 w-5 text-gold" /></div>
                <div className="mt-4"><ProgressBar value={project.score} label="Progress" /></div>
              </Link>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="hidden p-5">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-2xl font-black text-white">Department Summary</h2><Badge tone="neutral">5 departments</Badge></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {departments.map((department, index) => (
              <div key={department} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <p className="font-black text-white">{department}</p>
                <p className="mt-2 text-sm text-ds-text/48">{[52, 38, 44, 29, 31][index]} employees</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <GlassCard className="p-5">
          <div className="flex items-start gap-4"><VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" /><div><Badge tone="blue">VORA Governance</Badge><h2 className="mt-3 text-xl font-black text-white">Organization insight</h2></div></div>
          <p className="mt-5 text-sm leading-7 text-ds-text/60">Atlas should prioritize Rabat permit blockers and Tangier procurement decisions before the next executive review.</p>
        </GlassCard>

        <GlassCard className="p-5">
          <Badge tone="gold">Recent Activity</Badge>
          <div className="mt-5 grid gap-4">
            {recentActivity.slice(0, 3).map((item, index) => { const Icon = item.icon; return <TimelineCard key={item.title} index={index + 1} title={item.title} text={`${item.detail} · ${item.time}`} icon={<Icon className="h-4 w-4" />} />; })}
          </div>
        </GlassCard>
      </aside>
    </div>
  </AutoLocalizedContent>);
}

function TabScaffold({ tab }: { tab: string }) {
  const title = tabs.find((item) => item.value === tab)?.label || "Workspace";
  if (tab === "departments") {
    return (<AutoLocalizedContent><DepartmentsWorkspace /></AutoLocalizedContent>);
  }
  if (tab === "employees") {
    return (<AutoLocalizedContent><EmployeesWorkspace /></AutoLocalizedContent>);
  }
  if (tab === "roles") {
    return (<AutoLocalizedContent><RolesWorkspace /></AutoLocalizedContent>);
  }

  return (<AutoLocalizedContent>
    <GlassCard className="p-6">
      {tab === "teams" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demoUsers.map((user) => <EmployeeCard key={user.name} user={user} />)}
        </div>
      ) : tab === "projects" ? (
        <div className="grid gap-4 md:grid-cols-2">{projects.map((project) => <ProfileKpi key={project.id} label={project.title} value={project.status} />)}</div>
      ) : tab === "documents" ? (
        <div className="grid gap-4 md:grid-cols-3">{savedGenerations.map((doc) => <ProfileKpi key={doc.title} label={doc.title} value={doc.tool} />)}</div>
      ) : (
        <EmptyState title={`${title} workspace`} description="Demo UI foundation only. Backend organization settings will be connected in a later phase." />
      )}
    </GlassCard>
  </AutoLocalizedContent>);
}

function DepartmentsWorkspace() {
  const [selectedDepartment, setSelectedDepartment] = useState(departmentWorkspaces[0].name);
  const [query, setQuery] = useState("");
  const [workloadFilter, setWorkloadFilter] = useState("All workloads");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [activityFilter, setActivityFilter] = useState("All activity");

  const filteredDepartments = departmentWorkspaces.filter((department) => {
    const matchesQuery = department.name.toLowerCase().includes(query.toLowerCase()) || department.lead.toLowerCase().includes(query.toLowerCase());
    const matchesWorkload =
      workloadFilter === "All workloads" ||
      (workloadFilter === "High workload" && department.workload >= 75) ||
      (workloadFilter === "Balanced" && department.workload < 75);
    const matchesStatus = statusFilter === "All statuses" || department.status === statusFilter;
    const matchesActivity = activityFilter === "All activity" || department.activeProjects >= Number(activityFilter.split(" ")[0]);

    return matchesQuery && matchesWorkload && matchesStatus && matchesActivity;
  });

  const selected = departmentWorkspaces.find((department) => department.name === selectedDepartment) || departmentWorkspaces[0];
  const totalEmployees = departmentWorkspaces.reduce((sum, department) => sum + department.employees, 0);
  const averageWorkload = Math.round(departmentWorkspaces.reduce((sum, department) => sum + department.workload, 0) / departmentWorkspaces.length);
  const crossDepartmentProjects = projects.filter((project) => project.team >= 18).length;

  return (<AutoLocalizedContent>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-6">
        <GlassCard className="overflow-hidden p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="gold">Departments Command Center</Badge>
              <h2 className="mt-4 text-3xl font-black text-white">Atlas department operations</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">
                Monitor department capacity, project coverage, current priorities, and coordination risks across the Atlas enterprise workspace.
              </p>
            </div>
            <Button variant="secondary" icon={<SlidersHorizontal className="h-4 w-4" />}>Workspace controls</Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DepartmentOverviewMetric label="Total departments" value={String(departmentWorkspaces.length)} icon={<Building2 className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Total employees" value={String(totalEmployees)} icon={<UsersRound className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Average workload" value={`${averageWorkload}%`} icon={<Activity className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Cross-project teams" value={String(crossDepartmentProjects)} icon={<FolderKanban className="h-5 w-5" />} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
              <Search className="h-4 w-4 text-gold" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search departments or leads"
                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36"
              />
            </label>
            <DepartmentFilter value={workloadFilter} onChange={setWorkloadFilter} options={["All workloads", "High workload", "Balanced"]} />
            <DepartmentFilter value={statusFilter} onChange={setStatusFilter} options={["All statuses", ...departmentWorkspaces.map((department) => department.status)]} />
            <DepartmentFilter value={activityFilter} onChange={setActivityFilter} options={["All activity", "3+ projects", "4+ projects"]} />
          </div>
        </GlassCard>

        {filteredDepartments.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredDepartments.map((department) => (
              <DepartmentCard
                key={department.name}
                department={department}
                selected={selected.name === department.name}
                onSelect={() => setSelectedDepartment(department.name)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No departments match these filters"
            description="Adjust the search or filters to bring department workspaces back into view."
            action={<Button variant="secondary" onClick={() => { setQuery(""); setWorkloadFilter("All workloads"); setStatusFilter("All statuses"); setActivityFilter("All activity"); }}>Reset filters</Button>}
          />
        )}

        <GlassCard className="p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="blue">State coverage</Badge>
              <h3 className="mt-3 text-2xl font-black text-white">Empty, loading, and error readiness</h3>
            </div>
            <Badge tone="neutral">UI foundation</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatePreview title="Loading state" text="Skeleton cards are ready for future live department data." tone="blue" />
            <StatePreview title="Empty state" text="Helpful recovery actions appear when filters return no departments." tone="gold" />
            <StatePreview title="Error state" text="Clear alerts can be shown if future organization data fails to load." tone="danger" />
          </div>
        </GlassCard>
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <DepartmentDetailsPanel department={selected} />
        <DepartmentAiInsights />
      </aside>
    </div>
  </AutoLocalizedContent>);
}

function DepartmentCard({ department, selected, onSelect }: { department: DepartmentWorkspace; selected: boolean; onSelect: () => void }) {
  const Icon = department.icon;
  return (<AutoLocalizedContent>
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-[1.75rem] border p-5 text-right shadow-ds-md backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07] ${
        selected ? "border-[#D4AF37]/42 bg-[#D4AF37]/10" : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/22 bg-[#D4AF37]/10 text-gold shadow-gold-glow">
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-white">{department.name}</h3>
            <p className="mt-1 text-sm text-ds-text/52">{department.lead} · {department.leadRole}</p>
          </div>
        </div>
        <Badge tone={department.statusTone}>{department.status}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniKpi label="Employees" value={String(department.employees)} />
        <MiniKpi label="Projects" value={String(department.activeProjects)} />
        <MiniKpi label="Performance" value={department.performance} />
      </div>
      <div className="mt-5">
        <ProgressBar value={department.workload} label="Workload" tone={department.workload > 80 ? "warning" : department.workload > 72 ? "blue" : "success"} />
      </div>
      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-text/40">Current priorities</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {department.priorities.slice(0, 3).map((priority) => <Badge key={priority} tone="neutral">{priority}</Badge>)}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-black text-gold">
        <span>View department details</span>
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
      </div>
    </button>
  </AutoLocalizedContent>);
}

function DepartmentDetailsPanel({ department }: { department: DepartmentWorkspace }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={department.statusTone}>{department.status}</Badge>
          <h3 className="mt-3 text-2xl font-black text-white">{department.name}</h3>
          <p className="mt-2 text-sm text-ds-text/54">{department.performance}</p>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#F9E7A0] to-[#916B14] font-black text-black shadow-gold-glow">
          {department.name.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-text/42">Department lead</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#4F8CFF]/16 font-black text-[#9EC0FF]">{department.lead.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
          <div>
            <p className="font-black text-white">{department.lead}</p>
            <p className="text-sm text-ds-text/48">{department.leadRole}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <DetailSection title="Team members" items={department.members} icon={<UsersRound className="h-4 w-4" />} />
        <DetailSection title="Assigned projects" items={projects.slice(0, department.activeProjects).map((project) => project.title)} icon={<FolderKanban className="h-4 w-4" />} />
        <DetailSection title="Current tasks" items={department.tasks} icon={<ClipboardList className="h-4 w-4" />} />
        <DetailSection title="Recent activity" items={department.activity} icon={<Activity className="h-4 w-4" />} />
        <DetailSection title="Department documents" items={department.documents} icon={<FileText className="h-4 w-4" />} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function DepartmentAiInsights() {
  const insights = [
    { title: "Staffing risk", text: "Engineering is above 80% workload. Add temporary site support before the next inspection cycle.", tone: "warning" as const },
    { title: "Workload imbalance", text: "Logistics and Finance have capacity to support procurement reporting this week.", tone: "blue" as const },
    { title: "Coordination recommendation", text: "Run a joint Engineering + Architecture review before Rabat permit resubmission.", tone: "gold" as const },
    { title: "Delayed department alert", text: "Procurement decisions may affect Tangier steel milestones if awards slip past Friday.", tone: "danger" as const }
  ];

  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4">
        <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
        <div>
          <Badge tone="blue">VORA Insights</Badge>
          <h3 className="mt-3 text-xl font-black text-white">Department intelligence</h3>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${insight.tone === "danger" ? "text-[#EF4444]" : insight.tone === "warning" ? "text-[#FFB020]" : insight.tone === "blue" ? "text-[#4F8CFF]" : "text-gold"}`} />
              <p className="font-black text-white">{insight.title}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-ds-text/56">{insight.text}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function DetailSection({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2 text-gold">
        {icon}
        <p className="text-sm font-black text-white">{title}</p>
      </div>
      <div className="grid gap-2">
        {items.slice(0, 4).map((item) => (
          <p key={item} className="rounded-xl bg-black/18 px-3 py-2 text-sm leading-6 text-ds-text/58">{item}</p>
        ))}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function DepartmentFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (<AutoLocalizedContent>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-sm font-black text-white outline-none transition focus:border-[#D4AF37]/44"
    >
      {Array.from(new Set(options)).map((option) => (
        <option key={option} value={option} className="bg-[#111827] text-white">{option}</option>
      ))}
    </select>
  </AutoLocalizedContent>);
}

function DepartmentOverviewMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (<AutoLocalizedContent>
    <div className="rounded-2xl border border-white/10 bg-black/18 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-ds-text/38">{label}</p>
      <p className="mt-2 truncate text-sm font-black text-white">{value}</p>
    </div>
  </AutoLocalizedContent>);
}

function StatePreview({ title, text, tone }: { title: string; text: string; tone: "gold" | "blue" | "danger" }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
      <Badge tone={tone}>{title}</Badge>
      <p className="mt-3 text-sm leading-7 text-ds-text/56">{text}</p>
    </div>
  </AutoLocalizedContent>);
}

function EmployeesWorkspace() {
  const [selectedEmployee, setSelectedEmployee] = useState(employeeWorkspaces[0].name);
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [availabilityFilter, setAvailabilityFilter] = useState("All availability");
  const [workloadFilter, setWorkloadFilter] = useState("All workloads");

  const filteredEmployees = employeeWorkspaces.filter((employee) => {
    const searchText = `${employee.name} ${employee.role} ${employee.department}`.toLowerCase();
    const matchesQuery = searchText.includes(query.toLowerCase());
    const matchesDepartment = departmentFilter === "All departments" || employee.department === departmentFilter;
    const matchesRole = roleFilter === "All roles" || employee.role === roleFilter;
    const matchesAvailability = availabilityFilter === "All availability" || employee.availability === availabilityFilter;
    const matchesWorkload =
      workloadFilter === "All workloads" ||
      (workloadFilter === "Overloaded" && employee.workload >= 80) ||
      (workloadFilter === "Balanced" && employee.workload >= 60 && employee.workload < 80) ||
      (workloadFilter === "Available capacity" && employee.workload < 60);

    return matchesQuery && matchesDepartment && matchesRole && matchesAvailability && matchesWorkload;
  });

  const selected = employeeWorkspaces.find((employee) => employee.name === selectedEmployee) || employeeWorkspaces[0];
  const activeEmployees = employeeWorkspaces.filter((employee) => employee.status === "Active").length;
  const availableEmployees = employeeWorkspaces.filter((employee) => employee.workload < 70).length;
  const coveredDepartments = new Set(employeeWorkspaces.map((employee) => employee.department)).size;

  return (<AutoLocalizedContent>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-6">
        <GlassCard className="overflow-hidden p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="gold">Employees Workspace</Badge>
              <h2 className="mt-4 text-3xl font-black text-white">Atlas workforce command center</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">
                Track roles, capacity, skills, certifications, assigned projects, and workforce risk across Atlas Construction Group.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<UserCheck className="h-4 w-4" />}>Invite employee</Button>
              <Button variant="secondary" icon={<SlidersHorizontal className="h-4 w-4" />}>Workforce filters</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DepartmentOverviewMetric label="Total employees" value={String(employeeWorkspaces.length)} icon={<UsersRound className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Active employees" value={String(activeEmployees)} icon={<UserCheck className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Available capacity" value={String(availableEmployees)} icon={<Activity className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Departments covered" value={String(coveredDepartments)} icon={<Building2 className="h-5 w-5" />} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_165px_165px_175px_165px]">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
              <Search className="h-4 w-4 text-gold" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, role or department"
                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36"
              />
            </label>
            <DepartmentFilter value={departmentFilter} onChange={setDepartmentFilter} options={["All departments", ...Array.from(new Set(employeeWorkspaces.map((employee) => employee.department)))]} />
            <DepartmentFilter value={roleFilter} onChange={setRoleFilter} options={["All roles", ...employeeWorkspaces.map((employee) => employee.role)]} />
            <DepartmentFilter value={availabilityFilter} onChange={setAvailabilityFilter} options={["All availability", ...employeeWorkspaces.map((employee) => employee.availability)]} />
            <DepartmentFilter value={workloadFilter} onChange={setWorkloadFilter} options={["All workloads", "Overloaded", "Balanced", "Available capacity"]} />
          </div>
        </GlassCard>

        {filteredEmployees.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredEmployees.map((employee) => (
              <EmployeeWorkspaceCard
                key={employee.name}
                employee={employee}
                selected={selected.name === employee.name}
                onSelect={() => setSelectedEmployee(employee.name)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No employees match these filters"
            description="Reset filters or search another role to bring workforce records back."
            action={<Button variant="secondary" onClick={() => { setQuery(""); setDepartmentFilter("All departments"); setRoleFilter("All roles"); setAvailabilityFilter("All availability"); setWorkloadFilter("All workloads"); }}>Reset filters</Button>}
          />
        )}

        <OrganizationChartPreview />
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <EmployeeProfilePanel employee={selected} />
        <WorkforceAiInsights />
      </aside>
    </div>
  </AutoLocalizedContent>);
}

function EmployeeWorkspaceCard({ employee, selected, onSelect }: { employee: EmployeeWorkspace; selected: boolean; onSelect: () => void }) {
  return (<AutoLocalizedContent>
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-[1.75rem] border p-5 text-right shadow-ds-md backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07] ${
        selected ? "border-[#D4AF37]/42 bg-[#D4AF37]/10" : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <EmployeeAvatar name={employee.name} />
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black text-white">{employee.name}</h3>
            <p className="mt-1 text-sm text-ds-text/52">{employee.role} · {employee.department}</p>
          </div>
        </div>
        <Badge tone={employee.statusTone}>{employee.status}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniKpi label="Availability" value={employee.availability} />
        <MiniKpi label="Projects" value={String(employee.assignedProjects.length)} />
        <MiniKpi label="Skills" value={String(employee.skills.length)} />
      </div>

      <div className="mt-5">
        <ProgressBar value={employee.workload} label="Current workload" tone={employee.workload >= 80 ? "warning" : employee.workload < 60 ? "success" : "blue"} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {employee.assignedProjects.slice(0, 2).map((project) => <Badge key={project} tone="neutral">{project}</Badge>)}
      </div>

      <div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-sm text-ds-text/54">
        <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" />{employee.email}</span>
        <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" />{employee.phone}</span>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm font-black text-gold">
        <span>Open profile panel</span>
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
      </div>
    </button>
  </AutoLocalizedContent>);
}

function EmployeeProfilePanel({ employee }: { employee: EmployeeWorkspace }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <EmployeeAvatar name={employee.name} large />
          <div>
            <Badge tone={employee.statusTone}>{employee.status}</Badge>
            <h3 className="mt-3 text-2xl font-black text-white">{employee.name}</h3>
            <p className="mt-2 text-sm text-ds-text/54">{employee.role} · {employee.department}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-text/42">Personal information</p>
        <div className="mt-3 grid gap-2 text-sm leading-6 text-ds-text/58">
          <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" />{employee.email}</span>
          <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" />{employee.phone}</span>
          <span className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-gold" />Manager: {employee.manager}</span>
          <span className="flex items-center gap-2"><Activity className="h-4 w-4 text-gold" />Availability: {employee.availability}</span>
        </div>
      </div>

      <div className="mt-5">
        <ProgressBar value={employee.workload} label="Performance workload" tone={employee.workload >= 80 ? "warning" : employee.workload < 60 ? "success" : "blue"} />
        <p className="mt-3 text-sm leading-7 text-ds-text/58">{employee.performance}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <DetailSection title="Skills" items={employee.skills} icon={<ShieldCheck className="h-4 w-4" />} />
        <DetailSection title="Certifications" items={employee.certifications} icon={<UserCheck className="h-4 w-4" />} />
        <DetailSection title="Assigned projects" items={employee.assignedProjects} icon={<FolderKanban className="h-4 w-4" />} />
        <DetailSection title="Current tasks" items={employee.tasks} icon={<ClipboardList className="h-4 w-4" />} />
        <DetailSection title="Recent activity" items={employee.activity} icon={<Activity className="h-4 w-4" />} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function OrganizationChartPreview() {
  const ceo = employeeWorkspaces[0];
  const leads = employeeWorkspaces.filter((employee) => ["Project Manager", "Architect", "Procurement Manager", "Logistics Coordinator", "Finance Manager", "HR Manager"].includes(employee.role));
  const members = employeeWorkspaces.filter((employee) => ![ceo, ...leads].includes(employee));

  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="blue">Organization Chart</Badge>
          <h3 className="mt-3 text-2xl font-black text-white">Workforce structure preview</h3>
        </div>
        <Network className="h-6 w-6 text-gold" />
      </div>

      <div className="grid gap-4">
        <OrgChartRow title="CEO" employees={[ceo]} tone="gold" />
        <OrgChartRow title="Department Leads" employees={leads} tone="blue" />
        <OrgChartRow title="Team Members" employees={members} tone="neutral" />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function OrgChartRow({ title, employees, tone }: { title: string; employees: EmployeeWorkspace[]; tone: "gold" | "blue" | "neutral" }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Badge tone={tone}>{title}</Badge>
        <span className="text-xs font-black text-ds-text/42">{employees.length} people</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {employees.map((employee) => (
          <div key={employee.name} className="flex items-center gap-3 rounded-2xl bg-black/18 p-3">
            <EmployeeAvatar name={employee.name} />
            <div className="min-w-0">
              <p className="truncate font-black text-white">{employee.name}</p>
              <p className="truncate text-xs text-ds-text/48">{employee.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </AutoLocalizedContent>);
}

function WorkforceAiInsights() {
  const insights = [
    { title: "Resource allocation", text: "Move one available logistics coordinator to support procurement reporting for Tangier this week.", tone: "blue" as const },
    { title: "Staffing recommendation", text: "Assign temporary site engineering support to Omar before the next inspection cycle.", tone: "warning" as const },
    { title: "Skill gap", text: "BIM capacity is concentrated with one engineer. Add backup model coordination coverage.", tone: "gold" as const },
    { title: "Overloaded employees", text: "Omar Haddad and Rachid Kabbaj are above 80% workload and should not receive new urgent tasks.", tone: "danger" as const },
    { title: "Available capacity", text: "HR and Logistics have room to support onboarding, staffing, and procurement coordination.", tone: "success" as const }
  ];

  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4">
        <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
        <div>
          <Badge tone="blue">VORA Workforce</Badge>
          <h3 className="mt-3 text-xl font-black text-white">AI workforce insights</h3>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${insight.tone === "danger" ? "text-[#EF4444]" : insight.tone === "warning" ? "text-[#FFB020]" : insight.tone === "blue" ? "text-[#4F8CFF]" : insight.tone === "success" ? "text-[#16C784]" : "text-gold"}`} />
              <p className="font-black text-white">{insight.title}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-ds-text/56">{insight.text}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function EmployeeAvatar({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (<AutoLocalizedContent>
    <span className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#F9E7A0] via-[#D4AF37] to-[#916B14] font-black text-black shadow-gold-glow ring-1 ring-white/20 ${large ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm"}`}>
      {initials}
    </span>
  </AutoLocalizedContent>);
}

function RolesWorkspace() {
  const [selectedRole, setSelectedRole] = useState(roleWorkspaces[0].name);
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [levelFilter, setLevelFilter] = useState("All permission levels");

  const filteredRoles = roleWorkspaces.filter((role) => {
    const matchesQuery = `${role.name} ${role.department} ${role.permissionLevel}`.toLowerCase().includes(query.toLowerCase());
    const matchesDepartment = departmentFilter === "All departments" || role.department === departmentFilter;
    const matchesLevel = levelFilter === "All permission levels" || role.permissionLevel === levelFilter;
    return matchesQuery && matchesDepartment && matchesLevel;
  });

  const selected = roleWorkspaces.find((role) => role.name === selectedRole) || roleWorkspaces[0];
  const activeUsers = roleWorkspaces.reduce((sum, role) => sum + role.users.length, 0);
  const adminRoles = roleWorkspaces.filter((role) => ["Owner", "Admin"].includes(role.permissionLevel)).length;
  const customRoles = roleWorkspaces.filter((role) => !["CEO", "Project Manager", "Site Engineer", "Architect"].includes(role.name)).length;

  return (<AutoLocalizedContent>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-6">
        <GlassCard className="overflow-hidden p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge tone="gold">Roles & Permissions</Badge>
              <h2 className="mt-4 text-3xl font-black text-white">Atlas access governance</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ds-text/58">
                Review demo role access, permission levels, responsibilities, and security signals for the Atlas organization workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<LockKeyhole className="h-4 w-4" />}>Audit access</Button>
              <Button variant="secondary" icon={<KeyRound className="h-4 w-4" />}>Create role</Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DepartmentOverviewMetric label="Total roles" value={String(roleWorkspaces.length)} icon={<KeyRound className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Active users" value={String(activeUsers)} icon={<UsersRound className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Admin roles" value={String(adminRoles)} icon={<ShieldCheck className="h-5 w-5" />} />
            <DepartmentOverviewMetric label="Custom roles" value={String(customRoles)} icon={<SlidersHorizontal className="h-5 w-5" />} />
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_210px]">
            <label className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 shadow-inner shadow-black/20 transition focus-within:border-[#D4AF37]/44">
              <Search className="h-4 w-4 text-gold" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roles, departments or access"
                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-ds-text/36"
              />
            </label>
            <DepartmentFilter value={departmentFilter} onChange={setDepartmentFilter} options={["All departments", ...Array.from(new Set(roleWorkspaces.map((role) => role.department)))]} />
            <DepartmentFilter value={levelFilter} onChange={setLevelFilter} options={["All permission levels", ...Array.from(new Set(roleWorkspaces.map((role) => role.permissionLevel)))]} />
          </div>
        </GlassCard>

        {filteredRoles.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredRoles.map((role) => (
              <RoleCard key={role.name} role={role} selected={selected.name === role.name} onSelect={() => setSelectedRole(role.name)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No roles match these filters"
            description="Reset search or filters to review the full permissions model."
            action={<Button variant="secondary" onClick={() => { setQuery(""); setDepartmentFilter("All departments"); setLevelFilter("All permission levels"); }}>Reset filters</Button>}
          />
        )}

        <PermissionMatrix selectedRole={selected} />
      </div>

      <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
        <RoleDetailsPanel role={selected} />
        <SecurityAiInsights />
      </aside>
    </div>
  </AutoLocalizedContent>);
}

function RoleCard({ role, selected, onSelect }: { role: RoleWorkspace; selected: boolean; onSelect: () => void }) {
  return (<AutoLocalizedContent>
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-[1.75rem] border p-5 text-right shadow-ds-md backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07] ${
        selected ? "border-[#D4AF37]/42 bg-[#D4AF37]/10" : "border-white/10 bg-white/[0.045]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#D4AF37]/22 bg-[#D4AF37]/10 text-gold shadow-gold-glow">
            <KeyRound className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-white">{role.name}</h3>
            <p className="mt-1 text-sm text-ds-text/52">{role.department} · {role.scope}</p>
          </div>
        </div>
        <Badge tone={role.levelTone}>{role.permissionLevel}</Badge>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniKpi label="Users" value={String(role.users.length)} />
        <MiniKpi label="Access" value={role.accessLevel} />
        <MiniKpi label="Status" value={role.status} />
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-ds-text/40">Assigned responsibilities</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {role.responsibilities.slice(0, 3).map((responsibility) => <Badge key={responsibility} tone="neutral">{responsibility}</Badge>)}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm font-black text-gold">
        <span>Review role permissions</span>
        <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
      </div>
    </button>
  </AutoLocalizedContent>);
}

function PermissionMatrix({ selectedRole }: { selectedRole: RoleWorkspace }) {
  const rank = roleLevelRank[selectedRole.permissionLevel] || 1;
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Badge tone="blue">Permission Matrix</Badge>
          <h3 className="mt-3 text-2xl font-black text-white">{selectedRole.name} access map</h3>
        </div>
        <Badge tone={selectedRole.levelTone}>{selectedRole.permissionLevel}</Badge>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[780px] rounded-[1.5rem] border border-white/10 bg-black/16">
          <div className="grid grid-cols-[180px_repeat(6,1fr)] border-b border-white/10 text-xs font-black uppercase tracking-[0.08em] text-ds-text/44">
            <div className="p-3">Workspace</div>
            {permissionLevels.map((level) => <div key={level} className="p-3 text-center">{level}</div>)}
          </div>
          {permissionAreas.map((area) => (
            <div key={area} className="grid grid-cols-[180px_repeat(6,1fr)] border-b border-white/10 last:border-b-0">
              <div className="p-3 text-sm font-black text-white">{area}</div>
              {permissionLevels.map((level, index) => {
                const allowed = area === "Marketplace" ? index === 0 && rank >= 2 : index + 1 <= rank;
                return (
                  <div key={level} className="grid place-items-center p-3">
                    <span className={`h-3 w-3 rounded-full ${allowed ? "bg-[#D4AF37] shadow-gold-glow" : "bg-white/12"}`} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function RoleDetailsPanel({ role }: { role: RoleWorkspace }) {
  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={role.levelTone}>{role.permissionLevel}</Badge>
          <h3 className="mt-3 text-2xl font-black text-white">{role.name}</h3>
          <p className="mt-2 text-sm leading-6 text-ds-text/54">{role.scope}</p>
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#F9E7A0] to-[#916B14] text-black shadow-gold-glow">
          <LockKeyhole className="h-6 w-6" />
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MiniKpi label="Department" value={role.department} />
        <MiniKpi label="Access level" value={role.accessLevel} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <DetailSection title="Responsibilities" items={role.responsibilities} icon={<ClipboardList className="h-4 w-4" />} />
        <DetailSection title="Assigned employees" items={role.users} icon={<UsersRound className="h-4 w-4" />} />
        <DetailSection title="Permission summary" items={[role.scope, `${role.permissionLevel} permissions`, `${role.accessLevel} access ceiling`]} icon={<ShieldCheck className="h-4 w-4" />} />
        <DetailSection title="Activity preview" items={role.activity} icon={<Activity className="h-4 w-4" />} />
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function SecurityAiInsights() {
  const insights = [
    { title: "Excessive permissions", text: "Operations Director and HR Manager both hold Admin-level access. Review whether HR needs organization-wide controls.", tone: "warning" as const },
    { title: "Missing approvers", text: "Marketplace is coming soon. Define procurement and finance approvers before enabling vendor workflows.", tone: "blue" as const },
    { title: "Security recommendation", text: "Separate Finance approval from Quantity Surveyor edit access for stronger cost governance.", tone: "gold" as const },
    { title: "Access risk", text: "Quantity Surveyor workload is high and includes edit access across three projects. Add review checkpoints.", tone: "danger" as const }
  ];

  return (<AutoLocalizedContent>
    <GlassCard className="p-5">
      <div className="flex items-start gap-4">
        <VoraVisual variant="avatar" className="h-16 w-16 rounded-2xl" sizes="64px" />
        <div>
          <Badge tone="blue">VORA Security</Badge>
          <h3 className="mt-3 text-xl font-black text-white">AI access insights</h3>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${insight.tone === "danger" ? "text-[#EF4444]" : insight.tone === "warning" ? "text-[#FFB020]" : insight.tone === "blue" ? "text-[#4F8CFF]" : "text-gold"}`} />
              <p className="font-black text-white">{insight.title}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-ds-text/56">{insight.text}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  </AutoLocalizedContent>);
}

function EmployeeCard({ user }: { user: { name: string; role: string; department: string; status: string; tasks: number; workload: number } }) {
  return (<AutoLocalizedContent>
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-start justify-between gap-3"><div><Badge tone="success">{user.status}</Badge><h3 className="mt-3 text-lg font-black text-white">{user.name}</h3><p className="mt-1 text-sm text-ds-text/48">{user.role} · {user.department}</p></div><UsersRound className="h-5 w-5 text-gold" /></div>
      <div className="mt-4"><ProgressBar value={user.workload} label={`${user.tasks} tasks`} tone={user.workload > 80 ? "warning" : "blue"} /></div>
    </div>
  </AutoLocalizedContent>);
}

function HeaderMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"><div className="flex items-center gap-2 text-gold">{icon}<span className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</span></div><p className="mt-2 truncate font-black text-white">{value}</p></div></AutoLocalizedContent>); }
function ProfileKpi({ label, value }: { label: string; value: string }) { return (<AutoLocalizedContent><div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"><p className="text-xs font-black uppercase tracking-[0.1em] text-ds-text/42">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p></div></AutoLocalizedContent>); }

