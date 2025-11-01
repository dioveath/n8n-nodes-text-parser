// aligner.ts

import {
  AlignmentOptions,
  AlignmentResult,
  StoryBeatCandidate,
} from "./types";
import {
  ComparisonTokens,
  similarityRatio,
  tokenizeForComparison,
} from "./tokenizer";

interface FuzzyCandidate {
  length: number;      // always ends at a sentence boundary
  similarity: number;
}

type Bounds = { start: number; end: number };

const DEFAULT_THRESHOLD = 0.6;
const DEFAULT_MAX_EXPANSION = 200;
const DEFAULT_MAX_CONTRACTION = 0.4;

/** --- Sentence utilities --- */

/**
 * Compute sentence boundaries as [start, end) pairs, where `end`
 * is positioned at the first non-whitespace character AFTER the
 * sentence’s terminal punctuation (., !, ?, or … and trailing quotes/brackets).
 * This makes the next sentence start index exactly `end`.
 */
function computeSentences(text: string): Bounds[] {
  // Use Intl.Segmenter when available (more robust, multilingual).
  const AnyIntl: any = Intl as any;
  if (AnyIntl && typeof AnyIntl.Segmenter === "function") {
    const seg = new AnyIntl.Segmenter(undefined, { granularity: "sentence" });
    const sentences: Bounds[] = [];
    let lastEnd = 0;
    for (const s of seg.segment(text) as any) {
      const start = s.index as number;
      const end = (s.index as number) + (s.segment as string).length;
      // Merge preceding whitespace into previous sentence end and
      // advance end to the first non-whitespace after punctuation.
      // Segmenter already yields sentence-like chunks; we still normalize trailing spaces.
      let e = end;
      while (e < text.length && /\s/.test(text[e])) e++;
      sentences.push({ start, end: e });
      lastEnd = e;
    }
    if (sentences.length === 0) {
      // Treat entire text as one "sentence" if segmenter returns nothing.
      return text.length ? [{ start: 0, end: text.length }] : [];
    }
    // Ensure coverage of trailing text if any (rare with Segmenter).
    if (lastEnd < text.length) {
      sentences.push({ start: lastEnd, end: text.length });
    }
    return sentences;
  }

  // Fallback heuristic: scan for ., !, ?, or … then eat closing quotes/brackets and whitespace.
  const sentences: Bounds[] = [];
  const len = text.length;
  let i = 0;
  while (i < len) {
    // skip leading whitespace
    while (i < len && /\s/.test(text[i])) i++;
    if (i >= len) break;

    let j = i;
    let ended = false;
    while (j < len) {
      const ch = text[j];
      if (ch === "." || ch === "!" || ch === "?" || ch === "…") {
        j++;
        // consume any stacked punctuation/quotes/brackets immediately after terminal
        while (j < len && /["'”’)\]\}\u00BB>]+/.test(text[j])) j++;
        // consume trailing whitespace, and define end at first non-space (start of next sentence)
        while (j < len && /\s/.test(text[j])) j++;
        ended = true;
        break;
      }
      j++;
    }
    if (!ended) j = len; // last line without terminal punctuation
    sentences.push({ start: i, end: j });
    i = j;
  }
  return sentences;
}

function sentenceIndexForPosition(sentences: Bounds[], pos: number): number {
  let lo = 0, hi = sentences.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = sentences[mid];
    if (pos < s.start) hi = mid - 1;
    else if (pos >= s.end) lo = mid + 1;
    else return mid;
  }
  return Math.max(0, Math.min(sentences.length - 1, lo - 1));
}

/**
 * Collect candidate window ends that are exactly sentence ends,
 * starting from the sentence containing `cursor`. We include the next
 * end beyond `maxLen` if no end falls into [minLen, maxLen] to guarantee
 * sentence-complete windows.
 */
function collectSentenceEndCandidates(
  sentences: Bounds[],
  cursor: number,
  minLen: number,
  maxLen: number,
): number[] {
  const idx = sentenceIndexForPosition(sentences, cursor);
  const ends: number[] = [];
  for (let i = idx; i < sentences.length; i++) {
    const end = sentences[i].end;
    const length = end - cursor;
    if (length < minLen) continue;
    if (length > maxLen) {
      // If we already collected some within range, stop.
      if (ends.length > 0) break;
      // Otherwise, allow the very next sentence end (force boundary).
      ends.push(end);
      break;
    }
    ends.push(end);
  }
  // If nothing (e.g., cursor at final trailing whitespace), last resort: end of story.
  if (ends.length === 0 && sentences.length > 0) {
    ends.push(sentences[sentences.length - 1].end);
  }
  return ends;
}

/** --- Existing token window cache helper --- */
function computeWindowTokens(
  cache: Map<number, ComparisonTokens>,
  story: string,
  cursor: number,
  length: number,
): ComparisonTokens {
  if (!cache.has(length)) {
    cache.set(length, tokenizeForComparison(story.slice(cursor, cursor + length)));
  }
  return cache.get(length)!;
}

/** --- Fuzzy alignment restricted to sentence ends --- */
function fuzzyAlignAtCursor(
  story: string,
  script: string,
  cursor: number,
  options: Required<AlignmentOptions>,
  isLastBeat: boolean,
  sentences: Bounds[],
): FuzzyCandidate | null {
  const remaining = story.length - cursor;
  if (remaining <= 0) return null;

  const candidateTokens = tokenizeForComparison(script);
  if (candidateTokens.tokens.length === 0) return null;

  const minLen = Math.max(
    1,
    Math.min(
      remaining,
      Math.floor(script.length * (1 - options.maxContraction)),
    ),
  );
  const maxLen = Math.max(
    minLen,
    Math.min(remaining, script.length + options.maxExpansion),
  );

  const windowCache = new Map<number, ComparisonTokens>();
  let best: FuzzyCandidate | null = null;

  // Only evaluate windows that end at sentence boundaries.
  const ends = collectSentenceEndCandidates(sentences, cursor, minLen, maxLen);
  for (const end of ends) {
    const len = end - cursor;
    const windowTokens = computeWindowTokens(windowCache, story, cursor, len);
    const similarity = similarityRatio(candidateTokens, windowTokens);
    if (!best || similarity > best.similarity) {
      best = { length: len, similarity };
    }
  }

  if (!best) return null;
  if (best.similarity >= options.fuzzyThreshold || isLastBeat) return best;
  return null;
}

function resolveOptions(options?: AlignmentOptions): Required<AlignmentOptions> {
  return {
    fuzzyThreshold: options?.fuzzyThreshold ?? DEFAULT_THRESHOLD,
    maxExpansion: options?.maxExpansion ?? DEFAULT_MAX_EXPANSION,
    maxContraction: options?.maxContraction ?? DEFAULT_MAX_CONTRACTION,
  };
}

/** --- Public API --- */
export function alignBeats(
  story: string,
  beats: StoryBeatCandidate[],
  options?: AlignmentOptions,
): AlignmentResult[] {
  const resolved = resolveOptions(options);
  const sentences = computeSentences(story);
  const results: AlignmentResult[] = [];
  let cursor = 0;

  beats.forEach((beat, index) => {
    const remaining = story.length - cursor;
    if (remaining < 0) {
      throw new Error("Cursor exceeded story length during alignment");
    }
    const isLastBeat = index === beats.length - 1;
    const candidateScript = beat.script;
    if (!candidateScript) {
      throw new Error("Beat script must be non-empty");
    }

    // Try exact first.
    if (story.startsWith(candidateScript, cursor)) {
      const candidateTokens = tokenizeForComparison(candidateScript);
      const scriptEnd = cursor + candidateScript.length;

      // Snap exact match to the end of the containing sentence.
      const sentIdx = sentenceIndexForPosition(sentences, Math.min(scriptEnd - 1, story.length - 1));
      const snappedEnd = sentences[sentIdx]?.end ?? scriptEnd;

      const end = snappedEnd;
      const matched = story.slice(cursor, end);

      // exact is true only if the script ends exactly on the boundary we used
      const exactOnBoundary = scriptEnd === end;
      const similarity = exactOnBoundary
        ? 1
        : similarityRatio(candidateTokens, tokenizeForComparison(matched));

      results.push({
        title: beat.title,
        script: beat.script,
        start: cursor,
        end,
        matchedText: matched,
        exact: exactOnBoundary,
        similarity,
      });
      cursor = end;
      return;
    }

    // Fuzzy, with sentence-boundary windows only.
    const fuzzy = fuzzyAlignAtCursor(
      story,
      candidateScript,
      cursor,
      resolved,
      isLastBeat,
      sentences,
    );

    if (!fuzzy) {
      throw new Error(
        `Could not fuzzily align beat: ${beat.title ?? beat.script.slice(0, 30)}`,
      );
    }

    // For the last beat, still consume all remaining characters to satisfy the invariant.
    // For non-last beats, fuzzy.length already ends at a sentence boundary.
    const end = isLastBeat && fuzzy.length < remaining
      ? cursor + remaining
      : cursor + fuzzy.length;

    results.push({
      title: beat.title,
      script: beat.script,
      start: cursor,
      end,
      matchedText: story.slice(cursor, end),
      exact: false,
      similarity: fuzzy.similarity,
    });
    cursor = end;
  });

  if (cursor !== story.length) {
    throw new Error(
      `Alignment did not consume the full story. Remaining characters: ${story.length - cursor}`,
    );
  }

  return results;
}
