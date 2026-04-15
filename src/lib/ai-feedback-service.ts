/**
 * src/lib/ai-feedback-service.ts
 *
 * Lightweight AI feedback layer. Generates child-friendly explanations for
 * wrong answers using an LLM (Gemini by default, OpenAI-compatible).
 *
 * Safety guarantees:
 *  - AI never determines correctness — it only gets pre-graded data.
 *  - If API key is missing or the call fails, safe fallbacks are returned.
 *  - Never throws; always resolves with a FeedbackResult.
 */

import { loadPromptTemplate } from "./prompt-loader";
import { renderPrompt } from "./prompt-renderer";

export interface WrongAnswerInput {
  questionText: string;
  givenAnswer: string;
  correctAnswer: string;
  hint?: string;
  topicName: string;
  gradeLevel: number;
}

export interface WrongAnswerFeedback {
  /** One short sentence explaining the concept (≤ 30 words, child-friendly). */
  shortExplanation: string;
  /** A friendly hint nudging the child to try differently (≤ 25 words). */
  friendlyHint: string;
}

export interface SessionFeedback {
  /** An encouraging message for the full session result (≤ 2 sentences). */
  encouragementMessage: string;
}

// ── Fallbacks (no API key / error) ───────────────────────────────────────────

const FALLBACK_EXPLANATIONS: WrongAnswerFeedback = {
  shortExplanation: "Câu này cần xem lại một lần nữa nhé.",
  friendlyHint:     "Con thử tính lại từng bước một xem sao.",
};

const FALLBACK_ENCOURAGEMENTS = [
  "Con đã cố gắng rất nhiều! Tiếp tục luyện tập nhé.",
  "Thật tuyệt vời khi con đã làm hết bài! Lần sau sẽ tốt hơn.",
  "Con rất dũng cảm khi thử bài khó. Cố lên nhé!",
  "Mỗi lần luyện tập, con lại giỏi thêm một chút. Tiếp tục nào!",
];

function ageLabel(gradeLevel: number): string {
  if (gradeLevel <= 1) return "6";
  if (gradeLevel === 2) return "7–8";
  return "8–9";
}

function randomFallbackEncouragement(): string {
  return FALLBACK_ENCOURAGEMENTS[
    Math.floor(Math.random() * FALLBACK_ENCOURAGEMENTS.length)
  ];
}

// ── Provider abstraction ──────────────────────────────────────────────────────

interface LLMResponse {
  text: string;
}

async function callGemini(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:     0.4,
        maxOutputTokens: 120,
        topP:            0.9,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }),
    signal: AbortSignal.timeout(8000), // 8s hard timeout
  });

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const data = await res.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Empty response from Gemini");
  return { text: text.trim() };
}

/**
 * Single entry-point for LLM calls. Swap provider here if needed.
 * Returns null if no API key is configured (no error thrown).
 */
async function callLLM(prompt: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) return null; // graceful no-config path
  try {
    const { text } = await callGemini(prompt);
    return text;
  } catch (err) {
    console.warn("[ai-feedback-service] LLM call failed:", (err as Error).message);
    return null;
  }
}

// ── JSON extraction helper ─────────────────────────────────────────────────────

function extractJSON<T>(text: string): T | null {
  try {
    // The model sometimes wraps JSON in ```json ... ```, strip it.
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate a short, child-friendly explanation for one wrong answer.
 * Always resolves — falls back to static content if AI is unavailable.
 */
export async function generateWrongAnswerFeedback(
  input: WrongAnswerInput,
): Promise<WrongAnswerFeedback> {
  let prompt: string;
  try {
    const template = await loadPromptTemplate("result-feedback/wrong-answer-feedback");
    prompt = renderPrompt(template, {
      gradeLevel:    input.gradeLevel,
      ageRange:      ageLabel(input.gradeLevel),
      topicName:     input.topicName,
      questionText:  input.questionText,
      givenAnswer:   input.givenAnswer,
      correctAnswer: input.correctAnswer,
      hintLine:      input.hint ? `- Gợi ý sẵn có: ${input.hint}` : "",
    });
  } catch (err) {
    console.warn("[ai-feedback-service] Prompt build failed:", (err as Error).message);
    return FALLBACK_EXPLANATIONS;
  }

  const raw = await callLLM(prompt);
  if (!raw) return FALLBACK_EXPLANATIONS;

  const parsed = extractJSON<WrongAnswerFeedback>(raw);
  if (
    parsed &&
    typeof parsed.shortExplanation === "string" &&
    typeof parsed.friendlyHint === "string" &&
    parsed.shortExplanation.length > 0 &&
    parsed.friendlyHint.length > 0
  ) {
    return {
      shortExplanation: parsed.shortExplanation.slice(0, 200),
      friendlyHint:     parsed.friendlyHint.slice(0, 200),
    };
  }

  return FALLBACK_EXPLANATIONS;
}

/**
 * Generate an encouraging session-level message based on score.
 * Always resolves — falls back to a static random message.
 */
export async function generateEncouragementMessage(params: {
  score: number;
  totalQuestions: number;
  topicName: string;
  gradeLevel: number;
}): Promise<SessionFeedback> {
  const { score, totalQuestions, topicName, gradeLevel } = params;
  const accuracy = Math.round((score / totalQuestions) * 100);

  let prompt: string;
  try {
    const template = await loadPromptTemplate("result-feedback/encouragement");
    prompt = renderPrompt(template, {
      gradeLevel,
      ageRange:       ageLabel(gradeLevel),
      topicName,
      score,
      totalQuestions,
      accuracy,
    });
  } catch (err) {
    console.warn("[ai-feedback-service] Prompt build failed:", (err as Error).message);
    return { encouragementMessage: randomFallbackEncouragement() };
  }

  const raw = await callLLM(prompt);
  if (!raw) return { encouragementMessage: randomFallbackEncouragement() };

  const parsed = extractJSON<SessionFeedback>(raw);
  if (parsed && typeof parsed.encouragementMessage === "string" && parsed.encouragementMessage.length > 0) {
    return { encouragementMessage: parsed.encouragementMessage.slice(0, 300) };
  }

  return { encouragementMessage: randomFallbackEncouragement() };
}
