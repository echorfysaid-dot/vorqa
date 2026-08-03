import {
  inferDocumentType,
  normalizeDocument,
  type DocumentContent,
  type DocumentDescriptor,
  type DocumentMetadata,
  type DocumentType
} from "@/lib/document-intelligence";
import { parseDocumentWithAdapter } from "@/lib/document-parser-adapters";
import {
  executeVoraIntelligence,
  executeVoraIntelligenceSafe,
  type VoraIntelligenceExecutionRequest,
  type VoraIntelligenceExecutionWarning,
  type VoraNormalizedIntelligenceResponse
} from "@/lib/vora-intelligence-service";

export type ContractReviewDocumentInput = Readonly<{
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  text?: string;
}>;

export type ContractReviewExecutionRequest = Readonly<
  Omit<VoraIntelligenceExecutionRequest, "taskIntent" | "documents" | "documentMetadata" | "documentContent" | "userRequest"> & {
    document?: ContractReviewDocumentInput;
    reviewerNotes?: string;
  }
>;

export type ContractReviewValidationErrorCode = "missing_document" | "unsupported_document" | "empty_available_text";

export type ContractReviewValidationError = Readonly<{
  code: ContractReviewValidationErrorCode;
  message: string;
}>;

export type ContractReviewPreparation = Readonly<{
  valid: boolean;
  errors: readonly ContractReviewValidationError[];
  warnings: readonly VoraIntelligenceExecutionWarning[];
  descriptor?: DocumentDescriptor;
  documentContent?: DocumentContent;
  documentMetadata?: DocumentMetadata;
  userRequest?: string;
}>;

export type ContractReviewStructuredResult = Readonly<{
  executiveSummary: string;
  contractOverview: string;
  keyClauses: readonly string[];
  potentialRisks: readonly string[];
  missingInformation: readonly string[];
  itemsRequiringReview: readonly string[];
  recommendedActions: readonly string[];
  confidence: VoraNormalizedIntelligenceResponse["confidence"];
  warnings: readonly VoraIntelligenceExecutionWarning[];
}>;

export type ContractReviewResponse = VoraNormalizedIntelligenceResponse &
  Readonly<{
    contractReview?: ContractReviewStructuredResult;
  }>;

const supportedContractTypes: readonly DocumentType[] = ["txt", "markdown", "pdf", "docx", "contract"];
const textReadableTypes: readonly DocumentType[] = ["txt", "markdown"];
const maxContractCharacters = 12_000;

function createWarning(code: string, message: string, severity: VoraIntelligenceExecutionWarning["severity"] = "warning"): VoraIntelligenceExecutionWarning {
  return { code, message, severity };
}

function truncateContractText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (normalized.length <= maxContractCharacters) return { text: normalized, truncated: false };
  return {
    text: `${normalized.slice(0, maxContractCharacters - 40).trimEnd()}\n[CONTRACT_TEXT_TRUNCATED]`,
    truncated: true
  };
}

function createDescriptor(document: ContractReviewDocumentInput): DocumentDescriptor {
  const inferredType = inferDocumentType({
    mimeType: document.mimeType,
    name: document.name,
    category: "contract"
  });

  return normalizeDocument({
    id: `contract-review:${document.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document"}`,
    name: document.name,
    type: inferredType,
    source: "upload",
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    metadata: {
      title: document.name,
      category: "contract",
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      sourceName: document.name,
      tags: ["contract", "review"]
    }
  });
}

function buildContractReviewRequest(input: {
  descriptor: DocumentDescriptor;
  availableText?: string;
  reviewerNotes?: string;
  warnings: readonly VoraIntelligenceExecutionWarning[];
}) {
  const textNotice = input.availableText
    ? "The following contract text was supplied by the user and is the only available source text for this review."
    : "No extracted contract text is available. Do not infer missing clauses. Explain that the review is limited to metadata and placeholders.";

  return [
    "Review this construction contract using VORA Intelligence.",
    "",
    "Important safety rules:",
    "- Do not provide legal advice.",
    "- Do not invent contract clauses.",
    "- Do not invent extracted text.",
    "- If parsing is unavailable, state that analysis is based only on available text and metadata.",
    "",
    "Required output sections:",
    "- Executive Summary",
    "- Contract Overview",
    "- Key Clauses",
    "- Potential Risks",
    "- Missing Information",
    "- Items Requiring Review",
    "- Recommended Actions",
    "- Confidence",
    "- Warnings",
    "",
    `Document name: ${input.descriptor.name}`,
    `Document type: ${input.descriptor.type}`,
    `MIME type: ${input.descriptor.mimeType || "unknown"}`,
    `Available text status: ${input.availableText ? "available" : "unavailable"}`,
    input.warnings.length ? `Warnings: ${input.warnings.map((warning) => warning.message).join(" | ")}` : "",
    input.reviewerNotes ? `Reviewer notes: ${input.reviewerNotes}` : "",
    "",
    textNotice,
    input.availableText ? `\n--- CONTRACT TEXT START ---\n${input.availableText}\n--- CONTRACT TEXT END ---` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export async function prepareContractReview(request: ContractReviewExecutionRequest): Promise<ContractReviewPreparation> {
  const document = request.document;
  if (!document) {
    return {
      valid: false,
      errors: [{ code: "missing_document", message: "A contract document is required for Contract Review." }],
      warnings: []
    };
  }

  const descriptor = createDescriptor(document);
  if (!supportedContractTypes.includes(descriptor.type)) {
    return {
      valid: false,
      errors: [{ code: "unsupported_document", message: "Contract Review currently supports TXT, Markdown, PDF placeholder, and DOCX placeholder documents." }],
      warnings: [createWarning("unsupported_document", `Unsupported document type: ${descriptor.type}.`, "critical")],
      descriptor
    };
  }

  const warnings: VoraIntelligenceExecutionWarning[] = [];
  const readable = textReadableTypes.includes(descriptor.type);
  const truncated = truncateContractText(document.text || "");
  const availableText = readable ? truncated.text : "";

  if (readable && !availableText) {
    return {
      valid: false,
      errors: [{ code: "empty_available_text", message: "TXT and Markdown contract files must contain readable text." }],
      warnings: [createWarning("empty_available_text", "The uploaded text document did not contain readable contract text.", "warning")],
      descriptor
    };
  }

  if (!readable) {
    warnings.push(
      createWarning(
        "parser_placeholder_only",
        `${descriptor.type.toUpperCase()} parsing is not available yet. VORA will not invent extracted text and will base the review on metadata and user-provided notes only.`,
        "warning"
      )
    );
  }

  if (truncated.truncated) {
    warnings.push(createWarning("contract_text_truncated", "The contract text was truncated before entering the AI runtime length controls.", "warning"));
  }

  const documentContent: DocumentContent = availableText
    ? {
        text: availableText,
        status: "normalized"
      }
    : {
        status: "placeholder"
      };
  const parserResult = await parseDocumentWithAdapter({ descriptor, content: documentContent });
  warnings.push(
    ...parserResult.validation.warnings.map((warning) =>
      createWarning(warning.code, warning.message, warning.severity === "error" ? "critical" : "warning")
    )
  );

  return {
    valid: true,
    errors: [],
    warnings,
    descriptor,
    documentContent,
    documentMetadata: descriptor.metadata,
    userRequest: buildContractReviewRequest({
      descriptor,
      availableText,
      reviewerNotes: request.reviewerNotes,
      warnings
    })
  };
}

function normalizeItems(value: readonly unknown[] | undefined, fallback: string): readonly string[] {
  if (!value?.length) return [fallback];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return String(record.title || record.label || record.description || record.summary || "").trim();
      }
      return "";
    })
    .filter(Boolean);
}

export function createContractReviewStructuredResult(
  response: VoraNormalizedIntelligenceResponse,
  preparation: ContractReviewPreparation
): ContractReviewStructuredResult {
  const descriptor = preparation.descriptor;
  const basis = preparation.documentContent?.text
    ? `Review basis: readable text supplied from ${descriptor?.name || "the uploaded document"}.`
    : `Review basis: metadata only for ${descriptor?.name || "the uploaded document"} because real parsing is not available yet.`;

  return {
    executiveSummary: response.summary || "VORA prepared a contract review response through the intelligence runtime.",
    contractOverview: `${basis} Document type: ${descriptor?.type || "unknown"}.`,
    keyClauses: ["Key clauses are not deterministically extracted in this pass. Review the generated response against the original contract text."],
    potentialRisks: normalizeItems(response.risks, "No deterministic risk item was extracted. Review the generated response and source contract."),
    missingInformation: normalizeItems(response.missingInformation, "Confirm parties, scope, payment terms, schedule, warranties, dispute clauses, and attachments."),
    itemsRequiringReview: normalizeItems(response.actions, "Manual legal and commercial review is required before relying on the contract."),
    recommendedActions: normalizeItems(response.recommendations, "Use this output as a project-management review aid, not legal advice."),
    confidence: response.confidence,
    warnings: [...preparation.warnings, ...response.warnings]
  };
}

export async function executeContractReview(request: ContractReviewExecutionRequest): Promise<ContractReviewResponse> {
  const preparation = await prepareContractReview(request);
  if (!preparation.valid || !preparation.descriptor || !preparation.userRequest) {
    return {
      id: `contract_review_error_${(request.now || new Date()).toISOString().replace(/[^0-9]/g, "")}`,
      status: "failed",
      taskIntent: "contract_review",
      reasoningType: "contract_review",
      warnings: preparation.warnings,
      errors: preparation.errors,
      confidence: {
        providerResponse: "placeholder"
      },
      usedMock: false,
      executionMetadata: {
        usedMock: false,
        taskIntent: "contract_review",
        reasoningType: "contract_review",
        reportType: "contract_review_report",
        createdAt: (request.now || new Date()).toISOString()
      },
      createdAt: (request.now || new Date()).toISOString()
    };
  }

  const response = await executeVoraIntelligence({
    ...request,
    userRequest: preparation.userRequest,
    taskIntent: "contract_review",
    documents: [preparation.descriptor],
    documentMetadata: preparation.documentMetadata ? [preparation.documentMetadata] : [],
    documentContent: preparation.documentContent ? [preparation.documentContent] : [],
    outputPreferences: {
      language: request.outputPreferences?.language || request.language || "ar",
      tone: request.outputPreferences?.tone || "professional",
      responseFormat: request.outputPreferences?.responseFormat || "markdown",
      includeRecommendations: true,
      includeSources: true,
      ...request.outputPreferences
    }
  });

  return {
    ...response,
    warnings: [...preparation.warnings, ...response.warnings],
    contractReview: createContractReviewStructuredResult(response, preparation)
  };
}

export async function executeContractReviewSafe(request: ContractReviewExecutionRequest): Promise<ContractReviewResponse> {
  try {
    return await executeContractReview(request);
  } catch (error) {
    const fallback = await executeVoraIntelligenceSafe({
      userRequest: "Contract Review failed before runtime execution.",
      taskIntent: "contract_review",
      provider: request.provider,
      projectId: request.projectId,
      organizationId: request.organizationId,
      now: request.now
    });
    return {
      ...fallback,
      status: "failed",
      errors: [
        ...fallback.errors,
        {
          code: "contract_review_failed",
          message: error instanceof Error ? error.message : "Contract Review failed safely."
        }
      ]
    };
  }
}
