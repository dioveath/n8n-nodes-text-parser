// action/segmentation.operation.ts

import { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);

export async function execute(
    this: IExecuteFunctions,
    item: INodeExecutionData
): Promise<INodeExecutionData> {
    const text = this.getNodeParameter('text', item?.index || 0) as string

    const doc = nlp.readDoc(text);
    const splitSentences = doc.sentences().out();

    return {
        json: {
            sentences: splitSentences
        }
    }
}