// aws/companyRegistration/handler.ts

/**
 * AWS Lambda Handler for Company Registration
 * 
 * This Lambda function handles company adhesion/registration requests.
 * It validates the input, creates a new company record, and returns the result.
 * 
 * Integration Steps:
 * 1. API Gateway Integration:
 *    - Create an API Gateway REST API
 *    - Create a POST method on /v1/companies resource
 *    - Configure Lambda proxy integration
 *    - Enable CORS if needed for web clients
 * 
 * 2. Alternative: EventBridge + SQS Integration:
 *    - EventBridge rule triggers this Lambda on company registration events
 *    - SQS for reliable message processing and retry logic
 *    - SNS for notifications to downstream systems
 * 
 * 3. Database Integration:
 *    - Add DynamoDB table for persistence
 *    - Configure IAM role with DynamoDB permissions
 *    - Use AWS SDK v3 for DynamoDB operations
 * 
 * Expected Output Format:
 * Success: { statusCode: 201, body: JSON.stringify(companyData) }
 * Error: { statusCode: 4xx/5xx, body: JSON.stringify({ error: "message" }) }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

interface CreateCompanyRequest {
  cuit: string;
  businessName: string;
  type: 'PYME' | 'CORPORATE';
}

interface CompanyResponse {
  id: string;
  cuit: string;
  businessName: string;
  joinedAt: string;
  type: 'PYME' | 'CORPORATE';
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const requestBody: CreateCompanyRequest = JSON.parse(event.body);

    const validationResult = validateCompanyRequest(requestBody);
    if (!validationResult.isValid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: validationResult.error }),
      };
    }

    const existingCompany = await checkCompanyExists(requestBody.cuit);
    if (existingCompany) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: `Company with CUIT ${requestBody.cuit} already exists`,
        }),
      };
    }

    const companyId = generateUniqueId();
    const newCompany: CompanyResponse = {
      id: companyId,
      cuit: requestBody.cuit,
      businessName: requestBody.businessName,
      joinedAt: new Date().toISOString(),
      type: requestBody.type,
    };

    await saveCompanyToDatabase(newCompany);

    await publishCompanyRegisteredEvent(newCompany);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newCompany),
    };
  } catch (error) {
    console.error('Error processing company registration:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function validateCompanyRequest(request: any): { isValid: boolean; error?: string } {
  if (!request.cuit || typeof request.cuit !== 'string') {
    return { isValid: false, error: 'CUIT is required and must be a string' };
  }

  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
  if (!cuitRegex.test(request.cuit)) {
    return { isValid: false, error: 'CUIT must follow the format XX-XXXXXXXX-X' };
  }

  if (!request.businessName || typeof request.businessName !== 'string') {
    return { isValid: false, error: 'Business name is required and must be a string' };
  }

  if (request.businessName.trim().length === 0) {
    return { isValid: false, error: 'Business name cannot be empty' };
  }

  if (request.businessName.length > 255) {
    return { isValid: false, error: 'Business name cannot exceed 255 characters' };
  }

  if (!request.type || !['PYME', 'CORPORATE'].includes(request.type)) {
    return { isValid: false, error: 'Type must be either PYME or CORPORATE' };
  }

  return { isValid: true };
}

async function checkCompanyExists(cuit: string): Promise<boolean> {
  // In a real implementation, this would query DynamoDB
  // Example with AWS SDK v3:
  /*
  const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  
  const command = new GetItemCommand({
    TableName: process.env.COMPANIES_TABLE,
    Key: { cuit: { S: cuit } }
  });
  
  const result = await client.send(command);
  return !!result.Item;
  */
  
  return false;
}

async function saveCompanyToDatabase(company: CompanyResponse): Promise<void> {
  // In a real implementation, this would save to DynamoDB
  // Example with AWS SDK v3:
  /*
  const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
  const client = new DynamoDBClient({ region: process.env.AWS_REGION });
  
  const command = new PutItemCommand({
    TableName: process.env.COMPANIES_TABLE,
    Item: {
      id: { S: company.id },
      cuit: { S: company.cuit },
      businessName: { S: company.businessName },
      joinedAt: { S: company.joinedAt },
      type: { S: company.type }
    }
  });
  
  await client.send(command);
  */
  
  console.log('Company saved to database:', company);
}

async function publishCompanyRegisteredEvent(company: CompanyResponse): Promise<void> {
  // In a real implementation, this would publish to EventBridge or SNS
  // Example with EventBridge:
  /*
  const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
  const client = new EventBridgeClient({ region: process.env.AWS_REGION });
  
  const command = new PutEventsCommand({
    Entries: [{
      Source: 'company.registration',
      DetailType: 'Company Registered',
      Detail: JSON.stringify(company),
      EventBusName: process.env.EVENT_BUS_NAME
    }]
  });
  
  await client.send(command);
  */
  
  console.log('Company registration event published:', company);
}

function generateUniqueId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}