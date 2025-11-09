export interface StoryBeatCandidate {
    title?: string;
    script: string;
  }
  
  export interface AlignmentResult {
    title?: string;
    script: string;
    start: number;
    end: number;
    matchedText: string;
    exact: boolean;
    similarity: number;
  }
  
  export interface AlignmentOptions {
    fuzzyThreshold?: number;
    maxExpansion?: number;
    maxContraction?: number;
    boundaryMode?: "sentence" | "word";
  }
  