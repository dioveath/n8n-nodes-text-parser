// action/segmentationWithTimestamps.operation.ts

import { IExecuteFunctions, INodeExecutionData, IPairedItemData } from "n8n-workflow";
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);

export async function execute(
    this: IExecuteFunctions,
    item: INodeExecutionData
): Promise<INodeExecutionData> {
    const itemIndex = (item["pairedItem"] as IPairedItemData).item;
    const text = this.getNodeParameter('text', itemIndex || 0) as string;
    // const timestampsJson = this.getNodeParameter('timestampsData', itemIndex) as string;
    // const timestampsData = JSON.parse(timestampsJson)


    const doc = nlp.readDoc(text);
    const splitSentences = doc.sentences().out();



    return {
        json: {
            sentences: splitSentences
        }
    }
}