import type { ParsedDocumentWarning } from "@/lib/document-types";

export type OcrInput = Readonly<{
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}>;

export type OcrResult = Readonly<{
  text: string;
  confidence: number;
  warnings: readonly ParsedDocumentWarning[];
}>;

export type OcrAdapter = Readonly<{
  id: string;
  available: boolean;
  extractText(input: OcrInput): Promise<OcrResult>;
}>;

export const unavailableOcrAdapter: OcrAdapter = Object.freeze({
  id: "ocr.unavailable",
  available: false,
  async extractText() {
    return Object.freeze({
      text: "",
      confidence: 0,
      warnings: [Object.freeze({ code: "ocr_unavailable", message: "OCR adapter is not configured for image text extraction.", severity: "warning" as const })]
    });
  }
});

