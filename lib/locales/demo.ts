import type { Locale } from "@/lib/i18n";

const demoCatalog = {
  "rfq.demo.luxuryVilla.title": {
    ar: "حزمة تنفيذ فيلا فاخرة بالدار البيضاء",
    fr: "Lot d’exécution de la villa de luxe à Casablanca",
    en: "Luxury Villa Casablanca execution package"
  },
  "rfq.demo.luxuryVilla.description": {
    ar: "طلب عروض تقنية وتجارية للتنفيذ الإنشائي وتوريد المواد والتحقق الهندسي والاستشارة الجيوتقنية.",
    fr: "Demande de propositions techniques et commerciales pour l’exécution structurelle, la fourniture des matériaux, la validation technique et le conseil géotechnique.",
    en: "Requesting technical and commercial proposals for structural execution, material supply, engineering validation, and geotechnical advisory."
  },
  "rfq.demo.rabatReview.title": {
    ar: "مراجعة التراخيص والهندسة للمجمع السكني بالرباط",
    fr: "Révision du permis et de l’ingénierie du complexe résidentiel de Rabat",
    en: "Residential Complex Rabat permit and engineering review"
  },
  "rfq.demo.rabatReview.description": {
    ar: "دعم المراجعة الهندسية والتصميمية قبل إعادة تقديم وثائق الترخيص.",
    fr: "Accompagnement de la revue technique et de conception avant le nouveau dépôt du dossier de permis.",
    en: "Engineering and design review support before resubmitting permit documentation."
  },
  "rfq.demo.tangierLogistics.title": {
    ar: "دعم الفولاذ والخدمات اللوجستية لمستودع طنجة",
    fr: "Accompagnement acier et logistique pour l’entrepôt de Tanger",
    en: "Tangier warehouse steel and logistics support"
  },
  "rfq.demo.tangierLogistics.description": {
    ar: "حزمة توريد وخدمات لوجستية لتسليم الفولاذ ووصول الرافعات وتدفق المواد داخل الموقع.",
    fr: "Lot fournisseur et logistique pour la livraison de l’acier, l’accès des grues et la circulation des matériaux sur site.",
    en: "Supplier and logistics package for steel delivery, crane access, and site material flow."
  },
  "rfq.demo.marrakechAdvisory.title": {
    ar: "استشارة أساسات برج المكاتب بمراكش",
    fr: "Conseil sur les fondations de la tour de bureaux de Marrakech",
    en: "Marrakech office tower foundation advisory"
  },
  "rfq.demo.marrakechAdvisory.description": {
    ar: "طلب مغلق للاستشارة حول الأساسات والتقييم المبكر للمخاطر.",
    fr: "Demande clôturée de conseil sur les fondations et d’évaluation préliminaire des risques.",
    en: "Closed request for foundation advisory and early risk assessment."
  }
} as const;

export type DemoTranslationKey = keyof typeof demoCatalog;

export function translateDemoKey(key: string | undefined, locale: Locale): string | undefined {
  return key && key in demoCatalog ? demoCatalog[key as DemoTranslationKey][locale] : undefined;
}

export function getDemoCatalogKeys(): DemoTranslationKey[] {
  return Object.keys(demoCatalog) as DemoTranslationKey[];
}

const marketplaceCategoryCatalog: Record<string, Record<Locale, { name: string; description: string }>> = {
  Contractors: { ar: { name: "المقاولون", description: "مقاولون موثوقون لتنفيذ المشاريع السكنية والتجارية والصناعية." }, fr: { name: "Entrepreneurs", description: "Entrepreneurs vérifiés pour les projets résidentiels, commerciaux et industriels." }, en: { name: "Contractors", description: "Verified construction contractors for residential, commercial, and industrial delivery." } },
  "Engineering Firms": { ar: { name: "المكاتب الهندسية", description: "مكاتب للهندسة المدنية والإنشائية والكهروميكانيكية ودعم التنفيذ." }, fr: { name: "Bureaux d’ingénierie", description: "Bureaux de génie civil, structure, MEP et ingénierie de projet pour l’exécution." }, en: { name: "Engineering Firms", description: "Civil, structural, MEP, and project engineering firms ready for execution support." } },
  "Architecture Studios": { ar: { name: "استوديوهات العمارة", description: "استوديوهات للتصميم والتراخيص وتنسيق BIM والتفاصيل المعمارية." }, fr: { name: "Agences d’architecture", description: "Agences de conception, permis, coordination BIM et architecture détaillée." }, en: { name: "Architecture Studios", description: "Design studios for concept, permit packages, BIM, and detailed architecture." } },
  "Material Suppliers": { ar: { name: "موردو المواد", description: "موردو الخرسانة والفولاذ والواجهات والتشطيبات ومواد الأنظمة الكهروميكانيكية." }, fr: { name: "Fournisseurs de matériaux", description: "Fournisseurs de béton, acier, façades, finitions et matériaux MEP." }, en: { name: "Material Suppliers", description: "Concrete, steel, facade, finishes, and MEP material suppliers." } },
  "Logistics Companies": { ar: { name: "شركات الخدمات اللوجستية", description: "شركاء لوجستيك البناء والتسليم للموقع وتنسيق الرافعات والنقل." }, fr: { name: "Sociétés logistiques", description: "Partenaires de logistique chantier, livraison, coordination des grues et transport." }, en: { name: "Logistics Companies", description: "Construction logistics, site delivery, crane coordination, and transport partners." } },
  "Equipment Rental": { ar: { name: "تأجير المعدات", description: "مزودو تأجير المعدات الثقيلة والرافعات والأدوات وآليات الموقع." }, fr: { name: "Location d’équipements", description: "Location d’équipements lourds, grues, outils et engins de chantier." }, en: { name: "Equipment Rental", description: "Heavy equipment, cranes, tools, and site machinery rental providers." } },
  Consultants: { ar: { name: "الاستشاريون", description: "استشاريون في التكلفة والتخطيط والجيوتقنية والقانون والسلامة وإدارة المشاريع." }, fr: { name: "Consultants", description: "Consultants en coûts, planification, géotechnique, droit, sécurité et gestion de projet." }, en: { name: "Consultants", description: "Cost, planning, geotechnical, legal, safety, and project advisory consultants." } },
  "General Contractor": { ar: { name: "مقاول عام", description: "شركاء للتنفيذ الشامل للمشاريع السكنية والتجارية والصناعية." }, fr: { name: "Entreprise générale", description: "Partenaires de réalisation globale pour les projets résidentiels, commerciaux et industriels." }, en: { name: "General Contractor", description: "Full-scope construction delivery partners for residential, commercial, and industrial projects." } },
  Subcontractor: { ar: { name: "مقاول فرعي", description: "فرق متخصصة في الإنشاءات والتشطيبات والأنظمة الكهروميكانيكية والواجهات." }, fr: { name: "Sous-traitant", description: "Équipes spécialisées en structure, finitions, MEP, façades et travaux de chantier." }, en: { name: "Subcontractor", description: "Specialized execution teams for structural, finishing, MEP, facade, and site works." } },
  Supplier: { ar: { name: "مورد", description: "شركاء لتوريد المواد والخرسانة والفولاذ والواجهات والتشطيبات." }, fr: { name: "Fournisseur", description: "Partenaires pour les matériaux, le béton, l’acier, les façades et les finitions." }, en: { name: "Supplier", description: "Material, concrete, steel, facade, finishing, and MEP supply partners." } },
  "Engineering Office": { ar: { name: "مكتب هندسي", description: "استشاريون في الهندسة المدنية والإنشائية وMEP وBIM وهندسة المشاريع." }, fr: { name: "Bureau d’études", description: "Consultants en génie civil, structure, MEP, BIM et ingénierie de projet." }, en: { name: "Engineering Office", description: "Civil, structural, MEP, BIM, and project engineering consultants." } },
  Architect: { ar: { name: "معماري", description: "استوديوهات للمفاهيم والتراخيص وتنسيق BIM وحزم التصميم." }, fr: { name: "Architecte", description: "Agences pour les concepts, permis, coordination BIM et dossiers de conception." }, en: { name: "Architect", description: "Architecture studios for concepts, permits, BIM coordination, and design packages." } },
  "Interior Designer": { ar: { name: "مصمم داخلي", description: "شركاء التصميم الداخلي والتجهيز للمشاريع السكنية والتجارية الراقية." }, fr: { name: "Architecte d’intérieur", description: "Partenaires de design intérieur et d’aménagement pour les projets résidentiels et commerciaux haut de gamme." }, en: { name: "Interior Designer", description: "Interior design and fit-out partners for premium residential and commercial projects." } },
  Surveyor: { ar: { name: "مساح", description: "خدمات الطبوغرافيا وحصر الكميات والقياسات والتحقق الموقعي." }, fr: { name: "Géomètre", description: "Services de topographie, métrés, mesures et vérification sur site." }, en: { name: "Surveyor", description: "Topography, quantity surveying, measurements, and site verification services." } },
  "Project Management": { ar: { name: "إدارة المشاريع", description: "خدمات PMO والتخطيط والتحكم وإدارة العقود وتمثيل المالك." }, fr: { name: "Gestion de projet", description: "PMO, planification, contrôle, administration des contrats et représentation du maître d’ouvrage." }, en: { name: "Project Management", description: "PMO, planning, controls, contract administration, and owner representation." } },
  HVAC: { ar: { name: "التكييف والتهوية", description: "شركاء التدفئة والتهوية والتكييف وتنفيذ الأنظمة الكهروميكانيكية." }, fr: { name: "CVC", description: "Partenaires en chauffage, ventilation, climatisation et exécution MEP." }, en: { name: "HVAC", description: "Heating, ventilation, air conditioning, and MEP execution partners." } },
  Electrical: { ar: { name: "الكهرباء", description: "مزودو التصميم والتركيب الكهربائي وأنظمة التيار الضعيف والاختبارات." }, fr: { name: "Électricité", description: "Prestataires de conception, installation électrique, courants faibles et essais." }, en: { name: "Electrical", description: "Electrical design, installation, low-current systems, and testing providers." } },
  Mechanical: { ar: { name: "الميكانيك", description: "فرق الأنظمة الميكانيكية والسباكة والحماية من الحريق والتركيبات التقنية." }, fr: { name: "Mécanique", description: "Équipes de systèmes mécaniques, plomberie, protection incendie et installations techniques." }, en: { name: "Mechanical", description: "Mechanical systems, plumbing, fire protection, and technical installation teams." } },
  Concrete: { ar: { name: "الخرسانة", description: "موردو الخرسانة الجاهزة والضخ والاختبارات والمواد الإنشائية." }, fr: { name: "Béton", description: "Fournisseurs de béton prêt à l’emploi, pompage, essais et matériaux structurels." }, en: { name: "Concrete", description: "Ready-mix concrete, pumping, testing, and structural material suppliers." } },
  Steel: { ar: { name: "الفولاذ", description: "شركاء تصنيع الفولاذ وتوريد حديد التسليح والمنشآت المعدنية." }, fr: { name: "Acier", description: "Partenaires de fabrication d’acier, fourniture d’armatures et charpente métallique." }, en: { name: "Steel", description: "Steel fabrication, reinforcement supply, and structural steel partners." } },
  Roads: { ar: { name: "الطرق", description: "أشغال الطرق والتعبيد والوصول والبنية التحتية والصرف والأشغال الخارجية." }, fr: { name: "Voirie", description: "Travaux routiers, pavage, accès, drainage et aménagements extérieurs." }, en: { name: "Roads", description: "Roadworks, paving, infrastructure access, drainage, and external works." } },
  Infrastructure: { ar: { name: "البنية التحتية", description: "متخصصون في الشبكات والصرف والطرق وبنية الموقع والأعمال التمهيدية." }, fr: { name: "Infrastructure", description: "Spécialistes des réseaux, du drainage, des routes, de l’infrastructure de site et des travaux préparatoires." }, en: { name: "Infrastructure", description: "Utilities, drainage, roads, site infrastructure, and enabling works specialists." } },
  Landscape: { ar: { name: "تنسيق المواقع", description: "تصميم وتنفيذ المساحات الخضراء والغرس والري والبيئة الخارجية." }, fr: { name: "Paysage", description: "Conception paysagère, plantation, irrigation et réalisation des espaces extérieurs." }, en: { name: "Landscape", description: "Landscape design, planting, irrigation, and external environment execution." } },
  Safety: { ar: { name: "السلامة", description: "استشاريو HSE وتدقيق السلامة والتدريب ودعم الامتثال." }, fr: { name: "Sécurité", description: "Consultants HSE, audits de sécurité, formation et accompagnement conformité." }, en: { name: "Safety", description: "HSE consultants, safety audits, training, and compliance support." } },
  Logistics: { ar: { name: "الخدمات اللوجستية", description: "التسليم للموقع وتنسيق الأسطول والوصول إلى الموانئ ولوجستيك البناء." }, fr: { name: "Logistique", description: "Livraisons chantier, coordination de flotte, accès portuaire et logistique construction." }, en: { name: "Logistics", description: "Site deliveries, fleet coordination, port access, and construction logistics." } },
  Other: { ar: { name: "خدمات أخرى", description: "خدمات بناء متخصصة لا تندرج ضمن الفئات القياسية." }, fr: { name: "Autres services", description: "Services de construction spécialisés hors des catégories standard." }, en: { name: "Other", description: "Specialized construction services that do not fit the standard categories." } }
};

export function localizeMarketplaceCategory(name: string, description: string, locale: Locale) {
  return marketplaceCategoryCatalog[name]?.[locale] || { name, description };
}

export function getMarketplaceCategoryKeys() {
  return Object.keys(marketplaceCategoryCatalog);
}
