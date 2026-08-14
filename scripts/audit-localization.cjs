const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const ts = require("typescript");
const Module = require("node:module");

const root = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveVorqaAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) return originalResolveFilename.call(this, path.join(root, request.slice(2)), parent, isMain, options);
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    fileName: filename
  });
  module._compile(output.outputText, filename);
};

const { locales, translateUiText } = require(path.join(root, "lib", "i18n.ts"));
const visibleAttributes = new Set(["aria-label", "placeholder", "title", "alt", "label", "description", "eyebrow", "message", "hint"]);
const structuredUiProps = new Set(["title", "label", "description", "subtitle", "eyebrow", "helper", "hint", "message", "badge", "status", "emptyText", "emptyLabel", "placeholder", "alt", "action", "summary", "reason", "risks", "negotiationPoints"]);
const ignored = /^(?:[a-z]+:|\/|#|\.|--|[\w-]+\.(?:png|jpe?g|webp|svg|pdf|docx|xlsx|csv)|[A-Z]{2,}-\d+|[\d\s.,%+:/-]+)$/i;
const localeNeutral = /^(?:VORA|Vorqa|Supabase|OpenAI|Anthropic|Gemini|OpenRouter|PDF|DOCX|XLSX|CSV|BIM|BOQ|RAG|OCR|API|AI|Email|Website|Kanban|Markdown|MRR|B2B|OK)$/i;
const intentionalUserOrFileData = /^(?:VORA AI|Atlas Construction Group|Nadia Benali|Luxury Villa Casablanca|Supplier Comparison\.xlsx|(?:RFQ|QTN|CON)-\d+\b)/i;

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isVisibleCopy(value) {
  const text = normalize(value);
  return text.length > 1 && /\p{L}/u.test(text) && !ignored.test(text);
}

function collect() {
  const presentationFiles = childProcess.execFileSync("rg", ["--files", "app", "components", "-g", "*.tsx", "-g", "*.ts"], {
    cwd: root,
    encoding: "utf8"
  }).trim().split(/\r?\n/).filter(Boolean);
  const repositoryRuntimeFiles = childProcess.execFileSync("rg", ["--files", "lib/repositories", "-g", "*DemoAdapter.ts", "-g", "*Mapper.ts"], {
    cwd: root,
    encoding: "utf8"
  }).trim().split(/\r?\n/).filter(Boolean);
  const runtimeFiles = [
    ...repositoryRuntimeFiles,
    "lib/rfq-data.ts",
    "lib/marketplace-data.ts",
    "lib/contracts-data.ts",
    "lib/platform-data.ts"
  ];
  const files = [...new Set([...presentationFiles, ...runtimeFiles])];
  const findings = [];

  for (const file of files) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const add = (node, value, kind) => {
      const text = normalize(value);
      if (isVisibleCopy(text)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        findings.push({ file: file.replaceAll("\\", "/"), line: line + 1, kind, text });
      }
    };
    const visit = (node) => {
      if (ts.isJsxText(node)) add(node, node.text, "jsx-text");
      if (ts.isJsxAttribute(node) && visibleAttributes.has(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer)) {
        add(node, node.initializer.text, node.name.text);
      }
      if (ts.isPropertyAssignment(node)) {
        const key = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : "";
        if (structuredUiProps.has(key)) {
          const collectPropertyStrings = (value) => {
            if (ts.isStringLiteralLike(value)) {
              const parent = value.parent;
              const isTypeofToken = ts.isBinaryExpression(parent) && (
                (parent.right === value && ts.isTypeOfExpression(parent.left)) ||
                (parent.left === value && ts.isTypeOfExpression(parent.right))
              );
              const isLookupToken = ts.isCallExpression(parent);
              if (!isTypeofToken && !isLookupToken) add(value, value.text, `property:${key}`);
            }
            ts.forEachChild(value, collectPropertyStrings);
          };
          collectPropertyStrings(node.initializer);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return findings;
}

function main() {
  const catalogs = Object.fromEntries(["ar", "fr", "en"].map((locale) => [
    locale,
    JSON.parse(fs.readFileSync(path.join(root, "lib", "locales", `${locale}.json`), "utf8"))
  ]));
  const findings = collect();
  const unique = [...new Set(findings.map(({ text }) => text))];
  const keySets = locales.map((locale) => Object.keys(catalogs[locale]).sort());
  const catalogParity = keySets.every((keys) => JSON.stringify(keys) === JSON.stringify(keySets[0]));
  const bracketArtifacts = findings.filter(({ kind, text }) => kind === "jsx-text" && /^[()[\]{}]+$/.test(text));
  const runtimeLeaks = [];
  unique.forEach((text) => {
    if (localeNeutral.test(text) || intentionalUserOrFileData.test(text)) return;
    if (/^[A-Za-z][\s\S]*[A-Za-z]$/.test(text) && translateUiText(text, "ar") === text) runtimeLeaks.push({ locale: "ar", text });
    if (/\p{Script=Arabic}/u.test(text) && translateUiText(text, "fr") === text) runtimeLeaks.push({ locale: "fr", text });
    if (/\p{Script=Arabic}/u.test(text) && translateUiText(text, "en") === text) runtimeLeaks.push({ locale: "en", text });
  });
  const report = {
    scannedOccurrences: findings.length,
    uniqueVisibleLiterals: unique.length,
    catalogParity,
    bracketArtifacts,
    runtimeLeaks
  };
  fs.writeFileSync(path.join(root, "localization-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Localization audit: ${findings.length} occurrences, ${unique.length} unique system literals.`);
  console.log(`Catalog parity: ${catalogParity ? "pass" : "fail"}; runtime leaks: ${runtimeLeaks.length}; bracket artifacts: ${bracketArtifacts.length}.`);
  if (!catalogParity || runtimeLeaks.length || bracketArtifacts.length) process.exitCode = 1;
}

main();
