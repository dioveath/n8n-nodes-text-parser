import {
  AlignmentOptions,
  AlignmentResult,
  StoryBeatCandidate,
} from "./types";
import { alignBeatsWithSentence } from "./sentenceAlignment";
import { alignBeatsWithWords } from "./wordAlignment";

const DEFAULT_THRESHOLD = 0.6;
const DEFAULT_MAX_EXPANSION = 200;
const DEFAULT_MAX_CONTRACTION = 0.4;
const DEFAULT_BOUNDARY_MODE: NonNullable<AlignmentOptions["boundaryMode"]> = "sentence";

function resolveOptions(options?: AlignmentOptions): Required<AlignmentOptions> {
  return {
    fuzzyThreshold: options?.fuzzyThreshold ?? DEFAULT_THRESHOLD,
    maxExpansion: options?.maxExpansion ?? DEFAULT_MAX_EXPANSION,
    maxContraction: options?.maxContraction ?? DEFAULT_MAX_CONTRACTION,
    boundaryMode: options?.boundaryMode ?? DEFAULT_BOUNDARY_MODE,
  };
}

export function alignBeats(
  story: string,
  beats: StoryBeatCandidate[],
  options?: AlignmentOptions,
): AlignmentResult[] {
  const resolved = resolveOptions(options);
  if (resolved.boundaryMode === "word") {
    return alignBeatsWithWords(story, beats, resolved);
  }
  return alignBeatsWithSentence(story, beats, resolved);
}
