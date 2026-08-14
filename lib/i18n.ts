import arCatalog from "@/lib/locales/ar.json";
import enCatalog from "@/lib/locales/en.json";
import frCatalog from "@/lib/locales/fr.json";
import { translateRuntimeSystemText } from "@/lib/locales/runtime";
import { finalSystemTranslations } from "@/lib/locales/system";

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
      fileCount: "ملف"
    },
    pages: {
      loginTitle: "ادخل إلى مساحة العمل الفاخرة",
      loginDescription: "مصادقة حقيقية عبر Supabase Auth مع ملفات شخصية ومشاريع ومخرجات محفوظة.",
      loginHeading: "تسجيل الدخول",
      loginHint: "سجّل الدخول للوصول إلى مشاريعك ومخرجاتك المحفوظة.",
      registerWelcome: "مرحباً بك في VORQA",
      registerText: "أنا VORA، مساعدك الذكي. سأرافقك في كل خطوة لبناء مشروعك من الفكرة الأولى حتى اكتمال التنفيذ.",
      registerChoose: "اختر نوع الحساب المناسب لك",
      registerCreate: "إنشاء الحساب",
      registerNote: "يمكنك تعديل هذه المعلومات لاحقاً.",
      pricingTitle: "خطط مصممة للنمو",
      pricingDescription: "تسعير فاخر وواضح، جاهز للربط لاحقاً مع Stripe أو مزود دفع محلي.",
      settingsTitle: "إعدادات Vorqa AI",
      settingsDescription: "إعدادات المنتج، المزودات، Supabase، العلامة، التنبيهات، وتجربة المستخدم.",
      savedTitle: "المخرجات المحفوظة",
      savedDescription: "المخرجات المحفوظة جاهزة للتنظيم، البحث، والتصدير في المرحلة التالية.",
      favoritesTitle: "المفضلة",
      favoritesDescription: "أفضل المخرجات مثبتة في مكان واحد للرجوع السريع.",
      historyTitle: "سجل VORA",
      historyDescription: "سجل زمني لكل الأنشطة والمخرجات المحفوظة داخل مساحة العمل."
    }
  },
  fr: {
    meta: { title: "Vorqa AI - Espace de travail IA premium", description: "Plateforme IA pour documents, CV, landing pages et idées de projets." },
    common: {
      appName: "Vorqa AI", vora: "VORA", getStarted: "Commencer", startJourney: "Démarrer", login: "Connexion", register: "Créer un compte", logout: "Déconnexion",
      search: "Rechercher...", searchWorkspace: "Rechercher projets, sorties, outils...", language: "Langue", all: "Tout", save: "Enregistrer", delete: "Supprimer",
      download: "Télécharger", copy: "Copier", exportMarkdown: "Exporter Markdown", loading: "Chargement", retry: "Réessayer", empty: "Aucun élément",
      viewAll: "Voir tout", activeSession: "Session active", guestMode: "Mode invité", profileSettings: "Paramètres du profil", workspace: "Espace principal",
      notifications: "Notifications", primary: "Principal", prepared: "Préparé", email: "E-mail", password: "Mot de passe", fullName: "Nom complet"
    },
    nav: { home: "Accueil", features: "Fonctionnalités", workflow: "Flux", showcase: "Aperçus", pricing: "Tarifs", about: "À propos", dashboard: "Tableau de bord", more: "Plus", tools: "Outils IA", rfq: "Demandes de prix", quotations: "Devis", contracts: "Contrats", billing: "Facturation", admin: "Administration", notifications: "Notifications", knowledge: "Connaissances", documents: "Documents", projects: "Projets", history: "Historique", saved: "Enregistrés", favorites: "Favoris", settings: "Paramètres" },
    shell: {
      workspaceBadge: "Espace principal", askVora: "Demander à VORA", askVoraText: "Créez un document, un projet ou une idée depuis un seul espace.", productivity: "Productivité du jour", productivityText: "7 sorties et 3 projets suivis.",
      notifications: [["VORA est prête", "Lancez un document ou un projet depuis les actions rapides."], ["Sorties enregistrées", "Les dernières générations sont disponibles dans l’espace."], ["Conseil productivité", "Épinglez les projets importants en haut du tableau de bord."]]
    },
    landing: {
      heroBadge: "Suite d’exécution intelligente avec VORA", heroLanguage: "Arabe, français et anglais", brandLine: "De l’idée à la livraison, avec clarté.",
      titleA: "Transformez vos idées en projets exécutables", titleB: "et en documents professionnels avec VORA",
      subtitle: "Vorqa AI aide les fondateurs et les équipes à planifier, générer, organiser et suivre leur travail dans une expérience premium.",
      seeWorkflow: "Voir le fonctionnement", trust: "Adopté par des équipes innovantes", capabilitiesTitle: "Une plateforme pour planifier, produire et organiser",
      capabilitiesText: "Tout ce qu’il faut pour passer d’une idée à des livrables clairs.", workflowTitle: "Un flux de travail clair qui garde l’élan",
      workflowText: "Chaque étape réduit l’ambiguïté et transforme la décision suivante en action.", voraPreviewTitle: "Un assistant exécutif qui comprend le contexte",
      showcaseTitle: "Des aperçus conçus pour décider vite", statsTitle: "Des résultats mesurables dès le départ", rolesTitle: "Une expérience pour plusieurs rôles",
      testimonialsTitle: "Une qualité prête pour les investisseurs", pricingTitle: "Commencez maintenant, évoluez ensuite", faqTitle: "Questions fréquentes",
      finalTitle: "Lancez votre prochain projet avec plus de clarté", finalText: "Laissez VORA transformer votre première idée en documents, plan d’action et livrables.",
      cards: ["Planification intelligente", "Gestion organisée", "Exécution fiable"]
    },
    dashboard: {
      badge: "Espace principal", title: "Bonjour, transformons la journée en résultats clairs", description: "Suivez les projets, créez des documents, surveillez VORA et gardez vos meilleures sorties au même endroit.",
      dateLocale: "fr-FR", generateDocument: "Générer un document", createProject: "Créer un projet", quickSearchTitle: "Rechercher dans l’espace", assistantTip: "Suggestion : commencez par le projet de lancement, c’est le plus actif.",
      stats: ["Projets", "Documents générés", "Générations IA", "Taux d’achèvement", "Stockage", "Activité du jour"],
      quickActions: [["Créer un projet", "Démarrer un nouvel espace"], ["Générer un document", "Un document pro en quelques minutes"], ["Chat VORA", "Interroger l’assistant"], ["Modèles", "Partir d’une structure prête"]],
      insightsTitle: "Meilleure action maintenant", projectsTitle: "Travaux en cours", recentActivity: "Activité récente de VORA", recentOutputs: "Sorties récentes", calendar: "Calendrier", recentFiles: "Fichiers récents", emptyTitle: "Aucune tâche en attente", emptyText: "VORA affichera ici les sorties à réviser."
    },
    tools: {} as any,
    projects: {} as any,
    pages: {} as any
  },
  en: {
    meta: { title: "Vorqa AI - Premium AI Workspace", description: "AI platform for documents, CVs, landing pages, and project ideas." },
    common: {
      appName: "Vorqa AI", vora: "VORA", getStarted: "Get Started", startJourney: "Start Your Journey", login: "Log in", register: "Create account", logout: "Log out",
      search: "Search...", searchWorkspace: "Search projects, outputs, tools...", language: "Language", all: "All", save: "Save", delete: "Delete", download: "Download",
      copy: "Copy", exportMarkdown: "Export Markdown", loading: "Loading", retry: "Retry", empty: "Nothing here yet", viewAll: "View all", activeSession: "Active session",
      guestMode: "Guest mode", profileSettings: "Profile settings", workspace: "Main workspace", notifications: "Notifications", primary: "Primary", prepared: "Prepared", email: "Email", password: "Password", fullName: "Full name"
    },
    nav: { home: "Home", features: "Features", workflow: "Workflow", showcase: "Showcase", pricing: "Pricing", about: "About", dashboard: "Dashboard", more: "More", tools: "AI Tools", rfq: "RFQs", quotations: "Quotations", contracts: "Contracts", billing: "Billing", admin: "Administration", notifications: "Notifications", knowledge: "Knowledge", documents: "Documents", projects: "Projects", history: "History", saved: "Saved", favorites: "Favorites", settings: "Settings" },
    shell: {
      workspaceBadge: "Main workspace", askVora: "Ask VORA", askVoraText: "Start a document, project, or business idea from one place.", productivity: "Today’s productivity", productivityText: "7 outputs and 3 projects in progress.",
      notifications: [["VORA is ready", "Start a document or project from quick actions."], ["Saved outputs", "Latest generations are ready in your workspace."], ["Productivity tip", "Pin key projects to keep them at the top."]]
    },
    landing: {
      heroBadge: "Intelligent execution suite powered by VORA", heroLanguage: "Arabic, French, and English", brandLine: "From idea to delivery, with clarity.",
      titleA: "Turn ideas into executable projects", titleB: "and professional documents with VORA",
      subtitle: "Vorqa AI helps founders and teams plan, generate, organize, and track work in one premium workspace.",
      seeWorkflow: "See how it works", trust: "Trusted by innovative teams", capabilitiesTitle: "One platform to plan, produce, and organize",
      capabilitiesText: "Everything you need to turn ideas into clear deliverables.", workflowTitle: "A clear workflow that keeps momentum",
      workflowText: "Each stage reduces ambiguity and turns the next decision into action.", voraPreviewTitle: "An executive assistant that understands context",
      showcaseTitle: "Preview boards designed for decisions", statsTitle: "Measurable outcomes from day one", rolesTitle: "One experience for multiple roles",
      testimonialsTitle: "Investor-ready product quality", pricingTitle: "Start now, scale as projects grow", faqTitle: "Frequently asked questions",
      finalTitle: "Start your next project with more clarity", finalText: "Let VORA turn your first idea into documents, an execution plan, and ready-to-use outputs.",
      cards: ["Smart planning", "Organized management", "Reliable execution"]
    },
    dashboard: {
      badge: "Main workspace", title: "Welcome, let’s turn today into clear outcomes", description: "Track projects, create documents, monitor VORA, and keep important outputs in one focused workspace.",
      dateLocale: "en-US", generateDocument: "Generate document", createProject: "Create project", quickSearchTitle: "Search your workspace", assistantTip: "Suggestion: review the launch project first; it has the most activity.",
      stats: ["Projects", "Generated documents", "AI generations", "Completion rate", "Storage", "Today’s activity"],
      quickActions: [["Create project", "Start a new workspace"], ["Generate document", "A professional doc in minutes"], ["VORA Chat", "Ask the assistant"], ["Templates", "Start from a ready structure"]],
      insightsTitle: "Best next action", projectsTitle: "Work in progress", recentActivity: "Recent VORA activity", recentOutputs: "Recent outputs", calendar: "Work calendar", recentFiles: "Recent files", emptyTitle: "No pending tasks", emptyText: "VORA will show review items here when they appear."
    },
    tools: {} as any,
    projects: {} as any,
    pages: {} as any
  }
};

function mergeLocale<T extends Record<string, unknown>>(base: T, partial: Partial<T>): T {
  return { ...base, ...partial } as T;
}

dictionaries.fr.tools = mergeLocale(dictionaries.ar.tools, {
  pageTitle: "Bibliothèque d’outils premium",
  pageDescription: "Des outils professionnels organisés par usage, avec des formulaires riches et des sorties prêtes à enregistrer.",
  studioDescription: "Remplissez le formulaire pour obtenir une sortie claire, structurée et exploitable.",
  askVora: "Demander à VORA",
  retryVora: "Réessayer",
  outputAtelier: "Atelier de sortie VORA",
  openaiConnected: "OpenAI connecté",
  mockMode: "Mode démo",
  emptyOutput: "Remplissez le formulaire pour que VORA rédige une sortie professionnelle.",
  copiedTitle: "Copié",
  copiedText: "La sortie a été copiée dans le presse-papiers.",
  markdownTitle: "Markdown",
  markdownText: "Le fichier Markdown est prêt.",
  successTitle: "Génération terminée",
  successOpenAi: "La sortie a été générée avec OpenAI et enregistrée dans l’historique.",
  successMock: "La sortie a été générée en mode démo et enregistrée.",
  failTitle: "Génération impossible",
  failText: "Vérifiez les informations et réessayez.",
  readError: "Impossible de lire la réponse du serveur.",
  createError: "Impossible de générer le contenu pour le moment.",
  networkError: "Erreur de connexion."
});
dictionaries.en.tools = mergeLocale(dictionaries.ar.tools, {
  pageTitle: "Premium tool library",
  pageDescription: "Professional tools organized by workflow, with rich forms and outputs ready to save and search.",
  studioDescription: "Fill the form to receive a structured, useful professional output.",
  askVora: "Ask VORA",
  retryVora: "Retry VORA",
  outputAtelier: "VORA Output Atelier",
  openaiConnected: "OpenAI connected",
  mockMode: "Demo mode",
  emptyOutput: "Fill the form to let VORA craft a professional output, then copy or export it as Markdown.",
  copiedTitle: "Copied",
  copiedText: "The output was copied to your clipboard.",
  markdownTitle: "Markdown",
  markdownText: "Markdown export is ready.",
  successTitle: "Generation complete",
  successOpenAi: "The output was generated with OpenAI and saved to history.",
  successMock: "The output was generated in demo mode and saved to history.",
  failTitle: "Could not generate content",
  failText: "Review the inputs and try again.",
  readError: "Could not read the server response.",
  createError: "Could not generate content right now.",
  networkError: "Connection error."
});

dictionaries.fr.projects = mergeLocale(dictionaries.ar.projects, {
  title: "Galerie de projets",
  description: "Chaque projet conserve son type, son état, sa dernière mise à jour et sa progression.",
  newProject: "Nouveau projet",
  search: "Rechercher des projets...",
  knowledgeTitle: "Espace de connaissance du projet",
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
  ["star", "étoile", "نجمة"],
  ["stars", "étoiles", "نجوم"],
  ["file", "fichier", "ملف"],
  ["files", "fichiers", "ملفات"],
  ["project", "projet", "مشروع"],
  ["projects", "projets", "مشاريع"],
  ["output", "résultat", "مخرج"],
  ["outputs", "résultats", "مخرجات"],
  ["quotation", "devis", "عرض سعر"],
  ["quotations", "devis", "عروض أسعار"],
  ["approval", "approbation", "موافقة"],
  ["approvals", "approbations", "موافقات"],
  ["member", "membre", "عضو"],
  ["members", "membres", "أعضاء"],
  ["request", "demande", "طلب"],
  ["requests", "demandes", "طلبات"],
  ["contract", "contrat", "عقد"],
  ["contracts", "contrats", "عقود"],
  ["document", "document", "مستند"],
  ["documents", "documents", "مستندات"],
  ["workspace", "espace de travail", "مساحة عمل"],
  ["workspaces", "espaces de travail", "مساحات عمل"],
  ["notification", "notification", "إشعار"],
  ["notifications", "notifications", "إشعارات"],
  ["action", "action", "إجراء"],
  ["actions", "actions", "إجراءات"],
  ["Workspace context", "Contexte de l’espace", "سياق مساحة العمل"],
  ["Current project", "Projet actuel", "المشروع الحالي"],
  ["Selected language", "Langue sélectionnée", "اللغة المختارة"],
  ["AI mode", "Mode IA", "وضع الذكاء الاصطناعي"],
  ["Online", "En ligne", "متصل"],
  ["AI Status: Ready", "État IA : prête", "حالة الذكاء الاصطناعي: جاهز"],
  ["Construction Command Center", "Centre de commande de construction", "مركز قيادة البناء"],
  ["Project-aware", "Conscient du projet", "مدرك لسياق المشروع"],
  ["Context Panel", "Panneau de contexte", "لوحة السياق"],
  ["Uploaded documents", "Documents importés", "المستندات المرفوعة"],
  ["Active knowledge", "Connaissances actives", "المعرفة النشطة"],
  ["Context readiness", "Préparation du contexte", "جاهزية السياق"],
  ["AI Memory", "Mémoire IA", "ذاكرة الذكاء الاصطناعي"],
  ["Quick Tools", "Outils rapides", "أدوات سريعة"],
  ["Suggested Prompts", "Suggestions de requêtes", "اقتراحات جاهزة"],
  ["Tool Library", "Bibliothèque d’outils", "مكتبة الأدوات"],
  ["Recent conversation", "Conversation récente", "محادثة حديثة"],
  ["Recent output", "Résultat récent", "مخرج حديث"],
  ["Recent report", "Rapport récent", "تقرير حديث"],
  ["Budget health summary", "Synthèse de santé budgétaire", "ملخص سلامة الميزانية"],
  ["Favorite prompt", "Requête favorite", "طلب مفضل"],
  ["New conversation", "Nouvelle conversation", "محادثة جديدة"],
  ["Search knowledge", "Rechercher dans les connaissances", "البحث في المعرفة"],
  ["VORA is typing", "VORA rédige", "VORA يكتب"],
  ["You", "Vous", "أنت"],
  ["Enabled", "Activé", "مفعّل"],
  ["Not set", "Non défini", "غير محدد"],
  ["Not scheduled", "Non planifié", "غير مجدول"],
  ["Not available", "Indisponible", "غير متوفر"],
  ["All suppliers", "Tous les fournisseurs", "كل الموردين"],
  ["All categories", "Toutes les catégories", "كل الفئات"],
  ["All countries", "Tous les pays", "كل البلدان"],
  ["All cities", "Toutes les villes", "كل المدن"],
  ["All verification", "Tous les niveaux de vérification", "كل حالات التوثيق"],
  ["All ratings", "Toutes les évaluations", "كل التقييمات"],
  ["All experience", "Tous les niveaux d’expérience", "كل مستويات الخبرة"],
  ["All availability", "Toutes les disponibilités", "كل حالات التوفر"],
  ["All languages", "Toutes les langues", "كل اللغات"],
  ["All services", "Tous les services", "كل الخدمات"],
  ["Pending verification", "Vérification en attente", "قيد التوثيق"],
  ["Available", "Disponible", "متاح"],
  ["Limited slots", "Places limitées", "أماكن محدودة"],
  ["By request", "Sur demande", "حسب الطلب"],
  ["recommended", "recommandé", "موصى به"],
  ["rating", "évaluation", "التقييم"],
  ["experience", "expérience", "الخبرة"],
  ["completed-projects", "projets terminés", "المشاريع المكتملة"],
  ["response-time", "délai de réponse", "وقت الاستجابة"],
  ["newest", "plus récent", "الأحدث"],
  ["Morocco", "Maroc", "المغرب"],
  ["Casablanca", "Casablanca", "الدار البيضاء"],
  ["Rabat", "Rabat", "الرباط"],
  ["Tangier", "Tanger", "طنجة"],
  ["Marrakech", "Marrakech", "مراكش"],
  ["Agadir", "Agadir", "أكادير"],
  ["Fez", "Fès", "فاس"],
  ["Tetouan", "Tétouan", "تطوان"],
  ["Arabic", "Arabe", "العربية"],
  ["French", "Français", "الفرنسية"],
  ["English", "Anglais", "الإنجليزية"],
  ["Spanish", "Espagnol", "الإسبانية"],
  ["Theme", "Thème", "المظهر"],
  ["Dark luxury default with light mode prepared", "Thème sombre premium par défaut, mode clair disponible", "مظهر داكن فاخر افتراضياً مع توفر الوضع الفاتح"],
  ["In-app notification center prepared", "Centre de notifications intégré prêt", "مركز الإشعارات داخل التطبيق جاهز"],
  ["Authentication", "Authentification", "المصادقة"],
  ["Supabase Auth environment prepared", "Environnement Supabase Auth prêt", "بيئة مصادقة Supabase جاهزة"],
  ["AI Providers", "Fournisseurs IA", "مزودو الذكاء الاصطناعي"],
  ["Supabase Integration", "Intégration Supabase", "تكامل Supabase"],
  ["Feature Flags", "Fonctionnalités contrôlées", "مفاتيح الميزات"],
  ["API latency", "Latence API", "زمن استجابة API"],
  ["Error rate", "Taux d’erreur", "معدل الأخطاء"],
  ["Uptime", "Disponibilité", "مدة التشغيل"],
  ["System health", "Santé du système", "سلامة النظام"],
  ["Platform administration center", "Centre d’administration de la plateforme", "مركز إدارة المنصة"],
  ["Internal workspace for organizations, users, subscriptions, usage, and audit operations.", "Espace interne pour gérer les organisations, les utilisateurs, les abonnements, l’utilisation et l’audit.", "مساحة داخلية لإدارة المؤسسات والمستخدمين والاشتراكات والاستخدام وعمليات التدقيق."],
  ["Administrative data is unavailable, so Vorqa is showing the demo fallback.", "Les données administratives sont indisponibles. Vorqa affiche donc les données de démonstration.", "بيانات الإدارة غير متاحة، لذلك تعرض Vorqa البيانات التجريبية البديلة."],
  ["Not linked", "Non lié", "غير مرتبط"],
  ["Recent audit events", "Événements d’audit récents", "أحداث التدقيق الأخيرة"],
  ["Total users", "Total des utilisateurs", "إجمالي المستخدمين"],
  ["Active organizations", "Organisations actives", "المؤسسات النشطة"],
  ["Revenue foundation", "Base de revenus", "أساس الإيرادات"],
  ["AI usage", "Utilisation IA", "استخدام الذكاء الاصطناعي"],
  ["AI requests", "Requêtes IA", "طلبات الذكاء الاصطناعي"],
  ["Storage", "Stockage", "التخزين"],
  ["Jobs", "Tâches système", "مهام النظام"],
  ["Workers", "Agents", "المعالجات"],
  ["Locked", "Verrouillé", "مقفل"],
  ["Editable", "Modifiable", "قابل للتعديل"],
  ["open", "ouverte", "مفتوحة"],
  ["paid", "payée", "مدفوعة"],
  ["trialing", "en période d’essai", "قيد التجربة"],
  ["manual", "manuel", "يدوي"],
  ["Current plan", "Forfait actuel", "الخطة الحالية"],
  ["Trial progress", "Progression de l’essai", "تقدم الفترة التجريبية"],
  ["Metric", "Indicateur", "المؤشر"],
  ["Used", "Utilisé", "المستخدم"],
  ["Limit", "Limite", "الحد"],
  ["Unit", "Unité", "الوحدة"],
  ["Invoice", "Facture", "الفاتورة"],
  ["Issued", "Émise", "تاريخ الإصدار"],
  ["Plans", "Forfaits", "الخطط"],
  ["Invoices", "Factures", "الفواتير"],
  ["Usage", "Utilisation", "الاستخدام"],
  ["Free", "Gratuit", "مجاني"],
  ["Starter", "Essentiel", "المبتدئ"],
  ["Professional", "Professionnel", "الاحترافي"],
  ["Enterprise", "Entreprise", "المؤسسات"],
  ["Custom", "Sur mesure", "مخصص"],
  ["Current", "Actuel", "الحالي"],
  ["Plan", "Forfait", "الخطة"],
  ["Prepare upgrade", "Préparer la mise à niveau", "تحضير الترقية"],
  ["For exploring Vorqa with one lightweight workspace.", "Pour découvrir Vorqa avec un espace de travail léger.", "لاستكشاف Vorqa ضمن مساحة عمل خفيفة."],
  ["For small teams managing early construction projects.", "Pour les petites équipes gérant leurs premiers projets de construction.", "للفرق الصغيرة التي تدير مشاريع البناء في مراحلها الأولى."],
  ["For construction companies coordinating projects, vendors, RFQs, and contracts.", "Pour les entreprises de construction coordonnant projets, fournisseurs, appels d’offres et contrats.", "لشركات البناء التي تنسق المشاريع والموردين وطلبات الأسعار والعقود."],
  ["For large owners, groups, and multi-organization construction operations.", "Pour les grands maîtres d’ouvrage, groupes et opérations multi-organisations.", "لكبار ملاك المشاريع والمجموعات وعمليات البناء متعددة المؤسسات."],
  ["Priority support", "Support prioritaire", "دعم ذو أولوية"],
  ["Unlimited workspaces", "Espaces de travail illimités", "مساحات عمل غير محدودة"],
  ["Custom AI limits", "Limites IA personnalisées", "حدود مخصصة للذكاء الاصطناعي"],
  ["Dedicated onboarding", "Accompagnement dédié", "تهيئة مخصصة"],
  ["Manual invoicing", "Facturation manuelle", "فوترة يدوية"],
  ["Enterprise support", "Support entreprise", "دعم المؤسسات"],
  ["Luxury Villa Casablanca execution package", "Lot d’exécution de la villa de luxe à Casablanca", "حزمة تنفيذ فيلا فاخرة بالدار البيضاء"],
  ["Best overall execution accountability with strong reporting and site management.", "Meilleure responsabilité globale d’exécution avec un reporting et une gestion de chantier solides.", "أفضل مسؤولية شاملة عن التنفيذ مع تقارير قوية وإدارة فعالة للموقع."],
  ["Strong technical validation partner for structural and engineering review.", "Partenaire solide de validation technique pour les revues structurelles et d’ingénierie.", "شريك قوي للتحقق التقني ومراجعة الأعمال الإنشائية والهندسية."],
  ["Competitive material supply proposal with verified quality documentation.", "Offre compétitive de fourniture de matériaux avec documents qualité vérifiés.", "عرض تنافسي لتوريد المواد مع وثائق جودة موثقة."],
  ["Fast geotechnical advisory and foundation risk summary.", "Conseil géotechnique rapide et synthèse des risques de fondation.", "استشارة جيوتقنية سريعة وملخص لمخاطر الأساسات."],
  ["Included", "Inclus", "مشمول"],
  ["Immediate", "Immédiate", "فوري"],
  ["High", "Élevé", "عالٍ"],
  ["Medium", "Moyen", "متوسط"],
  ["Low", "Faible", "منخفض"],
  ["Very high", "Très élevé", "عالٍ جداً"],
  ["Strong", "Solide", "قوي"],
  ["Lowest", "Le plus faible", "الأدنى"],
  ["Budget overrun risk detected", "Risque de dépassement budgétaire détecté", "تم اكتشاف خطر تجاوز الميزانية"],
  ["Luxury Villa Casablanca marble procurement is trending 8% above planned budget. Review supplier quotations before approval.", "Les achats de marbre de Luxury Villa Casablanca dépassent de 8 % le budget prévu. Examinez les devis avant approbation.", "تتجه مشتريات الرخام في Luxury Villa Casablanca إلى تجاوز الميزانية المخططة بنسبة 8%. راجع عروض الموردين قبل الموافقة."],
  ["Milestone delay warning", "Alerte de retard de jalon", "تحذير تأخر مرحلة"],
  ["Structural frame inspection is 2 days behind the baseline schedule. VORA recommends escalating the inspection checklist.", "L’inspection de la structure accuse deux jours de retard. VORA recommande d’escalader la liste de contrôle.", "يتأخر فحص الهيكل الإنشائي يومين عن الجدول الأساسي. توصي VORA بتصعيد قائمة الفحص."],
  ["RFQ response received", "Réponse à l’appel d’offres reçue", "تم استلام رد على طلب عرض السعر"],
  ["BetonPro Materials submitted a quotation for RFQ-1001 with a 14-day delivery window.", "BetonPro Materials a soumis un devis pour RFQ-1001 avec un délai de livraison de 14 jours.", "قدمت BetonPro Materials عرض سعر لـ RFQ-1001 بمهلة تسليم قدرها 14 يوماً."],
  ["Contract approval required", "Approbation du contrat requise", "مطلوب اعتماد العقد"],
  ["CON-1001 needs executive approval before the next payment milestone can be released.", "CON-1001 nécessite une approbation exécutive avant le prochain paiement d’étape.", "يحتاج CON-1001 إلى موافقة الإدارة قبل صرف دفعة المرحلة التالية."],
  ["Missing safety document", "Document de sécurité manquant", "مستند سلامة مفقود"],
  ["The latest site safety method statement is missing from the project knowledge base.", "La dernière méthode de sécurité chantier manque dans la base de connaissances du projet.", "بيان منهجية السلامة الأخير مفقود من قاعدة معرفة المشروع."],
  ["Marketplace connection accepted", "Connexion à la place de marché acceptée", "تم قبول اتصال السوق"],
  ["GeoConsult Africa accepted your connection request and is available for geotechnical review.", "GeoConsult Africa a accepté votre demande de connexion et est disponible pour la revue géotechnique.", "قبلت GeoConsult Africa طلب الاتصال وهي متاحة للمراجعة الجيوتقنية."],
  ["Quotation comparison ready", "Comparaison des devis prête", "مقارنة عروض الأسعار جاهزة"],
  ["VORA prepared a comparison summary for RFQ-1001 quotations and highlighted the best-value option.", "VORA a préparé une synthèse comparative des devis RFQ-1001 et mis en avant la meilleure valeur.", "أعدت VORA ملخص مقارنة لعروض RFQ-1001 وأبرزت الخيار الأفضل قيمة."],
  ["Task workload alert", "Alerte de charge de travail", "تنبيه عبء المهام"],
  ["Site engineering workload is above 82%. Consider moving two inspection tasks to the architecture team.", "La charge de l’ingénierie chantier dépasse 82 %. Envisagez de transférer deux inspections à l’équipe architecture.", "يتجاوز عبء الهندسة بالموقع 82%. يُنصح بنقل مهمتي تفتيش إلى فريق العمارة."],
  ["Payment reminder", "Rappel de paiement", "تذكير بالدفع"],
  ["Supplier advance payment review is due tomorrow for the steel procurement package.", "La revue de l’avance fournisseur est prévue demain pour le lot d’acier.", "موعد مراجعة الدفعة المقدمة للمورد غداً ضمن حزمة توريد الفولاذ."],
  ["System maintenance window", "Fenêtre de maintenance système", "فترة صيانة النظام"],
  ["Vorqa demo services are prepared for a short maintenance window. No user action is required.", "Les services de démonstration Vorqa sont prêts pour une courte maintenance. Aucune action utilisateur n’est requise.", "خدمات Vorqa التجريبية مهيأة لفترة صيانة قصيرة، ولا يلزم المستخدم اتخاذ أي إجراء."],
  ["Execution phase · Structural inspection", "Phase d’exécution · Inspection structurelle", "مرحلة التنفيذ · الفحص الإنشائي"],
  ["Supplier package", "Lot fournisseur", "حزمة المورد"],
  ["Atlas execution contract", "Contrat d’exécution Atlas", "عقد تنفيذ Atlas"],
  ["Documents · Safety", "Documents · Sécurité", "المستندات · السلامة"],
  ["Marketplace · Consultants", "Place de marché · Consultants", "السوق · الاستشاريون"],
  ["Quotation evaluation", "Évaluation des devis", "تقييم عروض الأسعار"],
  ["Team workload · Engineering", "Charge équipe · Ingénierie", "عبء الفريق · الهندسة"],
  ["Finance · Procurement", "Finance · Achats", "المالية · المشتريات"],
  ["System", "Système", "النظام"],
  ["Now", "Maintenant", "الآن"],
  ["Luxury Villa Casablanca execution contract", "Contrat d’exécution de la villa de luxe à Casablanca", "عقد تنفيذ الفيلا الفاخرة بالدار البيضاء"],
  ["Rabat engineering review agreement", "Accord de revue technique de Rabat", "اتفاقية المراجعة الهندسية بالرباط"],
  ["Tangier materials supply contract", "Contrat de fourniture de matériaux de Tanger", "عقد توريد المواد بطنجة"],
  ["GeoConsult advisory contract", "Contrat de conseil GeoConsult", "عقد استشارات GeoConsult"],
  ["Construction execution", "Exécution de construction", "تنفيذ البناء"],
  ["Engineering services", "Services d’ingénierie", "الخدمات الهندسية"],
  ["Material supply", "Fourniture de matériaux", "توريد المواد"],
  ["Consulting", "Conseil", "الاستشارات"],
  ["Expiring", "Expire bientôt", "قارب على الانتهاء"],
  ["Execution contract for structural works, site management, reporting, and coordinated delivery following RFQ award preview.", "Contrat d’exécution des travaux structurels, de la gestion de chantier, du reporting et de la livraison coordonnée après attribution.", "عقد لتنفيذ الأعمال الإنشائية وإدارة الموقع والتقارير والتسليم المنسق بعد ترسية طلب عرض السعر."],
  ["Draft agreement for engineering validation and permit package review.", "Projet d’accord pour la validation technique et la revue du dossier de permis.", "مسودة اتفاقية للتحقق الهندسي ومراجعة حزمة الترخيص."],
  ["Completed material supply agreement for warehouse execution package.", "Accord de fourniture de matériaux achevé pour le lot d’exécution de l’entrepôt.", "اتفاقية توريد مواد مكتملة لحزمة تنفيذ المستودع."],
  ["Geotechnical advisory contract nearing closeout.", "Contrat de conseil géotechnique proche de la clôture.", "عقد استشارات جيوتقنية يقترب من الإغلاق."],
  ["Track invoice status, taxes, totals, due dates, and future download actions.", "Suivez le statut des factures, les taxes, les totaux, les échéances et les futurs téléchargements.", "تابع حالة الفواتير والضرائب والإجماليات وتواريخ الاستحقاق وخيارات التنزيل."],
  ["ابحث في البنود والفئات والأقسام", "Rechercher dans les postes, catégories et départements", "ابحث في البنود والفئات والأقسام"],
  ["عدّل البحث أو أضف بند ميزانية جديد.", "Modifiez la recherche ou ajoutez un nouveau poste budgétaire.", "عدّل البحث أو أضف بند ميزانية جديداً."],
  ["ابحث في التقارير...", "Rechercher dans les rapports...", "ابحث في التقارير..."],
  ["Search users", "Rechercher des utilisateurs", "البحث عن المستخدمين"],
  ["Search by name, email, role, organization...", "Rechercher par nom, e-mail, rôle ou organisation...", "ابحث بالاسم أو البريد أو الدور أو المؤسسة..."],
  ["Adjust your search or filters.", "Modifiez votre recherche ou vos filtres.", "عدّل البحث أو عوامل التصفية."],
  ["Search organizations...", "Rechercher des organisations...", "البحث عن المؤسسات..."],
  ["Search audit", "Rechercher dans l’audit", "البحث في سجل التدقيق"],
  ["Search actor, action, target...", "Rechercher un acteur, une action ou une cible...", "ابحث عن منفذ أو إجراء أو هدف..."],
  ["Search employees...", "Rechercher des employés...", "البحث عن الموظفين..."],
  ["Search departments...", "Rechercher des départements...", "البحث عن الأقسام..."],
  ["Search departments or leads", "Rechercher des départements ou responsables", "البحث عن الأقسام أو المسؤولين"],
  ["Adjust the search or filters to bring department workspaces back into view.", "Modifiez la recherche ou les filtres pour afficher les espaces des départements.", "عدّل البحث أو عوامل التصفية لإظهار مساحات الأقسام."],
  ["Search by name, role or department", "Rechercher par nom, rôle ou département", "ابحث بالاسم أو الدور أو القسم"],
  ["Reset filters or search another role to bring workforce records back.", "Réinitialisez les filtres ou recherchez un autre rôle pour afficher les collaborateurs.", "أعد ضبط عوامل التصفية أو ابحث عن دور آخر لإظهار سجلات الفريق."],
  ["Search roles, departments or access", "Rechercher des rôles, départements ou accès", "البحث في الأدوار أو الأقسام أو الصلاحيات"],
  ["Reset search or filters to review the full permissions model.", "Réinitialisez la recherche ou les filtres pour consulter toutes les autorisations.", "أعد ضبط البحث أو عوامل التصفية لمراجعة نموذج الصلاحيات كاملاً."],
  ["VORA prioritizes risk-heavy events first: budget overruns, delayed milestones, missing documents, and pending contract approvals.", "VORA priorise les événements à risque : dépassements budgétaires, jalons retardés, documents manquants et approbations de contrats en attente.", "تعطي VORA الأولوية للأحداث الأعلى خطراً: تجاوزات الميزانية وتأخر المعالم والمستندات الناقصة واعتمادات العقود المعلقة."],
  ["Search notifications, context, modules...", "Rechercher des notifications, contextes ou modules...", "البحث في الإشعارات والسياق والوحدات..."],
  ["Winning company", "Entreprise attributaire", "الشركة الفائزة"],
  ["Contract value", "Valeur du contrat", "قيمة العقد"],
  ["Contract type", "Type de contrat", "نوع العقد"],
  ["Retention", "Retenue", "الاحتجاز المالي"],
  ["Award decision", "Décision d’attribution", "قرار الترسية"],
  ["Award date", "Date d’attribution", "تاريخ الترسية"],
  ["Award value", "Valeur attribuée", "قيمة الترسية"],
  ["Award reason", "Motif d’attribution", "سبب الترسية"],
  ["Milestone progress", "Progression du jalon", "تقدم المعلم"],
  ["Deliverables", "Livrables", "المخرجات المطلوبة"],
  ["Contract timeline", "Chronologie du contrat", "الخط الزمني للعقد"],
  ["VORA Contract Insights", "Analyses contractuelles VORA", "رؤى VORA للعقد"],
  ["Post-award foundation", "Gestion post-attribution", "إدارة ما بعد الترسية"],
  ["Contract management workspace.", "Espace de gestion des contrats.", "مساحة إدارة العقود."],
  ["Active contracts", "Contrats actifs", "العقود النشطة"],
  ["Awaiting approval", "En attente d’approbation", "بانتظار الموافقة"],
  ["Upcoming milestones", "Jalons à venir", "المعالم القادمة"],
  ["Total value", "Valeur totale", "القيمة الإجمالية"],
  ["Search contracts, RFQs, companies or projects", "Rechercher des contrats, appels d’offres, entreprises ou projets", "البحث في العقود أو طلبات الأسعار أو الشركات أو المشاريع"],
  ["Adjust your search or filters to restore the contract dashboard.", "Modifiez la recherche ou les filtres pour réafficher le tableau des contrats.", "عدّل البحث أو عوامل التصفية لإظهار لوحة العقود."],
  ["Linked RFQ", "Appel d’offres associé", "طلب عرض السعر المرتبط"],
  ["Contract progress", "Progression du contrat", "تقدم العقد"],
  ["Discover contractors, engineering firms, architects, suppliers, logistics teams, equipment providers, and consultants inside a premium B2B construction marketplace.", "Découvrez entrepreneurs, bureaux d’études, architectes, fournisseurs, logisticiens, loueurs d’équipements et consultants sur une place de marché B2B dédiée à la construction.", "اكتشف المقاولين والمكاتب الهندسية والمعماريين والموردين وشركات اللوجستيك ومزودي المعدات والاستشاريين داخل سوق مهني للبناء."],
  ["Search companies, categories, cities or services", "Rechercher des entreprises, catégories, villes ou services", "البحث عن الشركات أو الفئات أو المدن أو الخدمات"],
  ["Search marketplace", "Rechercher sur la place de marché", "البحث في السوق"],
  ["Adjust the search, category, verification, city, or rating filters to discover more B2B partners.", "Modifiez la recherche, la catégorie, la vérification, la ville ou la note pour découvrir davantage de partenaires.", "عدّل البحث أو الفئة أو حالة التوثيق أو المدينة أو التقييم لاكتشاف شركاء إضافيين."],
  ["Search shortlist", "Rechercher dans la sélection", "البحث في القائمة المختصرة"],
  ["Search RFQs, projects, suppliers or services", "Rechercher des appels d’offres, projets, fournisseurs ou services", "البحث في طلبات الأسعار أو المشاريع أو الموردين أو الخدمات"],
  ["Adjust search, status, category, or priority filters to find RFQs.", "Modifiez la recherche, le statut, la catégorie ou la priorité pour trouver des appels d’offres.", "عدّل البحث أو الحالة أو الفئة أو الأولوية للعثور على طلبات الأسعار."],
  ["Search suppliers", "Rechercher des fournisseurs", "البحث عن الموردين"],
  ["Search RFQs, projects or services", "Rechercher des appels d’offres, projets ou services", "البحث في طلبات الأسعار أو المشاريع أو الخدمات"],
  ["Adjust your search or filters to restore the RFQ dashboard.", "Modifiez la recherche ou les filtres pour réafficher le tableau des appels d’offres.", "عدّل البحث أو عوامل التصفية لإظهار لوحة طلبات الأسعار."],
  ["Search quotation, supplier, RFQ or project", "Rechercher un devis, fournisseur, appel d’offres ou projet", "البحث في عرض سعر أو مورد أو طلب أسعار أو مشروع"],
  ["Adjust search and filters or open an RFQ to invite suppliers.", "Modifiez la recherche et les filtres ou ouvrez un appel d’offres pour inviter des fournisseurs.", "عدّل البحث وعوامل التصفية أو افتح طلب عرض سعر لدعوة الموردين."],
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

  [...supplementalUiTranslations, ...finalSystemTranslations].forEach(([first, fr, third]) => {
    // A small number of legacy screens were authored in Arabic. Their tuples
    // intentionally use [Arabic, French, English] so all original source
    // variants can still resolve without rewriting presentation components.
    const arabicAuthored = /[\u0600-\u06ff]/.test(first) && !/[\u0600-\u06ff]/.test(third);
    const en = arabicAuthored ? third : first;
    const ar = arabicAuthored ? first : third;
    const values: Record<Locale, string> = { en, fr, ar };
    locales.forEach((locale) => {
      [first, fr, third].forEach((source) => {
        catalog[locale][source] = values[locale];
      });
    });
  });

  return catalog;
}

const generatedUiTranslationCatalog = buildTranslationCatalog();

const rejectedFlatTranslations: Record<Locale, ReadonlySet<string>> = {
  ar: new Set([
    "معلومات المؤسسة وأدوات إدارتها", "معلومات الفوترة وإدارة الاشتراك", "معلومات طلب عرض السعر وإجراءات المشتريات",
    "معلومات السوق وإجراءات الشركاء", "معلومات التطبيق والإجراءات المتاحة", "عرض التفاصيل", "لا تتوفر معلومات مطابقة",
    "البحث في المعلومات المتاحة", "معلومات الأداة والإجراءات المتاحة", "العودة إلى العرض السابق", "معلومات العقد ومتابعة التسليم",
    "معلومات إعداد مساحة العمل", "معلومات الإدارة وأدوات التحكم في المنصة", "إنشاء سجل جديد"
  ]),
  fr: new Set([
    "Informations de l’application et actions disponibles", "Informations et gestion de l’organisation",
    "Informations de facturation et gestion de l’abonnement", "Informations de demande de devis et actions d’approvisionnement",
    "Informations de la place de marché et actions partenaires", "Voir les détails", "Aucune information correspondante n’est disponible",
    "Rechercher dans les informations disponibles", "Informations de l’outil et actions disponibles", "Revenir à la vue précédente",
    "Informations contractuelles et suivi de livraison", "Informations de configuration de l’espace",
    "Informations d’administration et contrôles de la plateforme", "Créer un nouvel élément"
  ]),
  en: new Set(["Application information and available actions"])
};

function preciseFlatCatalog(locale: Locale, catalog: Record<string, string>) {
  return Object.fromEntries(Object.entries(catalog).filter(([, translated]) => !rejectedFlatTranslations[locale].has(translated)));
}

export const uiTranslationCatalog: TranslationCatalog = {
  // The curated dictionaries are authoritative. The flat catalogs are an
  // offline compatibility layer and may only fill keys not owned by them.
  // This prevents broad audit placeholders from replacing precise labels.
  ar: { ...preciseFlatCatalog("ar", arCatalog), ...generatedUiTranslationCatalog.ar },
  fr: { ...preciseFlatCatalog("fr", frCatalog), ...generatedUiTranslationCatalog.fr },
  en: { ...preciseFlatCatalog("en", enCatalog), ...generatedUiTranslationCatalog.en }
};

const normalizedUiTranslationCatalog = Object.fromEntries(locales.map((locale) => [
  locale,
  Object.fromEntries(Object.entries(uiTranslationCatalog[locale]).map(([key, translated]) => [key.toLocaleLowerCase("en"), translated]))
])) as TranslationCatalog;

export function translateUiText(value: string, locale: Locale): string {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const source = value.trim();
  if (!source) return value;
  const runtimeTranslation = translateRuntimeSystemText(source, locale);
  if (runtimeTranslation) return `${leading}${runtimeTranslation}${trailing}`;
  const exact = uiTranslationCatalog[locale][source];
  if (exact) return `${leading}${exact}${trailing}`;

  const normalizedSource = source.replaceAll("_", " ");
  const normalized = normalizedUiTranslationCatalog[locale][normalizedSource.toLocaleLowerCase("en")];
  if (normalized) return `${leading}${normalized}${trailing}`;

  const quantityUnit = source.match(/^(\d+(?:[.,]\d+)?)\+?\s+(day|days|week|weeks|month|months|year|years|star|stars|file|files|project|projects|output|outputs|quotation|quotations|approval|approvals|member|members|request|requests|contract|contracts|document|documents|workspace|workspaces|notification|notifications|action|actions)$/i);
  if (quantityUnit) {
    const [, amount, unit] = quantityUnit;
    const localizedUnit = uiTranslationCatalog[locale][unit.toLowerCase()] || unit;
    const plus = source.includes("+") ? "+" : "";
    return `${leading}${amount}${plus} ${localizedUnit}${trailing}`;
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
