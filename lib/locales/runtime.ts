export type RuntimeLocale = "ar" | "fr" | "en";

type RuntimeMessage = Readonly<{ key: string; en: string; fr: string; ar: string }>;

export const runtimeSystemMessages: readonly RuntimeMessage[] = [
  // Administrative audit events and platform metadata.
  { key: "audit.login.success", en: "Login successful", fr: "Connexion réussie", ar: "تم تسجيل الدخول بنجاح" },
  { key: "audit.ai.generatedBudgetRisk", en: "Generated budget risk review", fr: "Analyse du risque budgétaire générée", ar: "تم إنشاء مراجعة مخاطر الميزانية" },
  { key: "audit.project.updatedMilestone", en: "Updated milestone progress", fr: "Avancement du jalon mis à jour", ar: "تم تحديث تقدم المرحلة" },
  { key: "audit.marketplace.connectionOpened", en: "Opened supplier connection", fr: "Connexion fournisseur ouverte", ar: "تم فتح اتصال مع المورد" },
  { key: "audit.contract.awardReviewed", en: "Reviewed award decision", fr: "Décision d’attribution examinée", ar: "تمت مراجعة قرار الترسية" },
  { key: "audit.billing.paymentOverdue", en: "Invoice payment overdue", fr: "Paiement de facture en retard", ar: "تأخر سداد الفاتورة" },
  { key: "audit.admin.featureFlagChanged", en: "Changed feature flag rollout", fr: "Déploiement de la fonctionnalité modifié", ar: "تم تغيير نطاق تفعيل الميزة" },
  { key: "audit.target.atlasWorkspace", en: "Atlas workspace", fr: "Espace Atlas", ar: "مساحة عمل Atlas" },
  { key: "audit.target.executionPhase", en: "Execution phase", fr: "Phase d’exécution", ar: "مرحلة التنفيذ" },
  { key: "audit.actor.system", en: "System", fr: "Système", ar: "النظام" },
  { key: "audit.actor.supportAdmin", en: "Support Admin", fr: "Administrateur support", ar: "مسؤول الدعم" },
  { key: "admin.flag.marketplace.description", en: "Construction partner discovery, profiles, favorites, and comparison.", fr: "Recherche de partenaires de construction, profils, favoris et comparaison.", ar: "اكتشاف شركاء البناء وملفاتهم ومفضلاتهم ومقارنتهم." },
  { key: "admin.flag.vora.description", en: "Project-aware generation, summaries, risk reviews, and recommendations.", fr: "Génération contextuelle, synthèses, analyses des risques et recommandations.", ar: "إنشاء واعٍ بسياق المشروع وملخصات ومراجعات مخاطر وتوصيات." },
  { key: "admin.flag.notifications.description", en: "Unified alerts across projects, RFQs, contracts, documents, and AI.", fr: "Alertes unifiées pour les projets, appels d’offres, contrats, documents et l’IA.", ar: "تنبيهات موحدة للمشاريع وطلبات الأسعار والعقود والمستندات والذكاء الاصطناعي." },
  { key: "admin.flag.billing.description", en: "Plans, invoices, usage records, and payment-provider abstraction.", fr: "Forfaits, factures, suivi d’utilisation et abstraction du prestataire de paiement.", ar: "الخطط والفواتير وسجلات الاستخدام وطبقة مزود الدفع." },
  { key: "admin.flag.beta.description", en: "Admin-supervised access gates for invited construction companies.", fr: "Contrôles d’accès supervisés pour les entreprises de construction invitées.", ar: "ضوابط وصول بإشراف الإدارة لشركات البناء المدعوة." },
  { key: "admin.setting.dataSource", en: "Data source mode", fr: "Mode de source des données", ar: "وضع مصدر البيانات" },
  { key: "admin.setting.defaultModel", en: "Default AI model", fr: "Modèle IA par défaut", ar: "نموذج الذكاء الاصطناعي الافتراضي" },
  { key: "admin.setting.paymentProvider", en: "Payment provider", fr: "Prestataire de paiement", ar: "مزود الدفع" },
  { key: "admin.setting.marketplaceVerification", en: "Marketplace verification", fr: "Vérification de la place de marché", ar: "توثيق السوق" },
  { key: "admin.setting.securityHeaders", en: "Security headers", fr: "En-têtes de sécurité", ar: "ترويسات الأمان" },
  { key: "admin.setting.manualInvoices", en: "Manual invoices prepared", fr: "Factures manuelles préparées", ar: "الفواتير اليدوية جاهزة" },
  { key: "admin.setting.verifiedProfiles", en: "Verified profiles are public", fr: "Les profils vérifiés sont publics", ar: "الملفات الموثقة عامة" },
  { key: "admin.setting.securityPrepared", en: "Prepared in security hardening layer", fr: "Préparé dans la couche de renforcement de la sécurité", ar: "مجهز ضمن طبقة تعزيز الأمان" },
  { key: "admin.status.degraded", en: "degraded", fr: "dégradé", ar: "متدهور" },
  { key: "admin.status.unhealthy", en: "unhealthy", fr: "défaillant", ar: "غير سليم" },
  { key: "admin.status.suspended", en: "suspended", fr: "suspendu", ar: "موقوف" },
  { key: "admin.status.pastDue", en: "past_due", fr: "en retard", ar: "متأخر" },
  { key: "admin.status.warning", en: "warning", fr: "avertissement", ar: "تحذير" },
  { key: "admin.status.beta", en: "beta", fr: "bêta", ar: "تجريبي" },
  { key: "organization.status.suspended", en: "Suspended organization", fr: "Organisation suspendue", ar: "مؤسسة موقوفة" },

  // Global notification actions and deterministic empty titles.
  { key: "notification.action.reviewBudget", en: "Review budget", fr: "Examiner le budget", ar: "مراجعة الميزانية" },
  { key: "notification.action.openReport", en: "Open report", fr: "Ouvrir le rapport", ar: "فتح التقرير" },
  { key: "notification.action.viewDocument", en: "View document", fr: "Voir le document", ar: "عرض المستند" },
  { key: "notification.action.openApproval", en: "Open approval", fr: "Ouvrir l’approbation", ar: "فتح الموافقة" },
  { key: "notification.action.reviewAccess", en: "Review access", fr: "Examiner les accès", ar: "مراجعة الوصول" },
  { key: "notification.action.balanceTasks", en: "Balance tasks", fr: "Rééquilibrer les tâches", ar: "موازنة المهام" },
  { key: "notification.action.viewInvite", en: "View invite", fr: "Voir l’invitation", ar: "عرض الدعوة" },
  { key: "project.untitled", en: "Untitled project", fr: "Projet sans titre", ar: "مشروع بدون عنوان" },
  { key: "rfq.untitled", en: "Untitled RFQ", fr: "Demande de prix sans titre", ar: "طلب عرض سعر بدون عنوان" },

  // Billing, contract, and project fixture values.
  { key: "billing.method.manualInvoice", en: "Manual invoice", fr: "Facture manuelle", ar: "فاتورة يدوية" },
  { key: "billing.invoice.atlasFinance", en: "Manual invoice to Atlas finance", fr: "Facture manuelle destinée aux finances d’Atlas", ar: "فاتورة يدوية لقسم مالية Atlas" },
  { key: "billing.usage.remaining", en: "Remaining", fr: "Restant", ar: "المتبقي" },
  { key: "billing.usage.setting", en: "Setting", fr: "Paramètre", ar: "الإعداد" },
  { key: "billing.usage.watch", en: "Watch", fr: "Surveiller", ar: "مراقبة" },
  { key: "contract.status.internalReview", en: "Internal Review", fr: "Revue interne", ar: "مراجعة داخلية" },
  { key: "contract.status.executed", en: "Executed", fr: "Exécuté", ar: "منفذ" },
  { key: "contract.amendment.noneApproved", en: "No approved amendments", fr: "Aucun avenant approuvé", ar: "لا توجد تعديلات معتمدة" },
  { key: "contract.untitled", en: "Untitled contract", fr: "Contrat sans titre", ar: "عقد بدون عنوان" },
  { key: "contract.verification.pending", en: "Verification pending", fr: "Vérification en attente", ar: "التحقق قيد الانتظار" },
  { key: "contract.risk.capacity", en: "Capacity should be confirmed before award", fr: "La capacité doit être confirmée avant l’attribution", ar: "يجب تأكيد القدرة قبل الترسية" },
  { key: "project.portfolio.untitled", en: "Untitled portfolio project", fr: "Projet de portefeuille sans titre", ar: "مشروع محفظة بدون عنوان" },
  { key: "rfq.status.created", en: "RFQ created", fr: "Demande de prix créée", ar: "تم إنشاء طلب عرض السعر" },
  { key: "rfq.risk.deadlineConfirmation", en: "Submission deadline should be confirmed", fr: "La date limite de soumission doit être confirmée", ar: "يجب تأكيد الموعد النهائي للتقديم" },
  { key: "status.suspended", en: "Suspended", fr: "Suspendu", ar: "موقوف" },

  // Marketplace, project, and notification demo content.
  { key: "demo.notification.rabatReview", en: "Residential Complex Rabat permit and engineering review", fr: "Revue du permis et de l’ingénierie du complexe résidentiel de Rabat", ar: "مراجعة الترخيص والهندسة للمجمع السكني بالرباط" },
  { key: "demo.notification.tangierSupport", en: "Tangier warehouse steel and logistics support", fr: "Acier et soutien logistique pour l’entrepôt de Tanger", ar: "دعم الفولاذ والخدمات اللوجستية لمستودع طنجة" },
  { key: "demo.notification.marrakechAdvisory", en: "Marrakech office tower foundation advisory", fr: "Conseil sur les fondations de la tour de bureaux de Marrakech", ar: "استشارة أساسات برج المكاتب بمراكش" },
  { key: "demo.badge.fastestAdvisory", en: "Fastest advisory", fr: "Conseil le plus rapide", ar: "أسرع استشارة" },
  { key: "demo.badge.preferredPartner", en: "Preferred partner", fr: "Partenaire privilégié", ar: "شريك مفضل" },
  { key: "demo.service.turnkeyConstruction", en: "Turnkey construction", fr: "Construction clé en main", ar: "بناء متكامل جاهز للتسليم" },
  { key: "demo.service.siteExecution", en: "Site execution team", fr: "Équipe d’exécution chantier", ar: "فريق تنفيذ الموقع" },
  { key: "demo.service.executiveReporting", en: "Executive reporting", fr: "Rapports de direction", ar: "تقارير تنفيذية" },
  { key: "demo.project.rabatResidential", en: "Residential Complex Rabat", fr: "Complexe résidentiel de Rabat", ar: "المجمع السكني بالرباط" },
  { key: "demo.project.tangierWarehouse", en: "Industrial Warehouse Tangier", fr: "Entrepôt industriel de Tanger", ar: "المستودع الصناعي بطنجة" },
  { key: "demo.risk.engineeringWorkload", en: "High workload on engineering team", fr: "Charge élevée de l’équipe d’ingénierie", ar: "عبء عمل مرتفع على فريق الهندسة" },
  { key: "demo.risk.procurementAlignment", en: "Procurement approvals need early alignment", fr: "Les approbations des achats nécessitent un alignement anticipé", ar: "تحتاج موافقات المشتريات إلى تنسيق مبكر" },
  { key: "demo.service.structuralAudit", en: "Structural audit", fr: "Audit structurel", ar: "تدقيق إنشائي" },
  { key: "demo.service.infrastructureStudy", en: "Infrastructure study", fr: "Étude d’infrastructure", ar: "دراسة البنية التحتية" },
  { key: "demo.service.projectControls", en: "Project controls setup", fr: "Mise en place du contrôle de projet", ar: "إعداد ضوابط المشروع" },
  { key: "demo.project.rabatInfrastructure", en: "Rabat Infrastructure Audit", fr: "Audit d’infrastructure de Rabat", ar: "تدقيق البنية التحتية بالرباط" },
  { key: "demo.project.fezBridge", en: "Bridge Rehabilitation Fez", fr: "Réhabilitation du pont de Fès", ar: "تأهيل جسر فاس" },
  { key: "demo.risk.specialistAvailability", en: "Specialist availability should be booked early", fr: "La disponibilité des spécialistes doit être réservée tôt", ar: "يجب حجز توفر المتخصصين مبكراً" },
  { key: "demo.service.premiumConcept", en: "Premium concept design", fr: "Conception architecturale premium", ar: "تصميم مفاهيمي متميز" },
  { key: "demo.service.permitPackage", en: "Permit package", fr: "Dossier de permis", ar: "حزمة الترخيص" },
  { key: "demo.service.bimCoordination", en: "BIM coordination", fr: "Coordination BIM", ar: "تنسيق BIM" },
  { key: "demo.project.marrakechTower", en: "Office Tower Marrakech", fr: "Tour de bureaux de Marrakech", ar: "برج المكاتب بمراكش" },
  { key: "demo.project.agadirResort", en: "Agadir Resort Concept", fr: "Concept du complexe touristique d’Agadir", ar: "تصور منتجع أكادير" },
  { key: "demo.risk.bimCapacity", en: "BIM capacity should be protected for complex MEP coordination", fr: "La capacité BIM doit être réservée à la coordination MEP complexe", ar: "يجب تخصيص قدرة BIM لتنسيق MEP المعقد" },
  { key: "demo.service.deliveryRoute", en: "Delivery route planning", fr: "Planification des itinéraires de livraison", ar: "تخطيط مسارات التسليم" },
  { key: "demo.service.fleetCoordination", en: "Fleet coordination", fr: "Coordination de la flotte", ar: "تنسيق الأسطول" },
  { key: "demo.service.cranePlanning", en: "Crane slot planning", fr: "Planification des créneaux de grue", ar: "تخطيط مواعيد الرافعات" },
  { key: "demo.project.tangierMaterialsHub", en: "Tangier Port Materials Hub", fr: "Plateforme de matériaux du port de Tanger", ar: "مركز مواد ميناء طنجة" },
  { key: "demo.project.northernCraneFleet", en: "Northern Crane Fleet", fr: "Flotte de grues du Nord", ar: "أسطول رافعات الشمال" },
  { key: "demo.risk.insurancePending", en: "Insurance verification pending", fr: "Vérification de l’assurance en attente", ar: "التحقق من التأمين قيد الانتظار" },
  { key: "demo.risk.craneBooking", en: "Crane slots require early booking", fr: "Les créneaux de grue nécessitent une réservation anticipée", ar: "تتطلب مواعيد الرافعات حجزاً مبكراً" },
  { key: "demo.service.readyMix", en: "Ready-mix supply", fr: "Fourniture de béton prêt à l’emploi", ar: "توريد الخرسانة الجاهزة" },
  { key: "demo.service.aggregatePackages", en: "Aggregate packages", fr: "Lots de granulats", ar: "حزم الركام" },
  { key: "demo.service.qualityDocuments", en: "Quality documents", fr: "Documents qualité", ar: "وثائق الجودة" },
  { key: "demo.project.casablancaConcrete", en: "Casablanca Villa Concrete Package", fr: "Lot béton de la villa de Casablanca", ar: "حزمة خرسانة فيلا الدار البيضاء" },
  { key: "demo.project.rabatConcrete", en: "Rabat Complex Concrete Works", fr: "Travaux de béton du complexe de Rabat", ar: "أعمال خرسانة مجمع الرباط" },
  { key: "demo.risk.concreteLeadTimes", en: "Lead times must be locked before peak pour windows", fr: "Les délais doivent être confirmés avant les périodes de coulage intensif", ar: "يجب تثبيت آجال التوريد قبل فترات الصب المكثف" },
  { key: "demo.service.towerCrane", en: "Tower crane rental", fr: "Location de grue à tour", ar: "تأجير رافعة برجية" },
  { key: "demo.service.mobileLifting", en: "Mobile lifting support", fr: "Assistance de levage mobile", ar: "دعم الرفع المتنقل" },
  { key: "demo.service.liftingReview", en: "Lifting plan review", fr: "Revue du plan de levage", ar: "مراجعة خطة الرفع" },
  { key: "demo.project.tangierSteelLifts", en: "Tangier Warehouse Steel Lifts", fr: "Levages d’acier de l’entrepôt de Tanger", ar: "عمليات رفع فولاذ مستودع طنجة" },
  { key: "demo.status.booked", en: "Booked", fr: "Réservé", ar: "محجوز" },
  { key: "demo.risk.longLeadCrane", en: "Long-lead crane slots can affect execution timelines", fr: "Les créneaux de grue à long délai peuvent affecter le calendrier d’exécution", ar: "قد تؤثر مواعيد الرافعات طويلة الأجل على الجدول التنفيذي" },
  { key: "demo.service.soilInvestigation", en: "Soil investigation", fr: "Étude de sol", ar: "دراسة التربة" },
  { key: "demo.service.foundationAdvisory", en: "Foundation advisory", fr: "Conseil en fondations", ar: "استشارة الأساسات" },
  { key: "demo.service.siteRiskMemo", en: "Site risk memo", fr: "Note sur les risques du site", ar: "مذكرة مخاطر الموقع" },
  { key: "demo.project.agadirSoil", en: "Agadir Resort Soil Study", fr: "Étude de sol du complexe d’Agadir", ar: "دراسة تربة منتجع أكادير" },
  { key: "demo.project.marrakechFoundation", en: "Marrakech Tower Foundation Review", fr: "Revue des fondations de la tour de Marrakech", ar: "مراجعة أساسات برج مراكش" },
  { key: "demo.risk.siteAccess", en: "Field investigation scheduling depends on site access", fr: "La planification des investigations dépend de l’accès au site", ar: "تعتمد جدولة التحقيقات الميدانية على الوصول إلى الموقع" },

  // Contract milestones and platform fixture content.
  { key: "demo.milestone.contractSignature", en: "Contract signature", fr: "Signature du contrat", ar: "توقيع العقد" },
  { key: "demo.milestone.projectKickoff", en: "Project kickoff", fr: "Lancement du projet", ar: "انطلاق المشروع" },
  { key: "demo.milestone.structuralFrame", en: "Structural frame", fr: "Structure porteuse", ar: "الهيكل الإنشائي" },
  { key: "demo.milestone.mepCoordination", en: "MEP coordination", fr: "Coordination MEP", ar: "تنسيق MEP" },
  { key: "demo.milestone.completionHandover", en: "Completion handover", fr: "Remise à l’achèvement", ar: "التسليم عند الإنجاز" },
  { key: "demo.milestone.advancePayment", en: "Advance payment", fr: "Paiement de l’avance", ar: "الدفعة المقدمة" },
  { key: "demo.milestone.structural", en: "Structural milestone", fr: "Jalon structurel", ar: "مرحلة إنشائية" },
  { key: "demo.milestone.finalHandover", en: "Final handover", fr: "Remise finale", ar: "التسليم النهائي" },
  { key: "demo.milestone.signature", en: "Signature", fr: "Signature", ar: "التوقيع" },
  { key: "demo.milestone.kickoff", en: "Kickoff", fr: "Lancement", ar: "الانطلاق" },
  { key: "demo.milestone.warranty", en: "Warranty period", fr: "Période de garantie", ar: "فترة الضمان" },
  { key: "demo.account.enterprise", en: "Enterprise demo account", fr: "Compte entreprise de démonstration", ar: "حساب مؤسسة تجريبي" },
  { key: "demo.widget.favoriteOutputs", en: "Favorite Outputs", fr: "Sorties favorites", ar: "المخرجات المفضلة" },
  { key: "demo.widget.deliveryHealth", en: "Delivery Health", fr: "Santé des livraisons", ar: "صحة التسليم" },
  { key: "demo.output.villaWeeklyReport", en: "Luxury Villa Weekly Executive Report", fr: "Rapport exécutif hebdomadaire de la villa de luxe", ar: "التقرير التنفيذي الأسبوعي للفيلا الفاخرة" },
  { key: "demo.output.rabatPermitChecklist", en: "Residential Complex Permit Checklist", fr: "Liste de contrôle du permis du complexe résidentiel", ar: "قائمة تحقق ترخيص المجمع السكني" },
  { key: "demo.output.warehouseBoq", en: "Industrial Warehouse BOQ Summary", fr: "Synthèse du bordereau de l’entrepôt industriel", ar: "ملخص جدول كميات المستودع الصناعي" },
  { key: "demo.output.officeInvestorBrief", en: "Office Tower Investor Brief", fr: "Note aux investisseurs de la tour de bureaux", ar: "موجز مستثمري برج المكاتب" },
  { key: "demo.status.weeklyBriefReady", en: "Weekly briefing ready", fr: "Brief hebdomadaire prêt", ar: "الموجز الأسبوعي جاهز" },
  { key: "demo.onboarding.defineRole", en: "Define your role", fr: "Définissez votre rôle", ar: "حدد دورك" },
  { key: "demo.onboarding.personalize", en: "Let VORA personalize", fr: "Laissez VORA personnaliser", ar: "دع VORA تخصص تجربتك" },
  { key: "demo.onboarding.start", en: "Start execution", fr: "Commencer l’exécution", ar: "بدء التنفيذ" },
  { key: "demo.provider.openaiReady", en: "Ready via OPENAI_API_KEY", fr: "Prêt via OPENAI_API_KEY", ar: "جاهز عبر OPENAI_API_KEY" },
  { key: "demo.provider.anthropicReady", en: "Prepared via ANTHROPIC_API_KEY", fr: "Préparé via ANTHROPIC_API_KEY", ar: "مجهز عبر ANTHROPIC_API_KEY" },
  { key: "demo.provider.geminiReady", en: "Prepared via GEMINI_API_KEY", fr: "Préparé via GEMINI_API_KEY", ar: "مجهز عبر GEMINI_API_KEY" },
  { key: "demo.provider.openrouterReady", en: "Prepared via OPENROUTER_API_KEY", fr: "Préparé via OPENROUTER_API_KEY", ar: "مجهز عبر OPENROUTER_API_KEY" },
  { key: "demo.metric.timeSaved", en: "Time saved", fr: "Temps gagné", ar: "الوقت الموفر" },
  { key: "demo.metric.aiWorkflows", en: "AI workflows", fr: "Flux de travail IA", ar: "مسارات عمل الذكاء الاصطناعي" },

  // Quotation pages, fallbacks, comparison metadata, and demo values.
  { key: "quotation.command.title", en: "Quotation comparison command center.", fr: "Centre de commande de comparaison des devis.", ar: "مركز قيادة مقارنة عروض الأسعار." },
  { key: "quotation.command.description", en: "Manage supplier offers, evaluate technical and commercial strength, compare RFQ responses, and prepare VORA-backed award recommendations.", fr: "Gérez les offres fournisseurs, évaluez leur solidité technique et commerciale, comparez les réponses et préparez des recommandations d’attribution avec VORA.", ar: "أدِر عروض الموردين وقيّم قوتها التقنية والتجارية وقارن ردود طلبات الأسعار وأعد توصيات الترسية بدعم VORA." },
  { key: "quotation.fallback.demoNotice", en: "Production quotation data is unavailable, so Vorqa is showing demo fallback quotations.", fr: "Les données de devis de production sont indisponibles. Vorqa affiche donc les devis de démonstration.", ar: "بيانات عروض الأسعار الفعلية غير متاحة، لذلك تعرض Vorqa عروضاً تجريبية بديلة." },
  { key: "quotation.compare.title", en: "Supplier offer evaluation matrix.", fr: "Matrice d’évaluation des offres fournisseurs.", ar: "مصفوفة تقييم عروض الموردين." },
  { key: "quotation.compare.description", en: "Compare supplier quotations by price, compliance, delivery, warranty, payment terms, risk, and VORA fit before preparing an award decision.", fr: "Comparez les devis selon le prix, la conformité, la livraison, la garantie, les conditions de paiement, le risque et l’adéquation VORA avant de préparer la décision d’attribution.", ar: "قارن عروض الموردين حسب السعر والمطابقة والتسليم والضمان وشروط الدفع والمخاطر ومدى ملاءمة VORA قبل إعداد قرار الترسية." },
  { key: "quotation.compare.emptySummary", en: "No quotations are available for comparison yet.", fr: "Aucun devis n’est encore disponible pour comparaison.", ar: "لا تتوفر عروض أسعار للمقارنة بعد." },
  { key: "quotation.compare.emptyAction", en: "Invite suppliers and collect quotation responses before running comparison.", fr: "Invitez des fournisseurs et recueillez leurs réponses avant de lancer la comparaison.", ar: "ادعُ الموردين واجمع ردود عروض الأسعار قبل تشغيل المقارنة." },
  { key: "quotation.compare.lowestPrice", en: "Lowest Price", fr: "Prix le plus bas", ar: "أقل سعر" },
  { key: "quotation.compare.bestTechnical", en: "Best Technical", fr: "Meilleure offre technique", ar: "أفضل عرض تقني" },
  { key: "quotation.compare.bestValue", en: "Best Value", fr: "Meilleur rapport qualité-prix", ar: "أفضل قيمة" },
  { key: "quotation.compare.fastestDelivery", en: "Fastest Delivery", fr: "Livraison la plus rapide", ar: "أسرع تسليم" },
  { key: "quotation.compare.balanced", en: "Balanced Recommendation", fr: "Recommandation équilibrée", ar: "توصية متوازنة" },
  { key: "quotation.compare.totalPrice", en: "Total Price", fr: "Prix total", ar: "السعر الإجمالي" },
  { key: "quotation.compare.deliveryTime", en: "Delivery Time", fr: "Délai de livraison", ar: "مدة التسليم" },
  { key: "quotation.compare.paymentTerms", en: "Payment Terms", fr: "Conditions de paiement", ar: "شروط الدفع" },
  { key: "quotation.compare.technicalCompliance", en: "Technical Compliance", fr: "Conformité technique", ar: "المطابقة التقنية" },
  { key: "quotation.compare.commercialCompliance", en: "Commercial Compliance", fr: "Conformité commerciale", ar: "المطابقة التجارية" },
  { key: "quotation.compare.supplierRating", en: "Supplier Rating", fr: "Évaluation du fournisseur", ar: "تقييم المورد" },
  { key: "quotation.compare.responseTime", en: "Response Time", fr: "Délai de réponse", ar: "زمن الاستجابة" },
  { key: "quotation.compare.riskLevel", en: "Risk Level", fr: "Niveau de risque", ar: "مستوى المخاطر" },
  { key: "quotation.compare.voraFit", en: "VORA Fit", fr: "Adéquation VORA", ar: "مدى ملاءمة VORA" },
  { key: "quotation.compare.confirmScope", en: "Confirm final scope exclusions", fr: "Confirmer les exclusions finales du périmètre", ar: "تأكيد الاستثناءات النهائية من النطاق" },
  { key: "quotation.compare.negotiatePayment", en: "Negotiate payment terms before award", fr: "Négocier les conditions de paiement avant l’attribution", ar: "التفاوض على شروط الدفع قبل الترسية" },
  { key: "quotation.compare.strongerWarranty", en: "Target stronger warranty language", fr: "Renforcer les clauses de garantie", ar: "تعزيز صياغة بنود الضمان" },
  { key: "quotation.compare.finalMobilization", en: "Request final mobilization schedule", fr: "Demander le planning final de mobilisation", ar: "طلب الجدول النهائي للتعبئة" },
  { key: "quotation.compare.normalizeExclusions", en: "Normalize scope exclusions before award", fr: "Harmoniser les exclusions du périmètre avant l’attribution", ar: "توحيد استثناءات النطاق قبل الترسية" },
  { key: "quotation.compare.validateCosts", en: "Validate taxes and delivery costs against contract terms", fr: "Valider les taxes et les frais de livraison selon les conditions contractuelles", ar: "التحقق من الضرائب وتكاليف التسليم وفق شروط العقد" },
  { key: "quotation.compare.requestCertificates", en: "Request final certificate copies for shortlisted suppliers", fr: "Demander les copies finales des certificats aux fournisseurs présélectionnés", ar: "طلب النسخ النهائية للشهادات من الموردين المختارين" },
  { key: "quotation.compare.noSupplier", en: "No supplier selected", fr: "Aucun fournisseur sélectionné", ar: "لم يتم اختيار مورد" },
  { key: "quotation.demo.deliveryIncluded", en: "Delivery included in supplier scope", fr: "Livraison incluse dans le périmètre du fournisseur", ar: "التسليم مشمول ضمن نطاق المورد" },
  { key: "quotation.demo.notSpecified", en: "Not specified", fr: "Non précisé", ar: "غير محدد" },
  { key: "quotation.demo.notScored", en: "Not scored", fr: "Non évalué", ar: "غير مقيّم" },
  { key: "quotation.demo.loaded", en: "Production quotation loaded from repository adapter.", fr: "Devis de production chargé depuis l’adaptateur du référentiel.", ar: "تم تحميل عرض السعر الفعلي من محول المستودع." },
  { key: "quotation.demo.advanceMilestones", en: "20% advance / milestone payments", fr: "20 % d’avance / paiements par jalons", ar: "دفعة مقدمة 20% / دفعات حسب المراحل" },
  { key: "quotation.demo.advanceDelivery", en: "30% advance / 70% delivery", fr: "30 % d’avance / 70 % à la livraison", ar: "دفعة مقدمة 30% / 70% عند التسليم" },
  { key: "quotation.demo.advanceBatches", en: "15% advance / delivery batches", fr: "15 % d’avance / paiements par lots livrés", ar: "دفعة مقدمة 15% / دفعات حسب دفعات التسليم" },
  { key: "quotation.demo.advanceReport", en: "40% advance / 60% report delivery", fr: "40 % d’avance / 60 % à la remise du rapport", ar: "دفعة مقدمة 40% / 60% عند تسليم التقرير" },
  { key: "quotation.demo.professionalLiability", en: "12 months professional liability", fr: "Responsabilité professionnelle de 12 mois", ar: "مسؤولية مهنية لمدة 12 شهراً" },
  { key: "quotation.demo.materialWarranty", en: "Material compliance warranty", fr: "Garantie de conformité des matériaux", ar: "ضمان مطابقة المواد" },
  { key: "quotation.demo.advisoryLiability", en: "Professional advisory liability", fr: "Responsabilité professionnelle de conseil", ar: "مسؤولية مهنية عن الاستشارات" },
  { key: "quotation.demo.mediumHigh", en: "Medium-high", fr: "Moyenne à élevée", ar: "متوسطة إلى عالية" },
  { key: "quotation.demo.highCapacity", en: "High supply capacity", fr: "Forte capacité d’approvisionnement", ar: "قدرة توريد عالية" },
  { key: "quotation.demo.sameDay", en: "Same business day", fr: "Le jour ouvré même", ar: "في يوم العمل نفسه" },
  { key: "quotation.demo.underTwoHours", en: "Under 2 hours", fr: "Moins de 2 heures", ar: "أقل من ساعتين" },
  { key: "quotation.demo.underThreeHours", en: "Under 3 hours", fr: "Moins de 3 heures", ar: "أقل من 3 ساعات" },

  // Other deterministic repository copy rendered by application views.
  { key: "rfq.timeline.created", en: "RFQ draft created", fr: "Brouillon de demande de prix créé", ar: "تم إنشاء مسودة طلب عرض السعر" },
  { key: "rfq.timeline.createdDescription", en: "Procurement workspace prepared the first RFQ draft.", fr: "L’espace achats a préparé le premier brouillon de la demande de prix.", ar: "أعدت مساحة المشتريات المسودة الأولى لطلب عرض السعر." },
  { key: "rfq.timeline.suppliersSelected", en: "Suppliers selected", fr: "Fournisseurs sélectionnés", ar: "تم اختيار الموردين" },
  { key: "rfq.timeline.voraReview", en: "VORA scope review", fr: "Revue du périmètre par VORA", ar: "مراجعة النطاق بواسطة VORA" },
  { key: "rfq.timeline.voraDescription", en: "VORA highlighted scope completeness and supplier fit.", fr: "VORA a mis en évidence la complétude du périmètre et l’adéquation des fournisseurs.", ar: "أبرزت VORA اكتمال النطاق ومدى ملاءمة الموردين." },
  { key: "rfq.demo.created", en: "Draft RFQ created in demo mode.", fr: "Brouillon de demande de prix créé en mode démo.", ar: "تم إنشاء مسودة طلب عرض سعر في الوضع التجريبي." },
  { key: "rfq.activity.procurementReviewed", en: "RFQ reviewed by procurement", fr: "Demande de prix examinée par les achats", ar: "تمت مراجعة طلب عرض السعر من قسم المشتريات" },
  { key: "rfq.activity.voraSuggestions", en: "VORA generated supplier suggestions", fr: "VORA a généré des suggestions de fournisseurs", ar: "أنشأت VORA اقتراحات للموردين" },
  { key: "rfq.risk.deadlinePressure", en: "Deadline pressure may reduce supplier response quality", fr: "La pression des délais peut réduire la qualité des réponses fournisseurs", ar: "قد يقلل ضغط المواعيد من جودة ردود الموردين" },
  { key: "rfq.risk.scopeAssumptions", en: "Scope assumptions should be clarified before award", fr: "Les hypothèses de périmètre doivent être clarifiées avant l’attribution", ar: "يجب توضيح افتراضات النطاق قبل الترسية" }
] as const;

const exactRuntimeCatalog = Object.fromEntries((["ar", "fr", "en"] as const).map((locale) => {
  const entries: Array<readonly [string, string]> = [];
  runtimeSystemMessages.forEach((message) => {
    const translated = message[locale];
    entries.push([message.key, translated], [message.en, translated], [message.fr, translated], [message.ar, translated]);
  });
  return [locale, Object.fromEntries(entries)];
})) as Record<RuntimeLocale, Record<string, string>>;

const runtimeSystemKeyBySource = Object.fromEntries(runtimeSystemMessages.flatMap((message) => [
  [message.en, message.key],
  [message.fr, message.key],
  [message.ar, message.key]
])) as Record<string, string>;

export function getRuntimeSystemKey(value: string): string | undefined {
  return runtimeSystemKeyBySource[value];
}

function interpolate(locale: RuntimeLocale, values: Record<RuntimeLocale, string>, variables: Record<string, string>) {
  return Object.entries(variables).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), values[locale]);
}

export function translateRuntimeSystemText(value: string, locale: RuntimeLocale): string | undefined {
  const exact = exactRuntimeCatalog[locale][value];
  if (exact) return exact;

  const patterns: Array<{ match: RegExp; render: (groups: RegExpMatchArray) => string }> = [
    { match: /^(.+) has the lowest submitted total\.$/, render: (g) => interpolate(locale, { en: "{supplier} has the lowest submitted total.", fr: "{supplier} présente le total soumis le plus bas.", ar: "قدّم {supplier} أقل إجمالي." }, { supplier: g[1] }) },
    { match: /^(.+) has the strongest technical compliance score\.$/, render: (g) => interpolate(locale, { en: "{supplier} has the strongest technical compliance score.", fr: "{supplier} obtient le meilleur score de conformité technique.", ar: "حقق {supplier} أعلى درجة للمطابقة التقنية." }, { supplier: g[1] }) },
    { match: /^(.+) balances commercial, technical, and risk factors\.$/, render: (g) => interpolate(locale, { en: "{supplier} balances commercial, technical, and risk factors.", fr: "{supplier} équilibre les critères commerciaux, techniques et de risque.", ar: "يوازن {supplier} بين العوامل التجارية والتقنية والمخاطر." }, { supplier: g[1] }) },
    { match: /^(.+) has the shortest stated lead time\.$/, render: (g) => interpolate(locale, { en: "{supplier} has the shortest stated lead time.", fr: "{supplier} annonce le délai le plus court.", ar: "يقدم {supplier} أقصر مدة إنجاز معلنة." }, { supplier: g[1] }) },
    { match: /^(.+) is the safest balanced recommendation for executive review\.$/, render: (g) => interpolate(locale, { en: "{supplier} is the safest balanced recommendation for executive review.", fr: "{supplier} constitue la recommandation équilibrée la plus sûre pour la revue de direction.", ar: "يمثل {supplier} التوصية المتوازنة الأكثر أماناً للمراجعة التنفيذية." }, { supplier: g[1] }) },
    { match: /^VORA compared (\d+) supplier quotations for (.+) across cost, compliance, delivery, and risk\.$/, render: (g) => interpolate(locale, { en: "VORA compared {count} supplier quotations for {rfq} across cost, compliance, delivery, and risk.", fr: "VORA a comparé {count} devis fournisseurs pour {rfq} selon le coût, la conformité, la livraison et le risque.", ar: "قارنت VORA عدد {count} من عروض الموردين لـ {rfq} حسب التكلفة والمطابقة والتسليم والمخاطر." }, { count: g[1], rfq: g[2] }) },
    { match: /^(.+): review scope assumptions and cost completeness\.$/, render: (g) => interpolate(locale, { en: "{supplier}: review scope assumptions and cost completeness.", fr: "{supplier} : vérifier les hypothèses de périmètre et l’exhaustivité des coûts.", ar: "{supplier}: راجع افتراضات النطاق واكتمال التكاليف." }, { supplier: g[1] }) },
    { match: /^(.+) is recommended for balanced award review, while (.+) should be checked for scope completeness before any price-led decision\.$/, render: (g) => interpolate(locale, { en: "{preferred} is recommended for balanced award review, while {lowest} should be checked for scope completeness before any price-led decision.", fr: "{preferred} est recommandé pour une revue d’attribution équilibrée, tandis que {lowest} doit être vérifié quant à la complétude du périmètre avant toute décision fondée sur le prix.", ar: "يوصى بـ {preferred} لمراجعة ترسية متوازنة، بينما يجب التحقق من اكتمال نطاق {lowest} قبل أي قرار قائم على السعر." }, { preferred: g[1], lowest: g[2] }) },
    { match: /^(\d+) suppliers added from Marketplace\.$/, render: (g) => interpolate(locale, { en: "{count} suppliers added from Marketplace.", fr: "{count} fournisseurs ajoutés depuis la place de marché.", ar: "تمت إضافة {count} من الموردين من السوق." }, { count: g[1] }) },
    { match: /^(.+) is ready for supplier evaluation with (\d+) invited companies\.$/, render: (g) => interpolate(locale, { en: "{title} is ready for supplier evaluation with {count} invited companies.", fr: "{title} est prêt pour l’évaluation des fournisseurs avec {count} entreprises invitées.", ar: "أصبح {title} جاهزاً لتقييم الموردين مع دعوة {count} شركات." }, { title: g[1], count: g[2] }) },
    { match: /^(\d+(?:[.,]\d+)?)% technical compliance with submitted RFQ requirements\.$/, render: (g) => interpolate(locale, { en: "{score}% technical compliance with submitted RFQ requirements.", fr: "Conformité technique de {score} % aux exigences de la demande de prix.", ar: "مطابقة تقنية بنسبة {score}% لمتطلبات طلب عرض السعر المقدم." }, { score: g[1] }) },
    { match: /^(.+) delivery allowance$/, render: (g) => interpolate(locale, { en: "{amount} delivery allowance", fr: "Provision de livraison de {amount}", ar: "مخصص تسليم بقيمة {amount}" }, { amount: g[1] }) },
    { match: /^(.+) cost component from supplier quotation\.$/, render: (g) => interpolate(locale, { en: "{item} cost component from supplier quotation.", fr: "Composante de coût « {item} » issue du devis fournisseur.", ar: "مكوّن تكلفة {item} من عرض المورد." }, { item: g[1] }) }
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern.match);
    if (match) return pattern.render(match);
  }
  return undefined;
}
