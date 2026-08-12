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
    name: "all application JSX literals resolve through every offline catalog",
    run: () => {
      const collectFiles = (directory: string): string[] => fs.readdirSync(path.join(process.cwd(), directory), { withFileTypes: true }).flatMap((entry) => {
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) return collectFiles(relative);
        return entry.isFile() && relative.endsWith(".tsx") ? [relative.replace(/\\/g, "/")] : [];
      });
      const files = [...collectFiles("app"), ...collectFiles("components")];
      const keys = files.flatMap((file) => collectVisibleLiterals(file));
      assert(keys.length > 0, "No application JSX literals were found");
      new Set(keys).forEach((key) => {
        assert(Boolean(arCatalog[key as keyof typeof arCatalog]), `Missing Arabic application translation: ${key}`);
        assert(Boolean(frCatalog[key as keyof typeof frCatalog]), `Missing French application translation: ${key}`);
        assert(Boolean(enCatalog[key as keyof typeof enCatalog]), `Missing English application translation: ${key}`);
      });
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
      const values = ["Open", "Draft", "Pending", "Approved", "Rejected", "Planning", "Execution", "High", "Medium", "Low"];
      const catalogs = { ar: arCatalog, fr: frCatalog, en: enCatalog } as const;
      values.forEach((value) => locales.forEach((locale) => {
        const translated = translateUiText(value, locale);
        assert(Boolean(translated.trim()), `Empty ${locale} translation for ${value}`);
        assert(translated === catalogs[locale][value as keyof typeof arCatalog], `Incorrect ${locale} system value: ${value}`);
      }));
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
