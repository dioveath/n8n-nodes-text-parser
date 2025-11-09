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
  length: number;
  similarity: number;
}

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

function fuzzyAlignAtCursor(
  story: string,
  script: string,
  cursor: number,
  options: Required<AlignmentOptions>,
  isLastBeat: boolean,
): FuzzyCandidate | null {
  const remaining = story.length - cursor;
  if (remaining <= 0) {
    return null;
  }

  const candidateTokens = tokenizeForComparison(script);
  if (candidateTokens.tokens.length === 0) {
    return null;
  }

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

  let best: FuzzyCandidate | null = null;
  const windowCache = new Map<number, ComparisonTokens>();

  for (let len = minLen; len <= maxLen; len += 1) {
    const windowTokens = computeWindowTokens(windowCache, story, cursor, len);
    const similarity = similarityRatio(candidateTokens, windowTokens);
    if (!best || similarity > best.similarity) {
      best = { length: len, similarity };
    }
  }

  if (!best) {
    return null;
  }

  if (best.similarity >= options.fuzzyThreshold || isLastBeat) {
    return best;
  }

  return null;
}

export function alignBeatsWithWords(
  story: string,
  beats: StoryBeatCandidate[],
  options: Required<AlignmentOptions>,
): AlignmentResult[] {
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

    const exact = story.startsWith(candidateScript, cursor);
    if (exact) {
      const end = cursor + candidateScript.length;
      results.push({
        title: beat.title,
        script: beat.script,
        start: cursor,
        end,
        matchedText: story.slice(cursor, end),
        exact: true,
        similarity: 1,
      });
      cursor = end;
      return;
    }

    const fuzzy = fuzzyAlignAtCursor(
      story,
      candidateScript,
      cursor,
      options,
      isLastBeat,
    );

    if (!fuzzy) {
      throw new Error(
        `Could not fuzzily align beat: ${beat.title ?? beat.script.slice(0, 30)}`,
      );
    }

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

