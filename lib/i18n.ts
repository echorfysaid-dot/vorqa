import arCatalog from "@/lib/locales/ar.json";
import enCatalog from "@/lib/locales/en.json";
import frCatalog from "@/lib/locales/fr.json";

export const locales = ["ar", "fr", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export const localeMeta: Record<Locale, { label: string; nativeName: string; dir: "rtl" | "ltr" }> = {
  ar: { label: "Arabic", nativeName: "العربية", dir: "rtl" },
  fr: { label: "French", nativeName: "Français", dir: "ltr" },
  en: { label: "English", nativeName: "English", dir: "ltr" }
};

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export type ToolSlug = "document" | "contract-review" | "boq-review" | "risk-assessment" | "planning-review" | "site-report-review" | "executive-summary" | "cv" | "landing-page" | "business-idea" | "marketing";

export const dictionaries = {
  ar: {
    meta: {
      title: "Vorqa AI - مساحة عمل ذكية فاخرة",
      description: "منصة ذكاء اصطناعي عربية لإنشاء الوثائق والسير الذاتية وصفحات الهبوط وأفكار المشاريع."
    },
    common: {
      appName: "Vorqa AI",
      vora: "VORA",
      getStarted: "ابدأ الآن",
      startJourney: "ابدأ رحلتك",
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      logout: "تسجيل الخروج",
      search: "ابحث...",
      searchWorkspace: "ابحث في المشاريع، المخرجات، الأدوات...",
      language: "اللغة",
      all: "الكل",
      save: "حفظ",
      delete: "حذف",
      download: "تحميل",
      copy: "نسخ",
      exportMarkdown: "تصدير Markdown",
      loading: "جار التحميل",
      retry: "إعادة المحاولة",
      empty: "لا توجد عناصر بعد",
      viewAll: "عرض الكل",
      activeSession: "جلسة نشطة",
      guestMode: "وضع ضيف",
      profileSettings: "إعدادات الملف",
      workspace: "مساحة العمل الرئيسية",
      notifications: "الإشعارات",
      primary: "أساسي",
      prepared: "مجهز",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      fullName: "الاسم الكامل"
    },
    nav: {
      home: "الرئيسية",
      features: "القدرات",
      workflow: "طريقة العمل",
      showcase: "العروض",
      pricing: "الأسعار",
      about: "عن Vorqa",
      dashboard: "لوحة العمل",
      more: "المزيد",
      tools: "أدوات الذكاء",
      rfq: "طلبات عروض الأسعار",
      quotations: "عروض الأسعار",
      contracts: "العقود",
      billing: "الفوترة",
      admin: "الإدارة",
      notifications: "الإشعارات",
      knowledge: "المعرفة",
      documents: "الوثائق",
      projects: "المشاريع",
      history: "السجل",
      saved: "المحفوظات",
      favorites: "المفضلة",
      settings: "الإعدادات"
    },
    shell: {
      workspaceBadge: "مساحة العمل الرئيسية",
      askVora: "اسأل VORA",
      askVoraText: "ابدأ وثيقة، مشروعاً، أو فكرة عمل من مساحة واحدة.",
      productivity: "إنتاجية اليوم",
      productivityText: "7 مخرجات و3 مشاريع قيد المتابعة.",
      notifications: [
        ["VORA جاهزة", "يمكنك بدء وثيقة أو مشروع جديد من الإجراءات السريعة."],
        ["مخرجات محفوظة", "آخر التوليدات أصبحت جاهزة داخل مساحة العمل."],
        ["تلميح إنتاجية", "ثبّت أهم المشاريع لتظهر في أعلى لوحة العمل."]
      ]
    },
    landing: {
      heroBadge: "منصة تنفيذ ذكية تقودها VORA",
      heroLanguage: "العربية أولاً",
      brandLine: "من الفكرة إلى التسليم، بخطوات واضحة.",
      titleA: "حوّل أفكارك إلى مشاريع قابلة للتنفيذ",
      titleB: "ووثائق احترافية مع VORA",
      subtitle: "Vorqa AI منصة عربية فاخرة تساعدك على التخطيط، التوليد، التنظيم والمتابعة داخل تجربة واحدة مصممة للمؤسسين والفرق التي تريد السرعة دون التضحية بالجودة.",
      seeWorkflow: "شاهد كيف تعمل",
      trust: "موثوق من فرق مبتكرة تبني أسرع",
      capabilitiesTitle: "منصة واحدة للتخطيط، الإنتاج، والتنظيم",
      capabilitiesText: "كل ما تحتاجه لتحويل الفكرة إلى مخرجات واضحة دون تشتيت بين أدوات كثيرة.",
      workflowTitle: "تدفق عمل واضح يحافظ على الزخم",
      workflowText: "كل مرحلة مصممة لتقليل الغموض وتحويل القرار التالي إلى خطوة عملية.",
      voraPreviewTitle: "مساعد تنفيذي يفهم السياق قبل التوليد",
      showcaseTitle: "لوحات معاينة مصممة للقراءة واتخاذ القرار",
      statsTitle: "نتائج قابلة للقياس من أول تجربة",
      rolesTitle: "تجربة واحدة لعدة أدوار تنفيذية",
      testimonialsTitle: "انطباع منتج جاهز للاستثمار",
      pricingTitle: "ابدأ الآن، وتوسع عندما تكبر مشاريعك",
      faqTitle: "كل ما تحتاج معرفته قبل البدء",
      finalTitle: "ابدأ مشروعك القادم بطريقة أكثر وضوحاً",
      finalText: "دع VORA يساعدك على تحويل الفكرة الأولى إلى وثائق، خطة تنفيذ، ومخرجات جاهزة للعمل.",
      cards: ["تخطيط ذكي", "إدارة منظمة", "تنفيذ موثوق"]
    },
    dashboard: {
      badge: "مساحة العمل الرئيسية",
      title: "أهلاً بك، لنحوّل اليوم إلى مخرجات واضحة",
      description: "تابع المشاريع، أنشئ وثائق، راقب نشاط VORA، واحفظ أهم المخرجات داخل مساحة واحدة مصممة للعمل المتكرر.",
      dateLocale: "ar-MA",
      generateDocument: "توليد وثيقة",
      createProject: "إنشاء مشروع",
      quickSearchTitle: "ابحث في مساحة العمل",
      assistantTip: "اقتراح: ابدأ اليوم بمراجعة مشروع الإطلاق لأنه الأعلى نشاطاً.",
      stats: ["المشاريع", "الوثائق المولدة", "توليدات AI", "معدل الإنجاز", "التخزين", "نشاط اليوم"],
      quickActions: [
        ["إنشاء مشروع", "ابدأ مساحة عمل جديدة"],
        ["توليد وثيقة", "مستند احترافي خلال دقائق"],
        ["محادثة VORA", "اسأل المساعد الذكي"],
        ["القوالب", "ابدأ من بنية جاهزة"]
      ],
      insightsTitle: "الإجراء الأفضل الآن",
      projectsTitle: "أعمال قيد التنفيذ",
      recentActivity: "نشاط VORA الأخير",
      recentOutputs: "المخرجات الأخيرة",
      calendar: "تقويم العمل",
      recentFiles: "ملفات حديثة",
      emptyTitle: "لا توجد مهام عالقة",
      emptyText: "عندما تظهر مخرجات تحتاج مراجعة، ستعرضها VORA هنا."
    },
    tools: {
      pageTitle: "مكتبة أدوات فاخرة",
      pageDescription: "أدوات احترافية منظمة حسب الاستخدام، مع نماذج غنية ومخرجات قابلة للحفظ والبحث والإضافة للمفضلة.",
      studioDescription: "املأ النموذج لتحصل على مخرج احترافي منظم وقابل للنسخ أو التصدير.",
      askVora: "اسأل VORA",
      retryVora: "إعادة المحاولة",
      outputAtelier: "ورشة مخرجات VORA",
      openaiConnected: "OpenAI متصل",
      mockMode: "الوضع التجريبي",
      emptyOutput: "املأ النموذج لتبدأ VORA بصياغة مخرج احترافي، ثم انسخه أو صدّره كملف Markdown.",
      copiedTitle: "تم النسخ",
      copiedText: "تم نسخ المخرج إلى الحافظة.",
      markdownTitle: "Markdown",
      markdownText: "تم تجهيز ملف Markdown للتصدير.",
      successTitle: "اكتملت العملية",
      successOpenAi: "تم إنشاء المخرج عبر OpenAI وحفظه في السجل.",
      successMock: "تم إنشاء المخرج في الوضع التجريبي وحفظه في السجل.",
      failTitle: "تعذر إنشاء المحتوى",
      failText: "راجع المدخلات وحاول مرة أخرى.",
      readError: "تعذر قراءة رد الخادم.",
      createError: "تعذر إنشاء المحتوى حالياً.",
      networkError: "حدث خطأ في الاتصال.",
      definitions: {
        document: {
          title: "مولد الوثائق",
          shortTitle: "مولد الوثائق",
          description: "حوّل الأفكار إلى تقارير ومقترحات وخطط تنفيذية بصياغة مؤسسية فاخرة.",
          category: "وثائق",
          badge: "توقيع احترافي",
          cta: "توليد وثيقة",
          pageDescription: "أنشئ وثائق وتقارير ومقترحات بصياغة مؤسسية قابلة للحفظ والنسخ.",
          fields: {
            documentType: "نوع الوثيقة",
            topic: "الموضوع",
            language: "لغة المخرج",
            tone: "النبرة",
            extraDetails: "تفاصيل إضافية"
          }
        },
        "contract-review": {
          title: "مراجعة العقود",
          shortTitle: "مراجعة العقود",
          description: "راجع عقود البناء عبر VORA لاستخراج الملخص، المخاطر، المعلومات الناقصة، والإجراءات المقترحة دون اختراع بنود غير موجودة.",
          category: "عقود",
          badge: "VORA Runtime",
          cta: "مراجعة العقد",
          pageDescription: "ارفع عقد بناء بصيغة TXT أو Markdown، أو PDF/DOCX كمرحلة تمهيدية، لتحصل على مراجعة منظمة عبر مسار VORA Intelligence.",
          fields: {}
        },
        "boq-review": {
          title: "مراجعة جدول الكميات",
          shortTitle: "مراجعة جدول الكميات",
          description: "راجع جدول الكميات أو جدول التكلفة عبر VORA لاكتشاف النواقص، التكرارات، مشاكل الوحدات، وفروقات الكمية × السعر عند توفر البيانات.",
          category: "تحكم في التكلفة",
          badge: "Cost Review",
          cta: "مراجعة BOQ",
          pageDescription: "ارفع أو الصق جدول كميات بصيغة CSV أو TSV أو نص أو Markdown لتحصل على مراجعة هيكلية منظمة عبر VORA Intelligence.",
          fields: {}
        },
        "risk-assessment": {
          title: "تقييم المخاطر",
          shortTitle: "تقييم المخاطر",
          description: "اجمع نتائج مراجعة العقود وجداول الكميات وملاحظات المشروع لإنتاج تقييم مخاطر منظم عبر VORA.",
          category: "ذكاء البناء",
          badge: "Risk Engine",
          cta: "تقييم المخاطر",
          pageDescription: "أنشئ تقرير مخاطر مهني من أدلة موجودة: مراجعة عقد، مراجعة BOQ، أو ملاحظات مشروع قابلة للقراءة.",
          fields: {}
        },
        "planning-review": {
          title: "مراجعة التخطيط",
          shortTitle: "مراجعة التخطيط",
          description: "راجع جدولاً أو قائمة أنشطة لاكتشاف النواقص والتكرارات ومخاطر التسلسل دون حساب تواريخ أو تحسين الجدول.",
          category: "ذكاء البناء",
          badge: "Planning",
          cta: "مراجعة التخطيط",
          pageDescription: "ارفع أو الصق معلومات التخطيط بصيغة TXT أو Markdown أو CSV للحصول على مراجعة منظمة عبر VORA Intelligence.",
          fields: {}
        },
        "site-report-review": {
          title: "مراجعة تقارير الموقع",
          shortTitle: "مراجعة تقارير الموقع",
          description: "راجع تقارير الموقع اليومية وملاحظات التفتيش وسجلات التنفيذ لاكتشاف النواقص، ملاحظات السلامة والجودة، وعناصر المتابعة دون اختراع أحداث ميدانية.",
          category: "ذكاء البناء",
          badge: "Site Review",
          cta: "مراجعة التقرير",
          pageDescription: "ارفع أو الصق تقرير موقع بصيغة TXT أو Markdown أو CSV للحصول على مراجعة منظمة عبر VORA Intelligence.",
          fields: {}
        },
        "executive-summary": {
          title: "الملخص التنفيذي",
          shortTitle: "الملخص التنفيذي",
          description: "اجمع نتائج تحليلات ذكاء البناء المتوفرة في تقرير تنفيذي واحد دون اختراع نتائج أو مخاطر غير موجودة.",
          category: "ذكاء البناء",
          badge: "Executive",
          cta: "إنشاء الملخص",
          pageDescription: "أنشئ تقريرا تنفيذيا من جلسة Project Intelligence والنتائج المكتملة فقط.",
          fields: {}
        },
        cv: {
          title: "مولد السيرة الذاتية",
          shortTitle: "مولد السيرة الذاتية",
          description: "أنشئ CV راقياً يبرز الخبرة والمهارات ويمنحك حضوراً مهنياً قوياً.",
          category: "مسار مهني",
          badge: "تنفيذي",
          cta: "توليد CV",
          pageDescription: "حوّل الخبرات والمهارات إلى CV احترافي ومنظم.",
          fields: {
            fullName: "الاسم الكامل",
            jobTitle: "المسمى الوظيفي",
            experience: "الخبرة",
            education: "التعليم",
            skills: "المهارات",
            languages: "اللغات",
            style: "النمط"
          }
        },
        "landing-page": {
          title: "مولد صفحات الهبوط",
          shortTitle: "مولد صفحات الهبوط",
          description: "ولّد صفحة هبوط عالية التحويل مع قصة بيع وفوائد وتسلسل مقنع.",
          category: "نمو",
          badge: "إطلاق",
          cta: "توليد صفحة هبوط",
          pageDescription: "ولّد صفحة هبوط جاهزة للإطلاق مع عرض وفوائد ودعوة إجراء.",
          fields: {
            productName: "اسم المنتج",
            productDescription: "وصف المنتج",
            targetAudience: "الجمهور المستهدف",
            price: "السعر",
            mainBenefits: "الفوائد الرئيسية",
            ctaText: "نص الدعوة للإجراء",
            language: "لغة المخرج"
          }
        },
        "business-idea": {
          title: "مولد أفكار المشاريع",
          shortTitle: "مولد أفكار المشاريع",
          description: "اكتشف فكرة مشروع عملية مع نموذج ربح وجمهور وخارطة انطلاق.",
          category: "استراتيجية",
          badge: "مشروع",
          cta: "توليد فكرة مشروع",
          pageDescription: "اكتشف فكرة مشروع عملية مع نموذج ربح وخطة انطلاق.",
          fields: {
            industry: "المجال",
            budget: "الميزانية",
            skills: "المهارات",
            country: "البلد",
            goal: "الهدف"
          }
        },
        marketing: {
          title: "مولد المحتوى التسويقي",
          shortTitle: "مولد المحتوى التسويقي",
          description: "اكتب إعلانات ورسائل تسويقية بنبرة فاخرة وواضحة ومقنعة.",
          category: "تسويق",
          badge: "علامة تجارية",
          cta: "توليد محتوى",
          pageDescription: "أنشئ محتوى تسويقياً مناسباً للقناة والنبرة والجمهور.",
          fields: {
            brand: "العلامة التجارية",
            offer: "العرض",
            channel: "القناة",
            tone: "النبرة",
            language: "لغة المخرج"
          }
        }
      },
      options: {
        documentType: ["تقرير", "مقترح عمل", "خطة مشروع", "رسالة مهنية", "ملخص تنفيذي"],
        outputLanguage: ["العربية", "Français", "English"],
        tone: ["احترافي", "رسمي", "مقنع", "بسيط وواضح", "فاخر"],
        style: ["Modern", "Executive", "Creative", "Minimal"],
        channel: ["Instagram", "Facebook", "Email", "LinkedIn", "Website"]
      }
    },
    projects: {
      title: "معرض المشاريع",
      description: "كل مشروع يحتفظ بنوع الأداة، الحالة، آخر تحديث، ونسبة الجاهزية.",
      newProject: "مشروع جديد",
      search: "ابحث في المشاريع...",
      knowledgeBadge: "Knowledge Workspace",
      knowledgeTitle: "مساحة معرفة المشروع",
      knowledgeDescription: "ارفع ملفات المعرفة داخل كل مشروع لتنظيم المصادر والوثائق. القراءة الذكية و RAG ستأتي في مراحل لاحقة.",
      selectProject: "المشروع",
      uploadTitle: "اسحب الملفات هنا أو اخترها من جهازك",
      uploadHint: "PDF, DOCX, TXT, MD, CSV, XLSX, PPTX, PNG, JPG, JPEG, WEBP",
      uploadTarget: "سيتم الحفظ داخل:",
      uploadProgress: "تقدم الرفع",
      fileSearch: "ابحث داخل ملفات المعرفة...",
      emptyProjects: "لا توجد مشاريع بعد",
      emptyProjectsText: "أنشئ مشروعاً من أدوات VORA أولاً، ثم ستظهر هنا مساحة المعرفة الخاصة به.",
      emptyFiles: "مساحة المعرفة فارغة",
      emptyFilesText: "ارفع ملفات المشروع لتبقى منظمة وقابلة للإدارة من مكان واحد.",
      chooseProject: "يرجى اختيار مشروع قبل رفع الملفات.",
      loginFirst: "يرجى تسجيل الدخول قبل رفع الملفات.",
      uploadFailed: "تعذر رفع الملف.",
      deleteFailed: "تعذر حذف الملف.",
      downloadFailed: "تعذر تحميل الملف.",
      fileCount: "م…3492 tokens truncated…connaissance du projet",
  knowledgeDescription: "Importez les fichiers de connaissance de chaque projet pour organiser les sources et documents. La lecture IA et le RAG viendront plus tard.",
  selectProject: "Projet",
  uploadTitle: "Glissez vos fichiers ici ou choisissez-les",
  uploadTarget: "Enregistré dans :",
  uploadProgress: "Progression",
  fileSearch: "Rechercher dans les fichiers...",
  emptyProjects: "Aucun projet pour le moment",
  emptyProjectsText: "Créez d’abord un projet avec VORA, puis son espace de connaissance apparaîtra ici.",
  emptyFiles: "L’espace de connaissance est vide",
  emptyFilesText: "Importez les fichiers du projet pour les garder organisés.",
  chooseProject: "Veuillez choisir un projet avant l’import.",
  loginFirst: "Veuillez vous connecter avant d’importer des fichiers.",
  uploadFailed: "Import impossible.",
  deleteFailed: "Suppression impossible.",
  downloadFailed: "Téléchargement impossible.",
  fileCount: "fichier"
});
dictionaries.en.projects = mergeLocale(dictionaries.ar.projects, {
  title: "Project gallery",
  description: "Every project keeps its tool type, status, latest update, and readiness score.",
  newProject: "New project",
  search: "Search projects...",
  knowledgeTitle: "Project Knowledge Workspace",
  knowledgeDescription: "Upload project knowledge files to organize sources and documents. AI reading and RAG will come later.",
  selectProject: "Project",
  uploadTitle: "Drop files here or choose from your device",
  uploadTarget: "Saved inside:",
  uploadProgress: "Upload progress",
  fileSearch: "Search knowledge files...",
  emptyProjects: "No projects yet",
  emptyProjectsText: "Create a project with VORA first, then its knowledge workspace will appear here.",
  emptyFiles: "Knowledge workspace is empty",
  emptyFilesText: "Upload project files to keep them organized in one place.",
  chooseProject: "Choose a project before uploading files.",
  loginFirst: "Log in before uploading files.",
  uploadFailed: "Upload failed.",
  deleteFailed: "Delete failed.",
  downloadFailed: "Download failed.",
  fileCount: "file"
});

dictionaries.fr.pages = mergeLocale(dictionaries.ar.pages, {
  loginTitle: "Accédez à votre espace de travail premium",
  loginDescription: "Authentification Supabase avec profils, projets et sorties enregistrées.",
  loginHeading: "Connexion",
  loginHint: "Connectez-vous pour accéder à vos projets et sorties.",
  registerWelcome: "Bienvenue dans VORQA",
  registerText: "Je suis VORA, votre assistant intelligent. Je vous accompagne de l’idée à l’exécution.",
  registerChoose: "Choisissez le type de compte adapté",
  registerCreate: "Créer le compte",
  registerNote: "Vous pourrez modifier ces informations plus tard.",
  pricingTitle: "Des plans conçus pour grandir",
  pricingDescription: "Une tarification claire, prête pour Stripe ou un fournisseur local.",
  settingsTitle: "Paramètres Vorqa AI",
  settingsDescription: "Paramètres produit, fournisseurs, Supabase, marque, notifications et expérience utilisateur.",
  savedTitle: "Sorties enregistrées",
  savedDescription: "Vos sorties enregistrées sont prêtes à organiser, rechercher et exporter.",
  favoritesTitle: "Favoris",
  favoritesDescription: "Vos meilleures sorties au même endroit.",
  historyTitle: "Historique VORA",
  historyDescription: "Chronologie des activités et sorties enregistrées."
});
dictionaries.en.pages = mergeLocale(dictionaries.ar.pages, {
  loginTitle: "Enter your premium workspace",
  loginDescription: "Real Supabase authentication with profiles, projects, and saved outputs.",
  loginHeading: "Log in",
  loginHint: "Log in to access your projects and saved outputs.",
  registerWelcome: "Welcome to VORQA",
  registerText: "I’m VORA, your intelligent assistant. I’ll guide each step from idea to execution.",
  registerChoose: "Choose the right account type",
  registerCreate: "Create account",
  registerNote: "You can update this information later.",
  pricingTitle: "Plans designed for growth",
  pricingDescription: "Clear premium pricing, ready for Stripe or a local payment provider later.",
  settingsTitle: "Vorqa AI Settings",
  settingsDescription: "Product, providers, Supabase, brand, notifications, and user experience settings.",
  savedTitle: "Saved outputs",
  savedDescription: "Saved outputs are ready to organize, search, and export.",
  favoritesTitle: "Favorites",
  favoritesDescription: "Your best outputs pinned in one place.",
  historyTitle: "VORA History",
  historyDescription: "A timeline of activity and saved outputs."
});

export type Dictionary = (typeof dictionaries)[Locale];

type TranslationCatalog = Record<Locale, Record<string, string>>;

const supplementalUiTranslations: Array<readonly [string, string, string]> = [
  ["Runtime error", "Erreur d’exécution", "خطأ في التشغيل"],
  ["An unexpected error occurred", "Une erreur inattendue s’est produite", "حدث خطأ غير متوقع"],
  ["Your data was not changed. Try again, and review production logs if the error continues.", "Vos données n’ont pas été modifiées. Réessayez et consultez les journaux de production si l’erreur persiste.", "لم يتم تغيير بياناتك. أعد المحاولة، وراجع سجلات الإنتاج إذا استمر الخطأ."],
  ["Page not found", "Page introuvable", "الصفحة غير موجودة"],
  ["The requested route is unavailable or has moved. Return to the workspace to continue.", "La page demandée est indisponible ou a été déplacée. Revenez à l’espace de travail pour continuer.", "المسار المطلوب غير متاح أو تم نقله. عُد إلى مساحة العمل للمتابعة."],
  ["Back to dashboard", "Retour au tableau de bord", "العودة إلى لوحة التحكم"],
  ["Try again", "Réessayer", "إعادة المحاولة"],
  ["Skip to workspace", "Aller à l’espace de travail", "تخطي إلى مساحة العمل"],
  ["Primary workspace navigation", "Navigation principale de l’espace de travail", "التنقل الرئيسي في مساحة العمل"],
  ["Close menu", "Fermer le menu", "إغلاق القائمة"],
  ["Command Center", "Centre de commande", "مركز القيادة"],
  ["Organizations", "Organisations", "المؤسسات"],
  ["Marketplace", "Marché", "السوق"],
  ["More", "Plus", "المزيد"],
  ["AI Tools", "Outils IA", "أدوات الذكاء الاصطناعي"],
  ["RFQs", "Appels d’offres", "طلبات عروض الأسعار"],
  ["Quotations", "Devis", "عروض الأسعار"],
  ["Contracts", "Contrats", "العقود"],
  ["Billing", "Facturation", "الفوترة"],
  ["Admin", "Administration", "الإدارة"],
  ["Notifications", "Notifications", "الإشعارات"],
  ["Knowledge", "Connaissances", "المعرفة"],
  ["Documents", "Documents", "المستندات"],
  ["Production data", "Données de production", "بيانات الإنتاج"],
  ["Auto data mode", "Mode de données automatique", "وضع البيانات التلقائي"],
  ["Demo mode", "Mode démo", "الوضع التجريبي"],
  ["Search", "Rechercher", "بحث"],
  ["Search workspace", "Rechercher dans l’espace de travail", "البحث في مساحة العمل"],
  ["Open dashboard", "Ouvrir le tableau de bord", "فتح لوحة التحكم"],
  ["Open projects", "Ouvrir les projets", "فتح المشاريع"],
  ["Open organizations", "Ouvrir les organisations", "فتح المؤسسات"],
  ["Open marketplace", "Ouvrir le marché", "فتح السوق"],
  ["Open settings", "Ouvrir les paramètres", "فتح الإعدادات"],
  ["View notifications", "Voir les notifications", "عرض الإشعارات"],
  ["Create project", "Créer un projet", "إنشاء مشروع"],
  ["New project", "Nouveau projet", "مشروع جديد"],
  ["Upload document", "Importer un document", "رفع مستند"],
  ["Generate report", "Générer un rapport", "إنشاء تقرير"],
  ["Open organization", "Ouvrir l’organisation", "فتح المؤسسة"],
  ["Mark all as read", "Tout marquer comme lu", "تحديد الكل كمقروء"],
  ["All notifications", "Toutes les notifications", "كل الإشعارات"],
  ["Unread", "Non lues", "غير مقروءة"],
  ["High priority", "Priorité élevée", "أولوية عالية"],
  ["Loading", "Chargement", "جارٍ التحميل"],
  ["No results", "Aucun résultat", "لا توجد نتائج"],
  ["No data available", "Aucune donnée disponible", "لا توجد بيانات متاحة"],
  ["Save company", "Enregistrer l’entreprise", "حفظ الشركة"],
  ["Saved to shortlist", "Ajoutée à la sélection", "تمت الإضافة إلى القائمة المختصرة"],
  ["View shortlist", "Voir la sélection", "عرض القائمة المختصرة"],
  ["Coming Soon", "Bientôt disponible", "قريباً"],
  ["Active", "Actif", "نشط"],
  ["Draft", "Brouillon", "مسودة"],
  ["Completed", "Terminé", "مكتمل"],
  ["Archived", "Archivé", "مؤرشف"],
  ["Pending", "En attente", "قيد الانتظار"],
  ["Status", "Statut", "الحالة"],
  ["Project", "Projet", "المشروع"],
  ["Organization", "Organisation", "المؤسسة"],
  ["Department", "Département", "القسم"],
  ["Employee", "Employé", "الموظف"],
  ["Report", "Rapport", "التقرير"],
  ["Settings", "Paramètres", "الإعدادات"],
  ["Overview", "Vue d’ensemble", "نظرة عامة"],
  ["Team", "Équipe", "الفريق"],
  ["Tasks", "Tâches", "المهام"],
  ["Timeline", "Calendrier", "الجدول الزمني"],
  ["Budget", "Budget", "الميزانية"],
  ["Reports", "Rapports", "التقارير"],
  ["Analyze this project", "Analyser ce projet", "تحليل هذا المشروع"],
  ["Create project schedule", "Créer le planning du projet", "إنشاء الجدول الزمني للمشروع"],
  ["Generate BOQ", "Générer le bordereau de quantités", "إنشاء جدول الكميات"],
  ["Review BOQ", "Réviser le bordereau de quantités", "مراجعة جدول الكميات"],
  ["Risk assessment", "Évaluation des risques", "تقييم المخاطر"],
  ["Create report", "Créer un rapport", "إنشاء تقرير"],
  ["Review contract", "Réviser le contrat", "مراجعة العقد"],
  ["Create meeting summary", "Créer un compte rendu de réunion", "إنشاء ملخص الاجتماع"],
  ["Extract risks, opportunities, and recommended next steps.", "Identifier les risques, les opportunités et les prochaines étapes recommandées.", "استخراج المخاطر والفرص والخطوات التالية الموصى بها."],
  ["Turn the project phases into an execution schedule.", "Transformer les phases du projet en planning d’exécution.", "تحويل مراحل المشروع إلى جدول زمني للتنفيذ."],
  ["Prepare a structured draft bill of quantities.", "Préparer un projet structuré de bordereau de quantités.", "إعداد مسودة منظمة لجدول الكميات."],
  ["Review the bill of quantities for gaps and duplicates.", "Réviser le bordereau de quantités pour détecter les lacunes et les doublons.", "مراجعة جدول الكميات لاكتشاف النواقص والتكرارات."],
  ["Assess project risks and potential delays.", "Évaluer les risques du projet et les retards potentiels.", "تقييم مخاطر المشروع واحتمالات التأخير."],
  ["Create an executive report for management.", "Créer un rapport exécutif pour la direction.", "إنشاء تقرير تنفيذي للإدارة."],
  ["Review a construction contract for risks and missing information.", "Réviser un contrat de construction pour identifier les risques et les informations manquantes.", "مراجعة عقد البناء لاكتشاف المخاطر والمعلومات الناقصة."],
  ["Turn the team meeting into actionable points.", "Transformer la réunion d’équipe en actions concrètes.", "تحويل اجتماع الفريق إلى نقاط قابلة للتنفيذ."],
  ["One workspace for contract reviews, bills of quantities, and VORA construction tools without changing existing workflows.", "Un espace unique pour les révisions de contrats, les bordereaux de quantités et les outils de construction VORA, sans modifier les processus existants.", "مساحة واحدة لمراجعة العقود وجداول الكميات وأدوات VORA للبناء دون تغيير سير العمل الحالي."],
  ["Submitted", "Soumis", "مُقدَّم"],
  ["Accepted", "Accepté", "مقبول"],
  ["Under review", "En cours d’examen", "قيد المراجعة"],
  ["Under Review", "En cours d’examen", "قيد المراجعة"],
  ["Shortlisted", "Présélectionné", "ضمن القائمة المختصرة"],
  ["Awarded", "Attribué", "تمت الترسية"],
  ["Published", "Publié", "منشور"],
  ["Closed", "Clôturé", "مغلق"],
  ["Cancelled", "Annulé", "ملغى"],
  ["All statuses", "Tous les statuts", "كل الحالات"],
  ["Technical", "Technique", "تقني"],
  ["Commercial", "Commercial", "تجاري"],
  ["Technical score", "Score technique", "التقييم التقني"],
  ["Commercial score", "Score commercial", "التقييم التجاري"],
  ["Technical compliance", "Conformité technique", "المطابقة التقنية"],
  ["Commercial compliance", "Conformité commerciale", "المطابقة التجارية"],
  ["Technical evaluation", "Évaluation technique", "التقييم التقني"],
  ["Technical Evaluation", "Évaluation technique", "التقييم التقني"],
  ["Commercial evaluation", "Évaluation commerciale", "التقييم التجاري"],
  ["Commercial Evaluation", "Évaluation commerciale", "التقييم التجاري"],
  ["Commercial terms", "Conditions commerciales", "الشروط التجارية"],
  ["Lowest", "Le plus faible", "الأدنى"],
  ["Highest", "Le plus élevé", "الأعلى"],
  ["Best value", "Meilleur rapport qualité-prix", "أفضل قيمة"],
  ["Lowest price", "Prix le plus bas", "أقل سعر"],
  ["Lowest risk", "Risque le plus faible", "أقل مخاطرة"],
  ["Highest rated", "Mieux noté", "الأعلى تقييماً"],
  ["Fastest", "Le plus rapide", "الأسرع"],
  ["Fastest delivery", "Livraison la plus rapide", "أسرع تسليم"],
  ["Recommended", "Recommandé", "موصى به"],
  ["Best Technical", "Meilleure offre technique", "أفضل عرض تقني"],
  ["Lowest Price", "Prix le plus bas", "أقل سعر"],
  ["Best value for money", "Meilleur rapport qualité-prix", "أفضل قيمة مقابل السعر"],
  ["Years in business", "Années d’activité", "سنوات الخبرة"],
  ["day", "jour", "يوم"],
  ["days", "jours", "أيام"],
  ["week", "semaine", "أسبوع"],
  ["weeks", "semaines", "أسابيع"],
  ["month", "mois", "شهر"],
  ["months", "mois", "أشهر"],
  ["year", "an", "سنة"],
  ["years", "ans", "سنوات"],
  ["Search...", "Rechercher...", "ابحث..."],
  ["Cancel", "Annuler", "إلغاء"],
  ["Close", "Fermer", "إغلاق"],
  ["Create", "Créer", "إنشاء"],
  ["Edit", "Modifier", "تعديل"],
  ["Archive", "Archiver", "أرشفة"],
  ["Delete", "Supprimer", "حذف"],
  ["Download", "Télécharger", "تنزيل"],
  ["Continue", "Continuer", "متابعة"],
  ["Previous", "Précédent", "السابق"],
  ["Next", "Suivant", "التالي"]
  ,["Building the future together", "Construisons l’avenir ensemble", "نبني المستقبل معاً"]
  ,["Welcome, I’ll help you return to your project workspace safely.", "Bienvenue, je vous aide à retrouver votre espace projet en toute sécurité.", "مرحباً، سأساعدك على العودة إلى مساحة مشروعك بأمان."]
  ,["High security", "Sécurité renforcée", "أمان عالي"]
  ,["Your data is protected", "Protection de vos données", "حماية بياناتك"]
  ,["Cloud storage", "Stockage infonuagique", "حفظ سحابي"]
  ,["Access your projects", "Accès à vos projets", "الوصول لمشاريعك"]
  ,["Artificial intelligence", "Intelligence artificielle", "ذكاء اصطناعي"]
  ,["Analysis and recommendations", "Analyses et recommandations", "تحليل واقتراحات"]
  ,["Integrated collaboration", "Collaboration intégrée", "تعاون متكامل"]
  ,["Across all stakeholders", "Entre toutes les parties prenantes", "بين كل الأطراف"]
  ,["Professional reports", "Rapports professionnels", "تقارير احترافية"]
  ,["Better decisions", "De meilleures décisions", "قرارات أفضل"]
];

function flattenDictionary(value: unknown, prefix = "", output: Record<string, string> = {}) {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => flattenDictionary(entry, `${prefix}.${index}`, output));
    return output;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => flattenDictionary(entry, prefix ? `${prefix}.${key}` : key, output));
  }
  return output;
}

function buildTranslationCatalog(): TranslationCatalog {
  const flattened = Object.fromEntries(locales.map((locale) => [locale, flattenDictionary(dictionaries[locale])])) as Record<Locale, Record<string, string>>;
  const catalog = Object.fromEntries(locales.map((locale) => [locale, {}])) as TranslationCatalog;

  const paths = new Set(locales.flatMap((locale) => Object.keys(flattened[locale])));
  paths.forEach((path) => {
    const values = locales.map((locale) => flattened[locale][path]);
    values.forEach((source) => {
      if (!source) return;
      locales.forEach((locale, index) => {
        if (values[index]) catalog[locale][source.trim()] = values[index].trim();
      });
    });
  });

  supplementalUiTranslations.forEach(([en, fr, ar]) => {
    const values: Record<Locale, string> = { en, fr, ar };
    locales.forEach((locale) => {
      [en, fr, ar].forEach((source) => {
        catalog[locale][source] = values[locale];
      });
    });
  });

  return catalog;
}

const generatedUiTranslationCatalog = buildTranslationCatalog();

export const uiTranslationCatalog: TranslationCatalog = {
  ar: { ...generatedUiTranslationCatalog.ar, ...arCatalog },
  fr: { ...generatedUiTranslationCatalog.fr, ...frCatalog },
  en: { ...generatedUiTranslationCatalog.en, ...enCatalog }
};

export function translateUiText(value: string, locale: Locale): string {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const source = value.trim();
  if (!source) return value;
  const exact = uiTranslationCatalog[locale][source];
  if (exact) return `${leading}${exact}${trailing}`;

  const quantityUnit = source.match(/^(\d+(?:[.,]\d+)?)\s+(day|days|week|weeks|month|months|year|years)$/i);
  if (quantityUnit) {
    const [, amount, unit] = quantityUnit;
    const localizedUnit = uiTranslationCatalog[locale][unit.toLowerCase()] || unit;
    return `${leading}${amount} ${localizedUnit}${trailing}`;
  }

  const score = source.match(/^(Technical|Commercial)\s+(\d+(?:[.,]\d+)?)%$/i);
  if (score) {
    const [, label, amount] = score;
    const localizedLabel = uiTranslationCatalog[locale][label] || label;
    return `${leading}${localizedLabel} ${amount}%${trailing}`;
  }

  const experience = source.match(/^(\d+)\s+years?\s+in\s+business$/i);
  if (experience) {
    const label = uiTranslationCatalog[locale]["Years in business"] || "Years in business";
    return locale === "ar"
      ? `${leading}${label}: ${experience[1]}${trailing}`
      : `${leading}${experience[1]} ${label.toLocaleLowerCase(locale === "fr" ? "fr" : "en")}${trailing}`;
  }

  return value;
}

