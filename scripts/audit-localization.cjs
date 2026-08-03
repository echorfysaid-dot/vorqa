const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const visibleAttributes = new Set(["aria-label", "placeholder", "title", "alt"]);
const ignored = /^(?:[a-z]+:|\/|#|\.|--|[\w-]+\.(?:png|jpe?g|webp|svg|pdf|docx|xlsx|csv)|[A-Z]{2,}-\d+|[\d\s.,%+:/-]+)$/i;

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isVisibleCopy(value) {
  const text = normalize(value);
  return text.length > 1 && /\p{L}/u.test(text) && !ignored.test(text);
}

function collect() {
  const files = childProcess.execFileSync("rg", ["--files", "app", "components", "-g", "*.tsx"], {
    cwd: root,
    encoding: "utf8"
  }).trim().split(/\r?\n/).filter(Boolean);
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
  const missing = unique.filter((text) => !["ar", "fr", "en"].every((locale) => catalogs[locale][text]));
  const report = { scannedOccurrences: findings.length, uniqueVisibleLiterals: unique.length, cataloged: unique.length - missing.length, missing };
  fs.writeFileSync(path.join(root, "localization-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Localization audit: ${report.cataloged}/${report.uniqueVisibleLiterals} direct visible literals cataloged.`);
  if (missing.length) console.log(`${missing.length} literals remain listed in localization-audit.json.`);
}

main();
