import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import * as segmentation from './action/segmentation.operation';
import * as split from './action/split.operation';
import * as writeToImage from './action/writeToImage.operation';

export class TextParser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Text Parser',
		name: 'textParser',
		icon: { dark: 'file:TextParser.icon.svg', light: 'file:TextParser.icon.svg' },
		group: ['transform'],
		version: [1, 1],
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
					},
					{
						name: 'Write to Image with Wrapped Text',
						value: 'writeToImageWithWrappedText',
						action: 'Create image with wrapped text'
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
			},
			{
				displayName: 'Image Binary Field',
				name: 'imageBinaryField',
				type: 'string',
				default: 'data',
				placeholder: 'data',
				description: 'Data field of the image binary',
				displayOptions: {
					show: {
						operation: ['writeToImageWithWrappedText']
					}
				}
			},
			{
				displayName: 'Draw Options JSON',
				name: 'drawOptions',
				type: 'json',
				typeOptions: {
					rows: 20,
				},
				default: '{\r\n  \"box\": {\r\n    \"x\": 100,\r\n    \"y\": 200,\r\n    \"width\": 600,\r\n    \"height\": 300\r\n  },\r\n  \"options\": {\r\n    \"align\": \"center\",\r\n    \"verticalAlign\": \"middle\",\r\n    \"padding\": {\r\n      \"top\": 20,\r\n      \"right\": 30,\r\n      \"bottom\": 20,\r\n      \"left\": 30\r\n    },\r\n    \"style\": {\r\n      \"fontSize\": 36,\r\n      \"fontFamily\": \"Inter\",\r\n      \"fontColor\": \"#ffffff\",\r\n      \"lineSpacing\": 1.4,\r\n      \"strokeColor\": \"#000000\",\r\n      \"strokeWidth\": 2,\r\n      \"keywordColor\": \"#ff0000\"\r\n    },\r\n    \"keywords\": [\"urgent\", \"important\", \"breaking\"]\r\n  }\r\n}\r\n',
				placeholder: '{\r\n  \"box\": {\r\n    \"x\": 100,\r\n    \"y\": 200,\r\n    \"width\": 600,\r\n    \"height\": 300\r\n  },\r\n  \"options\": {\r\n    \"align\": \"center\",\r\n    \"verticalAlign\": \"middle\",\r\n    \"padding\": {\r\n      \"top\": 20,\r\n      \"right\": 30,\r\n      \"bottom\": 20,\r\n      \"left\": 30\r\n    },\r\n    \"style\": {\r\n      \"fontSize\": 36,\r\n      \"fontFamily\": \"Inter\",\r\n      \"fontColor\": \"#ffffff\",\r\n      \"lineSpacing\": 1.4,\r\n      \"strokeColor\": \"#000000\",\r\n      \"strokeWidth\": 2,\r\n      \"keywordColor\": \"#ff0000\"\r\n    },\r\n    \"keywords\": [\"urgent\", \"important\", \"breaking\"]\r\n  }\r\n}\r\n',
				description: 'JSON draw options for writing text to image',
				displayOptions: {
					show: {
						operation: ['writeToImageWithWrappedText']
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
				returnData.push(result);
			} else if (operation === 'splitToNCharacters') {
				const result = await split.execute.call(this, items[i]);
				returnData.push(result);
			} else if (operation === 'writeToImageWithWrappedText') {
				const result = await writeToImage.execute.call(this, items[i])
				returnData.push(result);
			}
		}

		return this.prepareOutputData(returnData)
	}
}
