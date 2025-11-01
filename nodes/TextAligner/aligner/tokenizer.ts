export interface ComparisonTokens {
    tokens: string[];
    counts: Map<string, number>;
  }
  
  const WORD_PUNCT_REGEX = /\p{L}+[\p{L}\p{Mn}\p{Pd}\p{Pc}\p{Nd}]*|\p{Nd}+|[^\s\p{L}\p{Nd}]+/gu;
  
  export function normalizeToken(token: string): string {
    const lower = token.toLowerCase();
    if (lower.length > 3 && lower.endsWith("s") && !lower.endsWith("ss")) {
      return lower.slice(0, -1);
    }
    return lower;
  }
  
  export function tokenizeForComparison(text: string): ComparisonTokens {
    const matches = text.match(WORD_PUNCT_REGEX);
    const tokens: string[] = [];
    const counts = new Map<string, number>();
    if (!matches) {
      return { tokens, counts };
    }
  
    for (const raw of matches) {
      const normalized = normalizeToken(raw);
      if (!normalized) {
        continue;
      }
      tokens.push(normalized);
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
    return { tokens, counts };
  }
  
  export function similarityRatio(
    candidate: ComparisonTokens,
    window: ComparisonTokens,
  ): number {
    if (candidate.tokens.length === 0) {
      return 0;
    }
    let overlap = 0;
    for (const [token, count] of candidate.counts.entries()) {
      const windowCount = window.counts.get(token);
      if (windowCount) {
        overlap += Math.min(count, windowCount);
      }
    }
    return overlap / candidate.tokens.length;
  }
  