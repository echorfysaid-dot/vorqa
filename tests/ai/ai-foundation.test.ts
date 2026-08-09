import assert from "node:assert/strict";
import { createAiApplicationContext } from "@/lib/ai-context";
import { safeAuthRedirect } from "@/lib/auth-client";
import { friendlyAuthError, friendlyDataError } from "@/lib/supabase-server";
import { resolveDataSourceMode } from "@/lib/data-source";
import { projectDemoAdapter } from "@/lib/repositories/projectDemoAdapter";
import { shouldUseDemoForProjectWrite } from "@/lib/repositories/projectRepository";
import { createAiMemory } from "@/lib/ai-memory";
import { createAiPromptPayload, normalizeUserRequest } from "@/lib/ai-prompt-builder";
import { executeAiOrchestrator, rankModelsForOrchestration, rankProvidersForOrchestration } from "@/lib/ai-orchestrator-engine";
import { getProviderHealth, resetProviderHealth } from "@/lib/ai-provider-health";
import { isVorqaAccountType, isVorqaOrganizationType, isVorqaUserRole, navigationForIdentity, navigationForRole, normalizeAccountIdentity, workspaceTypeForIdentity, workspaceTypeForRole } from "@/lib/onboarding";
import { checkApiRateLimit, resetApiRateLimits } from "@/lib/api-rate-limit";
import { __resetActivityTimeline, listProjectActivity } from "@/lib/activity-timeline";
import { __resetAuditLog, listAuditEvents } from "@/lib/audit-log";
import { createProjectPermissionSnapshot } from "@/lib/collaboration-engine";
import { assembleCopilotPrompt, renderCopilotRuntimeRequest } from "@/lib/copilot-context";
import { executeCopilotChatSafe } from "@/lib/copilot-engine";
import {
  __resetCopilotMemory,
  appendMessage,
  clearHistory,
  createSession as createCopilotSession,
  listSessions,
  loadHistory
} from "@/lib/copilot-session";
import {
  AiOrchestrationError,
  createAiExecutionPlan,
  normalizeExecutionOptions,
  selectAiModel,
  selectAiProvider,
  validateProviderCapabilities
} from "@/lib/ai-orchestrator";
import { aiProviderDescriptors, normalizeAiProviderResponse } from "@/lib/ai-provider-adapter";
import { createAiExecutionPolicy, rankAiModelCandidates, rankAiProviderCandidates, resolveAiExecutionCandidate } from "@/lib/ai-execution-policy";
import { hasModelCapability, validateModelProviderPair } from "@/lib/ai-model-registry";
import { createReasoningPlan } from "@/lib/vora-reasoning-engine";
import { createDecisionPlan } from "@/lib/vora-decision-engine";
import { createReportPlan } from "@/lib/vora-report-engine";
import { executeRuntimePipeline, executeVoraRuntime } from "@/lib/vora-intelligence-runtime";
import { createRecommendationPlan } from "@/lib/vora-recommendation-engine";
import { executeVoraIntelligence, executeVoraIntelligenceSafe } from "@/lib/vora-intelligence-service";
import { executeContractReview, prepareContractReview } from "@/lib/vora-contract-review";
import { executeBoqReview, normalizeBoqHeader, parseBoqContent, prepareBoqReview, summarizeBoqStructure } from "@/lib/vora-boq-review";
import {
  calculateRiskPriority,
  createRiskMatrix,
  executeRiskAssessment,
  normalizeRiskSeverity,
  prepareRiskAssessment
} from "@/lib/vora-risk-assessment";
import {
  detectPlanningIssues,
  executePlanningReview,
  normalizePlanningActivities,
  preparePlanningReview,
  summarizePlanning
} from "@/lib/vora-planning-review";
import {
  detectSiteReportIssues,
  executeSiteReportReview,
  normalizeSiteReportObservations,
  prepareSiteReportReview,
  summarizeSiteReport
} from "@/lib/vora-site-report-review";
import {
  calculateExecutiveSummaryCoverage,
  deriveExecutiveSummaryRecommendations,
  executeExecutiveSummary,
  prepareExecutiveSummary
} from "@/lib/vora-executive-summary";
import { normalizeDocument } from "@/lib/document-intelligence";
import {
  constructionIntelligenceFeatures,
  getConstructionIntelligenceWorkspaceSummary,
  getLaunchableConstructionIntelligenceFeatures
} from "@/lib/construction-intelligence-workspace";
import {
  calculateProjectHealth,
  createProjectIntelligenceSession,
  createProjectIntelligenceSessionAsync,
  createProjectIntelligenceTimeline
} from "@/lib/project-intelligence";
import { createAnalysisWorkflow, getWorkflowStageOrder, resolveNextAction } from "@/lib/analysis-workflow";
import { __resetProjectComments, addProjectComment, listProjectComments, resolveProjectComment } from "@/lib/project-comments";
import {
  __resetProjectMembers,
  canComment,
  canEditProject,
  canManageMembers,
  canReview,
  canViewProject,
  removeProjectMember,
  upsertProjectMember
} from "@/lib/project-members";
import { __resetProjectReviews, createProjectReview, listProjectReviews, transitionProjectReview } from "@/lib/project-review";
import { clearPerformanceMetrics, getPerformanceMetric, getPerformanceMetrics, measurePerformance, recordPerformanceMetric } from "@/lib/performance-metrics";
import { clear as clearRequestCache, get as getRequestCache, set as setRequestCache, stats as requestCacheStats } from "@/lib/request-cache";
import { runRuntimeHealthChecks } from "@/lib/health-check";
import { getRuntimeMonitorSnapshot } from "@/lib/runtime-monitor";
import { clearRuntimeLogs, listRuntimeLogs, logRuntimeEvent, normalizeRuntimeError } from "@/lib/runtime-logger";
import {
  __resetProjectAnalysisStorage,
  __setProjectAnalysisAdapter,
  __setProjectAnalysisStorageFailure,
  createSession,
  latestAnalysis,
  listProjectAnalyses,
  listProjectAnalysesAsync,
  loadAnalysis,
  saveAnalysis,
  saveAnalysisAsync,
  updateAnalysis
} from "@/lib/project-analysis-storage";
import { persistAnalysisResultSafe } from "@/lib/project-session";
import { calculateProjectReadiness, createAnalysisTimeline, getAnalysisHistory, getProjectAnalysisState, resumeAnalysis } from "@/lib/project-analysis-engine";
import { createProjectAnalysisUiModel, filterAnalysisHistory } from "@/lib/project-analysis-view-model";
import { createProjectAnalysisSupabaseAdapter } from "@/lib/project-analysis-supabase";
import {
  canonicalConstructionWorkflow,
  createAnalysisCoverageLabel,
  createErrorResponse,
  createExportReadyReport,
  createSafeError,
  formatConfidence,
  formatHealth,
  mapHttpErrorRetryable,
  validateWorkflowCoverage
} from "@/lib/analysis-hardening";
import { exportProfessionalReport, sanitizeReportFilename } from "@/lib/document-engine";
import { parseConstructionDocument } from "@/lib/document-parser";
import { parseDocumentWithAdapter } from "@/lib/document-parser-adapters";
import { inferMimeType } from "@/lib/document-metadata";
import { normalizeParsedDocument } from "@/lib/document-normalizer";
import { createFallbackEmbeddingProvider, unavailableEmbeddingProvider } from "@/lib/embedding-provider";
import { createKnowledgeEngine, knowledgeEngine } from "@/lib/knowledge-engine";
import { retrieveProjectKnowledge } from "@/lib/project-intelligence";
import { createKnowledgeChunks } from "@/lib/vector-index";
import { createInMemoryVectorStorage } from "@/lib/vector-storage";
import { generateDocxReport } from "@/lib/docx-export";
import { generatePdfReport } from "@/lib/pdf-export";
import { generateHtmlReport, renderPrintReadyHtml } from "@/lib/html-export";
import { vorqaReportBranding } from "@/lib/report-branding";
import { createProfessionalReportTemplate, renderReportPlainText } from "@/lib/report-template";
import { createAnalysisExportModel, createProjectIntelligenceExportModel, getLatestAnalysisVersion, getSpecificAnalysisVersion } from "@/lib/project-report-export";

type TestCase = {
  name: string;
  run: () => void | Promise<void>;
};

const fixedNow = new Date("2026-07-23T10:00:00.000Z");

function bytesToAscii(bytes: Uint8Array, limit = bytes.length) {
  return Array.from(bytes.slice(0, limit)).map((byte) => String.fromCharCode(byte)).join("");
}

function createSimplePdfBytes(text: string) {
  return new TextEncoder().encode(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${text.length + 32} >>
stream
BT /F1 12 Tf 72 720 Td (${text}) Tj ET
endstream
endobj
%%EOF`);
}

function createSampleContext() {
  return createAiApplicationContext({
    pathname: "/projects/PRJ-1048",
    searchParams: new URLSearchParams("organizationId=atlas&documentId=DOC-1"),
    language: "ar",
    direction: "rtl",
    theme: "dark",
    isAuthenticated: true,
    now: fixedNow
  });
}

function createSampleMemory() {
  return createAiMemory({
    context: createSampleContext(),
    session: {
      sessionId: "test-session",
      startedAt: fixedNow.toISOString()
    },
    recentNavigation: [
      {
        pathname: "/dashboard",
        workspaceType: "command-center",
        entityType: "none",
        visitedAt: fixedNow.toISOString()
      }
    ],
    conversation: {
      title: "Project review",
      messageCount: 2,
      lastInteractionAt: fixedNow.toISOString()
    },
    referencedDocumentIds: ["DOC-1"],
    now: fixedNow
  });
}

function createSamplePrompt() {
  return createAiPromptPayload({
    context: createSampleContext(),
    memory: createSampleMemory(),
    userRequest: "Create an executive summary for the current project.",
    taskIntent: "generate_report",
    outputPreferences: {
      language: "ar",
      tone: "executive",
      responseFormat: "markdown"
    },
    now: fixedNow
  });
}

function createSampleReportPlan() {
  const context = createSampleContext();
  const memory = createSampleMemory();
  const documentMetadata = [
    {
      title: "Contract draft",
      language: "en" as const,
      category: "contract",
      sourceName: "contract-draft.pdf"
    }
  ];
  const reasoningPlan = createReasoningPlan({
    context,
    memory,
    documentMetadata,
    taskIntent: "analyze",
    userRequest: "Review the contract and prepare the report structure.",
    now: fixedNow
  });
  const decisionPlan = createDecisionPlan({
    reasoningPlan,
    context,
    memory,
    documentMetadata,
    now: fixedNow
  });

  return createReportPlan({
    reasoningPlan,
    decisionPlan,
    context,
    memory,
    documentMetadata,
    preferences: {
      audience: "owner",
      outputFormat: "structured_data",
      includeEvidence: true
    },
    now: fixedNow
  });
}

function createSampleRuntimeResult() {
  return executeRuntimePipeline({
    userRequest: "Prepare the intelligence pipeline for this contract review.",
    context: createSampleContext(),
    memory: createSampleMemory(),
    documents: [
      {
        id: "DOC-1",
        name: "contract-draft.pdf",
        type: "contract",
        source: "upload",
        mimeType: "application/pdf",
        metadata: {
          title: "Contract draft",
          category: "contract",
          sourceName: "contract-draft.pdf"
        }
      }
    ],
    taskIntent: "analyze",
    now: fixedNow
  });
}

function createSampleRecommendationPlan() {
  const runtime = createSampleRuntimeResult();
  return createRecommendationPlan({
    decisionPlan: runtime.decisionPlan,
    reasoningPlan: runtime.reasoningPlan,
    reportPlan: runtime.reportPlan,
    runtimeContext: runtime.runtimeContext,
    now: fixedNow
  });
}

function assertThrowsOrchestration(fn: () => unknown, category: AiOrchestrationError["category"]) {
  assert.throws(
    fn,
    (error) => error instanceof AiOrchestrationError && error.category === category
  );
}

export const tests: TestCase[] = [
  {
    name: "Onboarding roles use stable typed identifiers",
    run() {
      assert.equal(isVorqaUserRole("project_owner"), true);
      assert.equal(isVorqaUserRole("company"), false);
      assert.equal(isVorqaUserRole("Project Owner"), false);
      assert.equal(isVorqaAccountType("individual"), true);
      assert.equal(isVorqaAccountType("organization"), true);
      assert.equal(isVorqaAccountType("company"), false);
      assert.equal(isVorqaOrganizationType("construction_company"), true);
      assert.equal(workspaceTypeForRole("engineer"), "individual_engineer");
    }
  },
  {
    name: "Legacy company identities migrate deterministically to organization workspaces",
    run() {
      const identity = normalizeAccountIdentity({ primaryRole: "company" });
      assert.deepEqual(identity, { accountType: "organization", primaryRole: null, organizationType: "construction_company" });
      assert.equal(identity && workspaceTypeForIdentity(identity), "organization_construction_company");
    }
  },
  {
    name: "Organization navigation derives from organization type rather than user role",
    run() {
      const navigation = navigationForIdentity({ accountType: "organization", primaryRole: null, organizationType: "supplier_company" });
      assert.equal(navigation.some((item) => item.href === "/quotations"), true);
      assert.equal(navigation.some((item) => item.label === "Administration"), false);
    }
  },
  {
    name: "Role navigation is deterministic and preserves implemented routes",
    run() {
      const first = navigationForRole("contractor");
      const second = navigationForRole("contractor");
      assert.deepEqual(first, second);
      assert.equal(first[0]?.href, "/dashboard");
      assert.equal(first.some((item) => item.href === "/contracts"), true);
    }
  },
  {
    name: "Unavailable role capabilities use an explicit coming-soon route",
    run() {
      const equipment = navigationForRole("contractor").find((item) => item.label === "Equipment");
      assert.equal(equipment?.available, false);
      assert.match(equipment?.href || "", /^\/coming-soon\?/);
    }
  },
  {
    name: "AI context is deterministic for identical inputs",
    run() {
      assert.deepEqual(createSampleContext(), createSampleContext());
    }
  },
  {
    name: "AI memory is deterministic for identical inputs",
    run() {
      assert.deepEqual(createSampleMemory(), createSampleMemory());
    }
  },
  {
    name: "Prompt payload is deterministic when now is supplied",
    run() {
      assert.deepEqual(createSamplePrompt(), createSamplePrompt());
    }
  },
  {
    name: "Prompt context and memory sections keep stable ordering",
    run() {
      const prompt = createSamplePrompt();
      assert.deepEqual(
        prompt.contextSections.map((section) => section.key),
        [
          "application.route",
          "application.selection",
          "application.user",
          "memory.workspace",
          "memory.selection",
          "memory.session"
        ]
      );
    }
  },
  {
    name: "Prompt truncation is deterministic",
    run() {
      const normalized = normalizeUserRequest("x".repeat(80), 32);
      assert.equal(normalized.includes("[TRUNCATED_FOR_PROMPT_LIMIT]"), true);
      assert.equal(normalized, normalizeUserRequest("x".repeat(80), 32));
    }
  },
  {
    name: "Unavailable requested provider is rejected",
    run() {
      assertThrowsOrchestration(
        () =>
          selectAiProvider({
            providerPreference: "openai",
            availableProviders: { openai: false },
            requiredCapabilities: ["text_generatioßN=òÚ$z{-®éÜj×væW$–C¢&÷væW"Ó"ÂWF†÷$–C¢'f–WvW"Ó"ÂF&vWEG—S¢&6öçG&7E÷&Wf–Wr"ÂF&vWD–C¢&æÇ—6—2Ó"Â&öG“¢$6ææ÷B6öÖÖVçB"Âæ÷s¢f—†VDæ÷rÒ“°¢6öç7BFFVBÒFE&ö¦V7D6öÖÖVçB‡²&ö¦V7D–C¢%$¢Ô4ôÔÔTåE2"Â÷væW$–C¢&÷væW"Ó"ÂWF†÷$–C¢&Væv–æVW"Ó"ÂF&vWEG—S¢&6öçG&7E÷&Wf–Wr"ÂF&vWD–C¢&æÇ—6—2Ó"Â&öG“¢%ÆV6RfW&–g’6ÆW6RBâ"Âæ÷s¢f—†VDæ÷rÒ“° ¢76W'BæWVÂ†FVæ–VBæö²ÂfÇ6R“°¢76W'BæWVÂ†FFVBæö²ÂG'VR“°¢76W'BæWVÂ†Æ—7E&ö¦V7D6öÖÖVçG2‚%$¢Ô4ôÔÔTåE2"’æÆVæwF‚Â“°¢76W'BæWVÂ†Æ—7E&ö¦V7D7F—f—G’‚%$¢Ô4ôÔÔTåE2"•³ÒçG—RÂ&6öÖÖVçEöFFVB"“°¢76W'BæWVÂ†Æ—7DVF—DWfVçG2‚’ç6öÖR‚†WfVçB’ÓâWfVçBæ7F–öâÓÓÒ&6öÖÖVçEöFFVB"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7B6öÖÖVçG2&W6öÇfRF‡&÷Vv‚F†R6ÖRW&Ö—76–öâÆ–W""À¢'Vâ‚’°¢õ÷&W6WE&ö¦V7DÖVÖ&W'2‚“°¢õ÷&W6WE&ö¦V7D6öÖÖVçG2‚“°¢õ÷&W6WD7F—f—G•F–ÖVÆ–æR‚“°¢W6W'E&ö¦V7DÖVÖ&W"‡²&ö¦V7D–C¢%$¢Õ$U4ôÅdR"Â÷væW$–C¢&÷væW"Ó"ÂW6W$–C¢'&Wf–WvW"Ó"Â&öÆS¢'&Wf–WvW""Âæ÷s¢f—†VDæ÷rÒ“°¢6öç7BFFVBÒFE&ö¦V7D6öÖÖVçB‡²&ö¦V7D–C¢%$¢Õ$U4ôÅdR"Â÷væW$–C¢&÷væW"Ó"ÂWF†÷$–C¢'&Wf–WvW"Ó"ÂF&vWEG—S¢&&÷÷&Wf–Wr"ÂF&vWD–C¢&&÷Ó"Â&öG“¢$6Æ÷6RVçF—G’æ÷FRâ"Âæ÷s¢f—†VDæ÷rÒ“°¢76W'Bæö²†FFVBæFF“°¢6öç7B&W6öÇfVBÒ&W6öÇfU&ö¦V7D6öÖÖVçB‡²&ö¦V7D–C¢%$¢Õ$U4ôÅdR"Â÷væW$–C¢&÷væW"Ó"ÂW6W$–C¢'&Wf–WvW"Ó"Â6öÖÖVçD–C¢FFVBæFFæ–BÂæ÷s¢f—†VDæ÷rÒ“° ¢76W'BæWVÂ‡&W6öÇfVBæö²ÂG'VR“°¢76W'BæWVÂ‡&W6öÇfVBæFFòç&W6öÇfVBÂG'VR“°¢76W'BæWVÂ†Æ—7E&ö¦V7D7F—f—G’‚%$¢Õ$U4ôÅdR"’ç6öÖR‚†WfVçB’ÓâWfVçBçG—RÓÓÒ&6öÖÖVçE÷&W6öÇfVB"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7B&Wf–Wrv÷&¶fÆ÷rG&6·2&÷fÂæB&V¦V7F–öâ"À¢'Vâ‚’°¢õ÷&W6WE&ö¦V7DÖVÖ&W'2‚“°¢õ÷&W6WE&ö¦V7E&Wf–Ww2‚“°¢õ÷&W6WD7F—f—G•F–ÖVÆ–æR‚“°¢õ÷&W6WDVF—DÆör‚“°¢W6W'E&ö¦V7DÖVÖ&W"‡²&ö¦V7D–C¢%$¢Õ$Ud”Ur"Â÷væW$–C¢&÷væW"Ó"ÂW6W$–C¢&ÖævW"Ó"Â&öÆS¢&ÖævW""Âæ÷s¢f—†VDæ÷rÒ“°¢6öç7B&Wf–WrÒ7&VFU&ö¦V7E&Wf–Wr‡°¢&ö¦V7D–C¢%$¢Õ$Ud”Ur"À¢÷væW$–C¢&÷væW"Ó"À¢&WVW7FVD'“¢&ÖævW"Ó"À¢F&vWEG—S¢'&—6µö76W76ÖVçB"À¢F&vWD–C¢'&—6²Ó"À¢æ÷s¢f—†VDæ÷p¢Ò“°¢76W'Bæö²‡&Wf–WræFF“°¢6öç7B&÷fVBÒG&ç6—F–öå&ö¦V7E&Wf–Wr‡²&ö¦V7D–C¢%$¢Õ$Ud”Ur"Â÷væW$–C¢&÷væW"Ó"Â7F÷$–C¢&ÖævW"Ó"Â&Wf–Wt–C¢&Wf–WræFFæ–BÂ7FGW3¢&&÷fVB"Âæ÷FW3¢$&÷fVBf÷"—77VRâ"Âæ÷s¢f—†VDæ÷rÒ“° ¢76W'BæWVÂ‡&Wf–WræFFç7FGW2Â&–å÷&Wf–Wr"“°¢76W'BæWVÂ†&÷fVBæFFòç7FGW2Â&&÷fVB"“°¢76W'BæWVÂ†&÷fVBæFFòæFV6—6–öâÂ&&÷fVB"“°¢76W'BæWVÂ†Æ—7E&ö¦V7E&Wf–Ww2‚%$¢Õ$Ud”Ur"•³Òç7FGW2Â&&÷fVB"“°¢76W'BæWVÂ†Æ—7E&ö¦V7D7F—f—G’‚%$¢Õ$Ud”Ur"’ç6öÖR‚†WfVçB’ÓâWfVçBçG—RÓÓÒ'&Wf–Wuö&÷fVB"’ÂG'VR“°¢76W'BæWVÂ†Æ—7DVF—DWfVçG2‚’ç6öÖR‚†WfVçB’ÓâWfVçBæ7F–öâÓÓÒ'&Wf–Wuö&÷fVB"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7BÖVÖ&W'2&VÖ–â—6öÆFVBW"&ö¦V7B"À¢'Vâ‚’°¢õ÷&W6WE&ö¦V7DÖVÖ&W'2‚“°¢W6W'E&ö¦V7DÖVÖ&W"‡²&ö¦V7D–C¢%$¢Ô"Â÷væW$–C¢&÷væW"Ó"ÂW6W$–C¢'W6W"Ó"Â&öÆS¢&Væv–æVW""Âæ÷s¢f—†VDæ÷rÒ“°¢W6W'E&ö¦V7DÖVÖ&W"‡²&ö¦V7D–C¢%$¢Ô""Â÷væW$–C¢&÷væW"Ó"ÂW6W$–C¢'W6W"Ó"Â&öÆS¢'f–WvW""Âæ÷s¢f—†VDæ÷rÒ“°¢6öç7B&VÖ÷fVBÒ&VÖ÷fU&ö¦V7DÖVÖ&W"‚%$¢Ô"Â'W6W"Ó"Âf—†VDæ÷r“° ¢76W'BæWVÂ‡&VÖ÷fVCòç7FGW2Â'&VÖ÷fVB"“°¢76W'BæWVÂ†6ä6öÖÖVçB‡&VÖ÷fVB’ÂfÇ6R“°¢76W'BæWVÂ†6åf–Wu&ö¦V7B‡W6W'E&ö¦V7DÖVÖ&W"‡²&ö¦V7D–C¢%$¢Ô""Â÷væW$–C¢&÷væW"Ó"ÂW6W$–C¢'W6W"Ó"Â&öÆS¢'f–WvW""Âæ÷s¢f—†VDæ÷rÒ’’ÂG'VR“°¢76W'BæWVÂ†6ä6öÖÖVçB‡W6W'E&ö¦V7DÖVÖ&W"‡²&ö¦V7D–C¢%$¢Ô""Â÷væW$–C¢&÷væW"Ó"ÂW6W$–C¢'W6W"Ó"Â&öÆS¢'f–WvW""Âæ÷s¢f—†VDæ÷rÒ’’ÂfÇ6R“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖR&WVW7B66†RG&6·2†—G2ÂÖ—76W2Â–çfÆ–FF–öâÂæB7FG2"À¢'Vâ‚’°¢6ÆV%&WVW7D66†R‚“°¢6öç7Bæ÷rÒf—†VDæ÷s°¢6WE&WVW7D66†R‚'&ö¦V7C¥$¢Ô44„R"Â²ö³¢G'VRÒÂÂæ÷r“° ¢76W'BæFVWWVÂ†vWE&WVW7D66†R‚'&ö¦V7C¥$¢Ô44„R"Âæ÷r’Â²ö³¢G'VRÒ“°¢76W'BæWVÂ†vWE&WVW7D66†R‚&Ö—76–ær"Âæ÷r’ÂVæFVf–æVB“°¢76W'BæWVÂ‡&WVW7D66†U7FG2‚’æ†—G2Â“°¢76W'BæWVÂ‡&WVW7D66†U7FG2‚’æÖ—76W2Â“°¢76W'BæWVÂ‡&WVW7D66†U7FG2‚’æ†—E&FRÂãR“°¢76W'BæWVÂ†6ÆV%&WVW7D66†R‚’ÂVæFVf–æVB“°¢6WE&WVW7D66†R‚&W‡—&R"Â'fÇVR"ÂÂæ÷r“°¢76W'BæWVÂ†vWE&WVW7D66†R‚&W‡—&R"ÂæWrFFR†æ÷rævWEF–ÖR‚’²’’ÂVæFVf–æVB“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖR&FRÆ–Ö—FW"7W÷'G2W6W"Â•ÂVæGö–çBÂæB–çFW&æÂfÆÆ&6²"À¢'Vâ‚’°¢&W6WD•&FTÆ–Ö—G2‚“°¢6öç7Bf—'7BÒ6†V6´•&FTÆ–Ö—B‡²W6W$–C¢'W6W"Ó"ÂVæGö–çC¢&’"Â6öæf–s¢²Æ–Ö—C¢"Âv–æF÷t×3¢Â66÷S¢'W6W""ÒÂæ÷s¢f—†VDæ÷rÒ“°¢6öç7B6V6öæBÒ6†V6´•&FTÆ–Ö—B‡²W6W$–C¢'W6W"Ó"ÂVæGö–çC¢&’"Â6öæf–s¢²Æ–Ö—C¢"Âv–æF÷t×3¢Â66÷S¢'W6W""ÒÂæ÷s¢f—†VDæ÷rÒ“°¢6öç7BF†—&BÒ6†V6´•&FTÆ–Ö—B‡²W6W$–C¢'W6W"Ó"ÂVæGö–çC¢&’"Â6öæf–s¢²Æ–Ö—C¢"Âv–æF÷t×3¢Â66÷S¢'W6W""ÒÂæ÷s¢f—†VDæ÷rÒ“°¢6öç7B–çFW&æÂÒ6†V6´•&FTÆ–Ö—B‡²VæGö–çC¢&’"Â–çFW&æÃ¢G'VRÂ6öæf–s¢²Æ–Ö—C¢Âv–æF÷t×3¢Â66÷S¢&VæGö–çB"ÒÂæ÷s¢f—†VDæ÷rÒ“°¢6öç7B—Ò6†V6´•&FTÆ–Ö—B‡²—¢##rããã"ÂVæGö–çC¢'6V&6‚"Â6öæf–s¢²Æ–Ö—C¢Âv–æF÷t×3¢Â66÷S¢&—"ÒÂæ÷s¢f—†VDæ÷rÒ“° ¢76W'BæWVÂ†f—'7BæÆÆ÷vVBÂG'VR“°¢76W'BæWVÂ‡6V6öæBæÆÆ÷vVBÂG'VR“°¢76W'BæWVÂ‡F†—&BæÆÆ÷vVBÂfÇ6R“°¢76W'BæWVÂ†–çFW&æÂæÆÆ÷vVBÂG'VR“°¢76W'BæWVÂ†–çFW&æÂç6fTfÆÆ&6²ÂG'VR“°¢76W'BæWVÂ†—æ¶W’æ–æ6ÇVFW2‚##rããã"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖRÆövvW"&VF7G26V7&WG2æBæ÷&ÖÆ—¦W2W'&÷'2"À¢'Vâ‚’°¢6ÆV%'VçF–ÖTÆöw2‚“°¢6öç7BVçG'’ÒÆöu'VçF–ÖTWfVçB‡°¢&WVW7D–C¢'&W×FW7B"À¢&ö¦V7D–C¢%$¢ÔÄôr"À¢÷væW$–C¢&÷væW"Ó"À¢÷W&F–öã¢'FW7Eö÷W&F–öâ"À¢GW&F–öã¢C"À¢&÷f–FW#¢&Öö6²"À¢7FGW3¢'7V66W72"À¢v&æ–æw3¢²'6fRv&æ–ær%ÒÀ¢ÖWFFF¢²”¶W“¢'6V7&WB×fÇVR"ÂæW7FVC¢²WF†÷&—¦F–öã¢$&V&W"Fö¶Vâ"Âf—6–&ÆS¢&ö²"ÒÒÀ¢F–ÖW7F×¢f—†VDæ÷rçFô•4õ7G&–ær‚¢Ò“°¢6öç7B&÷f–FW$W'&÷"Òæ÷&ÖÆ—¦U'VçF–ÖTW'&÷"†æWrW'&÷"‚$÷Vä’&÷f–FW"f–ÆVB"’“°¢6öç7BfÆ–FF–öäW'&÷"Òæ÷&ÖÆ—¦U'VçF–ÖTW'&÷"†æWrW'&÷"‚'&WV—&VBf–VÆBÖ—76–ær"’“° ¢76W'BæWVÂ†VçG'’æÖWFFFæ”¶W’Â%µ$TD5DTEÒ"“°¢76W'BæFVWWVÂ‚†VçG'’æÖWFFFææW7FVB2&V6÷&CÇ7G&–ærÂVæ¶æ÷vãâ’æWF†÷&—¦F–öâÂ%µ$TD5DTEÒ"“°¢76W'BæWVÂ‚†VçG'’æÖWFFFææW7FVB2&V6÷&CÇ7G&–ærÂVæ¶æ÷vãâ’çf—6–&ÆRÂ&ö²"“°¢76W'BæWVÂ†Æ—7E'VçF–ÖTÆöw2ƒ•³Òç&WVW7D–BÂ'&W×FW7B"“°¢76W'BæWVÂ‡&÷f–FW$W'&÷"æ6FVv÷'’Â%&÷f–FW""“°¢76W'BæWVÂ‡fÆ–FF–öäW'&÷"æ6FVv÷'’Â%fÆ–FF–öâ"“°¢Ð¢ÒÀ¢°¢æÖS¢%W&f÷&Öæ6RÖWG&–72vw&VvFRÆFVæ7’æB66†R–æf÷&ÖF–öâ"À¢7–æ2'Vâ‚’°¢6ÆV%W&f÷&Öæ6TÖWG&–72‚“°¢6ÆV%&WVW7D66†R‚“°¢&V6÷&EW&f÷&Öæ6TÖWG&–2‚&¶æ÷vÆVFvU÷&WG&–WfÂ"Â#“°¢&V6÷&EW&f÷&Öæ6TÖWG&–2‚&¶æ÷vÆVFvU÷&WG&–WfÂ"ÂC“°¢v—BÖV7W&UW&f÷&Öæ6R‚&Fö7VÖVçE÷'6–ær"Â7–æ2‚’Óâ&ö²"Â‚’Óâ“°¢6WE&WVW7D66†R‚&ÖWG&–2"Â'fÇVR"ÂÂf—†VDæ÷r“°¢vWE&WVW7D66†R‚&ÖWG&–2"Âf—†VDæ÷r“°¢6öç7BÖWG&–2ÒvWEW&f÷&Öæ6TÖWG&–2‚&¶æ÷vÆVFvU÷&WG&–WfÂ"“°¢6öç7B6æ6†÷BÒvWEW&f÷&Öæ6TÖWG&–72‚“° ¢76W'BæWVÂ†ÖWG&–3òæ6÷VçBÂ"“°¢76W'BæWVÂ†ÖWG&–3òæfW&vTÆFVæ7”×2Â3“°¢76W'BæWVÂ‡6æ6†÷Bæ66†Ræ†—E&FRÂ“°¢76W'BæWVÂ‡6æ6†÷Bæ÷W&F–öç2ç6öÖR‚†—FVÒ’Óâ—FVÒæ÷W&F–öâÓÓÒ&Fö7VÖVçE÷'6–ær"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖR†VÇF‚6†V6·2&öGV6Râ÷fW&ÆÂ†VÇF‚&W÷'B"À¢7–æ2'Vâ‚’°¢6öç7B&W÷'BÒv—B'Vå'VçF–ÖT†VÇF„6†V6·2†f—†VDæ÷r“° ¢76W'BæWVÂ‡&W÷'Bæ6†V6¶VDBÂf—†VDæ÷rçFô•4õ7G&–ær‚’“°¢76W'BæWVÂ‡&W÷'Bæ6†V6·2ç6öÖR‚†6†V6²’Óâ6†V6²ææÖRÓÓÒ'&÷f–FW'2"’ÂG'VR“°¢76W'BæWVÂ‡&W÷'Bæ6†V6·2ç6öÖR‚†6†V6²’Óâ6†V6²ææÖRÓÓÒ&¶æ÷vÆVFvR"’ÂG'VR“°¢76W'BæWVÂ…²&†VÇF‡’"Â&FVw&FVB"Â'Væ†VÇF‡’%Òæ–æ6ÇVFW2‡&W÷'Bç7FGW2’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖRÖöæ—F÷"6öÖ&–æW2†VÇF‚ÂÖWG&–72ÂæB&V6VçBÆöw2"À¢7–æ2'Vâ‚’°¢6ÆV%'VçF–ÖTÆöw2‚“°¢Æöu'VçF–ÖTWfVçB‡²&WVW7D–C¢'&WÖÖöæ—F÷""Â÷W&F–öã¢&Ööæ—F÷""ÂGW&F–öã¢Â7FGW3¢'7V66W72"Âv&æ–æw3¢µÒÂF–ÖW7F×¢f—†VDæ÷rçFô•4õ7G&–ær‚’Ò“°¢6öç7B6æ6†÷BÒv—BvWE'VçF–ÖTÖöæ—F÷%6æ6†÷B†f—†VDæ÷r“° ¢76W'BæWVÂ‡6æ6†÷BævVæW&FVDBÂf—†VDæ÷rçFô•4õ7G&–ær‚’“°¢76W'BæWVÂ‡6æ6†÷BæÆöw2ç6öÖR‚†VçG'’’ÓâVçG'’ç&WVW7D–BÓÓÒ'&WÖÖöæ—F÷""’ÂG'VR“°¢76W'BæWVÂ„&ööÆVâ‡6æ6†÷BçW&f÷&Öæ6Ræ66†R’ÂG'VR“°¢76W'BæWVÂ„&ööÆVâ‡6æ6†÷Bæ†VÇF‚æ6†V6·2æÆVæwF‚’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r7&VFW2÷&FW&VB7FvW2"À¢'Vâ‚’°¢76W'BæFVWWVÂ†vWEv÷&¶fÆ÷u7FvT÷&FW"‚’Â°¢&6öçG&7E÷&Wf–Wr"À¢&&÷÷&Wf–Wr"À¢'&—6µö76W76ÖVçB"À¢'Æææ–æu÷&Wf–Wr"À¢'6—FU÷&W÷'E÷&Wf–Wr"À¢&W†V7WF—fU÷7VÖÖ'’ ¢Ò“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r6Æ7VÆFW2–×ÆVÖVçFVB×7FvR&öw&W72"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡°¢&ö¦V7D–C¢&7W7FöÒ×&ö¦V7B"À¢æÇ—6W3¢°¢²G—S¢&6öçG&7E÷&Wf–Wr"ÂF—FÆS¢$6öçG&7B&Wf–Wr"Â7FGW3¢&6ö×ÆWFVB"Â6öæf–FVæ6S¢ƒÒÀ¢²G—S¢&&÷÷&Wf–Wr"ÂF—FÆS¢$$õ&Wf–Wr"Â7FGW3¢'VæF–ær"ÒÀ¢²G—S¢'&—6µö76W76ÖVçB"ÂF—FÆS¢%&—6²76W76ÖVçB"Â7FGW3¢&æ÷E÷7F'FVB"Ð¢ÒÀ¢æ÷s¢f—†VDæ÷p¢Ò“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷ræ–×ÆVÖVçFVE7FvT6÷VçBÂb“°¢76W'BæWVÂ‡v÷&¶fÆ÷ræ6ö×ÆWFVD–×ÆVÖVçFVE7FvT6÷VçBÂ“°¢76W'BæWVÂ‡v÷&¶fÆ÷ræ6ö×ÆWF–öåW&6VçFvRÂr“°¢76W'BæWVÂ‡v÷&¶fÆ÷ræ7W'&VçE7FvSòæ–BÂ&&÷÷&Wf–Wr"“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷rÆö6·27FvW2VçF–Â&Wf–÷W2–×ÆVÖVçFVB7FvW26ö×ÆWFR"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡°¢&ö¦V7D–C¢&Æö6¶VB×&ö¦V7B"À¢æÇ—6W3¢°¢²G—S¢&6öçG&7E÷&Wf–Wr"ÂF—FÆS¢$6öçG&7B&Wf–Wr"Â7FGW3¢'VæF–ær"ÒÀ¢²G—S¢&&÷÷&Wf–Wr"ÂF—FÆS¢$$õ&Wf–Wr"Â7FGW3¢'VæF–ær"ÒÀ¢²G—S¢'&—6µö76W76ÖVçB"ÂF—FÆS¢%&—6²76W76ÖVçB"Â7FGW3¢'VæF–ær"Ð¢ÒÀ¢æ÷s¢f—†VDæ÷p¢Ò“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ&6öçG&7E÷&Wf–Wr"“òæ—47W'&VçBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ&&÷÷&Wf–Wr"“òæ—4Æö6¶VBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ'Æææ–æu÷&Wf–Wr"“òæ—4Æö6¶VBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ'6—FU÷&W÷'E÷&Wf–Wr"“òæ—4Æö6¶VBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ&W†V7WF—fU÷7VÖÖ'’"“òæ—4Æö6¶VBÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r6VÆV7G2F†RæW‡Bf–Æ&ÆR7F–öâ"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡°¢&ö¦V7D–C¢&æW‡BÖ7F–öâ×&ö¦V7B"À¢æÇ—6W3¢°¢²G—S¢&6öçG&7E÷&Wf–Wr"ÂF—FÆS¢$6öçG&7B&Wf–Wr"Â7FGW3¢&6ö×ÆWFVB"Â6öæf–FVæ6S¢ƒÒÀ¢²G—S¢&&÷÷&Wf–Wr"ÂF—FÆS¢$$õ&Wf–Wr"Â7FGW3¢&6ö×ÆWFVB"Â6öæf–FVæ6S¢ƒÒÀ¢²G—S¢'&—6µö76W76ÖVçB"ÂF—FÆS¢%&—6²76W76ÖVçB"Â7FGW3¢'VæF–ær"Ð¢ÒÀ¢æ÷s¢f—†VDæ÷p¢Ò“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæÆ&VÂÂ%'Vâ&—6²76W76ÖVçB"“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâç&÷WFRÂ"÷FööÇ2÷&—6²Ö76W76ÖVçB"“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæ—4f–Æ&ÆRÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r6ö×ÆWFW2v†Vâ–×ÆVÖVçFVB7FvW2&R6ö×ÆWFR"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡²&ö¦V7D–C¢%$¢ÓC‚"Âæ÷s¢f—†VDæ÷rÒ“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷ræ6ö×ÆWF–öåW&6VçFvRÂ“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæÆ&VÂÂ$6ö×ÆWFR&ö¦V7BæÇ—6—2"“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæ—4f–Æ&ÆRÂfÇ6R“°¢76W'BæWVÂ‡&W6öÇfTæW‡D7F–öâ‡VæFVf–æVBÂ’æÆ&VÂÂ$6ö×ÆWFR&ö¦V7BæÇ—6—2"“°¢Ð¢ÒÀ¢°¢æÖS¢$WF‚&VF—&V7G266WB&÷FV7FVBÆö6Â&÷WFW2æB&V¦V7BWF‚Æö÷2÷"W‡FW&æÂU$Ç2"À¢'Vâ‚’°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"÷&ö¦V7G3÷f–WsÖ7F—fR"’Â"÷&ö¦V7G3÷f–WsÖ7F—fR"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"öÆöv–â"’Â"öF6†&ö&B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"òöW†×ÆRæ6öÒö66÷VçB"’Â"öF6†&ö&B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚&‡GG3¢òöW†×ÆRæ6öÒö66÷VçB"’Â"öF6†&ö&B"“°¢Ð¢ÒÀ¢°¢æÖS¢$WF‚W'&÷'2&Ræ÷&ÖÆ—¦VBv—F†÷WBÆV¶–ær&÷f–FW"FWF–Ç2"À¢'Vâ‚’°¢76W'BæWVÂ†g&–VæFÇ”WF„W'&÷"‚$–çfÆ–BÆöv–â7&VFVçF–Ç2"Â&Æöv–â"’Â$–æ6÷'&V7BVÖ–Â÷"77v÷&Bâ"“°¢76W'BæWVÂ†g&–VæFÇ”WF„W'&÷"‚$VÖ–Âæ÷B6öæf—&ÖVB"Â&Æöv–â"’Â$6öæf—&Ò–÷W"VÖ–Â&Vf÷&R6–væ–ær–ââ"“°¢76W'BæWVÂ†g&–VæFÇ”WF„W'&÷"‚&–çFW&æÂ&÷f–FW"W†6WF–öã¢6V7&WBFWF–Â"Â'&Vv—7FW""’Â%Væ&ÆRFò7&VFRF†R66÷VçBâ6†V6²F†RFWF–Ç2æBG'’v–ââ"“°¢76W'BæWVÂ†g&–VæFÇ”FFW'&÷"ƒC’æ–æ6ÇVFW2‚&6öÇVÖâ"’ÂfÇ6R“°¢76W'BæWVÂ†g&–VæFÇ”FFW'&÷"ƒS’Â%vR6÷VÆBæ÷BÆöB–÷W"66÷VçB–æf÷&ÖF–öââG'’v–â6†÷'FÇ’â"“°¢Ð¢ÒÀ¢°¢æÖS¢$WF‚&VF—&V7B&W7F÷&W2–çFVæFVB&÷WFW2v—F†÷WBW&Ö—GF–ærÆöv–âÆö÷2"À¢'Vâ‚’°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"öF6†&ö&B"’Â"öF6†&ö&B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"÷&ö¦V7G2õ$¢ÓCƒ÷F#ÖFö7VÖVçG26ÆFW7B"’Â"÷&ö¦V7G2õ$¢ÓCƒ÷F#ÖFö7VÖVçG26ÆFW7B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"÷&Vv—7FW#öæW‡CÒöF6†&ö&B"’Â"öF6†&ö&B"“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7BFF6÷W&6RFVfVÇG2FòWFòv†Vâ7W&6R—26öæf–wW&VB"À¢'Vâ‚’°¢76W'BæWVÂ‡&W6öÇfTFF6÷W&6TÖöFR‡VæFVf–æVBÂG'VR’Â&WFò"“°¢76W'BæWVÂ‡&W6öÇfTFF6÷W&6TÖöFR‡VæFVf–æVBÂfÇ6R’Â&FVÖò"“°¢76W'BæWVÂ‡&W6öÇfTFF6÷W&6TÖöFR‚&FVÖò"ÂG'VR’Â&FVÖò"“°¢76W'BæWVÂ‡6†÷VÆEW6TFVÖôf÷%&ö¦V7Ew&—FR‚&WFò"’ÂfÇ6R“°¢76W'BæWVÂ‡6†÷VÆEW6TFVÖôf÷%&ö¦V7Ew&—FR‚'7W&6R"’ÂfÇ6R“°¢76W'BæWVÂ‡6†÷VÆEW6TFVÖôf÷%&ö¦V7Ew&—FR‚&FVÖò"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$FVÖò&ö¦V7B7&VF–öâ&VÖ–ç2&W6öÇf&ÆR'’vÆÆW'’”BæB6ÇVr"À¢7–æ2'Vâ‚’°¢&ö¦V7DFVÖôFFW"ç&W6WE7F÷&VE&ö¦V7G2‚“°¢6öç7B7&VFVBÒv—B&ö¦V7DFVÖôFFW"æ7&VFU&ö¦V7B‡°¢÷&væ—¦F–öä–C¢&FÆ2"À¢F—FÆS¢%f–ÆÆFW7Bf÷'"À¢6ÇVs¢'f–ÆÆ×FW7B×f÷'"À¢7FGW3¢%Æææ–ær ¢Ò“°¢76W'Bæö²†7&VFVBæFFòæ–B“°¢76W'BæWVÂ‚†v—B&ö¦V7DFVÖôFFW"ævWE&ö¦V7B†7&VFVBæFFæ–B’’æFFòçF—FÆRÂ%f–ÆÆFW7Bf÷'"“°¢76W'BæWVÂ‚†v—B&ö¦V7DFVÖôFFW"ævWE&ö¦V7B‚'f–ÆÆ×FW7B×f÷'"’’æFFòæ–BÂ7&VFVBæFFæ–B“°¢76W'BæWVÂ‚†v—B&ö¦V7DFVÖôFFW"ævWE&ö¦V7G2‚’’æFFç6öÖR‚‡&ö¦V7B’Óâ&ö¦V7Bæ–BÓÓÒ7&VFVBæFFæ–B’ÂG'VR“°¢&ö¦V7DFVÖôFFW"ç&W6WE7F÷&VE&ö¦V7G2‚“°¢Ð¢Ð¥Ó° Ð Ð