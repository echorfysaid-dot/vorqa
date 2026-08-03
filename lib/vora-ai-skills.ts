import type { VoraProjectContext } from "@/lib/ai-context-repository";

export type VoraSkillId =
  | "project-health-review"
  | "budget-review"
  | "timeline-review"
  | "risk-detection"
  | "missing-documents"
  | "delayed-tasks"
  | "upcoming-milestones"
  | "knowledge-suggestions"
  | "safety-recommendations"
  | "productivity-suggestions";

export type VoraSkill = {
  id: VoraSkillId;
  title: string;
  prompt: string;
  modules: string[];
};

export const voraSkills: VoraSkill[] = [
  {
    id: "project-health-review",
    title: "Project Health Review",
    prompt: "راجع صحة المشروع بناء على التقدم، المهام، الجدول، الميزانية، الوثائق، والمعرفة.",
    modules: ["Project", "Tasks", "Timeline", "Budget", "Documents", "Knowledge"]
  },
  {
    id: "budget-review",
    title: "Budget Review",
    prompt: "حلل الميزانية وحدد البنود المتجاوزة والالتزامات والتوصيات المالية.",
    modules: ["Budget", "Procurement", "Documents"]
  },
  {
    id: "timeline-review",
    title: "Timeline Review",
    prompt: "راجع الجدول الزمني، المراحل، الاعتماديات، ومخاطر التأخير.",
    modules: ["Timeline", "Milestones", "Tasks"]
  },
  {
    id: "risk-detection",
    title: "Risk Detection",
    prompt: "استخرج المخاطر التشغيلية والمالية والزمنية والوثائقية مع إجراءات التخفيف.",
    modules: ["Project", "Tasks", "Budget", "Timeline", "Knowledge"]
  },
  {
    id: "missing-documents",
    title: "Missing Documents",
    prompt: "حدد الوثائق الناقصة أو القديمة أو المطلوبة للمرحلة التالية.",
    modules: ["Documents", "Knowledge", "Timeline"]
  },
  {
    id: "delayed-tasks",
    title: "Delayed Tasks",
    prompt: "راجع المهام المتأخرة أو المحجوبة واقترح خطة استدراك.",
    modules: ["Tasks", "Team", "Timeline"]
  },
  {
    id: "upcoming-milestones",
    title: "Upcoming Milestones",
    prompt: "لخص المعالم القادمة وما يجب تحضيره قبلها.",
    modules: ["Milestones", "Tasks", "Documents"]
  },
  {
    id: "knowledge-suggestions",
    title: "Knowledge Suggestions",
    prompt: "اقترح إجراءات ومعايير وقوائم تحقق من قاعدة المعرفة المناسبة لهذا المشروع.",
    modules: ["Knowledge", "Documents", "Safety"]
  },
  {
    id: "safety-recommendations",
    title: "Safety Recommendations",
    prompt: "أنشئ توصيات سلامة عملية حسب المرحلة الحالية ومخاطر الموقع.",
    modules: ["Knowledge", "Tasks", "Timeline"]
  },
  {
    id: "productivity-suggestions",
    title: "Productivity Suggestions",
    prompt: "اقترح تحسينات إنتاجية وتنسيق للفريق بناء على العبء والمهام.",
    modules: ["Team", "Tasks", "Timeline"]
  }
];

export function getVoraSkill(id: VoraSkillId) {
  return voraSkills.find((skill) => skill.id === id);
}

export function getContextReferencedModules(context?: VoraProjectContext) {
  if (!context) return [];
  return [
    context.project ? "Project" : "",
    context.organization ? "Organization" : "",
    context.members.length ? "Team" : "",
    context.tasks.length ? "Tasks" : "",
    context.milestones.length ? "Timeline" : "",
    context.budget ? "Budget" : "",
    context.documents.length ? "Documents" : "",
    context.knowledge.length ? "Knowledge" : ""
  ].filter(Boolean);
}
