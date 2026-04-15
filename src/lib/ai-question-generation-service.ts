/**
 * src/lib/ai-question-generation-service.ts
 *
 * Calls the LLM to generate exam questions based on a blueprint prompt.
 * Uses the same Gemini provider already wired in ai-feedback-service.ts.
 *
 * Safety guarantees:
 *  - Never throws — always returns a GenerationResult (success or failure).
 *  - AI output goes through question-validator.ts before being used.
 *  - If AI is not configured, returns { source: "unavailable" } immediately.
 */

import { resolveQuestionPromptVariables, type PromptBuilderInput, type BlueprintConstraints } from "./question-prompt-builder";
import { loadPromptTemplate } from "./prompt-loader";
import { renderPrompt } from "./prompt-renderer";
import {
  validateGeneratedItems,
  type ValidatedItem,
  type ValidationReport,
} from "./question-validator";
import type { QuestionFormat } from "@/types/enums";

// ── Result types ──────────────────────────────────────────────────────────────

export type GenerationSource = "ai" | "fallback" | "unavailable" | "bank";

export interface GenerationSuccess {
  source:           "ai";
  items:            ValidatedItem[];
  validationReport: ValidationReport;
  promptTokensEst:  number; // rough char/4 estimate
}

export interface GenerationFailure {
  source:  "unavailable" | "fallback";
  reason:  string;
  /** Partial items if some passed validation (can still use these + fill rest with fallback) */
  items:   ValidatedItem[];
  validationReport: ValidationReport | null;
}

export type GenerationResult = GenerationSuccess | GenerationFailure;

// ── Gemini call (reuses provider pattern from ai-feedback-service) ────────────

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

// ── Retry helpers ─────────────────────────────────────────────────────────────

async function waitForRetry(attempt: number): Promise<void> {
  if (attempt === 0) return;
  const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  console.info(`[ai-gen] Retry ${attempt}/${MAX_RETRIES} after ${delayMs}ms...`);
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function extractGeminiText(data: { candidates?: GeminiCandidate[] }): string {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  return text.trim();
}

function buildGeminiPayload(prompt: string): string {
  return JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature:      0.3,
      maxOutputTokens:  2048,
      topP:             0.85,
      responseMimeType: "application/json",
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  });
}

/** Status codes that are safe to retry (transient server-side errors). */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504]);
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1_500; // 1.5s → 3s with exponential backoff

/**
 * Some 429s are quota exhaustion (won't recover in seconds; no point retrying).
 * Others are per-minute rate limits (will recover quickly; worth retrying).
 * Heuristic: if the body mentions "quota", treat it as non-retryable.
 */
function isQuotaExhausted(status: number, body: string): boolean {
  return status === 429 && body.toLowerCase().includes("quota");
}

async function callGeminiRaw(prompt: string): Promise<string> {
  console.log(prompt);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body  = buildGeminiPayload(prompt);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForRetry(attempt);

    let res: Response;
    try {
      res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[ai-gen] Network error on attempt ${attempt}: ${lastError.message}`);
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      lastError = new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 400)}`);
      const canRetry = RETRYABLE_STATUS_CODES.has(res.status)
        && !isQuotaExhausted(res.status, errBody)
        && attempt < MAX_RETRIES;
      if (canRetry) {
        console.warn(`[ai-gen] Transient error (${res.status}) on attempt ${attempt}, will retry.`);
        continue;
      }
      throw lastError;
    }

    return extractGeminiText(await res.json() as { candidates?: GeminiCandidate[] });
  }

  throw lastError ?? new Error("Gemini call failed after retries");
}

// ── JSON extraction (strips markdown fences if present) ───────────────────────

function extractJSONArray(raw: string): unknown[] | null {
  try {
    // Strip ```json ... ``` or ``` ... ``` wrappers
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Parse outer value
    const parsed: unknown = JSON.parse(cleaned);

    if (Array.isArray(parsed)) return parsed;

    // Model sometimes wraps in { "questions": [...] } or { "items": [...] }
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      const found = ["questions", "items", "data", "results"].find((k) => Array.isArray(obj[k]));
      if (found) return obj[found] as unknown[];
    }

    return null;
  } catch {
    return null;
  }
}

// ── Public entry-point ────────────────────────────────────────────────────────

export interface AIGenerationInput extends PromptBuilderInput {
  constraints: BlueprintConstraints;
  format: QuestionFormat;
}

/**
 * Attempt to generate `count` questions using the LLM.
 * Always resolves — never throws. Caller decides how to handle failures.
 */
export async function generateQuestionsWithAI(
  input: AIGenerationInput,
): Promise<GenerationResult> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      source: "unavailable",
      reason: "GEMINI_API_KEY not configured — skipping AI generation.",
      items: [],
      validationReport: null,
    };
  }

  let prompt: string;
  try {
    const template = await loadPromptTemplate("question-generation/gen-question");
    const vars     = resolveQuestionPromptVariables(input);
    prompt         = renderPrompt(template, vars);
  } catch (err) {
    const reason = `Prompt build failed: ${(err as Error).message}`;
    console.warn(`[ai-gen] ${reason}`);
    return { source: "fallback", reason, items: [], validationReport: null };
  }

  console.info(
    `[ai-gen] Starting generation: topic=${input.topicCode} format=${input.format} difficulty=${input.difficulty} count=${input.count} blueprint=${input.blueprintVersion}`
  );

  let rawText: string;
  try {
    rawText = await callGeminiRaw(prompt);
  } catch (err) {
    const reason = `LLM call failed: ${(err as Error).message}`;
    console.warn(`[ai-gen] ${reason}`);
    return { source: "fallback", reason, items: [], validationReport: null };
  }

  const rawArray = extractJSONArray(rawText);
  if (!rawArray) {
    const reason = `Could not parse AI response as JSON array. Raw (truncated): ${rawText.slice(0, 300)}`;
    console.warn(`[ai-gen] ${reason}`);
    return { source: "fallback", reason, items: [], validationReport: null };
  }

  const report = validateGeneratedItems(rawArray, input.format, input.constraints, input.gradeLevel);

  console.info(
    `[ai-gen] Validation: ${report.validCount}/${report.totalInput} items passed.` +
    (report.failedCount > 0
      ? ` Failures: ${report.results
          .filter((r) => !r.valid)
          .map((r) => `#${r.index}(${r.errors.join("; ")})`)
          .join(", ")}`
      : "")
  );

  if (report.validCount === 0) {
    return {
      source: "fallback",
      reason: `All ${report.totalInput} AI items failed validation.`,
      items: [],
      validationReport: report,
    };
  }

  return {
    source: "ai",
    items: report.validItems,
    validationReport: report,
    promptTokensEst: Math.ceil(prompt.length / 4),
  };
}
