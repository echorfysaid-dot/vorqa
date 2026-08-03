const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveVorqaAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(root, request.slice(2)), parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function loadTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      strict: true
    },
    fileName: filename
  });
  module._compile(output.outputText, filename);
};

async function main() {
  const testModules = [path.join(root, "tests", "ai", "ai-foundation.test.ts")];
  let passed = 0;

  for (const testModule of testModules) {
    const loaded = require(testModule);
    for (const testCase of loaded.tests || []) {
      await testCase.run();
      passed += 1;
      console.log(`✓ ${testCase.name}`);
    }
  }

  console.log(`\nAI foundation tests passed: ${passed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
