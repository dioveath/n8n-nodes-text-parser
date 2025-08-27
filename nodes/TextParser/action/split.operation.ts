// action/split.operation.ts

import { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);

export async function execute(
    this: IExecuteFunctions,
    item: INodeExecutionData
): Promise<INodeExecutionData> {
    const text = this.getNodeParameter('text', item?.index || 0) as string
    const maxChars = this.getNodeParameter('maxChars', item?.index || 0) as number
    const overlapChars = this.getNodeParameter('overlapChars', item?.index || 0) as number

    const doc = nlp.readDoc(text);
    const sentences = doc.sentences().out();

    let chunks = [];
    let current = '';

    for (let s of sentences) {
        if ((current + ' ' + s).length <= maxChars) {
            current += (current ? ' ' : '') + s;
        } else {
            chunks.push(current.trim())            

            if (overlapChars > 0 && current.length > overlapChars) {
                current = current.slice(-overlapChars) + ' ' + s;
            } else {
                current = s;
            }
        }
    }

    if (current) chunks.push(current.trim())        

    return {
        json: {
            chunks
        }
    }
}