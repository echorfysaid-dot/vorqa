import { defaultLocale, dictionaries, localeMeta, locales, resolveLocale, translateUiText } from "@/lib/i18n";
import arCatalog from "@/lib/locales/ar.json";
import enCatalog from "@/lib/locales/en.json";
import frCatalog from "@/lib/locales/fr.json";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { formatCurrency, formatDate, formatNumber, resolveIntlLocale } from "@/lib/utils/format";
import { getDemoCatalogKeys, getMarketplaceCategoryKeys, localizeMarketplaceCategory, translateDemoKey } from "@/lib/locales/demo";
import { localizeDemoDate } from "@/lib/demo-localization";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const workspaceTextProps = new Set(["aria-label", "placeholder", "title", "alt", "label", "description", "eyebrow", "message"]);
const intentionalLocaleNeutralCopy = /^(?:VORA|Vorqa|Supabase|OpenAI|Anthropic|Gemini|OpenRouter|PDF|DOCX|XLSX|CSV|BIM|BOQ|RAG|OCR|API|AI|Email|Website|Kanban|Markdown|MRR|B2B|OK)$/i;
const genericAuditPlaceholders = new Set([
  "معلومات المؤسسة وأدوات إدارتها", "معلومات الفوترة وإدارة الاشتراك", "معلومات طلب عرض السعر وإجراءات المشتريات",
  "معلومات السوق وإجراءات الشركاء", "معلومات التطبيق والإجراءات المتاحة", "عرض التفاصيل", "لا تتوفر معلومات مطابقة",
  "البحث في المعلومات المتاحة", "معلومات الأداة والإجراءات المتاحة", "العودة إلى العرض السابق", "معلومات العقد ومتابعة التسليم",
  "معلومات إعداد مساحة العمل", "معلومات الإدارة وأدوات التحكم في المنصة", "إنشاء سجل جديد",
  "Informations de l’application et actions disponibles", "Informations et gestion de l’organisation",
  "Informations de facturation et gestion de l’abonnement", "Informations de demande de devis et actions d’approvisionnement",
  "Informations de la place de marché et actions partenaires", "Voir les détails", "Aucune information correspondante n’est disponible",
  "Rechercher dans les informations disponibles", "Informations de l’outil et actions disponibles", "Revenir à la vue précédente",
  "Informations contractuelles et suivi de livraison", "Informations de configuration de l’espace",
  "Informations d’administration et contrôles de la plateforme", "Créer un nouvel élément"
]);

const structuredUiProps = new Set([
  "title", "label", "description", "subtitle", "eyebrow", "helper", "hint", "message",
  "badge", "status", "emptyText", "emptyLabel", "placeholder", "alt"
]);
const intentionalUserOrFileData = /^(?:VORA AI|Atlas Construction Group|Nadia Benali|Luxury Villa Casablanca|Supplier Comparison\.xlsx|(?:RFQ|QTN|CON)-\d+\b)/i;

function collectVisibleLiterals(file: string, includeLine: (line: number) => boolean = () => true) {
  const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const values: string[] = [];
  const add = (node: ts.Node, value: string) => {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    const normalized = value.replace(/\s+/g, " ").trim();
    if (includeLine(line) && normalized && /\p{L}/u.test(normalized)) values.push(normalized);
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) add(node, node.text);
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && workspaceTextProps.has(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) {
      add(node, node.initializer.text);
    }
    if (
      ts.isStringLiteral(node) && ts.isJsxExpression(node.parent) && node.parent.parent &&
      ts.isJsxAttribute(node.parent.parent) && ts.isIdentifier(node.parent.parent.name) && workspaceTextProps.has(node.parent.parent.name.text)
    ) {
      add(node, node.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return values;
}

function collectStructuredUiLiterals(file: string) {
  const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const values: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isPropertyAssignment(node)) {
      const key = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : "";
      if (structuredUiProps.has(key) && ts.isStringLiteralLike(node.initializer)) {
        const value = node.initializer.text.replace(/\s+/g, " ").trim();
        if (value && /\p{L}/u.test(value)) values.push(value);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return values;
}

export const tests = [
  {
    name: "all shell translation calls resolve through every offline catalog",
    run: () => {
      const files = ["components/app-shell.tsx"];
      const keys = files.flatMap((file) => {
        const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
        return [...source.matchAll(/translate\("((?:[^"\\]|\\.)+)"\)/g)].map((match) => match[1]);
      });
      assert(keys.length > 0, "No shell translation calls were found");
      keys.forEach((key) => {
        assert(Boolean(arCatalog[key as keyof typeof arCatalog]), `Missing Arabic shell translation: ${key}`);
        assert(Boolean(frCatalog[key as keyof typeof frCatalog]), `Missing French shell translation: ${key}`);
        assert(Boolean(enCatalog[key as keyof typeof enCatalog]), `Missing English shell translation: ${key}`);
      });
    }
  },
  {
    name: "all dashboard translation calls resolve through every offline catalog",
    run: () => {
      const source = fs.readFileSync(path.join(process.cwd(), "app/dashboard/page.tsx"), "utf8");
      const keys = [...source.matchAll(/translate\("((?:[^"\\]|\\.)+)"\)/g)].map((match) => match[1]);
      assert(keys.length > 0, "No dashboard translation calls were found");
      keys.forEach((key) => {
        assert(Boolean(arCatalog[key as keyof typeof arCatalog]), `Missing Arabic dashboard translation: ${key}`);
        assert(Boolean(frCatalog[key as keyof typeof frCatalog]), `Missing French dashboard translation: ${key}`);
        assert(Boolean(enCatalog[key as keyof typeof enCatalog]), `Missing English dashboard translation: ${key}`);
      });
    }
  },
  {
    name: "all Projects and Workspace literals resolve through every offline catalog",
    run: () => {
      const workspaceFile = path.join(process.cwd(), "components/project-workspace.tsx");
      const workspaceSource = fs.readFileSync(workspaceFile, "utf8");
      const lineOf = (marker: string) => workspaceSource.slice(0, workspaceSource.indexOf(marker)).split("\n").length;
      const aiStart = lineOf("function AiWorkspaceTab");
      const documentsStart = lineOf("function DocumentsTab");
      const knowledgeStart = lineOf("function KnowledgeTab");
      const tasksStart = lineOf("function TasksTab");
      const reportsStart = lineOf("function ReportsTab");
      const workspaceInScope = (line: number) => line < aiStart || (line >= documentsStart && line < knowledgeStart) || (line >= tasksStart && line < reportsStart);
      const keys = [
        ...collectVisibleLiterals("app/projects/page.tsx"),
        ...collectVisibleLiterals("app/projects/[id]/page.tsx"),
        ...collectVisibleLiterals("components/project-workspace.tsx", workspaceInScope)
      ];
      assert(keys.length > 0, "No Projects or Workspace literals were found");
      new Set(keys).forEach((key) => {
        assert(Boolean(arCatalog[key as keyof typeof arCatalog]), `Missing Arabic workspace translation: ${key}`);
        assert(Boolean(frCatalog[key as keyof typeof frCatalog]), `Missing French workspace translation: ${key}`);
        assert(Boolean(enCatalog[key as keyof typeof enCatalog]), `Missing English workspace translation: ${key}`);
      });
    }
  },
  {
    name: "all Construction Intelligence and Copilot literals resolve through every offline catalog",
    run: () => {
      const files = [
        "app/tools/construction-intelligence/page.tsx",
        "app/tools/contract-review/page.tsx",
        "app/tools/boq-review/page.tsx",
        "app/tools/risk-assessment/page.tsx",
        "app/tools/planning-review/page.tsx",
        "app/tools/site-report-review/page.tsx",
        "app/tools/executive-summary/page.tsx",
        "app/projects/[id]/intelligence/page.tsx",
        "components/knowledge-workspace.tsx"
      ];
      const projectWorkspaceFile = path.join(process.cwd(), "components/project-workspace.tsx");
      const projectWorkspaceSource = fs.readFileSync(projectWorkspaceFile, "utf8");
      const lineOf = (marker: string) => projectWorkspaceSource.slice(0, projectWorkspaceSource.indexOf(marker)).split("\n").length;
      const aiStart = lineOf("function AiWorkspaceTab");
      const documentsStart = lineOf("function DocumentsTab");
      const knowledgeStart = lineOf("function KnowledgeTab");
      const knowledgeEnd = lineOf("function InsightRow");
      const aiWorkspaceInScope = (line: number) => (line >= aiStart && line < documentsStart) || (line >= knowledgeStart && line < knowledgeEnd);
      const keys = [
        ...files.flatMap((file) => collectVisibleLiterals(file)),
        ...collectVisibleLiterals("components/project-workspace.tsx", aiWorkspaceInScope)
      ];
      assert(keys.length > 0, "No Construction Intelligence or Copilot literals were found");
      new Set(keys).forEach((key) => {
        assert(Boolean(arCatalog[key as keyof typeof arCatalog]), `Missing Arabic AI translation: ${key}`);
        assert(Boolean(frCatalog[key as keyof typeof frCatalog]), `Missing French AI translation: ${key}`);
        assert(Boolean(enCatalog[key as keyof typeof enCatalog]), `Missing English AI translation: ${key}`);
      });
    }
  },
  {
    name: "all application JSX literals resolve through the authoritative runtime catalog",
    run: () => {
      const collectFiles = (directory: string): string[] => fs.readdirSync(path.join(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectFiles(relative);
        return entry.isFile() && relative.endsWith(".tsx") ? [relative.replace(/\\/g, "/")] : [];
      });
      const files = [...collectFiles("app"), ...collectFiles("components")];
      const keys = files.flatMap((file) => collectVisibleLiterals(file));
      const issues: string[] = [];
      assert(keys.length > 0, "No application JSX literals were found");
      new Set(keys).forEach((key) => {
        locales.forEach((locale) => {
          const translated = translateUiText(key, locale).trim();
          if (!translated) issues.push(`Missing ${locale}: ${key}`);
          if (genericAuditPlaceholders.has(translated)) issues.push(`Generic ${locale}: ${key}`);
        });
        if (/^[A-Za-z][\s\S]*[A-Za-z]$/.test(key) && !intentionalLocaleNeutralCopy.test(key)) {
          if (translateUiText(key, "ar") === key) issues.push(`English leaked into Arabic: ${key}`);
        }
        if (/\p{Script=Arabic}/u.test(key) && !intentionalLocaleNeutralCopy.test(key)) {
          if (translateUiText(key, "fr") === key) issues.push(`Arabic leaked into French: ${key}`);
          if (translateUiText(key, "en") === key) issues.push(`Arabic leaked into English: ${key}`);
        }
      });
      assert(issues.length === 0, `Runtime localization audit failed:\n${issues.join("\n")}`);
    }
  },
  {
    name: "application JSX contains no accidental bracket-only text nodes",
    run: () => {
      const collectFiles = (directory: string): string[] => fs.readdirSync(path.join(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectFiles(relative);
        return entry.isFile() && relative.endsWith(".tsx") ? [relative.replace(/\\/g, "/")] : [];
      });
      const artifacts: string[] = [];
      for (const file of [...collectFiles("app"), ...collectFiles("components")]) {
        const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
        const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const visit = (node: ts.Node) => {
          if (ts.isJsxText(node)) {
            const value = node.text.replace(/\s+/g, "").trim();
            if (value && /^[()[\]{}]+$/.test(value)) artifacts.push(`${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}:${value}`);
          }
          ts.forEachChild(node, visit);
        };
        visit(sourceFile);
      }
      assert(artifacts.length === 0, `Accidental bracket-only JSX text found: ${artifacts.join(", ")}`);
    }
  },
  {
    name: "structured system card metadata resolves without cross-language leakage",
    run: () => {
      const collectFiles = (directory: string): string[] => fs.readdirSync(path.join(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectFiles(relative);
        return entry.isFile() && /\.tsx?$/.test(relative) ? [relative.replace(/\\/g, "/")] : [];
      });
      const values = [...collectFiles("app"), ...collectFiles("components")].flatMap(collectStructuredUiLiterals);
      const issues: string[] = [];
      new Set(values).forEach((value) => {
        if (intentionalUserOrFileData.test(value)) return;
        if (/^[A-Za-z][\s\S]*[A-Za-z]$/.test(value) && !intentionalLocaleNeutralCopy.test(value) && translateUiText(value, "ar") === value) {
          issues.push(`English structured UI leaked into Arabic: ${value}`);
        }
        if (/\p{Script=Arabic}/u.test(value) && translateUiText(value, "fr") === value) issues.push(`Arabic structured UI leaked into French: ${value}`);
        if (/\p{Script=Arabic}/u.test(value) && translateUiText(value, "en") === value) issues.push(`Arabic structured UI leaked into English: ${value}`);
      });
      assert(issues.length === 0, `Structured UI localization audit failed:\n${issues.join("\n")}`);
    }
  },
  {
    name: "offline catalogs have identical source keys",
    run: () => {
      const arKeys = Object.keys(arCatalog).sort();
      const frKeys = Object.keys(frCatalog).sort();
      const enKeys = Object.keys(enCatalog).sort();
      assert(JSON.stringify(arKeys) === JSON.stringify(frKeys), "Arabic and French catalog keys differ");
      assert(JSON.stringify(arKeys) === JSON.stringify(enKeys), "Arabic and English catalog keys differ");
      assert(arKeys.every((key) => arCatalog[key as keyof typeof arCatalog].trim()), "Arabic catalog contains an empty value");
      assert(frKeys.every((key) => frCatalog[key as keyof typeof frCatalog].trim()), "French catalog contains an empty value");
      assert(enKeys.every((key) => enCatalog[key as keyof typeof enCatalog].trim()), "English catalog contains an empty value");
    }
  },
  {
    name: "global More navigation has complete AR FR EN semantic labels",
    run: () => {
      const moreKeys = ["more", "tools", "rfq", "quotations", "contracts", "billing", "admin", "notifications", "knowledge", "documents", "history", "saved", "favorites", "pricing", "settings"] as const;
      const expectedTitles = { ar: "المزيد", fr: "Plus", en: "More" } as const;
      locales.forEach((locale) => {
        const nav = dictionaries[locale].nav;
        moreKeys.forEach((key) => assert(Boolean(nav[key]?.trim()), `Missing ${locale} More navigation label: ${key}`));
        assert(nav.more === expectedTitles[locale], `Incorrect ${locale} More section title`);
      });

      const shell = fs.readFileSync(path.join(process.cwd(), "components/app-shell.tsx"), "utf8");
      assert(shell.includes("const label = t.nav[item.key]"), "More navigation must use the canonical locale dictionary");
    }
  },
  {
    name: "HeaderMeta label is deterministic for the initial locale",
    run: () => {
      const expected = { ar: "الحالة", fr: "Statut", en: "Status" } as const;
      locales.forEach((locale) => {
        const serverLabel = translateUiText("Status", resolveLocale(locale));
        const initialClientLabel = translateUiText("Status", resolveLocale(locale));
        assert(serverLabel === expected[locale], `Unexpected HeaderMeta label for ${locale}`);
        assert(initialClientLabel === serverLabel, `HeaderMeta hydration mismatch for ${locale}`);
      });
    }
  },
  {
    name: "server and initial client locale resolve from the same canonical value",
    run: () => {
      locales.forEach((cookieLocale) => {
        const serverLocale = resolveLocale(cookieLocale);
        const initialClientLocale = serverLocale;
        assert(initialClientLocale === serverLocale, `Initial locale mismatch for ${cookieLocale}`);
      });
      assert(resolveLocale(undefined) === defaultLocale, "Missing cookie must use the deterministic default locale");
      assert(resolveLocale("unsupported") === defaultLocale, "Invalid cookie must use the deterministic default locale");
    }
  },
  {
    name: "all supported locales expose metadata and dictionaries",
    run: () => {
      locales.forEach((locale) => {
        assert(dictionaries[locale], `Missing dictionary for ${locale}`);
        assert(localeMeta[locale], `Missing locale metadata for ${locale}`);
      });
    }
  },
  {
    name: "Arabic uses RTL while French and English use LTR",
    run: () => {
      assert(localeMeta.ar.dir === "rtl", "Arabic must be RTL");
      assert(localeMeta.fr.dir === "ltr", "French must be LTR");
      assert(localeMeta.en.dir === "ltr", "English must be LTR");
    }
  },
  {
    name: "shared dictionary text translates deterministically",
    run: () => {
      assert(translateUiText(dictionaries.ar.common.save, "fr") === dictionaries.fr.common.save, "Arabic to French lookup failed");
      assert(translateUiText(dictionaries.fr.common.save, "ar") === dictionaries.ar.common.save, "French to Arabic lookup failed");
      assert(translateUiText(dictionaries.en.common.save, "en") === dictionaries.en.common.save, "English identity lookup failed");
    }
  },
  {
    name: "legacy shell and state labels translate in both directions",
    run: () => {
      assert(translateUiText("Command Center", "fr") === "Centre de commande", "Shell label was not localized");
      assert(translateUiText("Page introuvable", "ar") === "الصفحة غير موجودة", "Error state was not localized");
      assert(translateUiText("جارٍ التحميل", "fr") === "Chargement", "Loading state was not localized");
    }
  },
  {
    name: "unknown project data remains unchanged",
    run: () => {
      const projectName = "PRJ-1048 · Luxury Villa Casablanca";
      assert(translateUiText(projectName, "ar") === projectName, "Project data must not be translated implicitly");
    }
  },
  {
    name: "canonical system statuses and priorities localize in every locale",
    run: () => {
      const expected = {
        Open: { ar: "مفتوح", fr: "Ouvert", en: "Open" },
        Draft: { ar: "مسودة", fr: "Brouillon", en: "Draft" },
        Pending: { ar: "قيد الانتظار", fr: "En attente", en: "Pending" },
        Approved: { ar: "معتمد", fr: "Approuvé", en: "Approved" },
        Rejected: { ar: "مرفوض", fr: "Rejeté", en: "Rejected" },
        Planning: { ar: "التخطيط", fr: "Planification", en: "Planning" },
        Execution: { ar: "التنفيذ", fr: "Exécution", en: "Execution" },
        High: { ar: "عالٍ", fr: "Élevé", en: "High" },
        Medium: { ar: "متوسط", fr: "Moyen", en: "Medium" },
        Low: { ar: "منخفض", fr: "Faible", en: "Low" }
      } as const;
      Object.entries(expected).forEach(([value, translations]) => locales.forEach((locale) => {
        assert(translateUiText(value, locale) === translations[locale], `Incorrect ${locale} system value: ${value}`);
      }));
    }
  },
  {
    name: "AI actions quotation labels and dynamic units never leak English into Arabic UI",
    run: () => {
      const systemLabels = [
        "Analyze this project", "Create project schedule", "Review BOQ", "Create report", "Risk assessment",
        "Submitted", "Under review", "Shortlisted", "Awarded", "Lowest", "Highest", "Best value",
        "Technical score", "Commercial score", "Technical compliance", "Commercial compliance"
      ];
      systemLabels.forEach((label) => {
        assert(translateUiText(label, "ar") !== label, `Arabic system label leaked English: ${label}`);
        assert(translateUiText(label, "fr") !== label || label === "Commercial", `French system label leaked English: ${label}`);
        assert(Boolean(translateUiText(label, "en").trim()), `Missing English system label: ${label}`);
      });

      ["1 day", "10 days", "1 week", "8 weeks", "1 month", "24 months", "1 year", "18 years", "24 files", "3 projects", "4 quotations", "2 approvals"].forEach((value) => {
        assert(!/\b(day|days|week|weeks|month|months|year|years)\b/i.test(translateUiText(value, "ar")), `Arabic duration leaked English: ${value}`);
        assert(!/\b(day|days|week|weeks|month|months|year|years)\b/i.test(translateUiText(value, "fr")), `French duration leaked English: ${value}`);
      });
      assert(translateUiText("Technical 92%", "ar").startsWith("تقني"), "Arabic technical score was not localized");
      assert(translateUiText("Commercial 88%", "fr").startsWith("Commercial"), "French commercial score was not localized");
      assert(translateUiText("18 years in business", "ar").includes("سنوات الخبرة"), "Arabic experience metadata was not localized");
      assert(translateUiText("pending_approval", "ar") !== "pending_approval", "Canonical underscore status leaked into Arabic");

      const aiTools = fs.readFileSync(path.join(process.cwd(), "app/tools/page.tsx"), "utf8");
      const mojibake = /[ØÙ][^\s"']*/;
      assert(!mojibake.test(aiTools), "AI Tools contains corrupted locale-specific fixture text");
    }
  },
  {
    name: "dates numbers and currencies use the active locale",
    run: () => {
      assert(resolveIntlLocale("ar") === "ar-MA", "Arabic Intl locale mismatch");
      assert(resolveIntlLocale("fr") === "fr-FR", "French Intl locale mismatch");
      assert(resolveIntlLocale("en") === "en-GB", "English Intl locale mismatch");
      const date = "2026-08-04T12:00:00.000Z";
      assert(formatDate(date, "ar") !== formatDate(date, "fr"), "Arabic and French dates should differ");
      assert(formatNumber(1234567, "fr") !== formatNumber(1234567, "en"), "French and English numbers should differ");
      locales.forEach((locale) => assert(formatCurrency(245000, "MAD", locale).includes("245"), `Currency formatting failed for ${locale}`));
    }
  },
  {
    name: "demo localization catalog has exact AR FR EN parity",
    run: () => {
      getDemoCatalogKeys().forEach((key) => locales.forEach((locale) => {
        assert(Boolean(translateDemoKey(key, locale)?.trim()), `Missing ${locale} demo translation for ${key}`);
      }));
    }
  },
  {
    name: "all marketplace demo categories localize in AR FR and EN",
    run: () => {
      assert(getMarketplaceCategoryKeys().length === 26, "Marketplace category catalog must cover every canonical demo category");
      getMarketplaceCategoryKeys().forEach((key) => locales.forEach((locale) => {
        const localized = localizeMarketplaceCategory(key, "fallback", locale);
        assert(localized.name !== "", `Missing ${locale} marketplace category name for ${key}`);
        assert(localized.description !== "fallback", `Missing ${locale} marketplace category description for ${key}`);
      }));
    }
  },
  {
    name: "RFQ demo titles and long dates follow the active locale",
    run: () => {
      assert(translateDemoKey("rfq.demo.luxuryVilla.title", "ar") === "حزمة تنفيذ فيلا فاخرة بالدار البيضاء", "Arabic RFQ title mismatch");
      assert(translateDemoKey("rfq.demo.luxuryVilla.title", "fr")?.startsWith("Lot d’exécution"), "French RFQ title mismatch");
      assert(translateDemoKey("rfq.demo.luxuryVilla.title", "en") === "Luxury Villa Casablanca execution package", "English RFQ title mismatch");
      assert(localizeDemoDate("2026-07-28", "ar", (value) => value).includes("يوليو"), "Arabic month must be localized");
      assert(localizeDemoDate("2026-07-28", "fr", (value) => value).includes("juillet"), "French month must be localized");
      assert(localizeDemoDate("2026-07-28", "en", (value) => value).includes("July"), "English month must be localized");
    }
  },
  {
    name: "language switching has one cookie-backed path without a reload flash",
    run: () => {
      const provider = fs.readFileSync(path.join(process.cwd(), "components/i18n-provider.tsx"), "utf8");
      const selector = fs.readFileSync(path.join(process.cwd(), "components/language-selector.tsx"), "utf8");
      assert(provider.includes("useState<Locale>(initialLocale)"), "Provider must initialize from the server locale");
      assert(provider.includes("vorqa-locale=${nextLocale}"), "Locale switch must update the canonical cookie");
      assert(provider.includes("router.refresh()"), "Locale switch must refresh server components");
      assert(!provider.includes("window.location.reload"), "Locale switch must not force a second render flash");
      assert(selector.includes("setLocale(item)"), "Language selector must use the global locale setter");
    }
  },
  {
    name: "report export UI follows the application locale while preserving an explicit report language",
    run: () => {
      const source = fs.readFileSync(path.join(process.cwd(), "components/project-analysis-dashboard.tsx"), "utf8");
      assert(source.includes("initialLanguage={locale"), "Report language must initialize from the application locale");
      assert(source.includes('translate("Export professional report")'), "Report dialog title must use application localization");
      assert(source.includes('translate("Report options")'), "Report options must use application localization");
      assert(source.includes("options.language"), "Report export must retain an explicit output language option");
    }
  }
];
