// action/writeToImage.operation.ts
// import { createCanvas, loadImage, SKRSContext2D } from '@napi-rs/canvas';
// import { IExecuteFunctions, INodeExecutionData, IPairedItemData, NodeApiError } from 'n8n-workflow';
// import { Parser } from 'expr-eval';

// export async function execute(this: IExecuteFunctions, item: INodeExecutionData): Promise<INodeExecutionData> {
//     const itemIndex = (item["pairedItem"] as IPairedItemData).item
//     const text = this.getNodeParameter('text', itemIndex) as string;
//     const imageBinaryField = this.getNodeParameter('imageBinaryField', itemIndex) as string;
//     const writeOptions = this.getNodeParameter('drawOptions', itemIndex) as string;

//     const parsedOptions = JSON.parse(writeOptions)
//     this.logger.info(`Write Otions: ${JSON.stringify(parsedOptions, null, 2)}`)

//     const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(itemIndex, imageBinaryField)
//     if (!binaryDataBuffer) {
//         throw new NodeApiError(this.getNode(), {
//             message: "No image found",
//             description: `Failed to get image from the binary field ${imageBinaryField}`
//         })
//     }

//     const img = await loadImage(binaryDataBuffer);
//     const { box: inputBox, options } = parsedOptions;

//     // const defaultBox: Box = { x: 0, y: 0, width: img.width / 2, height: img.height };    
//     // use { Parser } from 'expr-eval' to evaluate dynamic width with img.width and img.height
//     // for example _box.x = "w/2", we'll evaluate this dynamically    

//     const vars = {
//         w: img.width,
//         h: img.height
//     }

//     const evalField = (value: string | number): number => {
//         if (typeof value === "number") return value;
//         const parser = new Parser();
//         return parser.parse(value).evaluate(vars)
//     }

//     const box: Box = {
//         x: evalField(inputBox.x),
//         y: evalField(inputBox.y),
//         width: evalField(inputBox.width),
//         height: evalField(inputBox.height)
//     }

//     this.logger.info(`Options: ${JSON.stringify(options, null, 2)}`)
//     const canvas = await drawTextInBox(binaryDataBuffer, text, box, options);

//     const buffer = await canvas.encode('png');
//     const base64 = Buffer.from(buffer).toString('base64');

//     const mimeType = 'image/png';
//     const fileExtension = mimeType.split('/')[1];
//     const fileName = `file_${Date.now()}.${fileExtension}`;
//     const fileSize = buffer.byteLength || buffer.length;

//     return {
//         binary: {
//             data: {
//                 data: base64,
//                 mimeType,
//                 fileName,
//                 fileExtension,
//                 fileSize: `${fileSize}`
//             }
//         },
//         json: {
//             success: true,
//         }
//     };
// }

// export interface Box {
//     x: number;
//     y: number;
//     width: number;
//     height: number;
// }

// export type TextAlign = 'left' | 'center' | 'right';
// export type VerticalAlign = 'top' | 'middle' | 'bottom';

// export interface Padding {
//     top?: number;
//     right?: number;
//     bottom?: number;
//     left?: number;
// }

// export interface TextStyle {
//     fontSize?: number;         // px (undefined = auto-fit)
//     fontFamily?: string;       // 'Arial', 'Inter', etc.
//     fontColor?: string;        // '#ffffff'
//     lineSpacing?: number;      // e.g. 1.2
//     strokeColor?: string;      // '#000000'
//     strokeWidth?: number;      // px
//     keywordColor?: string;     // Color for highlighted keywords
// }

// export interface DrawOptions {
//     align?: TextAlign;
//     verticalAlign?: VerticalAlign;
//     padding?: Padding;
//     style?: TextStyle;
//     keywords?: string[];
// }

// const MIN_FONT_SIZE = 16;

// async function drawTextInBox(imagePath: string | Buffer, text: string, box: Box, options: DrawOptions = {}) {
//     const {
//         align = 'left',
//         verticalAlign = 'bottom',
//         padding = {},
//         style = {},
//         keywords = []
//     } = options;

//     const {
//         fontSize,
//         fontFamily = 'sans-serif',
//         fontColor = 'white',
//         lineSpacing = 1.2,
//         strokeColor,
//         strokeWidth = 0,
//         keywordColor = '#ff0000'
//     } = style;

//     const img = await loadImage(imagePath);
//     const canvas = createCanvas(img.width, img.height);
//     const ctx = canvas.getContext('2d');
//     ctx.drawImage(img, 0, 0);

//     const padTop = padding.top ?? 0;
//     const padRight = padding.right ?? 0;
//     const padBottom = padding.bottom ?? 0;
//     const padLeft = padding.left ?? 0;

//     const innerBox = {
//         x: box.x + padLeft,
//         y: box.y + padTop,
//         width: box.width - padLeft - padRight,
//         height: box.height - padTop - padBottom
//     }

//     // debug lines
//     ctx.strokeStyle = 'red';
//     ctx.strokeRect(box.x, box.y, box.width, box.height);
//     ctx.strokeStyle = 'blue';
//     ctx.strokeRect(innerBox.x, innerBox.y, innerBox.width, innerBox.height);

//     console.log(`fontSize: ${fontSize}`)

//     let finalFontSize = fontSize ?? innerBox.height;
//     let lines: string[] = [];

//     if (fontSize === undefined) {
//         while (finalFontSize > MIN_FONT_SIZE) {
//             ctx.font = `${finalFontSize}px ${fontFamily}`;
//             ctx.textBaseline = 'top';
//             lines = wrapText(ctx, text, innerBox.width)
//             const totalHeight = lines.length * finalFontSize * lineSpacing;
//             if (totalHeight <= innerBox.height) break;
//             finalFontSize -= 2;
//         }
//     } else {
//         ctx.font = `${finalFontSize}px ${fontFamily}`;
//         ctx.textBaseline = 'top';
//         lines = wrapText(ctx, text, innerBox.width);
//     }

//     ctx.textAlign = align;
//     if (strokeColor && strokeWidth > 0){
//         ctx.strokeStyle = strokeColor;
//         ctx.lineWidth = strokeWidth;
//     }

//     const totalHeight = lines.length * finalFontSize * lineSpacing;
//     let y = calculateInitialY(verticalAlign, innerBox, totalHeight);
//     const useKeywordHighlighting = keywords.length > 0;

//     for (const line of lines) {
//         let x: number;
//         if (align === "center") x = innerBox.x + innerBox.width / 2;
//         else if (align === "right") x = innerBox.x + innerBox.width;
//         else x = innerBox.x;

//         if (useKeywordHighlighting) {
//             drawTextWithKeywords(ctx, line, x, y, fontColor, keywordColor, strokeColor, strokeWidth, keywords);
//         } else {
//             ctx.fillStyle = fontColor;
//             if (strokeColor && strokeWidth > 0){
//                 ctx.strokeText(line, x, y);
//             }
//             ctx.fillText(line, x, y);
//         }

//         y += finalFontSize * lineSpacing;        
//     }

//     return canvas;
// }

// function calculateInitialY(verticalAlign: VerticalAlign, innerBox: { y: number, height: number }, totalHeight: number): number {
//     switch (verticalAlign) {
//         case 'top':
//             return innerBox.y;
//         case 'bottom':
//             return innerBox.y + innerBox.height - totalHeight;
//         case 'middle':
//         default:
//             return innerBox.y + (innerBox.height - totalHeight) / 2;
//     }
// }

// function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number) {
//     const words = text.split(' ');
//     const lines = [];
//     let line = '';

//     for (let word of words) {
//         const testLine = line + word + ' ';
//         if (ctx.measureText(testLine).width > maxWidth && line !== '') {
//             lines.push(line.trim());
//             line = word + ' ';
//         } else {
//             line = testLine;
//         }
//     }

//     if (line) lines.push(line.trim());
//     return lines;
// }

// function drawTextWithKeywords(
//     ctx: SKRSContext2D, 
//     text: string, x: number, y: number, 
//     fontColor: string, keywordColor: string, strokeColor: string | undefined, strokeWidth: number,
//     keywords: string[]
// ): void {
//     const words = text.split(' ');
//     let currentX = x;

//     for (const word of words) {
//         const cleanWord = word.toLowerCase().replace(/[.,!?;:"'()\[\]{}]/g, '');
//         const isKeyword = keywords.some(keyword => keyword.toLowerCase() === cleanWord);

//         ctx.fillStyle = isKeyword ? keywordColor : fontColor;

//         if (strokeColor && strokeWidth > 0) {
//             ctx.strokeText(word, currentX, y);            
//         }
//         ctx.fillText(word, currentX, y);

//         const wordWidth = ctx.measureText(word).width;
//         const spaceWidth = ctx.measureText(' ').width;

//         currentX += wordWidth + spaceWidth;
//     }
// }