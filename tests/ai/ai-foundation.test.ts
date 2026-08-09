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
import { classifyProjectDocument, createExecutiveSummaryGate, createProjectIntelligenceWorkflowSnapshot, resolveProjectNextBestAction } from "@/lib/project-intelligence-workflow";
import type { Document, Project } from "@/lib/models";

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
    name: "Unavailable requested provider is rejecteßm¼òÚ$z{-®éÜj×s¢f—†VDæ÷rÒ“°¢6öç7B—Ò6†V6´•&FTÆ–Ö—B‡²—¢##rããã"ÂVæGö–çC¢'6V&6‚"Â6öæf–s¢²Æ–Ö—C¢Âv–æF÷t×3¢Â66÷S¢&—"ÒÂæ÷s¢f—†VDæ÷rÒ“° ¢76W'BæWVÂ†f—'7BæÆÆ÷vVBÂG'VR“°¢76W'BæWVÂ‡6V6öæBæÆÆ÷vVBÂG'VR“°¢76W'BæWVÂ‡F†—&BæÆÆ÷vVBÂfÇ6R“°¢76W'BæWVÂ†–çFW&æÂæÆÆ÷vVBÂG'VR“°¢76W'BæWVÂ†–çFW&æÂç6fTfÆÆ&6²ÂG'VR“°¢76W'BæWVÂ†—æ¶W’æ–æ6ÇVFW2‚##rããã"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖRÆövvW"&VF7G26V7&WG2æBæ÷&ÖÆ—¦W2W'&÷'2"À¢'Vâ‚’°¢6ÆV%'VçF–ÖTÆöw2‚“°¢6öç7BVçG'’ÒÆöu'VçF–ÖTWfVçB‡°¢&WVW7D–C¢'&W×FW7B"À¢&ö¦V7D–C¢%$¢ÔÄôr"À¢÷væW$–C¢&÷væW"Ó"À¢÷W&F–öã¢'FW7Eö÷W&F–öâ"À¢GW&F–öã¢C"À¢&÷f–FW#¢&Öö6²"À¢7FGW3¢'7V66W72"À¢v&æ–æw3¢²'6fRv&æ–ær%ÒÀ¢ÖWFFF¢²”¶W“¢'6V7&WB×fÇVR"ÂæW7FVC¢²WF†÷&—¦F–öã¢$&V&W"Fö¶Vâ"Âf—6–&ÆS¢&ö²"ÒÒÀ¢F–ÖW7F×¢f—†VDæ÷rçFô•4õ7G&–ær‚¢Ò“°¢6öç7B&÷f–FW$W'&÷"Òæ÷&ÖÆ—¦U'VçF–ÖTW'&÷"†æWrW'&÷"‚$÷Vä’&÷f–FW"f–ÆVB"’“°¢6öç7BfÆ–FF–öäW'&÷"Òæ÷&ÖÆ—¦U'VçF–ÖTW'&÷"†æWrW'&÷"‚'&WV—&VBf–VÆBÖ—76–ær"’“° ¢76W'BæWVÂ†VçG'’æÖWFFFæ”¶W’Â%µ$TD5DTEÒ"“°¢76W'BæFVWWVÂ‚†VçG'’æÖWFFFææW7FVB2&V6÷&CÇ7G&–ærÂVæ¶æ÷vãâ’æWF†÷&—¦F–öâÂ%µ$TD5DTEÒ"“°¢76W'BæWVÂ‚†VçG'’æÖWFFFææW7FVB2&V6÷&CÇ7G&–ærÂVæ¶æ÷vãâ’çf—6–&ÆRÂ&ö²"“°¢76W'BæWVÂ†Æ—7E'VçF–ÖTÆöw2ƒ•³Òç&WVW7D–BÂ'&W×FW7B"“°¢76W'BæWVÂ‡&÷f–FW$W'&÷"æ6FVv÷'’Â%&÷f–FW""“°¢76W'BæWVÂ‡fÆ–FF–öäW'&÷"æ6FVv÷'’Â%fÆ–FF–öâ"“°¢Ð¢ÒÀ¢°¢æÖS¢%W&f÷&Öæ6RÖWG&–72vw&VvFRÆFVæ7’æB66†R–æf÷&ÖF–öâ"À¢7–æ2'Vâ‚’°¢6ÆV%W&f÷&Öæ6TÖWG&–72‚“°¢6ÆV%&WVW7D66†R‚“°¢&V6÷&EW&f÷&Öæ6TÖWG&–2‚&¶æ÷vÆVFvU÷&WG&–WfÂ"Â#“°¢&V6÷&EW&f÷&Öæ6TÖWG&–2‚&¶æ÷vÆVFvU÷&WG&–WfÂ"ÂC“°¢v—BÖV7W&UW&f÷&Öæ6R‚&Fö7VÖVçE÷'6–ær"Â7–æ2‚’Óâ&ö²"Â‚’Óâ“°¢6WE&WVW7D66†R‚&ÖWG&–2"Â'fÇVR"ÂÂf—†VDæ÷r“°¢vWE&WVW7D66†R‚&ÖWG&–2"Âf—†VDæ÷r“°¢6öç7BÖWG&–2ÒvWEW&f÷&Öæ6TÖWG&–2‚&¶æ÷vÆVFvU÷&WG&–WfÂ"“°¢6öç7B6æ6†÷BÒvWEW&f÷&Öæ6TÖWG&–72‚“° ¢76W'BæWVÂ†ÖWG&–3òæ6÷VçBÂ"“°¢76W'BæWVÂ†ÖWG&–3òæfW&vTÆFVæ7”×2Â3“°¢76W'BæWVÂ‡6æ6†÷Bæ66†Ræ†—E&FRÂ“°¢76W'BæWVÂ‡6æ6†÷Bæ÷W&F–öç2ç6öÖR‚†—FVÒ’Óâ—FVÒæ÷W&F–öâÓÓÒ&Fö7VÖVçE÷'6–ær"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖR†VÇF‚6†V6·2&öGV6Râ÷fW&ÆÂ†VÇF‚&W÷'B"À¢7–æ2'Vâ‚’°¢6öç7B&W÷'BÒv—B'Vå'VçF–ÖT†VÇF„6†V6·2†f—†VDæ÷r“° ¢76W'BæWVÂ‡&W÷'Bæ6†V6¶VDBÂf—†VDæ÷rçFô•4õ7G&–ær‚’“°¢76W'BæWVÂ‡&W÷'Bæ6†V6·2ç6öÖR‚†6†V6²’Óâ6†V6²ææÖRÓÓÒ'&÷f–FW'2"’ÂG'VR“°¢76W'BæWVÂ‡&W÷'Bæ6†V6·2ç6öÖR‚†6†V6²’Óâ6†V6²ææÖRÓÓÒ&¶æ÷vÆVFvR"’ÂG'VR“°¢76W'BæWVÂ…²&†VÇF‡’"Â&FVw&FVB"Â'Væ†VÇF‡’%Òæ–æ6ÇVFW2‡&W÷'Bç7FGW2’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢%'VçF–ÖRÖöæ—F÷"6öÖ&–æW2†VÇF‚ÂÖWG&–72ÂæB&V6VçBÆöw2"À¢7–æ2'Vâ‚’°¢6ÆV%'VçF–ÖTÆöw2‚“°¢Æöu'VçF–ÖTWfVçB‡²&WVW7D–C¢'&WÖÖöæ—F÷""Â÷W&F–öã¢&Ööæ—F÷""ÂGW&F–öã¢Â7FGW3¢'7V66W72"Âv&æ–æw3¢µÒÂF–ÖW7F×¢f—†VDæ÷rçFô•4õ7G&–ær‚’Ò“°¢6öç7B6æ6†÷BÒv—BvWE'VçF–ÖTÖöæ—F÷%6æ6†÷B†f—†VDæ÷r“° ¢76W'BæWVÂ‡6æ6†÷BævVæW&FVDBÂf—†VDæ÷rçFô•4õ7G&–ær‚’“°¢76W'BæWVÂ‡6æ6†÷BæÆöw2ç6öÖR‚†VçG'’’ÓâVçG'’ç&WVW7D–BÓÓÒ'&WÖÖöæ—F÷""’ÂG'VR“°¢76W'BæWVÂ„&ööÆVâ‡6æ6†÷BçW&f÷&Öæ6Ræ66†R’ÂG'VR“°¢76W'BæWVÂ„&ööÆVâ‡6æ6†÷Bæ†VÇF‚æ6†V6·2æÆVæwF‚’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r7&VFW2÷&FW&VB7FvW2"À¢'Vâ‚’°¢76W'BæFVWWVÂ†vWEv÷&¶fÆ÷u7FvT÷&FW"‚’Â°¢&6öçG&7E÷&Wf–Wr"À¢&&÷÷&Wf–Wr"À¢'&—6µö76W76ÖVçB"À¢'Æææ–æu÷&Wf–Wr"À¢'6—FU÷&W÷'E÷&Wf–Wr"À¢&W†V7WF—fU÷7VÖÖ'’ ¢Ò“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r6Æ7VÆFW2–×ÆVÖVçFVB×7FvR&öw&W72"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡°¢&ö¦V7D–C¢&7W7FöÒ×&ö¦V7B"À¢æÇ—6W3¢°¢²G—S¢&6öçG&7E÷&Wf–Wr"ÂF—FÆS¢$6öçG&7B&Wf–Wr"Â7FGW3¢&6ö×ÆWFVB"Â6öæf–FVæ6S¢ƒÒÀ¢²G—S¢&&÷÷&Wf–Wr"ÂF—FÆS¢$$õ&Wf–Wr"Â7FGW3¢'VæF–ær"ÒÀ¢²G—S¢'&—6µö76W76ÖVçB"ÂF—FÆS¢%&—6²76W76ÖVçB"Â7FGW3¢&æ÷E÷7F'FVB"Ð¢ÒÀ¢æ÷s¢f—†VDæ÷p¢Ò“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷ræ–×ÆVÖVçFVE7FvT6÷VçBÂb“°¢76W'BæWVÂ‡v÷&¶fÆ÷ræ6ö×ÆWFVD–×ÆVÖVçFVE7FvT6÷VçBÂ“°¢76W'BæWVÂ‡v÷&¶fÆ÷ræ6ö×ÆWF–öåW&6VçFvRÂr“°¢76W'BæWVÂ‡v÷&¶fÆ÷ræ7W'&VçE7FvSòæ–BÂ&&÷÷&Wf–Wr"“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷rÆö6·27FvW2VçF–Â&Wf–÷W2–×ÆVÖVçFVB7FvW26ö×ÆWFR"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡°¢&ö¦V7D–C¢&Æö6¶VB×&ö¦V7B"À¢æÇ—6W3¢°¢²G—S¢&6öçG&7E÷&Wf–Wr"ÂF—FÆS¢$6öçG&7B&Wf–Wr"Â7FGW3¢'VæF–ær"ÒÀ¢²G—S¢&&÷÷&Wf–Wr"ÂF—FÆS¢$$õ&Wf–Wr"Â7FGW3¢'VæF–ær"ÒÀ¢²G—S¢'&—6µö76W76ÖVçB"ÂF—FÆS¢%&—6²76W76ÖVçB"Â7FGW3¢'VæF–ær"Ð¢ÒÀ¢æ÷s¢f—†VDæ÷p¢Ò“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ&6öçG&7E÷&Wf–Wr"“òæ—47W'&VçBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ&&÷÷&Wf–Wr"“òæ—4Æö6¶VBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ'Æææ–æu÷&Wf–Wr"“òæ—4Æö6¶VBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ'6—FU÷&W÷'E÷&Wf–Wr"“òæ—4Æö6¶VBÂG'VR“°¢76W'BæWVÂ‡v÷&¶fÆ÷rç7FvW2æf–æB‚‡7FvR’Óâ7FvRæ–BÓÓÒ&W†V7WF—fU÷7VÖÖ'’"“òæ—4Æö6¶VBÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r6VÆV7G2F†RæW‡Bf–Æ&ÆR7F–öâ"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡°¢&ö¦V7D–C¢&æW‡BÖ7F–öâ×&ö¦V7B"À¢æÇ—6W3¢°¢²G—S¢&6öçG&7E÷&Wf–Wr"ÂF—FÆS¢$6öçG&7B&Wf–Wr"Â7FGW3¢&6ö×ÆWFVB"Â6öæf–FVæ6S¢ƒÒÀ¢²G—S¢&&÷÷&Wf–Wr"ÂF—FÆS¢$$õ&Wf–Wr"Â7FGW3¢&6ö×ÆWFVB"Â6öæf–FVæ6S¢ƒÒÀ¢²G—S¢'&—6µö76W76ÖVçB"ÂF—FÆS¢%&—6²76W76ÖVçB"Â7FGW3¢'VæF–ær"Ð¢ÒÀ¢æ÷s¢f—†VDæ÷p¢Ò“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæÆ&VÂÂ%'Vâ&—6²76W76ÖVçB"“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâç&÷WFRÂ"÷FööÇ2÷&—6²Ö76W76ÖVçB"“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæ—4f–Æ&ÆRÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$wV–FVBæÇ—6—2v÷&¶fÆ÷r6ö×ÆWFW2v†Vâ–×ÆVÖVçFVB7FvW2&R6ö×ÆWFR"À¢'Vâ‚’°¢6öç7B6W76–öâÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6U6W76–öâ‡²&ö¦V7D–C¢%$¢ÓC‚"Âæ÷s¢f—†VDæ÷rÒ“°¢6öç7Bv÷&¶fÆ÷rÒ7&VFTæÇ—6—5v÷&¶fÆ÷r‡6W76–öâ“° ¢76W'BæWVÂ‡v÷&¶fÆ÷ræ6ö×ÆWF–öåW&6VçFvRÂ“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæÆ&VÂÂ$6ö×ÆWFR&ö¦V7BæÇ—6—2"“°¢76W'BæWVÂ‡v÷&¶fÆ÷rææW‡D7F–öâæ—4f–Æ&ÆRÂfÇ6R“°¢76W'BæWVÂ‡&W6öÇfTæW‡D7F–öâ‡VæFVf–æVBÂ’æÆ&VÂÂ$6ö×ÆWFR&ö¦V7BæÇ—6—2"“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7B–çFVÆÆ–vVæ6Rv÷&¶fÆ÷r&W6W'fW2V×G’&ö¦V7B6öçFW‡Bv—F†÷WB–çfVçF–ærWf–FVæ6R"À¢'Vâ‚’°¢õ÷&W6WE&ö¦V7DæÇ—6—57F÷&vR‚“°¢6öç7B&ö¦V7C¢&ö¦V7BÒ²–C¢%$¢Õtõ$´dÄõr"ÂF—FÆS¢%&VÂ&ö¦V7B"ÂG—S¢%&W6–FVçF–Â"Â7FGW3¢%Æææ–ær"Â†6S¢%Æææ–ær"ÂWFFVDC¢f—†VDæ÷rçFô•4õ7G&–ær‚’Â66÷&S¢Â'VFvWC¢""ÂF–ÖVÆ–æS¢""ÂFVÓ¢ÂFö7VÖVçG3¢Â¶æ÷vÆVFvTf–ÆW3¢ÂÆö6F–öã¢$66&Ææ6"ÂFW67&—F–öã¢%W'6—7FVB&ö¦V7B6öçFW‡B"Ó°¢6öç7B6æ6†÷BÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6Uv÷&¶fÆ÷u6æ6†÷B‡&ö¦V7BÂµÒÂvWE&ö¦V7DæÇ—6—57FFR‡&ö¦V7Bæ–BÂ&÷væW"Ó"’“° ¢76W'BæWVÂ‡6æ6†÷Bæ6öçFW‡BææÖRÂ%&VÂ&ö¦V7B"“°¢76W'BæWVÂ‡6æ6†÷Bæ6öçFW‡BæÆö6F–öâÂ$66&Ææ6"“°¢76W'BæWVÂ‡6æ6†÷BæWf–FVæ6RæÆVæwF‚Â“°¢76W'BæFVWWVÂ‡6æ6†÷BæÖ—76–ætWf–FVæ6RÂ²&6öçG&7B"Â&&÷"Â'Æææ–ær"Â'6—FU÷&W÷'B%Ò“°¢76W'BæWVÂ‡6æ6†÷BææW‡D7F–öâçG—RÂ&FEöWf–FVæ6R"“°¢76W'BæWVÂ‡6æ6†÷BææW‡D7F–öâç&÷WFRÂ"÷FööÇ2ö6öçG&7B×&Wf–Ws÷&ö¦V7D–CÕ$¢Õtõ$´dÄõr"“°¢76W'BæWVÂ‡6æ6†÷BæW†V7WF—fU7VÖÖ'’æ6ävVæW&FU'F–ÂÂfÇ6R“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7B–çFVÆÆ–vVæ6RFWFV7G27W÷'FVBWf–FVæ6RæBÖWFFFÖöæÇ’W‡G&7F–öâ†öæW7FÇ’"À¢'Vâ‚’°¢õ÷&W6WE&ö¦V7DæÇ—6—57F÷&vR‚“°¢6öç7B&ö¦V7C¢&ö¦V7BÒ²–C¢%$¢ÔUd”DTä4R"ÂF—FÆS¢$Wf–FVæ6R&ö¦V7B"ÂG—S¢$6öÖÖW&6–Â"Â7FGW3¢$W†V7WF–öâ"Â†6S¢$W†V7WF–öâ"ÂWFFVDC¢f—†VDæ÷rçFô•4õ7G&–ær‚’Â66÷&S¢Â'VFvWC¢""ÂF–ÖVÆ–æS¢""ÂFVÓ¢ÂFö7VÖVçG3¢"Â¶æ÷vÆVFvTf–ÆW3¢Ó°¢6öç7BFö7VÖVçG3¢Fö7VÖVçEµÒÒ°¢²–C¢$Dô2Ô4ôåE$5B"Â&ö¦V7D–C¢&ö¦V7Bæ–BÂF—FÆS¢$Ö–â6öçG&7B"Âf–ÆVæÖS¢&6öçG&7BçFb"ÂG—S¢$6öçG&7B"Â6FVv÷'“¢$6öçG&7G2"Â7FGW3¢%6fVB"Â6öçFVçC¢$6öçG&7B6ÆW6W2"Â7&VFVDC¢f—†VDæ÷rçFô•4õ7G&–ær‚’ÒÀ¢²–C¢$Dô2Ô$õ"Â&ö¦V7D–C¢&ö¦V7Bæ–BÂF—FÆS¢%&ö¦V7B$õ"Âf–ÆVæÖS¢&&÷ç†Ç7‚"ÂG—S¢$Fö7VÖVçB"Â6FVv÷'“¢$$õ"Â7FGW3¢%6fVB"Â7&VFVDC¢f—†VDæ÷rçFô•4õ7G&–ær‚’Ð¢Ó°¢6öç7B6öçG&7DæÇ—6—2Ò6fTæÇ—6—2‡²&ö¦V7D–C¢&ö¦V7Bæ–BÂ÷væW$–C¢&÷væW"Ó"ÂFööÅG—S¢&6öçG&7E÷&Wf–Wr"Â7FGW3¢&6ö×ÆWFVB"ÂæÇ—6—5&W7VÇC¢²7VÖÖ'“¢%&Wf–WvVB"ÒÂæ÷s¢f—†VDæ÷rÂÖWFFF¢²6÷W&6S¢'FW7B"ÒÒ“°¢6öç7B6æ6†÷BÒ7&VFU&ö¦V7D–çFVÆÆ–vVæ6Uv÷&¶fÆ÷u6æ6†÷B‡&ö¦V7BÂFö7VÖVçG2ÂvWE&ö¦V7DæÇ—6—57FFR‡&ö¦V7Bæ–BÂ&÷væW"Ó"’“° ¢76W'BæWVÂ†6Æ76–g•&ö¦V7DFö7VÖVçB†Fö7VÖVçG5³Ò’Â&6öçG&7B"“°¢76W'BæWVÂ†6Æ76–g•&ö¦V7DFö7VÖVçB†Fö7VÖVçG5³Ò’Â&&÷"“°¢76W'BæWVÂ‡6æ6†÷BæWf–FVæ6Ræf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ$Dô2Ô4ôåE$5B"“òæf–Æ&–Æ—G’Â&f–Æ&ÆR"“°¢76W'BæWVÂ‡6æ6†÷BæWf–FVæ6Ræf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ$Dô2Ô4ôåE$5B"“òæÆ–æ¶VDæÇ—6—4–BÂ6öçG&7DæÇ—6—2æ–B“°¢76W'BæWVÂ‡6æ6†÷BæWf–FVæ6Ræf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ$Dô2Ô4ôåE$5B"“òææÇ—6—57FGW2Â&6ö×ÆWFVB"“°¢76W'BæWVÂ‡6æ6†÷BæWf–FVæ6Ræf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ$Dô2Ô$õ"“òæf–Æ&–Æ—G’Â&ÖWFFFööæÇ’"“°¢76W'BæFVWWVÂ‡6æ6†÷BæÖ—76–ætWf–FVæ6RÂ²'Æææ–ær"Â'6—FU÷&W÷'B%Ò“°¢76W'BæWVÂ†vWE&ö¦V7DæÇ—6—57FFR‡&ö¦V7Bæ–BÂ&F–ffW&VçBÖ÷væW""’æ†—7F÷'’æÆVæwF‚Â“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7B–çFVÆÆ–vVæ6R&W7VÖW2Væf–æ—6†VBW'6—7FVBæÇ—6—2v—F‚6ö×ÆWFR&÷WFR6öçFW‡B"À¢'Vâ‚’°¢õ÷&W6WE&ö¦V7DæÇ—6—57F÷&vR‚“°¢6öç7BVæF–ærÒ6fTæÇ—6—2‡²&ö¦V7D–C¢%$¢Õ$U5TÔRÔ4ôåDU…B"Â÷væW$–C¢&÷væW"Ó"ÂFööÅG—S¢'Æææ–æu÷&Wf–Wr"Â7FGW3¢'VæF–ær"ÂæÇ—6—5&W7VÇC¢²G&gC¢G'VRÒÂæ÷s¢f—†VDæ÷rÂÖWFFF¢²6÷W&6S¢'FW7B"ÒÒ“°¢6öç7B7FFRÒvWE&ö¦V7DæÇ—6—57FFR‚%$¢Õ$U5TÔRÔ4ôåDU…B"Â&÷væW"Ó"“°¢6öç7B7F–öâÒ&W6öÇfU&ö¦V7DæW‡D&W7D7F–öâ‚%$¢Õ$U5TÔRÔ4ôåDU…B"ÂµÒÂ7FFR“° ¢76W'BæWVÂ†7F–öâçG—RÂ'&W7VÖUöæÇ—6—2"“°¢76W'Bæö²†7F–öâç&÷WFSòæ–æ6ÇVFW2†6W76–öä–CÒG¶Væ6öFUU$”6ö×öæVçB‡VæF–ærç6W76–öä–B—Ö’“°¢76W'Bæö²†7F–öâç&÷WFSòæ–æ6ÇVFW2†æÇ—6—4–CÒG¶Væ6öFUU$”6ö×öæVçB‡VæF–æræ–B—Ö’“°¢76W'Bæö²†7F–öâç&÷WFSòæ–æ6ÇVFW2‚'fW'6–öãÓ"’“°¢76W'Bæö²†7F–öâç&÷WFSòæ–æ6ÇVFW2‚'&ö¦V7D–CÕ$¢Õ$U5TÔRÔ4ôåDU…B"’“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7B–çFVÆÆ–vVæ6Rv÷&¶fÆ÷r&öw&W76–öâæBW†V7WF—fR7VÖÖ'’vF–ærW6R6ö×ÆWFVBÆFW7BæÇ—6W2"À¢'Vâ‚’°¢õ÷&W6WE&ö¦V7DæÇ—6—57F÷&vR‚“°¢6öç7B&ö¦V7D–BÒ%$¢ÔtDR#°¢6öç7BG—W2Ò²&6öçG&7E÷&Wf–Wr"Â&&÷÷&Wf–Wr"Â'&—6µö76W76ÖVçB"Â'Æææ–æu÷&Wf–Wr"Â'6—FU÷&W÷'E÷&Wf–Wr%Ò26öç7C°¢G—W2æf÷$V6‚‚‡FööÅG—RÂ–æFW‚’Óâ6fTæÇ—6—2‡²&ö¦V7D–BÂ÷væW$–C¢&÷væW"Ó"ÂFööÅG—RÂ7FGW3¢&6ö×ÆWFVB"ÂæÇ—6—5&W7VÇC¢²–æFW‚ÒÂ6öæf–FVæ6S¢s²–æFW‚Âæ÷s¢æWrFFR†f—†VDæ÷rævWEF–ÖR‚’²–æFW‚¢’ÂÖWFFF¢²6÷W&6S¢'FW7B"ÒÒ’“°¢6öç7B7FFRÒvWE&ö¦V7DæÇ—6—57FFR‡&ö¦V7D–BÂ&÷væW"Ó"“°¢6öç7BvFRÒ7&VFTW†V7WF—fU7VÖÖ'”vFR‡7FFR“°¢6öç7B7F–öâÒ&W6öÇfU&ö¦V7DæW‡D&W7D7F–öâ‡&ö¦V7D–BÂµÒÂ7FFR“° ¢76W'BæWVÂ‡7FFRæÆFW7DæÇ—6W2æÆVæwF‚ÂR“°¢76W'BæWVÂ‡7FFRæ†—7F÷'’æÆVæwF‚ÂR“°¢76W'BæWVÂ†vFRæWf–FVæ6T&6¶VBÂG'VR“°¢76W'BæWVÂ†vFRæ6ö×ÆWFVæW72Â“°¢76W'BæWVÂ†7F–öâçG—RÂ&vVæW&FU÷7VÖÖ'’"“°¢76W'BæWVÂ†7F–öâç&÷WFRÂ÷FööÇ2öW†V7WF—fR×7VÖÖ'“÷&ö¦V7D–CÒG·&ö¦V7D–GÖ“°¢Ð¢ÒÀ¢°¢æÖS¢$WF‚&VF—&V7G266WB&÷FV7FVBÆö6Â&÷WFW2æB&V¦V7BWF‚Æö÷2÷"W‡FW&æÂU$Ç2"À¢'Vâ‚’°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"÷&ö¦V7G3÷f–WsÖ7F—fR"’Â"÷&ö¦V7G3÷f–WsÖ7F—fR"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"öÆöv–â"’Â"öF6†&ö&B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"òöW†×ÆRæ6öÒö66÷VçB"’Â"öF6†&ö&B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚&‡GG3¢òöW†×ÆRæ6öÒö66÷VçB"’Â"öF6†&ö&B"“°¢Ð¢ÒÀ¢°¢æÖS¢$WF‚W'&÷'2&Ræ÷&ÖÆ—¦VBv—F†÷WBÆV¶–ær&÷f–FW"FWF–Ç2"À¢'Vâ‚’°¢76W'BæWVÂ†g&–VæFÇ”WF„W'&÷"‚$–çfÆ–BÆöv–â7&VFVçF–Ç2"Â&Æöv–â"’Â$–æ6÷'&V7BVÖ–Â÷"77v÷&Bâ"“°¢76W'BæWVÂ†g&–VæFÇ”WF„W'&÷"‚$VÖ–Âæ÷B6öæf—&ÖVB"Â&Æöv–â"’Â$6öæf—&Ò–÷W"VÖ–Â&Vf÷&R6–væ–ær–ââ"“°¢76W'BæWVÂ†g&–VæFÇ”WF„W'&÷"‚&–çFW&æÂ&÷f–FW"W†6WF–öã¢6V7&WBFWF–Â"Â'&Vv—7FW""’Â%Væ&ÆRFò7&VFRF†R66÷VçBâ6†V6²F†RFWF–Ç2æBG'’v–ââ"“°¢76W'BæWVÂ†g&–VæFÇ”FFW'&÷"ƒC’æ–æ6ÇVFW2‚&6öÇVÖâ"’ÂfÇ6R“°¢76W'BæWVÂ†g&–VæFÇ”FFW'&÷"ƒS’Â%vR6÷VÆBæ÷BÆöB–÷W"66÷VçB–æf÷&ÖF–öââG'’v–â6†÷'FÇ’â"“°¢Ð¢ÒÀ¢°¢æÖS¢$WF‚&VF—&V7B&W7F÷&W2–çFVæFVB&÷WFW2v—F†÷WBW&Ö—GF–ærÆöv–âÆö÷2"À¢'Vâ‚’°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"öF6†&ö&B"’Â"öF6†&ö&B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"÷&ö¦V7G2õ$¢ÓCƒ÷F#ÖFö7VÖVçG26ÆFW7B"’Â"÷&ö¦V7G2õ$¢ÓCƒ÷F#ÖFö7VÖVçG26ÆFW7B"“°¢76W'BæWVÂ‡6fTWF…&VF—&V7B‚"÷&Vv—7FW#öæW‡CÒöF6†&ö&B"’Â"öF6†&ö&B"“°¢Ð¢ÒÀ¢°¢æÖS¢%&ö¦V7BFF6÷W&6RFVfVÇG2FòWFòv†Vâ7W&6R—26öæf–wW&VB"À¢'Vâ‚’°¢76W'BæWVÂ‡&W6öÇfTFF6÷W&6TÖöFR‡VæFVf–æVBÂG'VR’Â&WFò"“°¢76W'BæWVÂ‡&W6öÇfTFF6÷W&6TÖöFR‡VæFVf–æVBÂfÇ6R’Â&FVÖò"“°¢76W'BæWVÂ‡&W6öÇfTFF6÷W&6TÖöFR‚&FVÖò"ÂG'VR’Â&FVÖò"“°¢76W'BæWVÂ‡6†÷VÆEW6TFVÖôf÷%&ö¦V7Ew&—FR‚&WFò"’ÂfÇ6R“°¢76W'BæWVÂ‡6†÷VÆEW6TFVÖôf÷%&ö¦V7Ew&—FR‚'7W&6R"’ÂfÇ6R“°¢76W'BæWVÂ‡6†÷VÆEW6TFVÖôf÷%&ö¦V7Ew&—FR‚&FVÖò"’ÂG'VR“°¢Ð¢ÒÀ¢°¢æÖS¢$FVÖò&ö¦V7B7&VF–öâ&VÖ–ç2&W6öÇf&ÆR'’vÆÆW'’”BæB6ÇVr"À¢7–æ2'Vâ‚’°¢&ö¦V7DFVÖôFFW"ç&W6WE7F÷&VE&ö¦V7G2‚“°¢6öç7B7&VFVBÒv—B&ö¦V7DFVÖôFFW"æ7&VFU&ö¦V7B‡°¢÷&væ—¦F–öä–C¢&FÆ2"À¢F—FÆS¢%f–ÆÆFW7Bf÷'"À¢6ÇVs¢'f–ÆÆ×FW7B×f÷'"À¢7FGW3¢%Æææ–ær ¢Ò“°¢76W'Bæö²†7&VFVBæFFòæ–B“°¢76W'BæWVÂ‚†v—B&ö¦V7DFVÖôFFW"ævWE&ö¦V7B†7&VFVBæFFæ–B’’æFFòçF—FÆRÂ%f–ÆÆFW7Bf÷'"“°¢76W'BæWVÂ‚†v—B&ö¦V7DFVÖôFFW"ævWE&ö¦V7B‚'f–ÆÆ×FW7B×f÷'"’’æFFòæ–BÂ7&VFVBæFFæ–B“°¢76W'BæWVÂ‚†v—B&ö¦V7DFVÖôFFW"ævWE&ö¦V7G2‚’’æFFç6öÖR‚‡&ö¦V7B’Óâ&ö¦V7Bæ–BÓÓÒ7&VFVBæFFæ–B’ÂG'VR“°¢&ö¦V7DFVÖôFFW"ç&W6WE7F÷&VE&ö¦V7G2‚“°¢Ð¢Ð¥Ó° Ð Ð 