/**
 * src/lib/prompt-loader.ts
 *
 * Loads prompt templates from files under src/prompts/.
 * Files are read once and cached for the lifetime of the process.
 *
 * Current source of truth: .vi.md files in the repo.
 *
 * ── How to add DB override later ───────────────────────────────────────────────
 * 1. Implement DbPromptRepository below (queries PromptTemplate table by slug).
 * 2. Replace `activeRepo` with a chaining call:
 *      const dbResult = await dbRepo.load(slug);
 *      return dbResult ?? fileRepo.load(slug);
 * 3. No schema migration needed — the PromptTemplate model already exists in
 *    prisma/schema.prisma with a `slug` field ready to use.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";

// ── Source abstraction (open for DB override) ─────────────────────────────────

export interface PromptRepository {
  load(slug: string): Promise<string | null>;
}

// ── File-based repository ─────────────────────────────────────────────────────

// Prompt files live under src/prompts/<slug>.vi.md (or <slug>.md for lang-neutral).
// process.cwd() is the project root in Next.js at runtime (dev & production).
const PROMPTS_DIR = path.join(process.cwd(), "src", "prompts");

// Simple process-lifetime cache — avoids repeated disk reads.
// Turbopack/HMR resets the process, so stale cache is never an issue in dev.
const cache = new Map<string, string>();

class FilePromptRepository implements PromptRepository {
  async load(slug: string): Promise<string | null> {
    const cached = cache.get(slug);
    if (cached !== undefined) return cached;

    // Try locale-specific first (<slug>.vi.md), then language-neutral (<slug>.md).
    const candidates = [
      path.join(PROMPTS_DIR, `${slug}.vi.md`),
      path.join(PROMPTS_DIR, `${slug}.md`),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        cache.set(slug, content);
        return content;
      }
    }

    return null;
  }
}

// ── Active repository ─────────────────────────────────────────────────────────
// Swap this to a chaining repo when DB override is ready.

const fileRepo = new FilePromptRepository();

// Active source: file only. Add a chaining DbPromptRepository here when DB override is ready.
const activeRepo: PromptRepository = fileRepo;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Load a prompt template by slug (path relative to src/prompts/, no extension).
 *
 * Examples:
 *   await loadPromptTemplate("question-generation/gen-question")
 *   await loadPromptTemplate("result-feedback/wrong-answer-feedback")
 *   await loadPromptTemplate("result-feedback/encouragement")
 *
 * Throws if the template is not found — a missing slug is always a code bug,
 * not a runtime condition, so we fail fast rather than silently continue.
 */
export async function loadPromptTemplate(slug: string): Promise<string> {
  const template = await activeRepo.load(slug);
  if (template === null) {
    throw new Error(
      `[prompt-loader] Template not found: "${slug}". ` +
      `Expected: src/prompts/${slug}.vi.md`,
    );
  }
  return template;
}

/** Clear the in-memory cache. Useful in tests. */
export function clearPromptCache(): void {
  cache.clear();
}
