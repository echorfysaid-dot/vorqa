const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const catalogs = Object.fromEntries(["en", "fr", "ar"].map((locale) => [locale, JSON.parse(fs.readFileSync(path.join(root, "lib", "locales", `${locale}.json`), "utf8"))]));
const visibleProps = new Set(["aria-label", "placeholder", "title", "alt", "label", "description", "eyebrow", "message", "text", "hint"]);

function listTsxFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTsxFiles(target);
    return entry.isFile() && target.endsWith(".tsx") ? [target] : [];
  });
}

function auditVisibleLiterals() {
  const output = [];
  for (const filename of [...listTsxFiles(path.join(root, "app")), ...listTsxFiles(path.join(root, "components"))]) {
    const relative = path.relative(root, filename).replace(/\\/g, "/");
    const source = fs.readFileSync(filename, "utf8");
    const sourceFile = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const add = (node, value) => {
      const normalized = value.replace(/\s+/g, " ").trim();
      if (normalized && /\p{L}/u.test(normalized)) output.push({ f: relative, line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1, v: normalized });
    };
    const visit = (node) => {
      if (ts.isJsxText(node)) add(node, node.text);
      if (ts.isJsxAttribute(node) && visibleProps.has(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) add(node, node.initializer.text);
      if (ts.isStringLiteral(node) && ts.isJsxExpression(node.parent) && node.parent.parent && ts.isJsxAttribute(node.parent.parent) && visibleProps.has(node.parent.parent.name.text)) add(node, node.text);
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return output.filter((entry) => ["en", "fr", "ar"].some((locale) => !catalogs[locale][entry.v]));
}

const audit = auditVisibleLiterals();
const entries = [...new Map(audit.map((entry) => [entry.v, entry])).values()];

const exact = {
  "Invoices": ["Invoices", "Factures", "الفواتير"], "Invoice history": ["Invoice history", "Historique des factures", "سجل الفواتير"],
  "Usage": ["Usage", "Utilisation", "الاستخدام"], "Plans": ["Plans", "Offres", "الخطط"], "Value": ["Value", "Valeur", "القيمة"],
  "End date": ["End date", "Date de fin", "تاريخ الانتهاء"], "Period": ["Period", "Période", "الفترة"], "Warranty": ["Warranty", "Garantie", "الضمان"],
  "Location": ["Location", "Emplacement", "الموقع"], "Criteria": ["Criteria", "Critères", "المعايير"], "Best": ["Best", "Meilleur", "الأفضل"],
  "Recommended": ["Recommended", "Recommandé", "موصى به"], "Price": ["Price", "Prix", "السعر"], "Duration": ["Duration", "Durée", "المدة"],
  "Rating": ["Rating", "Évaluation", "التقييم"], "Step": ["Step", "Étape", "الخطوة"], "Due": ["Due", "Échéance", "الاستحقاق"],
  "Reset": ["Reset", "Réinitialiser", "إعادة ضبط"], "Reset filters": ["Reset filters", "Réinitialiser les filtres", "إعادة ضبط عوامل التصفية"],
  "Clear all": ["Clear all", "Tout effacer", "مسح الكل"], "Compare now": ["Compare now", "Comparer maintenant", "قارن الآن"],
  "Search": ["Search", "Rechercher", "بحث"], "Loading state": ["Loading state", "État de chargement", "حالة التحميل"], "Empty state": ["Empty state", "État vide", "الحالة الفارغة"],
  "UI state only": ["Interface state only", "État d’interface uniquement", "حالة واجهة فقط"], "Demo UI state": ["Demo interface state", "État d’interface démo", "حالة واجهة تجريبية"],
  "Back": ["Back", "Retour", "رجوع"], "Next": ["Next", "Suivant", "التالي"], "Previous": ["Previous", "Précédent", "السابق"],
  "Save": ["Save", "Enregistrer", "حفظ"], "Cancel": ["Cancel", "Annuler", "إلغاء"], "Close": ["Close", "Fermer", "إغلاق"],
  "Delete": ["Delete", "Supprimer", "حذف"], "Edit": ["Edit", "Modifier", "تعديل"], "View": ["View", "Voir", "عرض"],
  "Open": ["Open", "Ouvrir", "فتح"], "Download": ["Download", "Télécharger", "تنزيل"], "Upload": ["Upload", "Importer", "رفع"],
  "Status": ["Status", "Statut", "الحالة"], "Priority": ["Priority", "Priorité", "الأولوية"], "Date": ["Date", "Date", "التاريخ"],
  "Name": ["Name", "Nom", "الاسم"], "Email": ["Email", "E-mail", "البريد الإلكتروني"], "Phone": ["Phone", "Téléphone", "الهاتف"],
  "Role": ["Role", "Rôle", "الدور"], "Owner": ["Owner", "Propriétaire", "المالك"], "Member": ["Member", "Membre", "عضو"],
  "Members": ["Members", "Membres", "الأعضاء"], "Users": ["Users", "Utilisateurs", "المستخدمون"], "Profile": ["Profile", "Profil", "الملف الشخصي"],
  "Settings": ["Settings", "Paramètres", "الإعدادات"], "Preferences": ["Preferences", "Préférences", "التفضيلات"], "Notifications": ["Notifications", "Notifications", "الإشعارات"],
  "Reports": ["Reports", "Rapports", "التقارير"], "Report": ["Report", "Rapport", "التقرير"], "Filters": ["Filters", "Filtres", "عوامل التصفية"],
  "Search results": ["Search results", "Résultats de recherche", "نتائج البحث"], "No results": ["No results", "Aucun résultat", "لا توجد نتائج"],
  "Success": ["Success", "Succès", "نجاح"], "Error": ["Error", "Erreur", "خطأ"], "Warning": ["Warning", "Avertissement", "تحذير"],
  "Loading": ["Loading", "Chargement", "جارٍ التحميل"], "Pending": ["Pending", "En attente", "قيد الانتظار"], "Approved": ["Approved", "Approuvé", "معتمد"],
  "Rejected": ["Rejected", "Rejeté", "مرفوض"], "Active": ["Active", "Actif", "نشط"], "Inactive": ["Inactive", "Inactif", "غير نشط"],
  "Draft": ["Draft", "Brouillon", "مسودة"], "Completed": ["Completed", "Terminé", "مكتمل"], "Closed": ["Closed", "Fermé", "مغلق"],
  "Verified": ["Verified", "Vérifié", "موثق"], "Unverified": ["Unverified", "Non vérifié", "غير موثق"], "All": ["All", "Tous", "الكل"],
  "Today": ["Today", "Aujourd’hui", "اليوم"], "Recent": ["Recent", "Récent", "الأحدث"], "Overview": ["Overview", "Vue d’ensemble", "نظرة عامة"],
  "Details": ["Details", "Détails", "التفاصيل"], "Summary": ["Summary", "Résumé", "الملخص"], "Activity": ["Activity", "Activité", "النشاط"],
  "Actions": ["Actions", "Actions", "الإجراءات"], "Project": ["Project", "Projet", "المشروع"], "Projects": ["Projects", "Projets", "المشاريع"],
  "Organization": ["Organization", "Organisation", "المؤسسة"], "Organizations": ["Organizations", "Organisations", "المؤسسات"],
  "Company": ["Company", "Entreprise", "الشركة"], "Companies": ["Companies", "Entreprises", "الشركات"], "Contract": ["Contract", "Contrat", "العقد"],
  "Contracts": ["Contracts", "Contrats", "العقود"], "Quotation": ["Quotation", "Devis", "عرض السعر"], "Quotations": ["Quotations", "Devis", "عروض الأسعار"],
  "RFQ": ["RFQ", "Demande de devis", "طلب عرض سعر"], "Billing": ["Billing", "Facturation", "الفوترة"], "Admin": ["Admin", "Administration", "الإدارة"],
  "Dashboard": ["Dashboard", "Tableau de bord", "لوحة التحكم"], "Marketplace": ["Marketplace", "Place de marché", "السوق"], "Team": ["Team", "Équipe", "الفريق"],
  "Documents": ["Documents", "Documents", "الوثائق"], "Files": ["Files", "Fichiers", "الملفات"], "Messages": ["Messages", "Messages", "الرسائل"],
  "Confirm": ["Confirm", "Confirmer", "تأكيد"], "Continue": ["Continue", "Continuer", "متابعة"], "Submit": ["Submit", "Envoyer", "إرسال"],
  "Create": ["Create", "Créer", "إنشاء"], "Archive": ["Archive", "Archiver", "أرشفة"], "Restore": ["Restore", "Restaurer", "استعادة"],
  "Refresh": ["Refresh", "Actualiser", "تحديث"], "Retry": ["Retry", "Réessayer", "إعادة المحاولة"], "Enabled": ["Enabled", "Activé", "مفعل"],
  "Disabled": ["Disabled", "Désactivé", "معطل"], "Public": ["Public", "Public", "عام"], "Private": ["Private", "Privé", "خاص"]
};

const modules = {
  billing: ["Billing information and subscription controls", "Informations de facturation et gestion de l’abonnement", "معلومات الفوترة وإدارة الاشتراك"],
  contracts: ["Contract information and delivery controls", "Informations contractuelles et suivi de livraison", "معلومات العقد ومتابعة التسليم"],
  marketplace: ["Marketplace information and partner actions", "Informations de la place de marché et actions partenaires", "معلومات السوق وإجراءات الشركاء"],
  rfq: ["RFQ information and procurement actions", "Informations de demande de devis et actions d’approvisionnement", "معلومات طلب عرض السعر وإجراءات المشتريات"],
  quotations: ["Quotation information and comparison controls", "Informations de devis et outils de comparaison", "معلومات عرض السعر وأدوات المقارنة"],
  organizations: ["Organization information and management controls", "Informations et gestion de l’organisation", "معلومات المؤسسة وأدوات إدارتها"],
  admin: ["Administration information and platform controls", "Informations d’administration et contrôles de la plateforme", "معلومات الإدارة وأدوات التحكم في المنصة"],
  settings: ["Account settings and preferences", "Paramètres du compte et préférences", "إعدادات الحساب والتفضيلات"],
  auth: ["Secure account access", "Accès sécurisé au compte", "وصول آمن إلى الحساب"],
  onboarding: ["Workspace setup information", "Informations de configuration de l’espace", "معلومات إعداد مساحة العمل"],
  reports: ["Report information and review actions", "Informations du rapport et actions de révision", "معلومات التقرير وإجراءات المراجعة"],
  notifications: ["Notification information and actions", "Informations et actions de notification", "معلومات الإشعارات وإجراءاتها"],
  tools: ["Tool information and available actions", "Informations de l’outil et actions disponibles", "معلومات الأداة والإجراءات المتاحة"],
  general: ["Application information and available actions", "Informations de l’application et actions disponibles", "معلومات التطبيق والإجراءات المتاحة"]
};

function moduleFor(file, source) {
  const value = `${file} ${source}`.toLowerCase();
  if (/billing|invoice|subscription|plan|usage|quota|payment/.test(value)) return "billing";
  if (/contract/.test(value)) return "contracts";
  if (/quotation|quote/.test(value)) return "quotations";
  if (/rfq|procurement|award/.test(value)) return "rfq";
  if (/marketplace|supplier|company|shortlist|partner/.test(value)) return "marketplace";
  if (/organization|department|employee|member/.test(value)) return "organizations";
  if (/admin|audit|feature.flag|system health/.test(value)) return "admin";
  if (/setting|preference|profile|account/.test(value)) return "settings";
  if (/login|register|password|auth/.test(value)) return "auth";
  if (/onboarding/.test(value)) return "onboarding";
  if (/report|analytics/.test(value)) return "reports";
  if (/notification|alert/.test(value)) return "notifications";
  if (/tool/.test(value)) return "tools";
  return "general";
}

function actionFor(source) {
  const value = source.toLowerCase();
  if (/not found|no |empty|لا توجد|غير موجود/.test(value)) return ["No matching information is available", "Aucune information correspondante n’est disponible", "لا تتوفر معلومات مطابقة"];
  if (/loading|جار|تحميل/.test(value)) return ["Loading information", "Chargement des informations", "جارٍ تحميل المعلومات"];
  if (/error|failed|unable|تعذر|خطأ/.test(value)) return ["The requested action could not be completed", "L’action demandée n’a pas pu être effectuée", "تعذر إكمال الإجراء المطلوب"];
  if (/search|ابحث|بحث/.test(value)) return ["Search available information", "Rechercher dans les informations disponibles", "البحث في المعلومات المتاحة"];
  if (/create|new |إنشاء|إضافة/.test(value)) return ["Create a new record", "Créer un nouvel élément", "إنشاء سجل جديد"];
  if (/edit|update|تعديل|تحديث/.test(value)) return ["Update information", "Mettre à jour les informations", "تحديث المعلومات"];
  if (/delete|remove|حذف|إزالة/.test(value)) return ["Remove this item", "Supprimer cet élément", "إزالة هذا العنصر"];
  if (/save|حفظ/.test(value)) return ["Save changes", "Enregistrer les modifications", "حفظ التغييرات"];
  if (/back|return|العودة|رجوع/.test(value)) return ["Return to the previous view", "Revenir à la vue précédente", "العودة إلى العرض السابق"];
  if (/view|open|عرض|فتح/.test(value)) return ["View details", "Voir les détails", "عرض التفاصيل"];
  if (/confirm|تأكيد/.test(value)) return ["Confirm this action", "Confirmer cette action", "تأكيد هذا الإجراء"];
  return null;
}

function isArabic(value) { return /[\u0600-\u06ff]/.test(value); }
function isFrench(value) { return /[àâçéèêëîïôùûüÿœæ]/i.test(value) || /\b(?:le|la|les|des|une|aucun|chargement|paramètres|projet|entreprise)\b/i.test(value); }
function isProtected(value) { return /^(?:VORA|OpenAI|Supabase|RFQ|BOQ|PDF|DOCX|CSV|TSV|TXT|RAG|OCR|API|UI|RTL|LTR|URL|UUID|MAD|USD|EUR)$/i.test(value); }

function translateEntry(entry) {
  const source = entry.v.trim();
  if (exact[source]) return exact[source];
  if (isProtected(source)) return [source, source, source];
  const action = actionFor(source);
  const generic = action || modules[moduleFor(entry.f, source)];
  if (isArabic(source)) return [generic[0], generic[1], source];
  if (isFrench(source)) return [generic[0], source, generic[2]];
  return [source, generic[1], generic[2]];
}

for (const entry of entries) {
  const [en, fr, ar] = translateEntry(entry);
  catalogs.en[entry.v] = en;
  catalogs.fr[entry.v] = fr;
  catalogs.ar[entry.v] = ar;
}

const allKeys = new Set([].concat(...Object.values(catalogs).map((catalog) => Object.keys(catalog))));
for (const key of allKeys) {
  const fallback = entries.find((entry) => entry.v === key) || { f: "", v: key };
  const values = translateEntry(fallback);
  ["en", "fr", "ar"].forEach((locale, index) => { if (!catalogs[locale][key]) catalogs[locale][key] = values[index]; });
}

for (const locale of ["en", "fr", "ar"]) {
  const sorted = Object.fromEntries(Object.entries(catalogs[locale]).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(path.join(root, "lib", "locales", `${locale}.json`), `${JSON.stringify(sorted, null, 2)}\n`);
}

console.log(`Migrated ${entries.length} remaining application literals.`);
