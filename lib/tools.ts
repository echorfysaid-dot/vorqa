import {
  BookOpenText,
  Bot,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  ClipboardList,
  FileText,
  Globe2,
  Languages,
  LayoutTemplate,
  Lightbulb,
  Megaphone,
  MonitorSmartphone,
  Scale,
  ShieldAlert,
  Sparkles,
  UserRound
} from "lucide-react";

export type ToolSlug = "document" | "contract-review" | "boq-review" | "risk-assessment" | "planning-review" | "site-report-review" | "executive-summary" | "cv" | "landing-page" | "business-idea" | "marketing";

export type ToolField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
};

export type ToolDefinition = {
  slug: ToolSlug;
  title: string;
  shortTitle: string;
  description: string;
  category: string;
  badge: string;
  cta: string;
  icon: typeof FileText;
  accent: string;
  fields: ToolField[];
};

export const tools: ToolDefinition[] = [
  {
    slug: "document",
    title: "Document Generator",
    shortTitle: "مولد الوثائق",
    description: "حوّل الأفكار إلى تقارير ومقترحات وخطط تنفيذية بصياغة مؤسسية فاخرة.",
    category: "Documents",
    badge: "Signature",
    cta: "Generate Document",
    icon: FileText,
    accent: "from-[#f7d774] via-[#c99a2e] to-[#7b5614]",
    fields: [
      { name: "documentType", label: "Document type", type: "select", options: ["تقرير", "مقترح عمل", "خطة مشروع", "رسالة مهنية", "ملخص تنفيذي"] },
      { name: "topic", label: "Topic", type: "text", placeholder: "مثال: خطة إطلاق منصة SaaS" },
      { name: "language", label: "Language", type: "select", options: ["العربية", "Français", "English"] },
      { name: "tone", label: "Tone", type: "select", options: ["احترافي", "رسمي", "مقنع", "بسيط وواضح", "فاخر"] },
      { name: "extraDetails", label: "Extra details", type: "textarea", placeholder: "الجمهور المستهدف، الطول، النقاط المهمة..." }
    ]
  },
  {
    slug: "contract-review",
    title: "Contract Review",
    shortTitle: "مراجعة العقود",
    description: "راجع عقود البناء عبر VORA لاستخراج الملخص، المخاطر، المعلومات الناقصة، والإجراءات المقترحة دون اختراع بنود غير موجودة.",
    category: "Contracts",
    badge: "VORA Runtime",
    cta: "Review Contract",
    icon: Scale,
    accent: "from-[#f7d774] via-[#d6b36a] to-[#10213a]",
    fields: []
  },
  {
    slug: "boq-review",
    title: "BOQ Review",
    shortTitle: "مراجعة جدول الكميات",
    description: "راجع جدول الكميات أو جدول التكلفة عبر VORA لاكتشاف النواقص، التكرارات، مشاكل الوحدات، وفروقات الكمية × السعر عند توفر البيانات.",
    category: "Cost Control",
    badge: "Cost Review",
    cta: "Review BOQ",
    icon: Calculator,
    accent: "from-[#dff7ff] via-[#38bdf8] to-[#123456]",
    fields: []
  },
  {
    slug: "risk-assessment",
    title: "Risk Assessment",
    shortTitle: "ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ù…Ø®Ø§Ø·Ø±",
    description: "Ø§Ø¬Ù…Ø¹ Ù†ØªØ§Ø¦Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¹Ù‚ÙˆØ¯ ÙˆØ¬Ø¯Ø§ÙˆÙ„ Ø§Ù„ÙƒÙ…ÙŠØ§Øª ÙˆÙ…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ù„Ø¥Ù†Ø´Ø§Ø¡ ØªÙ‚ÙŠÙŠÙ… Ù…Ø®Ø§Ø·Ø± Ù…Ù†Ø¸Ù… Ø¹Ø¨Ø± VORA.",
    category: "Construction Intelligence",
    badge: "Risk Engine",
    cta: "Assess Risk",
    icon: ShieldAlert,
    accent: "from-[#ffe1a6] via-[#d6b36a] to-[#7f1d1d]",
    fields: []
  },
  {
    slug: "planning-review",
    title: "Planning Review",
    shortTitle: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªØ®Ø·ÙŠØ·",
    description: "Ø±Ø§Ø¬Ø¹ ÙˆØ«Ø§Ø¦Ù‚ Ø§Ù„ØªØ®Ø·ÙŠØ· ÙˆÙ‚ÙˆØ§Ø¦Ù… Ø§Ù„Ø£Ù†Ø´Ø·Ø© Ù„Ø§ÙƒØªØ´Ø§Ù Ø§Ù„Ù…Ø¹Ø§Ù„Ù… Ø§Ù„Ù†Ø§Ù‚ØµØ©ØŒ Ø§Ù„ØªÙƒØ±Ø§Ø±ØŒ ÙˆÙ…Ø®Ø§Ø·Ø± Ø§Ù„ØªØ³Ù„Ø³Ù„ Ø¯ÙˆÙ† Ø­Ø³Ø§Ø¨ ØªÙˆØ§Ø±ÙŠØ®.",
    category: "Construction Intelligence",
    badge: "Planning",
    cta: "Review Plan",
    icon: CalendarDays,
    accent: "from-[#dff7ff] via-[#38bdf8] to-[#1f3a5f]",
    fields: []
  },
  {
    slug: "site-report-review",
    title: "Site Report Review",
    shortTitle: "مراجعة تقارير الموقع",
    description: "راجع تقارير الموقع اليومية وملاحظات التفتيش وسجلات التنفيذ لاكتشاف النواقص، ملاحظات السلامة والجودة، وعناصر المتابعة دون اختراع أحداث ميدانية.",
    category: "Construction Intelligence",
    badge: "Site Review",
    cta: "Review Site Report",
    icon: ClipboardList,
    accent: "from-[#e7f7ff] via-[#38bdf8] to-[#12323d]",
    fields: []
  },
  {
    slug: "executive-summary",
    title: "Executive Summary",
    shortTitle: "الملخص التنفيذي",
    description: "اجمع نتائج مراجعة العقد، BOQ، المخاطر، التخطيط، وتقارير الموقع في تقرير تنفيذي واحد دون اختراع نتائج غير موجودة.",
    category: "Construction Intelligence",
    badge: "Executive",
    cta: "Generate Summary",
    icon: FileText,
    accent: "from-[#fff3c4] via-[#d6b36a] to-[#1f2937]",
    fields: []
  },
  {
    slug: "cv",
    title: "CV Generator",
    shortTitle: "مولد السيرة الذاتية",
    description: "أنشئ CV راقيا يبرز الخبرة والمهارات ويمنحك حضورا مهنيا قويا.",
    category: "Career",
    badge: "Executive",
    cta: "Generate CV",
    icon: UserRound,
    accent: "from-[#e8c65f] via-[#a77b24] to-[#1b2238]",
    fields: [
      { name: "fullName", label: "Full name", type: "text", placeholder: "الاسم الكامل" },
      { name: "jobTitle", label: "Job title", type: "text", placeholder: "مثال: Product Designer" },
      { name: "experience", label: "Experience", type: "textarea", placeholder: "الخبرات المهنية والإنجازات" },
      { name: "education", label: "Education", type: "textarea", placeholder: "الشهادات والتكوين" },
      { name: "skills", label: "Skills", type: "textarea", placeholder: "المهارات التقنية والشخصية" },
      { name: "languages", label: "Languages", type: "text", placeholder: "العربية، الفرنسية، الإنجليزية" },
      { name: "style", label: "Style", type: "select", options: ["Modern", "Executive", "Creative", "Minimal"] }
    ]
  },
  {
    slug: "landing-page",
    title: "Landing Page Generator",
    shortTitle: "مولد صفحات الهبوط",
    description: "ولّد صفحة هبوط عالية التحويل مع قصة بيع، فوائد، وتسلسل مقنع.",
    category: "Growth",
    badge: "Launch",
    cta: "Generate Landing Page",
    icon: MonitorSmartphone,
    accent: "from-[#f6e7a8] via-[#c29535] to-[#172033]",
    fields: [
      { name: "productName", label: "Product name", type: "text", placeholder: "اسم المنتج أو الخدمة" },
      { name: "productDescription", label: "Product description", type: "textarea", placeholder: "ماذا يقدم المنتج؟" },
      { name: "targetAudience", label: "Target audience", type: "text", placeholder: "من هم العملاء؟" },
      { name: "price", label: "Price", type: "text", placeholder: "مثال: 199 درهم / شهريا" },
      { name: "mainBenefits", label: "Main benefits", type: "textarea", placeholder: "أهم الفوائد والنتائج" },
      { name: "ctaText", label: "CTA text", type: "text", placeholder: "ابدأ الآن" },
      { name: "language", label: "Language", type: "select", options: ["العربية", "Français", "English"] }
    ]
  },
  {
    slug: "business-idea",
    title: "Business Idea Generator",
    shortTitle: "مولد أفكار المشاريع",
    description: "اكتشف فكرة مشروع عملية مع نموذج ربح، جمهور، وخارطة انطلاق.",
    category: "Strategy",
    badge: "Venture",
    cta: "Generate Business Idea",
    icon: Lightbulb,
    accent: "from-[#ffd86b] via-[#b88724] to-[#0b1020]",
    fields: [
      { name: "industry", label: "Industry", type: "text", placeholder: "التعليم، التجارة، الصحة..." },
      { name: "budget", label: "Budget", type: "text", placeholder: "مثال: 5000 درهم" },
      { name: "skills", label: "Skills", type: "textarea", placeholder: "مهاراتك أو فريقك" },
      { name: "country", label: "Country", type: "text", placeholder: "المغرب، فرنسا..." },
      { name: "goal", label: "Goal", type: "textarea", placeholder: "دخل إضافي، شركة ناشئة، مشروع محلي..." }
    ]
  },
  {
    slug: "marketing",
    title: "Marketing Content Generator",
    shortTitle: "مولد المحتوى التسويقي",
    description: "اكتب إعلانات ورسائل تسويقية بنبرة فاخرة وواضحة ومقنعة.",
    category: "Marketing",
    badge: "Brand",
    cta: "Generate Content",
    icon: Megaphone,
    accent: "from-[#f9e6a6] via-[#d5a63b] to-[#3c2a0b]",
    fields: [
      { name: "brand", label: "Brand", type: "text", placeholder: "اسم العلامة التجارية" },
      { name: "offer", label: "Offer", type: "textarea", placeholder: "العرض أو المنتج" },
      { name: "channel", label: "Channel", type: "select", options: ["Instagram", "Facebook", "Email", "LinkedIn", "Website"] },
      { name: "tone", label: "Tone", type: "select", options: ["احترافي", "ودود", "مقنع", "فاخر", "سريع ومباشر"] },
      { name: "language", label: "Language", type: "select", options: ["العربية", "Français", "English"] }
    ]
  }
];

export const featureHighlights = [
  { title: "VORA Assistant", text: "مساعد ذكي حاضر في كل تجربة ليساعدك على التفكير والصياغة والتنفيذ.", icon: Bot },
  { title: "وثائق فاخرة", text: "مخرجات منظمة وقابلة للحفظ والبحث والمشاركة.", icon: BookOpenText },
  { title: "مشاريع محفوظة", text: "تاريخ كامل لكل ما تم توليده داخل مساحة العمل.", icon: BriefcaseBusiness },
  { title: "مفضلة ذكية", text: "ثبّت أفضل المخرجات وارجع إليها بسرعة.", icon: Sparkles },
  { title: "دعم لغات متعددة", text: "العربية أولا مع بنية جاهزة للفرنسية والإنجليزية.", icon: Languages },
  { title: "قوالب احترافية", text: "موجهات مصممة للأعمال والتسويق والوظائف.", icon: LayoutTemplate }
];

export const quickActions = [
  { title: "وثيقة جديدة", href: "/tools/document", icon: FileText, hint: "تقرير أو مقترح" },
  { title: "CV احترافي", href: "/tools/cv", icon: UserRound, hint: "سيرة ذاتية جاهزة" },
  { title: "صفحة هبوط", href: "/tools/landing-page", icon: Globe2, hint: "إطلاق منتج" },
  { title: "فكرة مشروع", href: "/tools/business-idea", icon: Lightbulb, hint: "خطة انطلاق" }
];

export const pricingPlans = [
  {
    name: "Atelier",
    price: "0 درهم",
    description: "للتجربة وبناء أول مخرجاتك",
    features: ["5 أدوات AI", "Mock outputs", "سجل محلي للأنشطة", "واجهة عربية فاخرة"]
  },
  {
    name: "Maison Pro",
    price: "99 درهم",
    description: "للمستقلين ورواد الأعمال",
    features: ["تكامل OpenAI-ready", "مشاريع محفوظة", "مفضلة وبحث", "قوالب أعمال متقدمة"]
  },
  {
    name: "Enterprise",
    price: "299 درهم",
    description: "للفرق والشركات الناشئة",
    features: ["صلاحيات فريق", "تكامل Supabase", "مزودات AI متعددة", "تقارير وملفات احترافية"]
  }
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
