import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeConnectionType } from "n8n-workflow";
import * as aligner from './action/aligner.operation';

export class TextAligner implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Text Aligner',
		name: 'textAligner',
		icon: { dark: 'file:TextAligner.icon.svg', light: 'file:TextAligner.icon.svg' },
		group: ['transform'],
		version: [1, 0],
		description: 'Aligns and reconstructs large text from partial or split segments using fuzzy matching.',
		defaults: { name: 'Align Text Segments' },
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Full Text',
				name: 'fullText',
				type: 'string',
				typeOptions: { rows: 8 },
				default: `Lena walked into the forest.\nShe followed a narrow path until she found an ancient tree.\nThe tree whispered secrets and offered her a glowing seed.\nShe returned home determined to plant it.`,
				description: 'The full reference text or target document to align segments against',
			},
			{
				displayName: 'Segment Candidates (JSON)',
				name: 'segments',
				type: 'json',
				typeOptions: { rows: 20 },
				default: '[\n    {\n      \"title\": \"Into the woods\",\n      \"script\": \"Lena walked into the forest.\\nShe followed a narrow path\"\n    }\n]',
				description: 'An array of partial text objects to align, e.g. [{ "title": "", "script": "..." }]',
			},
			{
				displayName: 'Fuzzy Threshold',
				name: 'fuzzyThreshold',
				type: 'number',
				default: 0.55,
				description: 'Minimum similarity score for fuzzy matching (0-1)',
			},
			{
				displayName: 'Max Expansion',
				name: 'maxExpansion',
				type: 'number',
				default: 160,
				description: 'Maximum allowed expansion in characters when searching for match regions',
			},
			{
				displayName: 'Max Contraction',
				name: 'maxContraction',
				type: 'number',
				default: 0.45,
				description: 'Maximum ratio of contraction when matching smaller fragments',
			},
			{
				displayName: 'Output Mode',
				name: 'outputMode',
				type: 'options',
				default: 'detailed',
				options: [
					{ name: 'Detailed', value: 'detailed', description: 'Includes similarity, positions, and match type' },
					{ name: 'Compact', value: 'compact', description: 'Outputs only aligned texts' },
					{ name: 'Summary', value: 'summary', description: 'Outputs statistics and reconstruction status only' },
				],
			},
		],
	};

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = []

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const result = await aligner.execute.call(this, item);
            returnData.push(result);
        }

        return this.prepareOutputData(returnData)
    }
}
