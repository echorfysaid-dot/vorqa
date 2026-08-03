import { Bot, CheckCircle2, Clock3, Crown, FileText, FolderKanban, Heart, Sparkles, UsersRound } from "lucide-react";

export const demoCompany = {
  name: "Atlas Construction Group",
  status: "Enterprise demo account",
  workspace: "North Africa Construction Command Center",
  headquarters: "Casablanca, Morocco",
  role: "CEO Workspace"
};

export const demoOrganizations = [
  {
    id: "atlas",
    name: "Atlas Construction Group",
    logo: "ACG",
    industry: "Construction & Real Estate Development",
    location: "Casablanca, Morocco",
    employees: 248,
    activeProjects: 4,
    role: "Owner",
    status: "Active",
    workspace: "North Africa Construction Command Center",
    recentProjects: ["Luxury Villa Casablanca", "Residential Complex Rabat", "Industrial Warehouse Tangier"],
    teamSummary: "Engineering, Architecture, Procurement, Logistics, Finance"
  },
  {
    id: "northbuild",
    name: "NorthBuild Engineering",
    logo: "NBE",
    industry: "Civil Engineering Consultancy",
    location: "Rabat, Morocco",
    employees: 86,
    activeProjects: 7,
    role: "Admin",
    status: "Active",
    workspace: "Engineering Delivery Workspace",
    recentProjects: ["Bridge Rehabilitation Fez", "Rabat Infrastructure Audit", "Coastal Drainage Upgrade"],
    teamSummary: "Civil, Structural, Surveying, Project Controls"
  },
  {
    id: "maghreb-logistics",
    name: "Maghreb Logistics",
    logo: "MLG",
    industry: "Construction Logistics & Supply Chain",
    location: "Tangier, Morocco",
    employees: 132,
    activeProjects: 5,
    role: "Member",
    status: "Pending invitation",
    workspace: "Regional Logistics Control",
    recentProjects: ["Tangier Port Materials Hub", "Casablanca Delivery Network", "Northern Crane Fleet"],
    teamSummary: "Fleet, Warehousing, Dispatch, Compliance"
  },
  {
    id: "urbanform",
    name: "UrbanForm Architects",
    logo: "UFA",
    industry: "Architecture & Urban Design",
    location: "Marrakech, Morocco",
    employees: 64,
    activeProjects: 9,
    role: "Guest",
    status: "Suspended organization",
    workspace: "Design Studio Workspace",
    recentProjects: ["Marrakech Office Tower", "Agadir Resort Concept", "Urban Housing Prototype"],
    teamSummary: "Architecture, BIM, Interiors, Urban Planning"
  }
];

export const departments = ["Engineering", "Architecture", "Procurement", "Logistics", "Finance"];

export const demoUsers = [
  { name: "Yassine El Mansouri", role: "CEO", department: "Executive", status: "Active", tasks: 7, workload: 62 },
  { name: "Nadia Benali", role: "Project Manager", department: "Engineering", status: "Active", tasks: 14, workload: 78 },
  { name: "Omar Haddad", role: "Site Engineer", department: "Engineering", status: "Active", tasks: 11, workload: 84 },
  { name: "Salma Idrissi", role: "Architect", department: "Architecture", status: "Active", tasks: 9, workload: 70 },
  { name: "Karim Berrada", role: "Procurement Manager", department: "Procurement", status: "Active", tasks: 12, workload: 66 },
  { name: "Hajar Amrani", role: "Logistics Coordinator", department: "Logistics", status: "Active", tasks: 8, workload: 58 }
];

export const workspaceStats = [
  { label: "Active Projects", value: "4", delta: "MAD 418M portfolio", icon: FolderKanban },
  { label: "Project Documents", value: "342", delta: "+28 this week", icon: FileText },
  { label: "Favorite Outputs", value: "19", delta: "Board-ready", icon: Heart },
  { label: "Delivery Health", value: "87%", delta: "VORA score", icon: CheckCircle2 }
];

export const projects = [
  {
    id: "PRJ-1048",
    title: "Luxury Villa Casablanca",
    type: "Residential Villa",
    status: "Execution",
    updatedAt: "12 minutes ago",
    score: 68,
    budget: "MAD 24.5M",
    timeline: "Feb 2026 - Nov 2026",
    team: 18,
    documents: 86,
    knowledgeFiles: 34,
    phase: "Structural works"
  },
  {
    id: "PRJ-2041",
    title: "Residential Complex Rabat",
    type: "Residential Complex",
    status: "Design Review",
    updatedAt: "Today",
    score: 42,
    budget: "MAD 162M",
    timeline: "Mar 2026 - Jun 2027",
    team: 42,
    documents: 118,
    knowledgeFiles: 51,
    phase: "Permit package"
  },
  {
    id: "PRJ-3092",
    title: "Industrial Warehouse Tangier",
    type: "Industrial Warehouse",
    status: "Procurement",
    updatedAt: "Yesterday",
    score: 57,
    budget: "MAD 78M",
    timeline: "Jan 2026 - Dec 2026",
    team: 27,
    documents: 74,
    knowledgeFiles: 29,
    phase: "Steel supplier lock"
  },
  {
    id: "PRJ-4120",
    title: "Office Tower Marrakech",
    type: "Commercial Tower",
    status: "Planning",
    updatedAt: "2 days ago",
    score: 31,
    budget: "MAD 153M",
    timeline: "Apr 2026 - Aug 2027",
    team: 23,
    documents: 64,
    knowledgeFiles: 18,
    phase: "Concept validation"
  }
];

export const projectDetails = {
  "PRJ-1048": {
    location: "Anfa, Casablanca",
    budgetPlanned: "MAD 24.5M",
    actualCost: "MAD 15.8M",
    remainingBudget: "MAD 8.7M",
    budgetHealth: 84,
    timelineHealth: 72,
    documents: ["Executive Progress Report.pdf", "Structural Inspection Notes.docx", "Material Approval Sheet.xlsx"],
    knowledgeFiles: ["Villa drawings package.pdf", "Supplier quotations.xlsx", "Site photos July.zip"],
    reports: ["Weekly Executive Report", "Budget Variance Report", "Risk Register Update"],
    aiHistory: ["VORA analyzed façade procurement risk.", "Generated executive summary for board review.", "Created mitigation checklist for concrete curing delay."],
    tasks: ["Finalize MEP coordination", "Confirm marble supplier", "Review pool waterproofing method"],
    milestones: ["Structural frame completion", "MEP rough-in", "Facade procurement"],
    team: demoUsers
  },
  "PRJ-2041": {
    location: "Hay Riad, Rabat",
    budgetPlanned: "MAD 162M",
    actualCost: "MAD 18.4M",
    remainingBudget: "MAD 143.6M",
    budgetHealth: 76,
    timelineHealth: 61,
    documents: ["Permit Submission Set.pdf", "Apartment Mix Study.xlsx", "Client Design Comments.docx"],
    knowledgeFiles: ["Urban planning rules.pdf", "Geotechnical report.pdf", "Parking concept.dwg"],
    reports: ["Design Review Report", "Permit Readiness Report", "Stakeholder Summary"],
    aiHistory: ["VORA summarized permit blockers.", "Generated apartment mix recommendation.", "Prepared city submission checklist."],
    tasks: ["Complete fire safety update", "Resolve parking ramp geometry", "Submit revised elevations"],
    milestones: ["Permit package freeze", "Client design approval", "Tender package start"],
    team: demoUsers.slice(0, 5)
  },
  "PRJ-3092": {
    location: "Tangier Free Zone",
    budgetPlanned: "MAD 78M",
    actualCost: "MAD 31.2M",
    remainingBudget: "MAD 46.8M",
    budgetHealth: 81,
    timelineHealth: 69,
    documents: ["Steel Procurement Matrix.xlsx", "Warehouse Layout.pdf", "Logistics Plan.docx"],
    knowledgeFiles: ["Supplier bids.zip", "Port access requirements.pdf", "Fire system specs.pdf"],
    reports: ["Procurement Status Report", "Logistics Risk Report", "Cost Forecast"],
    aiHistory: ["VORA compared steel supplier bids.", "Generated logistics sequencing plan.", "Flagged fire system approval dependency."],
    tasks: ["Award steel package", "Book crane schedule", "Validate dock leveler supplier"],
    milestones: ["Steel supplier award", "Foundation completion", "Roofing start"],
    team: demoUsers
  },
  "PRJ-4120": {
    location: "Gueliz, Marrakech",
    budgetPlanned: "MAD 153M",
    actualCost: "MAD 6.9M",
    remainingBudget: "MAD 146.1M",
    budgetHealth: 89,
    timelineHealth: 54,
    documents: ["Concept Massing Deck.pdf", "Investor Brief.docx", "Preliminary Budget.xlsx"],
    knowledgeFiles: ["Zoning extract.pdf", "Market study.pdf", "Tower precedents.pdf"],
    reports: ["Investor Readiness Report", "Concept Risk Memo", "Planning Assumptions"],
    aiHistory: ["VORA generated investor-ready summary.", "Created zoning risk checklist.", "Estimated concept-stage budget ranges."],
    tasks: ["Validate height restrictions", "Prepare investor presentation", "Review parking ratio"],
    milestones: ["Concept approval", "Feasibility sign-off", "Architectural competition"],
    team: demoUsers.slice(0, 4)
  }
} as const;

export const savedGenerations = [
  { title: "Luxury Villa Weekly Executive Report", tool: "Document Generator", date: "16 July", favorite: true },
  { title: "Residential Complex Permit Checklist", tool: "Document Generator", date: "15 July", favorite: true },
  { title: "Industrial Warehouse BOQ Summary", tool: "Document Generator", date: "14 July", favorite: false },
  { title: "Office Tower Investor Brief", tool: "Landing Page Generator", date: "13 July", favorite: true }
];

export const recentActivity = [
  { title: "VORA generated a board report", detail: "Luxury Villa Casablanca", time: "8 minutes ago", icon: FileText },
  { title: "Procurement risk flagged", detail: "Industrial Warehouse Tangier", time: "34 minutes ago", icon: Bot },
  { title: "Budget forecast updated", detail: "Residential Complex Rabat", time: "Today", icon: CheckCircle2 },
  { title: "Team invite prepared", detail: "Office Tower Marrakech", time: "Yesterday", icon: UsersRound }
];

export const notifications = [
  { title: "Budget variance detected", text: "Luxury Villa Casablanca has a 6% procurement variance requiring review.", unread: true },
  { title: "Permit package incomplete", text: "Residential Complex Rabat is missing fire safety updates.", unread: true },
  { title: "Weekly briefing ready", text: "VORA prepared a portfolio summary for Atlas Construction Group.", unread: false }
];

export const onboardingSteps = [
  { title: "Define your role", text: "Choose how Atlas teams should see project information.", icon: Crown },
  { title: "Let VORA personalize", text: "VORA prepares workspace recommendations and operating defaults.", icon: Sparkles },
  { title: "Start execution", text: "Enter the command center and continue managing delivery.", icon: CheckCircle2 }
];

export const providerStatus = [
  { name: "OpenAI", status: "Ready via OPENAI_API_KEY", active: true },
  { name: "Anthropic", status: "Prepared via ANTHROPIC_API_KEY", active: false },
  { name: "Google Gemini", status: "Prepared via GEMINI_API_KEY", active: false },
  { name: "OpenRouter", status: "Prepared via OPENROUTER_API_KEY", active: false }
];

export const skeletonRows = Array.from({ length: 4 }, (_, index) => index);

export const investorMetrics = [
  { label: "Time saved", value: "42h", icon: Clock3 },
  { label: "AI workflows", value: "18", icon: Sparkles },
  { label: "VORA ready", value: "Live", icon: Bot }
];
