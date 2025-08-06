import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { validateCompanyRequest } from "../../shared-lib/validation.js";
import type { CompanyDTO } from "../../shared-lib/validation.js";

const sqsClient = new SQSClient({});
const { COMPANY_QUEUE_URL } = process.env;

export const handler = async (event: any, context: any): Promise<void> => {
  const traceId = context.awsRequestId as string;
  const records = Array.isArray(event.detail) ? event.detail : [event.detail];

  await Promise.all(
    records.map(async (rec: CompanyDTO) => {
      validateCompanyRequest(rec);
      const cmd = new SendMessageCommand({
        QueueUrl: COMPANY_QUEUE_URL!,
        MessageBody: JSON.stringify(rec),
        MessageGroupId: rec.cuit,
        MessageDeduplicationId: rec.id,
        MessageAttributes: {
          traceId: { DataType: "String", StringValue: traceId },
          source: { DataType: "String", StringValue: "lambda-ingest" },
        },
      });
      try {
        await sqsClient.send(cmd);
      } catch (e) {
        console.error("Fallo SQS", e);
        throw e;
      }
    })
  );
};

