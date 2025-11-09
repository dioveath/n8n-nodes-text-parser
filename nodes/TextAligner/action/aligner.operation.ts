import { IExecuteFunctions, INodeExecutionData, IPairedItemData } from "n8n-workflow";
import { alignBeats, AlignmentOptions, StoryBeatCandidate } from "../aligner";

export async function execute(this: IExecuteFunctions, item: INodeExecutionData): Promise<INodeExecutionData> {
    const itemIndex = (item["pairedItem"] as IPairedItemData).item
    const fullText = this.getNodeParameter('fullText', itemIndex) as string;
    const segments = this.getNodeParameter('segments', itemIndex) as string;
    const fuzzyThreshold = this.getNodeParameter('fuzzyThreshold', itemIndex) as number;
    const maxExpansion = this.getNodeParameter('maxExpansion', itemIndex) as number;
    const maxContraction = this.getNodeParameter('maxContraction', itemIndex) as number;
    const boundaryMode = this.getNodeParameter('boundaryMode', itemIndex) as "sentence" | "word";
    const outputMode = this.getNodeParameter('outputMode', itemIndex) as string;

    const options: AlignmentOptions = { fuzzyThreshold, maxExpansion, maxContraction, boundaryMode };

    const segmentsArray = JSON.parse(segments);
    const results = alignBeats(fullText, segmentsArray as StoryBeatCandidate[], options);

    const summary = {
        totalSegments: results.length,
        exactMatches: results.filter(r => r.exact).length,
        fuzzyMatches: results.filter(r => !r.exact).length,
        avgSimilarity: (results.reduce((s, b) => s + b.similarity, 0) / results.length).toFixed(3),
        fullyReconstructed: results.map(r => r.matchedText).join('') === fullText,
    };

    if (outputMode === 'summary') {
        return {
            json: {
                summary
            }
        }
    }

    if (outputMode === 'compact') {
        return {
            json: {
                results: results.map(r => ({ text: r.matchedText }))
            }
        }
    }

    return {
        json: {
            results,
            summary
        }
    }
}