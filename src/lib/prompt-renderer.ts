/**
 * src/lib/prompt-renderer.ts
 *
 * Renders {{variable}} placeholders in a prompt template string.
 *
 * Rules:
 *  - Placeholder syntax: {{variableName}} (letters, digits, underscores; no spaces)
 *  - Variables can be strings or numbers; numbers are coerced via String()
 *  - Variables can be multi-line (e.g. a constraint block or JSON schema example)
 *  - Missing variables throw — fail fast rather than silently emit broken prompts
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/** Map of placeholder names to their values. Numbers are coerced to strings. */
export type PromptVariables = Record<string, string | number>;

// ── Internals ─────────────────────────────────────────────────────────────────

// Matches {{variableName}} — only word characters (no spaces inside braces).
const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Replace all {{variable}} placeholders in `template` with values from `variables`.
 *
 * Throws if any placeholder in the template has no corresponding entry in
 * `variables`. This prevents silently sending incomplete prompts to the LLM.
 *
 * @example
 *   const prompt = renderPrompt(template, {
 *     gradeLevel: 2,
 *     topicName: "Cộng có nhớ",
 *     count: 5,
 *   });
 */
export function renderPrompt(template: string, variables: PromptVariables): string {
  const missing: string[] = [];

  const rendered = template.replace(PLACEHOLDER_RE, (_, key: string) => {
    if (!(key in variables)) {
      missing.push(key);
      return `{{${key}}}`; // preserve for easier error diagnosis
    }
    return String(variables[key]);
  });

  if (missing.length > 0) {
    throw new Error(
      `[prompt-renderer] Missing variable(s): ${missing.join(", ")}. ` +
      `All placeholders must be provided before rendering.`,
    );
  }

  return rendered;
}

/**
 * Return the list of placeholder names referenced in a template.
 * Useful for writing tests or documenting expected variables.
 *
 * @example
 *   listPlaceholders("Hello {{name}}, you have {{count}} items.")
 *   // → ["name", "count"]
 */
export function listPlaceholders(template: string): string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_RE)) {
    found.add(match[1]);
  }
  return [...found];
}
