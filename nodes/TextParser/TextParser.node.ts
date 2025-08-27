import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import * as segmentation from './action/segmentation.operation';
import * as split from './action/split.operation';

export class TextParser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Text Parser',
		name: 'textParser',
		icon: { dark: 'file:TextParser.dark.svg', light: 'file:TextParser.light.svg' },
		group: ['transform'],
		version: 1,
		description: 'A node that parse and analyze large text.',
		defaults: {
			name: 'Parse Text',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					rows: 6,
				},
				default: '',
				placeholder: 'Write a long text...',
				description: 'Text that will be transformed'
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Sentence Segmentation',
						value: 'sentenceSegmentation',
						action: 'Segment text to sentences'
					},
					{
						name: 'Split to N Characters Text',
						value: 'splitToNCharacters',
						action: 'Split to N characters text'
					}
				],
				default: 'sentenceSegmentation'
			},
			{
				displayName: 'Max Characters',
				description: 'Number of maximum characters for splitting',
				name: 'maxChars',
				type: 'number',
				placeholder: '2000',
				default: 2000,
				noDataExpression: false,
				displayOptions: {
					show: {
						operation: ['splitToNCharacters']
					}
				}
			},
			{
				displayName: 'Overlap Characters',
				description: 'Number of characters that gets overlapped while splitting',
				name: 'overlapChars',
				type: 'number',
				placeholder: '100',
				default: 0,
				noDataExpression: false,
				displayOptions: {
					show: {
						operation: ['splitToNCharacters']
					}
				}
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = []

		for (let i = 0; i < items.length; i++) {
			const operation = this.getNodeParameter('operation', i) as string;

			if (operation === 'sentenceSegmentation') {
				const result = await segmentation.execute.call(this, items[i]);
				returnData.push(result)
			} else if (operation === 'splitToNCharacters') {
				const result = await split.execute.call(this, items[i]);
				returnData.push(result)
			}
		}

		return this.prepareOutputData(returnData)
	}
}
