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
				type: 'string',
				typeOptions: {
					rows: 12,
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
			// {
			// 	displayName: 'Write Options',
			// 	name: 'writeOptions',
			// 	type: 'fixedCollection',
			// 	typeOptions: {
			// 		multipleValues: true,
			// 		maxAllowedFields: 1,
			// 		sortable: false,
			// 	},
			// 	default: {},
			// 	placeholder: 'Add Options',
			// 	description: 'Add configuration options',
			// 	required: false,
			// 	displayOptions: {
			// 		show: {
			// 			operation: ['writeToImageWithWrappedText']
			// 		}
			// 	},
			// 	options: [
			// 		{
			// 			displayName: 'Position And Size',
			// 			name: 'positionAndSize',
			// 			values: [
			// 				{
			// 					displayName: "X Position",
			// 					name: "x",
			// 					type: "number",
			// 					default: 0,
			// 					description: "X coordinate of the text area"
			// 				},
			// 				{
			// 					displayName: "Y Position",
			// 					name: "y",
			// 					type: "number",
			// 					default: 0,
			// 					description: "Y coordinate of the text area"
			// 				},
			// 				{
			// 					displayName: "Width",
			// 					name: "width",
			// 					type: "number",
			// 					default: 100,
			// 					description: "Width of the text area"
			// 				},
			// 				{
			// 					displayName: "Height",
			// 					name: "height",
			// 					type: "number",
			// 					default: 50,
			// 					description: "Height of the text area"
			// 				}
			// 			]
			// 		},
			// 		{
			// 			displayName: 'Padding Values',
			// 			name: 'paddingValues',
			// 			values: [
			// 				{
			// 					displayName: "Top",
			// 					name: "top",
			// 					type: "number",
			// 					default: 16,
			// 					description: "Padding from the top"
			// 				},
			// 				{
			// 					displayName: "Right",
			// 					name: "right",
			// 					type: "number",
			// 					default: 16,
			// 					description: "Padding from the right"
			// 				},
			// 				{
			// 					displayName: "Bottom",
			// 					name: "bottom",
			// 					type: "number",
			// 					default: 16,
			// 					description: "Padding from the bottom"
			// 				},
			// 				{
			// 					displayName: "Left",
			// 					name: "left",
			// 					type: "number",
			// 					default: 16,
			// 					description: "Padding from the left"
			// 				}
			// 			]
			// 		},
			// 		{
			// 			displayName: 'Text Style',
			// 			name: 'textStyle',
			// 			values: [
			// 				{
			// 					displayName: 'Font Size',
			// 					name: 'fontSize',
			// 					type: 'number',
			// 					default: undefined,
			// 					description: 'Font size in pixels (undefined = auto-fit)',
			// 				},
			// 				{
			// 					displayName: 'Font Family',
			// 					name: 'fontFamily',
			// 					type: 'string',
			// 					default: 'Arial',
			// 					description: 'Font family like Arial, Inter, etc.',
			// 				},
			// 				{
			// 					displayName: 'Font Color',
			// 					name: 'fontColor',
			// 					type: 'string',
			// 					default: '#ffffff',
			// 					description: 'Font color in hex format',
			// 				},
			// 				{
			// 					displayName: 'Line Spacing',
			// 					name: 'lineSpacing',
			// 					type: 'number',
			// 					default: 1.2,
			// 					description: 'Line spacing multiplier',
			// 				},
			// 				{
			// 					displayName: 'Stroke Color',
			// 					name: 'strokeColor',
			// 					type: 'string',
			// 					default: '#000000',
			// 					description: 'Stroke color in hex format',
			// 				},
			// 				{
			// 					displayName: 'Stroke Width',
			// 					name: 'strokeWidth',
			// 					type: 'number',
			// 					default: 0,
			// 					description: 'Stroke width in pixels',
			// 				},
			// 				{
			// 					displayName: 'Keyword Color',
			// 					name: 'keywordColor',
			// 					type: 'string',
			// 					default: '#FF0000',
			// 					description: 'Keyword color in hex format'
			// 				}
			// 			]
			// 		},
			// 		{
			// 			displayName: 'Text Align Options',
			// 			name: 'textAlignOptions',
			// 			values: [
			// 				{
			// 					displayName: 'Text Align',
			// 					name: 'textAlign',
			// 					type: 'options',
			// 					options: [
			// 						{ name: 'Left', value: 'left' },
			// 						{ name: 'Center', value: 'center' },
			// 						{ name: 'Right', value: 'right' },																		
			// 					],
			// 					default: 'left',
			// 					description: 'Horizontal Text Alignment',
			// 				},
			// 				{
			// 					displayName: 'Vertical Align',
			// 					name: 'verticalAlign',
			// 					type: 'options',
			// 					options: [
			// 						{ name: 'Top', value: 'top' },
			// 						{ name: 'Middle', value: 'middle' },
			// 						{ name: 'Bottom', value: 'bottom' },																		
			// 					],
			// 					default: 'middle',
			// 					description: 'Vertical Text Alignment',
			// 				},							
			// 			]
			// 		},
			// 		{
			// 			displayName: 'Keywords Highlighting',
			// 			name: 'keywordsHighlighting',
			// 			values: [
			// 				// {
			// 				// 	displayName: 'Keywords Array',
			// 				// 	name: 'arrayKeywords',
			// 				// 	type: 'string',
			// 				// 	typeOptions: {
			// 				// 		multipleValues: true,
			// 				// 		multipleValueButtonText: 'Add Keyword'
			// 				// 	},
			// 				// 	default: [],
			// 				// 	placeholder: 'Add Keyword here',
			// 				// 	description: 'Add multiple keywords to highlight',
			// 				// 	required: false
			// 				// },
			// 				{
			// 					displayName: 'Keywords Array String',
			// 					name: 'arrayStringKeywords',
			// 					type: 'string',
			// 					default: '[]',
			// 					placeholder: 'Keywords array string',
			// 					description: 'Add string of array of keywords',
			// 					required: false								
			// 				}
			// 			]
			// 		}
			// 	]
			// }
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
