# Implementación AWS Lambda

## Overview

El proyecto incluye una implementación AWS Lambda para procesamiento asíncrono de registro de empresas, diseñada para partners y cargas masivas.

## Documentación y Código

### Archivos principales
- **Handler**: `aws/companyRegistration/handler.ts`
- **Documentación completa**: `aws/companyRegistration/README.md`
- **Evento de prueba**: `aws/companyRegistration/event.json`

### Arquitectura

La Lambda forma parte de un flujo event-driven que incluye:

1. **API Gateway** → **EventBridge** → **Lambda Ingest**
2. **Lambda** valida y publica a **SQS**
3. **Consumer** procesa mensajes y persiste en DB
4. **SNS** notifica otros sistemas

Ver documentación detallada en `aws/companyRegistration/README.md` para:
- Flujos síncronos vs asíncronos
- Beneficios de escalabilidad y resiliencia
- Configuración de EventBridge, SQS y SNS
- Manejo de errores y DLQ
- Observabilidad y tracing

## Dependencias

### AWS SDK
```bash
npm install @aws-sdk/client-sqs
```

### Variables de entorno requeridas
```bash
COMPANY_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/company-queue
AWS_REGION=us-east-1
```

## Testing Local

### Con SAM
```bash
sam local invoke CompanyRegistrationFunction -e aws/companyRegistration/event.json
```

### Con Serverless Offline
```bash
npx serverless offline
curl -X POST http://localhost:3000/dev/companies -d @aws/companyRegistration/event.json
```

## Validación

La Lambda utiliza la misma librería de validación que el API principal (`shared-lib/validation.js`) para mantener consistencia en las reglas de negocio.

## Despliegue

Consultar la documentación específica en `aws/companyRegistration/README.md` para instrucciones detalladas de despliegue con SAM, Serverless Framework o CDK.