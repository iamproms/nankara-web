// Heuristic: is this visitor likely outside Nigeria? Used only to decide whether to
// show the approximate USD price alongside NGN (spec §9). Pure and unit-tested; the
// hook in src/hooks/useInternationalVisitor.js feeds it real browser signals.
//
// A production-grade signal (edge geo) is a Milestone 5 refinement. This errs toward
// "international" on missing data — showing an extra approximate line is harmless;
// hiding it from someone who needs it is not.

const DOMESTIC_TIME_ZONE = 'Africa/Lagos';
const DOMESTIC_LANGUAGE = /^(en-ng|ha|yo|ig)\b/i;

export function classifyVisitor({ timeZone, languages } = {}) {
  if (timeZone && timeZone === DOMESTIC_TIME_ZONE) return 'domestic';

  const list = Array.isArray(languages) ? languages : languages ? [languages] : [];
  if (list.some((lang) => typeof lang === 'string' && DOMESTIC_LANGUAGE.test(lang))) {
    return 'domestic';
  }

  return 'international';
}
