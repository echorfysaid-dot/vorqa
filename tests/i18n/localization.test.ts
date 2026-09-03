import { defaultLocale, dictionaries, localeMeta, locales, resolveLocale, translateUiText } from "@/lib/i18n";
import arCatalog from "@/lib/locales/ar.json";
import enCatalog from "@/lib/locales/en.json";
import frCatalog from "@/lib/locales/fr.json";
import { projectLifecycleMessages, projectLifecycleTranslationCatalog } from "@/lib/locales/project-lifecycle";
import { projectStageGateMessages, projectStageGateTranslationCatalog } from "@/lib/locales/project-stage-gate";
import { projectWorkflowTranslationCatalog } from "@/lib/locales/project-workflow";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

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
    name: "RFQ command center and filters localize without changing canonical filter values",
    run: () => {
      const values = [
        "Request for Quotation command center.",
        "Create, track, review, and evaluate supplier RFQs connected to projects, organizations, Marketplace suppliers, documents, and VORA procurement intelligence.",
        "Production RFQ data is unavailable, so Vorqa is showing demo fallback RFQs.",
        "All priorities"
      ];
      values.forEach((value) => {
        assert(translateUiText(value, "ar") !== value, `Arabic RFQ runtime leaked English: ${value}`);
        assert(translateUiText(value, "fr") !== value, `French RFQ runtime leaked English: ${value}`);
        assert(Boolean(translateUiText(value, "en").trim()), `English RFQ runtime is empty: ${value}`);
      });
      const rfqPage = fs.readFileSync(path.join(process.cwd(), "app/rfq/page.tsx"), "utf8");
      assert(rfqPage.includes("rfq.command.title"), "RFQ page must render the semantic title key");
      assert(rfqPage.includes("rfq.command.description"), "RFQ page must render the semantic description key");
      assert(rfqPage.includes("rfq.fallback.demoNotice"), "RFQ page must render the semantic fallback key");
      assert(rfqPage.includes('useState("All priorities")'), "RFQ filter must preserve its canonical repository value");
    }
  },
  {
    name: "simple project owner journey has exact Arabic French and English coverage",
    run: () => {
      const catalogs = { ar: arCatalog, fr: frCatalog, en: enCatalog } as const;
      const keys = Object.keys(enCatalog).filter((key) => key.startsWith("projectJourney."));
      assert(keys.length >= 140, "Project journey catalog is incomplete");
      locales.forEach((locale) => {
        const localizedKeys = Object.keys(catalogs[locale]).filter((key) => key.startsWith("projectJourney."));
        assert(localizedKeys.length === keys.length, `Project journey key parity failed for ${locale}`);
        keys.forEach((key) => assert(Boolean(catalogs[locale][key as keyof (typeof catalogs)[typeof locale]]?.trim()), `Missing ${locale} project journey translation: ${key}`));
      });
      assert(arCatalog["projectJourney.create.title"] !== enCatalog["projectJourney.create.title"], "Arabic journey title leaked English");
      assert(frCatalog["projectJourney.create.title"] !== enCatalog["projectJourney.create.title"], "French journey title leaked English");
      assert(localeMeta.ar.dir === "rtl", "Arabic project journey must render RTL");
      assert(localeMeta.fr.dir === "ltr" && localeMeta.en.dir === "ltr", "French and English project journeys must render LTR");
    }
  },
  {
    name: "construction lifecycle has exact role-aware Arabic French and English coverage",
    run: () => {
      const keys = projectLifecycleMessages.map((message) => message.key);
      assert(new Set(keys).size === keys.length, "Construction lifecycle catalog contains duplicate keys");
      assert(keys.length >= 130, "Construction lifecycle catalog is incomplete");
      locales.forEach((locale) => {
        const localizedKeys = Object.keys(projectLifecycleTranslationCatalog[locale]);
        assert(localizedKeys.length === keys.length, `Construction lifecycle key parity failed for ${locale}`);
        keys.forEach((key) => {
          assert(Boolean(projectLifecycleTranslationCatalog[locale][key]?.trim()), `Missing ${locale} construction lifecycle translation: ${key}`);
          assert(translateUiText(key, locale) === projectLifecycleTranslationCatalog[locale][key], `Global catalog did not merge lifecycle key: ${key} (${locale})`);
        });
      });
      assert(projectLifecycleTranslationCatalog.ar["projectLifecycle.section.title"] !== projectLifecycleTranslationCatalog.en["projectLifecycle.section.title"], "Arabic lifecycle title leaked English");
      assert(projectLifecycleTranslationCatalog.fr["projectLifecycle.section.title"] !== projectLifecycleTranslationCatalog.en["projectLifecycle.section.title"], "French lifecycle title leaked English");
      assert(localeMeta.ar.dir === "rtl", "Arabic construction lifecycle must render RTL");
      assert(localeMeta.fr.dir === "ltr" && localeMeta.en.dir === "ltr", "French and English construction lifecycle must render LTR");

      const workspace = fs.readFileSync(path.join(process.cwd(), "components/project-workspace.tsx"), "utf8");
      assert(workspace.includes('translate("projectLifecycle.section.title")'), "Project workspace must use the semantic lifecycle title");
      assert(workspace.includes("translate(lifecycle.currentStageKey)"), "Project workspace must localize the shared current stage");
      assert(workspace.includes("roleContext.myActions"), "Project workspace must expose role-filtered My Actions");
      assert(workspace.includes("roleContext.waitingOn"), "Project workspace must expose role-filtered dependencies");
      assert(!workspace.includes(">Structural works<") && !workspace.includes(">Gros oeuvre<") && !workspace.includes(">الأشغال الإنشائية<"), "Project workspace must not hardcode lifecycle stage labels");
    }
  },
  {
    name: "Stage Gate catalog has exact Arabic French and English parity",
    run: () => {
      const keys = projectStageGateMessages.map((message) => message.key);
      assert(new Set(keys).size === keys.length, "Stage Gate catalog contains duplicate keys");
      locales.forEach((locale) => {
        assert(Object.keys(projectStageGateTranslationCatalog[locale]).length === keys.length, `Stage Gate key parity failed for ${locale}`);
        keys.forEach((key) => {
          assert(Boolean(projectStageGateTranslationCatalog[locale][key]?.trim()), `Missing ${locale} Stage Gate translation: ${key}`);
          assert(translateUiText(key, locale) === projectStageGateTranslationCatalog[locale][key], `Global catalog did not merge Stage Gate key: ${key} (${locale})`);
        });
      });
      assert(localeMeta.ar.dir === "rtl", "Arabic Stage Gate must render RTL");
      assert(localeMeta.fr.dir === "ltr" && localeMeta.en.dir === "ltr", "French and English Stage Gate must render LTR");
      const workspace = fs.readFileSync(path.join(process.cwd(), "components/project-workspace.tsx"), "utf8");
      assert(workspace.includes('translate("projectStageGate.section.title")'), "Project workspace must use the semantic Stage Gate title");
      assert(workspace.includes("<StageGatePanel"), "Project workspace must render the Stage Gate panel");
    }
  }
,
  {
    name: "Sprint 48 workflow catalog and UI have Arabic French and English parity",
    run: () => {
      const keys = Object.keys(projectWorkflowTranslationCatalog.en);
      locales.forEach((locale) => {
        assert(Object.keys(projectWorkflowTranslationCatalog[locale]).length === keys.length, `Workflow key parity failed for ${locale}`);
        keys.forEach((key) => assert(Boolean(projectWorkflowTranslationCatalog[locale][key]?.trim()), `Missing ${locale} workflow translation: ${key}`));
      });
      const panel = fs.readFileSync(path.join(process.cwd(), "components/project-workflow-panel.tsx"), "utf8");
      assert(panel.includes('translate("workflow.section.badge")'), "Workflow panel must localize its section badge");
      assert(panel.includes("allowedWorkflowActions"), "Workflow panel must derive actions from confirmed authority");
      assert(panel.includes("p_expected_lock_version"), "Workflow commands must send optimistic concurrency state");
      const adapter = fs.readFileSync(path.join(process.cwd(), "lib/repositories/workflowSupabaseAdapter.ts"), "utf8");
      assert(adapter.includes('value.startsWith("workflow_")'), "Persisted workflow event names must be normalized for UI and self-approval checks");
    }
  }
];
