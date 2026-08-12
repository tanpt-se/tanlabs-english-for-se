/**
 * Fill-blank templates use `___ (cue)` so learners see the base/lemma to produce.
 * When scoring or auditing the filled sentence, replace blank + cue with the answer.
 */

/** @param {string} template */
export function hasFillBlankCue(template) {
  return /___\s*\([^)]+\)/.test(template);
}

/**
 * @param {string} template
 * @param {string} answer
 */
export function fillBlankTemplate(template, answer) {
  if (hasFillBlankCue(template)) {
    return template.replace(/___\s*\([^)]+\)/, answer);
  }
  return template.replace('___', answer);
}

/**
 * @param {string} template
 * @returns {string | null}
 */
export function extractFillBlankCue(template) {
  const match = template.match(/___\s*\(([^)]+)\)/);
  return match?.[1]?.trim() ?? null;
}
