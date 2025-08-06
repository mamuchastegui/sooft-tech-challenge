import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
// Suponemos que existe una librería compartida de validación:
import { validateCompanyRequest } from "shared-lib";  // (Validaciones de formato/dominio)

// Instanciar el cliente SQS una sola vez (fuera del handler) para reutilizar conexión
const sqsClient = new SQSClient({});

/**
 * Handler principal de la Lambda.
 * @param event Evento de invocación (puede provenir de API Gateway o EventBridge).
 * @param context Contexto de ejecución de AWS Lambda.
 */
export const handler = async (event: any, context: any) => {
  console.log("Solicitud recibida en Lambda:", JSON.stringify(event));

  // 1. Obtener datos de la empresa desde el evento según origen
  let companyData;
  if (event.requestContext) {
    // Invocación vía API Gateway (evento HTTP)
    companyData = JSON.parse(event.body || "{}");
  } else if (event.detail) {
    // Invocación vía EventBridge (el payload vendría en event.detail)
    companyData = event.detail;
  } else {
    // Invocación directa (AWS SDK u otro) asumiendo el evento ya es el JSON de empresa
    companyData = event;
  }

  try {
    // 2. Validación básica de la estructura de datos
    //    (Reutilizando validaciones de dominio del microservicio)
    validateCompanyRequest(companyData);
    console.log("Validación de entrada exitosa");

    // 3. Envío del mensaje a la cola SQS
    const queueUrl = process.env.COMPANY_QUEUE_URL;  // URL de la cola, en variable de entorno
    const messageBody = JSON.stringify(companyData);
    // Opcional: agregar atributos para trazabilidad (e.g., requestId)
    const sendCmd = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      // MessageGroupId y MessageDeduplicationId si fuera cola FIFO
    });
    const result = await sqsClient.send(sendCmd);
    console.log("Mensaje encolado en SQS, ID:", result.MessageId);

    // 4. Preparar respuesta HTTP (si fue invocado vía API Gateway)
    if (event.requestContext) {
      const responseBody = {
        message: "Solicitud de adhesión recibida. Será procesada en breve.",
        requestId: result.MessageId  // Devolver ID de mensaje como correlativo (opcional)
      };
      return {
        statusCode: 202,
        body: JSON.stringify(responseBody)
      };
    } else {
      // Si invocado por EventBridge u otro, no se requiere respuesta específica
      return;
    }
  } catch (err: any) {
    console.error("Error procesando solicitud:", err);
    // Determinar tipo de error para respuesta adecuada
    if (event.requestContext) {
      // Respuesta HTTP de error (400 para errores de validación, 500 para otros)
      const statusCode = err.name === "ValidationError" ? 400 : 500;
      const errorMsg = err.message || "Internal Server Error";
      return {
        statusCode: statusCode,
        body: JSON.stringify({ error: errorMsg })
      };
    } else {
      // En entorno EventBridge, simplemente loguear el error (EventBridge retrigger según configuración)
      throw err;  // (Dejar que falle para reintento si aplica)
    }
  }
};
