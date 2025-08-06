# Implementación AWS Lambda

El proyecto incluye una función AWS Lambda para registro de empresas en `aws/companyRegistration/`:

## Archivos

### Handler Principal
- **`handler.ts`** - Código de función Lambda con validación y manejo de errores
- **`event.json`** - Evento de API Gateway de ejemplo para testing

## Código del Handler

```typescript
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
```

## Opciones de Integración

### Opción 1: API Gateway
**Integración directa de API REST**
- Maneja requests/responses HTTP
- Soporte CORS integrado
- Autenticación y autorización
- Rate limiting y throttling

#### Configuración de API Gateway
```yaml
# template.yaml (SAM)
Resources:
  CompanyRegistrationApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'POST, OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization'"
        AllowOrigin: "'*'"

  CompanyRegistrationFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: aws/companyRegistration/
      Handler: handler.handler
      Runtime: nodejs18.x
      Events:
        CompanyRegistration:
          Type: Api
          Properties:
            RestApiId: !Ref CompanyRegistrationApi
            Path: /companies
            Method: post
```

#### Respuesta de API Gateway
```json
{
  "statusCode": 201,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"id\":\"comp_123\",\"cuit\":\"30-12345678-1\",\"businessName\":\"New Company\",\"type\":\"CORPORATE\",\"joinedAt\":\"2023-12-01T10:00:00.000Z\"}"
}
```

### Opción 2: Event-Driven
**Arquitectura basada en eventos**
- EventBridge para ruteo de eventos
- SQS para procesamiento confiable
- SNS para notificaciones downstream
- DLQ para manejo de fallos

#### Arquitectura Event-Driven
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  EventBridge│────│   Lambda    │────│     SQS     │
│   (Trigger) │    │  (Process)  │    │   (Queue)   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                   ┌─────────────┐
                   │     SNS     │
                   │ (Notify)    │
                   └─────────────┘
```

#### Configuración EventBridge
```yaml
CompanyRegistrationEventRule:
  Type: AWS::Events::Rule
  Properties:
    EventPattern:
      source: ["company.registration"]
      detail-type: ["Company Registration Request"]
    State: ENABLED
    Targets:
      - Arn: !GetAtt CompanyRegistrationFunction.Arn
        Id: "CompanyRegistrationTarget"
```

## Despliegue

### SAM (Serverless Application Model)
```bash
# Instalar SAM CLI
npm install -g @aws-sam/cli

# Build y deploy
sam build
sam deploy --guided
```

### Serverless Framework
```yaml
# serverless.yml
service: company-registration

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1

functions:
  companyRegistration:
    handler: aws/companyRegistration/handler.handler
    events:
      - http:
          path: /companies
          method: post
          cors: true
    environment:
      COMPANY_QUEUE_URL: ${env:COMPANY_QUEUE_URL}
```

```bash
# Deploy con Serverless Framework
npx serverless deploy
```

### CDK (Cloud Development Kit)
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

const companyFunction = new lambda.Function(this, 'CompanyRegistrationFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'handler.handler',
  code: lambda.Code.fromAsset('aws/companyRegistration'),
  environment: {
    COMPANY_QUEUE_URL: queue.queueUrl,
  },
});

const api = new apigateway.RestApi(this, 'CompanyRegistrationApi');
const companiesResource = api.root.addResource('companies');
companiesResource.addMethod('POST', new apigateway.LambdaIntegration(companyFunction));
```

## Configuración de Entorno

### Variables de Entorno Requeridas
```bash
# SQS Configuration
COMPANY_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/company-queue

# AWS SDK Configuration (automático en Lambda)
AWS_REGION=us-east-1

# Application Configuration
NODE_ENV=production
```

### Permisos IAM
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:*:*:company-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## Testing Lambda

### Prueba Local con SAM
```bash
# Invocar función localmente
sam local invoke CompanyRegistrationFunction -e aws/companyRegistration/event.json

# Iniciar API local
sam local start-api
curl -X POST http://localhost:3000/companies -d @test-payload.json
```

### Prueba con Serverless Offline
```bash
# Instalar plugin
npm install --save-dev serverless-offline

# Agregar a serverless.yml
plugins:
  - serverless-offline

# Ejecutar localmente
npx serverless offline

# Test endpoint local
curl -X POST http://localhost:3000/dev/companies -d @test-payload.json
```

### Event de Prueba
```json
{
  "detail": {
    "id": "test-id-123",
    "cuit": "30-12345678-1",
    "businessName": "Test Company SA",
    "type": "CORPORATE"
  },
  "source": "company.registration",
  "detail-type": "Company Registration Request"
}
```

## Monitoreo y Logging

### CloudWatch Logs
```typescript
// Enhanced logging en Lambda
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  traceId: context.awsRequestId,
  event: 'company_registration_start',
  cuit: rec.cuit,
  type: rec.type
}));
```

### CloudWatch Metrics Personalizadas
```typescript
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch({});

await cloudwatch.putMetricData({
  Namespace: 'CompanyRegistration',
  MetricData: [
    {
      MetricName: 'CompaniesRegistered',
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        {
          Name: 'CompanyType',
          Value: rec.type
        }
      ]
    }
  ]
});
```

### X-Ray Tracing
```yaml
# SAM template.yaml
Globals:
  Function:
    Tracing: Active

Resources:
  CompanyRegistrationFunction:
    Type: AWS::Serverless::Function
    Properties:
      Tracing: Active
```

## Error Handling

### Dead Letter Queue
```yaml
CompanyRegistrationFunction:
  Type: AWS::Serverless::Function
  Properties:
    DeadLetterQueue:
      Type: SQS
      TargetArn: !GetAtt CompanyRegistrationDLQ.Arn
    ReservedConcurrencyLimit: 10
```

### Retry Logic
```typescript
const retryConfig = {
  maxRetries: 3,
  retryDelayOptions: {
    base: 300,
    customBackoff: (retryCount: number) => {
      return Math.pow(2, retryCount) * 100; // Exponential backoff
    }
  }
};
```

### Error Response Format
```json
{
  "statusCode": 400,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": "{\"error\":\"ValidationError\",\"message\":\"Invalid CUIT format\",\"details\":{\"cuit\":\"Format must be XX-XXXXXXXX-X\"}}"
}
```

## Costos y Optimización

### Optimización de Costos
- **Provisioned Concurrency**: Solo para producción si es necesario
- **Memory Allocation**: Optimizar entre 128MB-512MB según uso
- **Timeout**: Configurar timeout apropiado (30 segundos para SQS)
- **Batching**: Procesar múltiples registros por invocación

### Estimación de Costos (us-east-1)
```
Supuestos:
- 100,000 registros/mes
- 256MB memoria
- 2 segundos promedio de ejecución

Lambda:
- Requests: 100,000 * $0.0000002 = $0.02
- Duration: 100,000 * 2 * (256/1024) * $0.0000166667 = $0.83

SQS:
- Messages: 100,000 * $0.0000004 = $0.04

Total mensual: ~$0.89
```

## Mejores Prácticas

### Seguridad
- **Principle of Least Privilege**: Permisos mínimos necesarios
- **Environment Variables**: Para configuración sensible
- **VPC**: Para acceso a recursos privados si es necesario
- **Encryption**: En tránsito y en reposo

### Performance
- **Cold Start Optimization**: Mantener bundle size pequeño
- **Connection Pooling**: Reutilizar conexiones SDK
- **Async Operations**: Usar Promise.all para operaciones paralelas
- **Memory Tuning**: Monitorear y ajustar asignación de memoria

### Reliability
- **Idempotency**: Usar MessageDeduplicationId para SQS FIFO
- **Circuit Breaker**: Para dependencias externas
- **Graceful Degradation**: Fallbacks para servicios no críticos
- **Health Checks**: Monitoreo proactivo de dependencias