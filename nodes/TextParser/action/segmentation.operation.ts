// action/segmentation.operation.ts

import { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";

export async function execute(
    this: IExecuteFunctions,
    item: INodeExecutionData
): Promise<INodeExecutionData> {
    const operation = this.getNodeParameter('operation', item?.index || 0)

    return {
        json: {
            answer: "Operation: " + operation
        }
    }
}