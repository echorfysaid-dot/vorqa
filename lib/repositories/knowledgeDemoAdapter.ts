import type { KnowledgeArticle, KnowledgeArticleFilters, KnowledgeArticleInput } from "@/lib/models";
import { filterKnowledgeArticles, knowledgeCategories } from "./knowledgeMapper";

const demoTopics = [
  ["Building Standards", "معايير البناء للمشاريع السكنية الفاخرة", "اشتراطات جودة التنفيذ، العزل، السلامة، والتسليم النهائي للمشاريع السكنية."],
  ["Safety Procedures", "إجراءات السلامة اليومية في الموقع", "قائمة تشغيل يومية لمراقبة الدخول، معدات الوقاية، ومسارات الطوارئ."],
  ["Concrete Specifications", "مواصفات الخرسانة وأعمال الصب", "إرشادات الخلط، الفحوصات، المعالجة، وتوثيق نتائج الاختبارات."],
  ["Quality Control", "نظام ضبط الجودة للمقاولين", "آلية اعتماد الأعمال، نقاط الفحص، وإجراءات رفض أو إعادة تنفيذ البنود."],
  ["Inspection Checklist", "قائمة فحص الأساسات قبل الصب", "عناصر تفتيش التسليح، المناسيب، القوالب، والتمديدات قبل اعتماد الصب."],
  ["Site Logistics", "تنظيم حركة الموقع والتوريد", "خطة مناطق التخزين، مسارات المعدات، ونقاط التحميل لتقليل التعارضات."],
  ["Equipment Guide", "دليل المعدات الأساسية للتنفيذ", "مؤشرات اختيار المعدات، الجاهزية، الصيانة، ومخاطر التعطل."],
  ["Procurement Process", "سير عمل المشتريات واعتماد الموردين", "خطوات طلب عروض الأسعار، المقارنة، الاعتماد، وتتبع أوامر الشراء."],
  ["Permit Workflow", "مسار التراخيص والموافقات", "الوثائق المطلوبة، الجهات، المدد المتوقعة، ونقاط المتابعة الحرجة."],
  ["Risk Management", "إدارة مخاطر التأخير والتكلفة", "منهجية تسجيل المخاطر، تقييمها، وخطط التخفيف في المشاريع الإنشائية."]
] as const;

function makeKnowledge(projectId?: string, organizationId = "atlas"): KnowledgeArticle[] {
  return demoTopics.map(([category, title, summary], index) => ({
    id: `${projectId || organizationId}-knowledge-${index + 1}`,
    organizationId,
    projectId,
    documentId: index < 4 && projectId ? `${projectId}-document-${index + 1}` : undefined,
    documentTitle: index < 4 ? ["Architectural package", "Safety plan", "Structural drawings", "QA checklist"][index] : undefined,
    title,
    summary,
    content: [
      `## ${title}`,
      "",
      "### الملخص التنفيذي",
      summary,
      "",
      "### نقاط العمل",
      "- تحديد المسؤول عن التنفيذ والمتابعة.",
      "- ربط الإجراء بالمرحلة الحالية من المشروع.",
      "- تحديث الوثائق المرتبطة عند ظهور تغيير في النطاق.",
      "",
      "### توصية VORA",
      "راجع هذا المرجع قبل اعتماد المرحلة التالية لضمان تقليل المخاطر التشغيلية."
    ].join("\n"),
    category,
    tags: [category.toLowerCase().replace(/\s+/g, "-"), index % 2 === 0 ? "execution" : "governance"],
    status: index === 9 ? "Draft" : "Published",
    createdBy: "demo-user",
    createdByName: index % 2 === 0 ? "Project Manager" : "Site Engineer",
    metadata: {
      views: 180 - index * 11,
      relatedModules: ["Documents", "Tasks", index % 2 === 0 ? "Timeline" : "Budget"]
    },
    createdAt: `2026-07-${String(index + 4).padStart(2, "0")}T10:00:00.000Z`,
    updatedAt: `2026-07-${String(18 - (index % 5)).padStart(2, "0")}T12:00:00.000Z`
  }));
}

export const knowledgeDemoAdapter = {
  async getKnowledge(filters: KnowledgeArticleFilters = {}) {
    const data = makeKnowledge(filters.projectId, filters.organizationId || "atlas");
    return { data: filterKnowledgeArticles(data, filters), source: "demo" as const, isFallback: false };
  },

  async getKnowledgeArticle(articleId: string) {
    const article = makeKnowledge("PRJ-1048").find((item) => item.id === articleId)
      || makeKnowledge().find((item) => item.id === articleId);
    return { data: article, source: "demo" as const, isFallback: false };
  },

  async createKnowledge(input: KnowledgeArticleInput) {
    const article: KnowledgeArticle = {
      id: `${input.projectId || input.organizationId}-knowledge-preview-${Date.now()}`,
      ...input,
      status: input.status || "Published",
      tags: input.tags || [],
      createdBy: "demo-user",
      createdByName: "Demo User",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { data: article, source: "demo" as const, isFallback: false };
  },

  async updateKnowledge(articleId: string, input: Partial<KnowledgeArticleInput>) {
    const current = (await this.getKnowledgeArticle(articleId)).data;
    if (!current) return { data: undefined as KnowledgeArticle | undefined, source: "demo" as const, isFallback: false, error: "Knowledge article not found in demo data." };
    return { data: { ...current, ...input, updatedAt: new Date().toISOString() }, source: "demo" as const, isFallback: false };
  },

  async archiveKnowledge(articleId: string) {
    return { data: Boolean(articleId), source: "demo" as const, isFallback: false };
  },

  async searchKnowledge(query: string, filters: KnowledgeArticleFilters = {}) {
    return this.getKnowledge({ ...filters, query });
  },

  async filterKnowledge(filters: KnowledgeArticleFilters = {}) {
    return this.getKnowledge(filters);
  },

  listCategories() {
    return [...knowledgeCategories];
  }
};
