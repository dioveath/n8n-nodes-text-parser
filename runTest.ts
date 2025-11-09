import { alignBeats } from "./nodes/TextAligner/aligner/alignment";
import type { AlignmentOptions, StoryBeatCandidate } from "./nodes/TextAligner/aligner/types";


const story = `Lena walked into the forest.
She followed a narrow path until she found an ancient tree.
The tree whispered secrets and offered her a glowing seed.
She returned home determined to plant it.`;

const beatCandidates: StoryBeatCandidate[] = [
  {
    title: "Into the woods",
    script: "Lena walked into the forest.\nShe followed a narrow path",
  },
  {
    title: "A mysterious gift",
    script:
      "until she discovered an ancient tree that whispered secrets and offered her a glowing seed.",
  },
  {
    title: "Homecoming",
    script: "She brought the seed home and planned to plant it.",
  },
];

const options: AlignmentOptions = {
  fuzzyThreshold: 0.55,
  maxExpansion: 160,
  maxContraction: 0.45,
  boundaryMode: "sentence"
};

console.log("=== Alignment Configuration ===");
console.log(`fuzzyThreshold: ${options.fuzzyThreshold}`);
console.log(`maxExpansion: ${options.maxExpansion} characters`);
console.log(`maxContraction: ${options.maxContraction} (${Math.round((options.maxContraction ?? 0.55) * 100)}%)`);
console.log();

const results = alignBeats(story, beatCandidates, options);

console.log("=== Alignment Results ===");
results.forEach((beat, index) => {
  const matchType = beat.exact ? "EXACT MATCH" : "FUZZY MATCH";
  const thresholdMet = beat.similarity >= (options.fuzzyThreshold ?? 0.55) ? "✓" : "✗ (last beat exception)";
  
  console.log(`\nBeat ${index + 1}: ${beat.title || "Untitled"}`);
  console.log(`Match Type: ${matchType}`);
  console.log(`Similarity: ${beat.similarity.toFixed(3)} / ${options.fuzzyThreshold} ${thresholdMet}`);
  console.log(`Position: [${beat.start}, ${beat.end}) (${beat.end - beat.start} chars)`);
  console.log("\nOriginal script:");
  console.log(`  "${beat.script}"`);
  console.log("\nMatched text:");
  console.log(`  "${beat.matchedText}"`);
});

const reconstructed = results.map((beat) => beat.matchedText).join("");
console.log("\n=== Summary ===");
console.log(`Story fully reconstructed: ${reconstructed === story ? "✓" : "✗"}`);
console.log(`Total beats: ${results.length}`);
console.log(`Exact matches: ${results.filter(b => b.exact).length}`);
console.log(`Fuzzy matches: ${results.filter(b => !b.exact).length}`);
console.log(`Average similarity: ${(results.reduce((sum, b) => sum + b.similarity, 0) / results.length).toFixed(3)}`);
