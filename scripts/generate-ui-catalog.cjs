const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const localeDirectory = path.join(root, "lib", "locales");

const shellTranslations = [
  ["Command Center", "Centre de commande", "مركز القيادة"], ["Organizations", "Organisations", "المؤسسات"],
  ["Marketplace", "Place de marché", "السوق"], ["AI Tools", "Outils IA", "أدوات الذكاء الاصطناعي"],
  ["RFQs", "Demandes de prix", "طلبات عروض الأسعار"], ["Quotations", "Devis", "عروض الأسعار"],
  ["Contracts", "Contrats", "العقود"], ["Billing", "Facturation", "الفوترة"], ["Admin", "Administration", "الإدارة"],
  ["Notifications", "Notifications", "الإشعارات"], ["Knowledge", "Connaissances", "المعرفة"], ["Documents", "Documents", "المستندات"],
  ["More", "Plus", "المزيد"], ["Skip to workspace", "Accéder à l’espace de travail", "الانتقال إلى مساحة العمل"],
  ["Primary workspace navigation", "Navigation principale de l’espace de travail", "التنقل الرئيسي في مساحة العمل"],
  ["Secondary workspace sections", "Sections secondaires de l’espace de travail", "أقسام مساحة العمل الثانوية"],
  ["Main workspace sections", "Sections principales de l’espace de travail", "أقسام مساحة العمل الرئيسية"],
  ["Open menu", "Ouvrir le menu", "فتح القائمة"], ["Close menu", "Fermer le menu", "إغلاق القائمة"],
  ["Toggle sidebar", "Réduire ou développer la barre latérale", "طي الشريط الجانبي أو توسيعه"],
  ["VORA Project Workspace", "Espace projet VORA", "مساحة مشاريع VORA"],
  ["Open global search", "Ouvrir la recherche globale", "فتح البحث العام"],
  ["Open global search and command palette", "Ouvrir la recherche globale et la palette de commandes", "فتح البحث العام ولوحة الأوامر"],
  ["Open quick actions", "Ouvrir les actions rapides", "فتح الإجراءات السريعة"],
  ["Toggle theme", "Changer de thème", "تبديل السمة"], ["Open user profile menu", "Ouvrir le menu du profil", "فتح قائمة الملف الشخصي"],
  ["Production data", "Données de production", "بيانات الإنتاج"], ["Auto data mode", "Mode de données automatique", "وضع البيانات التلقائي"],
  ["Demo mode", "Mode démo", "الوضع التجريبي"], ["Demo", "Démo", "تجريبي"], ["Demo fallback", "Repli démo", "بيانات تجريبية احتياطية"],
  ["Active", "Actif", "نشط"], ["Pending invitation", "Invitation en attente", "دعوة معلقة"], ["Owner", "Propriétaire", "المالك"],
  ["Member", "Membre", "عضو"], ["Guest", "Invité", "ضيف"], ["Switch organization", "Changer d’organisation", "تبديل المؤسسة"],
  ["Switch workspace", "Changer d’espace de travail", "تبديل مساحة العمل"], ["UI state", "État de l’interface", "حالة الواجهة"],
  ["Search organizations", "Rechercher des organisations", "البحث في المؤسسات"], ["Recent organizations", "Organisations récentes", "المؤسسات الأخيرة"],
  ["All organizations", "Toutes les organisations", "كل المؤسسات"], ["Create organization", "Créer une organisation", "إنشاء مؤسسة"],
  ["Join organization", "Rejoindre une organisation", "الانضمام إلى مؤسسة"], ["No organizations found.", "Aucune organisation trouvée.", "لم يتم العثور على مؤسسات."],
  ["Quick actions", "Actions rapides", "إجراءات سريعة"], ["Quick Actions", "Actions rapides", "إجراءات سريعة"], ["Move faster", "Avancez plus vite", "أنجز بشكل أسرع"],
  ["New project", "Nouveau projet", "مشروع جديد"], ["Upload document", "Importer un document", "رفع مستند"], ["Ask VORA", "Interroger VORA", "اسأل VORA"],
  ["Generate report", "Générer un rapport", "إنشاء تقرير"], ["Invite employee", "Inviter un employé", "دعوة موظف"],
  ["Open organization", "Ouvrir l’organisation", "فتح المؤسسة"], ["Browse marketplace", "Parcourir la place de marché", "تصفح السوق"],
  ["Create RFQ", "Créer une demande de prix", "إنشاء طلب عرض سعر"], ["Compare quotations", "Comparer les devis", "مقارنة عروض الأسعار"],
  ["Open contracts", "Ouvrir les contrats", "فتح العقود"], ["Open billing", "Ouvrir la facturation", "فتح الفوترة"], ["Open admin", "Ouvrir l’administration", "فتح الإدارة"],
  ["Global search and command palette", "Recherche globale et palette de commandes", "البحث العام ولوحة الأوامر"],
  ["Search projects, organizations, people, reports, tools...", "Rechercher des projets, organisations, personnes, rapports, outils...", "ابحث عن المشاريع والمؤسسات والأشخاص والتقارير والأدوات..."],
  ["Search Vorqa workspace", "Rechercher dans l’espace Vorqa", "البحث في مساحة Vorqa"], ["Close command palette", "Fermer la palette de commandes", "إغلاق لوحة الأوامر"],
  ["Recent commands", "Commandes récentes", "الأوامر الأخيرة"], ["Suggested commands", "Commandes suggérées", "الأوامر المقترحة"],
  ["Global discovery", "Découverte globale", "استكشاف شامل"], ["results across Vorqa", "résultats dans Vorqa", "نتائج في Vorqa"],
  ["Navigate", "Naviguer", "تنقل"], ["Open", "Ouvrir", "فتح"], ["Command palette results", "Résultats de la palette de commandes", "نتائج لوحة الأوامر"],
  ["No results found", "Aucun résultat", "لم يتم العثور على نتائج"],
  ["Try searching for a project, employee, report, organization, or VORA tool.", "Recherchez un projet, un employé, un rapport, une organisation ou un outil VORA.", "جرّب البحث عن مشروع أو موظف أو تقرير أو مؤسسة أو أداة VORA."],
  ["Navigation", "Navigation", "التنقل"], ["Workspace", "Espace de travail", "مساحة العمل"], ["Placeholder", "Indisponible", "غير متاح"], ["Ready", "Prêt", "جاهز"],
  ["Open dashboard", "Ouvrir le tableau de bord", "فتح لوحة التحكم"], ["Open projects", "Ouvrir les projets", "فتح المشاريع"],
  ["Open organizations", "Ouvrir les organisations", "فتح المؤسسات"], ["Open marketplace", "Ouvrir la place de marché", "فتح السوق"],
  ["Open RFQs", "Ouvrir les demandes de prix", "فتح طلبات عروض الأسعار"], ["Open quotations", "Ouvrir les devis", "فتح عروض الأسعار"],
  ["Open administration", "Ouvrir l’administration", "فتح الإدارة"], ["Open notification center", "Ouvrir le centre de notifications", "فتح مركز الإشعارات"],
  ["Open VORA AI", "Ouvrir VORA AI", "فتح VORA AI"], ["Create project", "Créer un projet", "إنشاء مشروع"], ["Generate BOQ", "Générer le DQE", "إنشاء جدول الكميات"],
  ["Open settings", "Ouvrir les paramètres", "فتح الإعدادات"], ["View notifications", "Voir les notifications", "عرض الإشعارات"],
  ["Enterprise Demo", "Démo entreprise", "عرض مؤسسي تجريبي"], ["Workspace Active", "Espace actif", "مساحة العمل نشطة"],
  ["Atlas Construction Group Command Center", "Centre de commande d’Atlas Construction Group", "مركز قيادة Atlas Construction Group"],
  ["A live-feeling enterprise account for engineering, architecture, procurement, logistics, and finance teams managing construction delivery with VORA.", "Un espace d’entreprise réaliste pour les équipes d’ingénierie, d’architecture, d’approvisionnement, de logistique et de finance qui pilotent les travaux avec VORA.", "حساب مؤسسي واقعي لفرق الهندسة والعمارة والمشتريات والخدمات اللوجستية والمالية لإدارة تنفيذ البناء باستخدام VORA."],
  ["Primary Workspace", "Espace principal", "مساحة العمل الرئيسية"], ["No production projects available yet.", "Aucun projet de production disponible.", "لا توجد مشاريع إنتاج متاحة بعد."],
  ["Command shortcuts", "Raccourcis de commande", "اختصارات الأوامر"], ["Search Atlas workspace...", "Rechercher dans l’espace Atlas...", "البحث في مساحة Atlas..."],
  ["New Project", "Nouveau projet", "مشروع جديد"], ["Generate Document", "Générer un document", "إنشاء مستند"], ["Open AI", "Ouvrir l’IA", "فتح الذكاء الاصطناعي"],
  ["Upload Files", "Importer des fichiers", "رفع الملفات"], ["Invite Team", "Inviter l’équipe", "دعوة الفريق"],
  ["Create an Atlas workspace", "Créer un espace Atlas", "إنشاء مساحة Atlas"], ["Prepare a board-ready report", "Préparer un rapport prêt pour le comité", "إعداد تقرير جاهز لمجلس الإدارة"],
  ["Ask VORA with project context", "Interroger VORA avec le contexte du projet", "اسأل VORA باستخدام سياق المشروع"], ["Add drawings and knowledge", "Ajouter des plans et des connaissances", "إضافة المخططات والمعرفة"],
  ["Prepare team access", "Préparer l’accès de l’équipe", "إعداد وصول الفريق"], ["Current role", "Rôle actuel", "الدور الحالي"], ["Company", "Entreprise", "الشركة"],
  ["Status", "Statut", "الحالة"], ["Today", "Aujourd’hui", "اليوم"]
  , ["Project", "Projet", "مشروع"], ["Organization", "Organisation", "مؤسسة"], ["Employee", "Employé", "موظف"], ["Department", "Département", "قسم"]
  , ["Report", "Rapport", "تقرير"], ["Document", "Document", "مستند"], ["AI output", "Résultat IA", "مخرج ذكاء اصطناعي"], ["Tool", "Outil", "أداة"]
  , ["RFQ", "Demande de prix", "طلب عرض سعر"], ["Quotation", "Devis", "عرض سعر"], ["Contract", "Contrat", "عقد"]
  , ["Execution", "Exécution", "التنفيذ"], ["High workload", "Charge élevée", "عبء عمل مرتفع"], ["Reviewed", "Révisé", "تمت مراجعته"]
  , ["Generated", "Généré", "تم إنشاؤه"], ["Available", "Disponible", "متاح"], ["Shortlisted", "Présélectionné", "ضمن القائمة المختصرة"]
  , ["Trialing", "Période d’essai", "فترة تجريبية"], ["Foundation", "Fondation", "تأسيسي"], ["Unread alerts", "Alertes non lues", "تنبيهات غير مقروءة"]
  , ["Document Generator", "Générateur de documents", "منشئ المستندات"], ["Construction Marketplace", "Place de marché de la construction", "سوق البناء"]
  , ["Billing Control Center", "Centre de contrôle de la facturation", "مركز التحكم في الفوترة"], ["Administration Panel", "Panneau d’administration", "لوحة الإدارة"]
  , ["Notification Center", "Centre de notifications", "مركز الإشعارات"], ["North Africa Construction Command Center", "Centre de commande de la construction en Afrique du Nord", "مركز قيادة البناء في شمال أفريقيا"]
  , ["Verified B2B network", "Réseau B2B vérifié", "شبكة أعمال موثقة"], ["Marketplace procurement", "Achats de la place de marché", "مشتريات السوق"]
  , ["Plan, usage and invoices", "Forfait, utilisation et factures", "الخطة والاستخدام والفواتير"], ["Platform metrics, users and system health", "Indicateurs, utilisateurs et santé du système", "مؤشرات المنصة والمستخدمون وصحة النظام"]
  , ["Enterprise alerts", "Alertes d’entreprise", "تنبيهات المؤسسة"], ["Command palette", "Palette de commandes", "لوحة الأوامر"]
  , ["Arabic", "Arabe", "العربية"], ["French", "Français", "الفرنسية"], ["English", "Anglais", "الإنجليزية"]
  , ["Welcome to Vorqa AI", "Bienvenue sur Vorqa AI", "مرحباً بك في Vorqa AI"], ["How can I help you?", "Comment puis-je vous aider ?", "كيف يمكنني مساعدتك؟"]
  , ["Choose the role that best matches your work.", "Choisissez le rôle qui correspond le mieux à votre activité.", "اختر الدور الأقرب إلى طبيعة عملك."]
  , ["Project Owner", "Maître d’ouvrage", "مالك المشروع"], ["Contractor", "Entrepreneur", "مقاول"], ["Engineer", "Ingénieur", "مهندس"], ["Architect", "Architecte", "معماري"], ["Supplier", "Fournisseur", "مورد"]
  , ["Worker or Technician", "Ouvrier ou technicien", "عامل أو تقني"], ["Inspector or Supervisor", "Inspecteur ou superviseur", "مفتش أو مشرف"], ["Construction Company", "Entreprise de construction", "شركة بناء"], ["Something Else", "Autre activité", "نشاط آخر"]
  , ["Manage projects, approvals, budgets, and decisions.", "Gérez les projets, validations, budgets et décisions.", "أدر المشاريع والموافقات والميزانيات والقرارات."]
  , ["Coordinate execution, bids, teams, and site delivery.", "Coordonnez l’exécution, les offres, les équipes et le chantier.", "نسّق التنفيذ والعروض والفرق وتسليم الموقع."]
  , ["Review technical work, drawings, issues, and approvals.", "Révisez les travaux techniques, plans, problèmes et validations.", "راجع الأعمال التقنية والمخططات والمشكلات والموافقات."]
  , ["Coordinate designs, drawings, reviews, and documents.", "Coordonnez les conceptions, plans, revues et documents.", "نسّق التصاميم والمخططات والمراجعات والوثائق."]
  , ["Manage opportunities, quotations, products, and deliveries.", "Gérez les opportunités, devis, produits et livraisons.", "أدر الفرص وعروض الأسعار والمنتجات والتسليمات."]
  , ["Follow tasks, schedules, documents, and safety actions.", "Suivez les tâches, plannings, documents et actions de sécurité.", "تابع المهام والجداول والوثائق وإجراءات السلامة."]
  , ["Manage inspections, issues, approvals, and compliance.", "Gérez les inspections, problèmes, validations et la conformité.", "أدر عمليات التفتيش والمشكلات والموافقات والامتثال."]
  , ["Coordinate organizations, projects, teams, and operations.", "Coordonnez les organisations, projets, équipes et opérations.", "نسّق المؤسسات والمشاريع والفرق والعمليات."]
  , ["Create a flexible workspace for your professional activity.", "Créez un espace flexible pour votre activité professionnelle.", "أنشئ مساحة مرنة لنشاطك المهني."]
  , ["Set up your workspace", "Configurez votre espace de travail", "أعدّ مساحة عملك"], ["Add the essentials now. Optional details can be completed later.", "Ajoutez l’essentiel maintenant. Les détails facultatifs pourront être complétés plus tard.", "أضف المعلومات الأساسية الآن، ويمكن إكمال التفاصيل الاختيارية لاحقاً."]
  , ["Complete setup", "Terminer la configuration", "إكمال الإعداد"], ["Select one role to continue.", "Sélectionnez un rôle pour continuer.", "اختر دوراً واحداً للمتابعة."]
  , ["Loading workspace setup", "Chargement de la configuration", "جارٍ تحميل إعداد مساحة العمل"], ["Workspace setup unavailable", "Configuration indisponible", "إعداد مساحة العمل غير متاح"]
  , ["Individual or company", "Particulier ou entreprise", "فرد أو شركة"], ["Contractor type", "Type d’entrepreneur", "نوع المقاول"], ["Main specialization", "Spécialité principale", "التخصص الرئيسي"], ["Company size", "Taille de l’entreprise", "حجم الشركة"]
  , ["Logo URL", "URL du logo", "رابط الشعار"], ["Engineering discipline", "Discipline d’ingénierie", "التخصص الهندسي"], ["Years of experience", "Années d’expérience", "سنوات الخبرة"], ["License number", "Numéro de licence", "رقم الترخيص"]
  , ["Studio name", "Nom du studio", "اسم الاستوديو"], ["Specialization", "Spécialisation", "التخصص"], ["Product categories", "Catégories de produits", "فئات المنتجات"], ["Delivery region", "Zone de livraison", "منطقة التسليم"]
  , ["Main trade", "Métier principal", "الحرفة الرئيسية"], ["Skills", "Compétences", "المهارات"], ["Availability", "Disponibilité", "التوفر"], ["Inspection discipline", "Discipline d’inspection", "تخصص التفتيش"]
  , ["Certification", "Certification", "الشهادة"], ["Company type", "Type d’entreprise", "نوع الشركة"], ["Number of employees", "Nombre d’employés", "عدد الموظفين"], ["Number of projects", "Nombre de projets", "عدد المشاريع"]
  , ["Professional activity", "Activité professionnelle", "النشاط المهني"], ["Short description", "Brève description", "وصف مختصر"], ["City", "Ville", "المدينة"], ["Country", "Pays", "البلد"], ["Company name", "Nom de l’entreprise", "اسم الشركة"]
  , ["First name", "Prénom", "الاسم الأول"], ["Last name", "Nom", "اسم العائلة"], ["Phone number", "Numéro de téléphone", "رقم الهاتف"], ["Confirm password", "Confirmer le mot de passe", "تأكيد كلمة المرور"]
  , ["Preferred language", "Langue préférée", "اللغة المفضلة"], ["I accept the terms and privacy policy.", "J’accepte les conditions et la politique de confidentialité.", "أوافق على الشروط وسياسة الخصوصية."]
  , ["Create your account", "Créez votre compte", "أنشئ حسابك"], ["Your selected role will be used to prepare the right Vorqa workspace after registration.", "Votre rôle servira à préparer l’espace Vorqa adapté après l’inscription.", "سيُستخدم دورك المختار لإعداد مساحة Vorqa المناسبة بعد التسجيل."]
  , ["Change selected role", "Modifier le rôle sélectionné", "تغيير الدور المختار"], ["Choose your role before creating an account.", "Choisissez votre rôle avant de créer un compte.", "اختر دورك قبل إنشاء الحساب."]
  , ["Choose role", "Choisir un rôle", "اختيار الدور"], ["Confirm your email", "Confirmez votre e-mail", "أكد بريدك الإلكتروني"], ["Use the confirmation link sent to", "Utilisez le lien de confirmation envoyé à", "استخدم رابط التأكيد المرسل إلى"], [", then continue to workspace setup.", ", puis poursuivez la configuration de l’espace de travail.", "، ثم تابع إعداد مساحة العمل."]
  , ["Active workspace", "Espace actif", "مساحة العمل النشطة"], ["Coming Soon", "Bientôt disponible", "قريباً"], ["This capability", "Cette fonctionnalité", "هذه الإمكانية"], ["is not available in the current release.", "n’est pas disponible dans la version actuelle.", "غير متاحة في الإصدار الحالي."]
  , ["Back to dashboard", "Retour au tableau de bord", "العودة إلى لوحة التحكم"], ["Step", "Étape", "الخطوة"], ["of", "sur", "من"], ["of 3", "sur 3", "من 3"], ["Step 1 of 3", "Étape 1 sur 3", "الخطوة 1 من 3"], ["Step 2 of 3", "Étape 2 sur 3", "الخطوة 2 من 3"], ["Step 3 of 3", "Étape 3 sur 3", "الخطوة 3 من 3"], ["Setup progress", "Progression de la configuration", "تقدم الإعداد"]
  , ["Primary role", "Rôle principal", "الدور الرئيسي"], ["VORA Onboarding", "Accueil VORA", "إعداد VORA"], ["optional", "facultatif", "اختياري"], ["is required.", "est obligatoire.", "مطلوب."], ["Retry", "Réessayer", "إعادة المحاولة"], ["Back", "Retour", "رجوع"], ["Continue", "Continuer", "متابعة"]
  , ["Contractors", "Entrepreneurs", "المقاولون"], ["RFQs and Bids", "Demandes de prix et offres", "طلبات الأسعار والعروض"], ["Drawings", "Plans", "المخططات"], ["Site Visits", "Visites de chantier", "زيارات الموقع"], ["Issues", "Problèmes", "المشكلات"], ["Designs", "Conceptions", "التصاميم"], ["Reviews", "Revues", "المراجعات"]
  , ["Opportunities", "Opportunités", "الفرص"], ["Orders", "Commandes", "الطلبات"], ["Products", "Produits", "المنتجات"], ["Deliveries", "Livraisons", "التسليمات"], ["Customers", "Clients", "العملاء"], ["My Tasks", "Mes tâches", "مهامي"], ["Schedule", "Planning", "الجدول"], ["Safety", "Sécurité", "السلامة"], ["Daily Report", "Rapport quotidien", "التقرير اليومي"]
  , ["Inspections", "Inspections", "عمليات التفتيش"], ["Teams", "Équipes", "الفرق"], ["Departments", "Départements", "الأقسام"], ["Finance", "Finance", "المالية"], ["Administration", "Administration", "الإدارة"], ["Profile", "Profil", "الملف الشخصي"], ["Equipment", "Équipement", "المعدات"]
  , ["Individual", "Individuel", "فرد"], ["Organization", "Organisation", "مؤسسة"], ["Account type", "Type de compte", "نوع الحساب"], ["Organization type", "Type d’organisation", "نوع المؤسسة"]
  , ["A personal workspace for your professional role.", "Un espace personnel adapté à votre rôle professionnel.", "مساحة شخصية تناسب دورك المهني."], ["A shared workspace for departments, teams, members, and projects.", "Un espace partagé pour les départements, équipes, membres et projets.", "مساحة مشتركة للأقسام والفرق والأعضاء والمشاريع."]
  , ["Engineering Office", "Bureau d’études", "مكتب هندسي"], ["Architecture Studio", "Agence d’architecture", "استوديو معماري"], ["Supplier Company", "Entreprise fournisseur", "شركة توريد"], ["Real Estate Developer", "Promoteur immobilier", "مطور عقاري"]
  , ["Coordinate construction teams, delivery, finance, and operations.", "Coordonnez les équipes de construction, la livraison, la finance et les opérations.", "نسّق فرق البناء والتسليم والمالية والعمليات."], ["Coordinate engineering disciplines, reviews, and technical delivery.", "Coordonnez les disciplines d’ingénierie, les revues et la livraison technique.", "نسّق التخصصات الهندسية والمراجعات والتسليم التقني."]
  , ["Manage design teams, drawings, reviews, and documents.", "Gérez les équipes de conception, les plans, les revues et les documents.", "أدر فرق التصميم والمخططات والمراجعات والوثائق."], ["Manage products, quotations, orders, and deliveries.", "Gérez les produits, devis, commandes et livraisons.", "أدر المنتجات وعروض الأسعار والطلبات والتسليمات."]
  , ["Manage developments, projects, budgets, approvals, and contractors.", "Gérez les développements, projets, budgets, validations et entrepreneurs.", "أدر التطويرات والمشاريع والميزانيات والموافقات والمقاولين."]
  , ["Choose your account type, then select your role or organization type.", "Choisissez votre type de compte, puis votre rôle ou type d’organisation.", "اختر نوع حسابك، ثم اختر دورك أو نوع المؤسسة."], ["Select an account type to continue.", "Sélectionnez un type de compte pour continuer.", "اختر نوع حساب للمتابعة."], ["Select an organization type to continue.", "Sélectionnez un type d’organisation pour continuer.", "اختر نوع المؤسسة للمتابعة."]
  , ["Choose your account type before creating an account.", "Choisissez votre type de compte avant de créer un compte.", "اختر نوع حسابك قبل إنشاء الحساب."], ["Choose account type", "Choisir le type de compte", "اختيار نوع الحساب"]
  , ["Organization name", "Nom de l’organisation", "اسم المؤسسة"], ["Engineering disciplines", "Disciplines d’ingénierie", "التخصصات الهندسية"], ["Development type", "Type de développement", "نوع التطوير"]
];

const dashboardTranslations = [
  ["categories", "catégories", "فئات"], ["Active Projects", "Projets actifs", "المشاريع النشطة"], ["Pending Tasks", "Tâches en attente", "المهام المعلقة"],
  ["Budget Health", "Santé du budget", "سلامة الميزانية"], ["Team Members", "Membres de l’équipe", "أعضاء الفريق"], ["Risk Score", "Score de risque", "درجة المخاطر"],
  ["11 urgent", "11 urgentes", "11 عاجلة"], ["Forecast", "Prévision", "التوقعات"], ["6 active", "6 actifs", "6 نشطون"], ["VORA live", "VORA en direct", "VORA مباشر"],
  ["Project data is shown from the demo fallback while production data is unavailable.", "Les données projet proviennent du mode démo tant que les données de production sont indisponibles.", "يتم عرض بيانات المشروع من الوضع التجريبي ما دامت بيانات الإنتاج غير متاحة."],
  ["RFQ Management", "Gestion des demandes de prix", "إدارة طلبات عروض الأسعار"], ["Procurement quotation center", "Centre des devis d’approvisionnement", "مركز عروض أسعار المشتريات"],
  ["Track supplier quotation workflows connected to projects and the Marketplace.", "Suivez les devis fournisseurs liés aux projets et à la place de marché.", "تتبّع مسارات عروض أسعار الموردين المرتبطة بالمشاريع والسوق."],
  ["Draft", "Brouillon", "مسودة"], ["Pending", "En attente", "معلق"], ["Review", "Révision", "مراجعة"], ["Awarded", "Attribué", "تمت الترسية"], ["Closed", "Clôturé", "مغلق"],
  ["due", "échéance", "الاستحقاق"], ["RFQ production data is unavailable, so dashboard widgets are using demo fallback data.", "Les données de production des demandes de prix sont indisponibles; les widgets utilisent les données de démonstration.", "بيانات إنتاج طلبات عروض الأسعار غير متاحة، لذلك تستخدم عناصر لوحة التحكم البيانات التجريبية."],
  ["Quotation Intelligence", "Intelligence des devis", "ذكاء عروض الأسعار"], ["Supplier offer comparison", "Comparaison des offres fournisseurs", "مقارنة عروض الموردين"],
  ["Review pending quotations, best offers, and VORA award recommendations.", "Examinez les devis en attente, les meilleures offres et les recommandations d’attribution de VORA.", "راجع عروض الأسعار المعلقة وأفضل العروض وتوصيات VORA للترسية."],
  ["Compare", "Comparer", "مقارنة"], ["Compared", "Comparés", "تمت المقارنة"], ["Score", "Score", "الدرجة"],
  ["Quotation production data is unavailable, so dashboard widgets are using demo fallback data.", "Les données de production des devis sont indisponibles; les widgets utilisent les données de démonstration.", "بيانات إنتاج عروض الأسعار غير متاحة، لذلك تستخدم عناصر لوحة التحكم البيانات التجريبية."],
  ["Contract & Award Management", "Gestion des contrats et attributions", "إدارة العقود والترسية"], ["Post-award controls", "Contrôles après attribution", "ضوابط ما بعد الترسية"],
  ["Track active contracts, approvals, milestone obligations, payment events, and VORA risk indicators.", "Suivez les contrats actifs, validations, jalons, paiements et indicateurs de risque VORA.", "تتبّع العقود النشطة والموافقات والتزامات المراحل والمدفوعات ومؤشرات مخاطر VORA."],
  ["Open Contracts", "Ouvrir les contrats", "فتح العقود"], ["Approvals", "Approbations", "الموافقات"], ["Milestones", "Jalons", "المراحل"], ["Payments", "Paiements", "المدفوعات"], ["Risks", "Risques", "المخاطر"],
  ["Contract production data is unavailable, so dashboard widgets are using demo fallback data.", "Les données de production des contrats sont indisponibles; les widgets utilisent les données de démonstration.", "بيانات إنتاج العقود غير متاحة، لذلك تستخدم عناصر لوحة التحكم البيانات التجريبية."],
  ["Unread", "Non lues", "غير مقروءة"], ["Critical", "Critique", "حرج"], ["Reminders", "Rappels", "التذكيرات"], ["AI Alerts", "Alertes IA", "تنبيهات الذكاء الاصطناعي"],
  ["Unified risk, deadline, approval, document, marketplace, and VORA intelligence signals.", "Signaux unifiés de risque, échéance, approbation, document, marché et intelligence VORA.", "إشارات موحدة للمخاطر والمواعيد والموافقات والمستندات والسوق وذكاء VORA."],
  ["Open Notifications", "Ouvrir les notifications", "فتح الإشعارات"], ["Notification production data is unavailable, so dashboard widgets are using demo fallback data.", "Les données de production des notifications sont indisponibles; les widgets utilisent les données de démonstration.", "بيانات إنتاج الإشعارات غير متاحة، لذلك تستخدم عناصر لوحة التحكم البيانات التجريبية."],
  ["Subscription health", "Santé de l’abonnement", "سلامة الاشتراك"], ["Plan limits, trial status, AI usage, storage, and renewal readiness.", "Limites du forfait, essai, usage IA, stockage et préparation au renouvellement.", "حدود الخطة وحالة التجربة واستخدام الذكاء الاصطناعي والتخزين والاستعداد للتجديد."],
  ["Open Billing", "Ouvrir la facturation", "فتح الفوترة"], ["Trial", "Essai", "التجربة"], ["AI request usage", "Utilisation des requêtes IA", "استخدام طلبات الذكاء الاصطناعي"],
  ["of", "sur", "من"], ["No AI usage", "Aucune utilisation IA", "لا يوجد استخدام للذكاء الاصطناعي"], ["Storage usage", "Utilisation du stockage", "استخدام التخزين"],
  ["Renewal", "Renouvellement", "التجديد"], ["manual", "manuel", "يدوي"], ["trialing", "en période d’essai", "قيد التجربة"],
  ["Platform operations", "Opérations de la plateforme", "عمليات المنصة"], ["Admin foundation for users, organizations, subscriptions, audit logs, AI usage, and system configuration.", "Fondation d’administration des utilisateurs, organisations, abonnements, audits, usage IA et configuration système.", "أساس إدارة المستخدمين والمؤسسات والاشتراكات وسجلات التدقيق واستخدام الذكاء الاصطناعي وإعدادات النظام."],
  ["Open Admin", "Ouvrir l’administration", "فتح الإدارة"], ["Users", "Utilisateurs", "المستخدمون"], ["Revenue", "Revenus", "الإيرادات"], ["Health", "Santé", "السلامة"], ["healthy", "sain", "سليم"],
  ["Admin production views are unavailable, so the widget is using demo fallback data.", "Les vues d’administration de production sont indisponibles; le widget utilise les données de démonstration.", "عروض الإدارة الإنتاجية غير متاحة، لذلك يستخدم العنصر البيانات التجريبية."],
  ["Recently Added", "Ajoutées récemment", "أضيفت حديثًا"], ["Top Rated", "Mieux notées", "الأعلى تقييمًا"], ["Verified Companies", "Entreprises vérifiées", "الشركات الموثقة"],
  ["Nearby Companies", "Entreprises à proximité", "الشركات القريبة"], ["Recommended Partners", "Partenaires recommandés", "الشركاء الموصى بهم"],
  ["Construction partner network", "Réseau de partenaires de construction", "شبكة شركاء البناء"], ["Discover suppliers, contractors, consultants, and engineering offices for Atlas projects.", "Découvrez fournisseurs, entrepreneurs, consultants et bureaux d’études pour les projets Atlas.", "اكتشف الموردين والمقاولين والاستشاريين والمكاتب الهندسية لمشاريع Atlas."],
  ["Open Marketplace", "Ouvrir la place de marché", "فتح السوق"], ["Companies", "Entreprises", "الشركات"], ["Connections", "Connexions", "الاتصالات"], ["Favorites", "Favoris", "المفضلة"],
  ["Messages", "Messages", "الرسائل"], ["Reviews", "Avis", "المراجعات"], ["Verified", "Vérifiées", "موثقة"], ["No companies available yet.", "Aucune entreprise disponible.", "لا توجد شركات متاحة بعد."],
  ["Marketplace production data is unavailable, so dashboard widgets are using demo fallback data.", "Les données de production de la place de marché sont indisponibles; les widgets utilisent les données de démonstration.", "بيانات إنتاج السوق غير متاحة، لذلك تستخدم عناصر لوحة التحكم البيانات التجريبية."],
  ["Recent Projects", "Projets récents", "المشاريع الأخيرة"], ["Atlas project portfolio", "Portefeuille de projets Atlas", "محفظة مشاريع Atlas"], ["Progress", "Progression", "التقدم"],
  ["Production projects will appear here when they are available for your account.", "Les projets de production apparaîtront ici lorsqu’ils seront disponibles pour votre compte.", "ستظهر مشاريع الإنتاج هنا عندما تصبح متاحة لحسابك."],
  ["Recent Documents", "Documents récents", "المستندات الأخيرة"], ["Atlas document · updated today", "Document Atlas · mis à jour aujourd’hui", "مستند Atlas · حُدّث اليوم"],
  ["Upcoming Milestones", "Jalons à venir", "المراحل القادمة"], ["Luxury Villa structural inspection", "Inspection structurelle de Luxury Villa", "الفحص الإنشائي لـ Luxury Villa"],
  ["Rabat permit package review", "Révision du dossier de permis de Rabat", "مراجعة ملف ترخيص الرباط"], ["Tangier steel supplier award", "Attribution du fournisseur d’acier de Tanger", "ترسية مورد الفولاذ بطنجة"],
  ["Upcoming", "À venir", "قادم"], ["Scheduled", "Planifié", "مجدول"], ["18 July", "18 juillet", "18 يوليو"], ["21 July", "21 juillet", "21 يوليو"], ["25 July", "25 juillet", "25 يوليو"],
  ["VORA Recommendations", "Recommandations VORA", "توصيات VORA"], ["Portfolio action", "Action sur le portefeuille", "إجراء المحفظة"],
  ["Prioritize Rabat permit blockers and Tangier steel award before generating the weekly CEO briefing.", "Priorisez les blocages du permis de Rabat et l’attribution de l’acier à Tanger avant le briefing hebdomadaire de la direction.", "أعطِ الأولوية لعوائق ترخيص الرباط وترسية فولاذ طنجة قبل إنشاء الإحاطة الأسبوعية للإدارة."],
  ["Generate briefing", "Générer le briefing", "إنشاء الإحاطة"], ["Today's Agenda", "Agenda du jour", "جدول أعمال اليوم"],
  ["09:30 · Villa site inspection", "09:30 · Inspection du chantier de la villa", "09:30 · تفتيش موقع الفيلا"], ["Structural progress and waterproofing review.", "Avancement structurel et contrôle de l’étanchéité.", "مراجعة التقدم الإنشائي والعزل المائي."],
  ["12:00 · Finance review", "12:00 · Revue financière", "12:00 · المراجعة المالية"], ["Portfolio budget health and variance check.", "Contrôle de la santé budgétaire et des écarts du portefeuille.", "فحص سلامة ميزانية المحفظة والانحرافات."],
  ["16:00 · VORA briefing", "16:00 · Briefing VORA", "16:00 · إحاطة VORA"], ["Generate executive update for Atlas leadership.", "Générer une mise à jour exécutive pour la direction d’Atlas.", "إنشاء تحديث تنفيذي لقيادة Atlas."],
  ["Performance Overview", "Vue d’ensemble des performances", "نظرة عامة على الأداء"], ["Atlas delivery health", "Santé de livraison Atlas", "سلامة تنفيذ Atlas"],
  ["Project health", "Santé du projet", "سلامة المشروع"], ["Timeline health", "Santé du calendrier", "سلامة الجدول الزمني"], ["Budget health", "Santé du budget", "سلامة الميزانية"],
  ["Recent Activity", "Activité récente", "النشاط الأخير"], ["Recent AI Insights", "Analyses IA récentes", "أحدث رؤى الذكاء الاصطناعي"], ["VORA analytics", "Analyses VORA", "تحليلات VORA"],
  ["Knowledge ready", "Connaissances prêtes", "المعرفة جاهزة"], ["Atlas demo files and AI outputs are prepared for investor walkthroughs.", "Les fichiers de démonstration Atlas et les résultats IA sont prêts pour les présentations aux investisseurs.", "ملفات Atlas التجريبية ومخرجات الذكاء الاصطناعي جاهزة لعروض المستثمرين."],
  ["VORA generated a board report", "VORA a généré un rapport pour le conseil", "أنشأت VORA تقريرًا لمجلس الإدارة"], ["Procurement risk flagged", "Risque d’approvisionnement signalé", "تم رصد مخاطر مشتريات"],
  ["Budget forecast updated", "Prévision budgétaire mise à jour", "تم تحديث توقعات الميزانية"], ["Team invite prepared", "Invitation d’équipe préparée", "تم إعداد دعوة الفريق"],
  ["8 minutes ago", "Il y a 8 minutes", "منذ 8 دقائق"], ["34 minutes ago", "Il y a 34 minutes", "منذ 34 دقيقة"], ["Yesterday", "Hier", "أمس"],
  ["Budget variance detected", "Écart budgétaire détecté", "تم اكتشاف انحراف في الميزانية"], ["Luxury Villa Casablanca has a 6% procurement variance requiring review.", "Luxury Villa Casablanca présente un écart d’approvisionnement de 6 % nécessitant une révision.", "لدى Luxury Villa Casablanca انحراف مشتريات بنسبة 6% يتطلب المراجعة."],
  ["Permit package incomplete", "Dossier de permis incomplet", "ملف الترخيص غير مكتمل"], ["Residential Complex Rabat is missing fire safety updates.", "Residential Complex Rabat ne contient pas les mises à jour de sécurité incendie.", "يفتقد Residential Complex Rabat تحديثات السلامة من الحرائق."],
  ["Budget overrun risk detected", "Risque de dépassement budgétaire détecté", "تم اكتشاف خطر تجاوز الميزانية"], ["Luxury Villa Casablanca marble procurement is trending 8% above planned budget. Review supplier quotations before approval.", "Les achats de marbre de Luxury Villa Casablanca dépassent de 8 % le budget prévu. Examinez les devis avant approbation.", "تتجه مشتريات الرخام في Luxury Villa Casablanca إلى تجاوز الميزانية المخططة بنسبة 8%. راجع عروض الموردين قبل الموافقة."],
  ["Milestone delay warning", "Alerte de retard de jalon", "تحذير تأخر مرحلة"], ["Structural frame inspection is 2 days behind the baseline schedule. VORA recommends escalating the inspection checklist.", "L’inspection de la structure accuse deux jours de retard. VORA recommande d’escalader la liste de contrôle.", "يتأخر فحص الهيكل الإنشائي يومين عن الجدول الأساسي. توصي VORA بتصعيد قائمة الفحص."],
  ["Under 2 hours", "Moins de 2 heures", "أقل من ساعتين"], ["Same business day", "Le jour ouvrable même", "في يوم العمل نفسه"], ["Under 4 hours", "Moins de 4 heures", "أقل من 4 ساعات"],
  ["Under 6 hours", "Moins de 6 heures", "أقل من 6 ساعات"], ["Under 3 hours", "Moins de 3 heures", "أقل من 3 ساعات"], ["Under 1 business day", "Moins d’un jour ouvrable", "أقل من يوم عمل"], ["Not available", "Indisponible", "غير متاح"]
  , ["Free", "Gratuit", "مجاني"], ["Starter", "Démarrage", "المبتدئ"], ["Professional", "Professionnel", "الاحترافي"], ["Enterprise", "Entreprise", "المؤسسات"],
  ["active", "actif", "نشط"], ["expired", "expiré", "منتهي"], ["none", "aucun", "لا يوجد"]
];

function main() {
  const locales = ["ar", "fr", "en"];
  const uiTranslationCatalog = Object.fromEntries(locales.map((locale) => [
    locale,
    JSON.parse(fs.readFileSync(path.join(localeDirectory, `${locale}.json`), "utf8"))
  ]));
  fs.mkdirSync(localeDirectory, { recursive: true });

  for (const locale of locales) {
    const localeIndex = locale === "en" ? 0 : locale === "fr" ? 1 : 2;
    const merged = { ...uiTranslationCatalog[locale] };
    for (const row of [...shellTranslations, ...dashboardTranslations]) {
      for (const source of row) merged[source] = row[localeIndex];
    }
    const entries = Object.fromEntries(Object.entries(merged).sort(([left], [right]) => left.localeCompare(right)));
    fs.writeFileSync(
      path.join(localeDirectory, `${locale}.json`),
      `${JSON.stringify(entries, null, 2)}\n`,
      "utf8"
    );
  }

  console.log(`Generated ${locales.length} offline catalogs from the checked-in dictionaries.`);
}

main();
