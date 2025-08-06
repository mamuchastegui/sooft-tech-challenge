# SOOFT Technology Backend Challenge

A NestJS backend application implementing hexagonal architecture for company management and transfer tracking with PostgreSQL database and dynamic date range filtering.

## Architecture

This project follows **Hexagonal Architecture (Ports & Adapters)** with Clean Code principles:

- **Domain Layer**: Core business logic, entities, and repository interfaces
- **Application Layer**: Use cases, services, and DTOs with dynamic query filtering
- **Infrastructure Layer**: PostgreSQL database adapters, TypeORM entities, and date providers
- **Presentation Layer**: REST API controllers with OpenAPI documentation

## Features

### Core Endpoints

1. **POST /v1/companies** - Register new company adhesion
2. **GET /v1/companies** - Get companies with optional date range filters:
   - `?joinedFrom=2023-12-01T00:00:00Z&joinedTo=2023-12-31T23:59:59Z` - Companies joined within date range
   - `?transferFrom=2023-11-01T00:00:00Z&transferTo=2023-11-30T23:59:59Z` - Companies with transfers within date range
   - All parameters can be combined and are optional (inclusive filtering)
3. **GET /v1/reports/companies/transfer-last-month** - Companies with transfers in the previous month (materialized view)
4. **GET /v1/reports/companies/joined-last-month** - Companies that joined in the previous month (materialized view)

### Domain Models

- **Company**: Abstract base class with polymorphic behavior
  - **PymeCompany**: PYME companies with flat-rate fees and lower limits
  - **CorporateCompany**: Corporate companies with tiered fees and higher limits
- **Transfer**: `amount`, `companyId`, `debitAccount`, `creditAccount`, `createdAt`

## Polymorphic Company Model

The application implements true object-oriented polymorphism for company types, following hexagonal architecture and SOLID principles:

### Architecture Pattern
- **Abstract Base Class**: `Company` defines common behavior and abstract methods
- **Concrete Subclasses**: `PymeCompany` and `CorporateCompany` implement specific business rules
- **Strategy Pattern**: `FeePolicy` and `TransferLimitPolicy` interfaces enable pluggable business logic
- **Factory Pattern**: `CompanyFactory` creates appropriate company instances based on type

### Business Logic Differences

#### PYME Companies
- **Fee Structure**: Flat $50 fee for all transfers
- **Transfer Limits**: 
  - Maximum: $100,000 per transfer
  - Daily: $50,000
  - Monthly: $500,000
- **Government Support**: Eligible for government programs
- **Required Documents**: 4 basic documents including PYME certificate

#### Corporate Companies  
- **Fee Structure**: Tiered percentage-based fees
  - 0.1% for amounts up to $10,000
  - 0.5% for amounts $10,001-$100,000
  - 1.0% for amounts above $100,000
- **Transfer Limits**:
  - Maximum: $1,000,000 per transfer
  - Daily: $1,000,000
  - Monthly: $10,000,000
- **Government Support**: Not eligible
- **Required Documents**: 6 documents including audited financials
- **Compliance**: Additional reporting requirements

### Technical Implementation
- **Domain Layer**: Pure business logic with no framework dependencies
- **Infrastructure Layer**: TypeORM single-table inheritance with discriminator column
- **Persistence**: `CompanyMapper` handles domain ↔ entity conversion
- **Creation**: Factory pattern ensures correct instantiation based on type

### Usage Examples
```typescript
// Create companies using factory
const pymeCompany = CompanyFactory.createPyme(cuit, businessName);
const corporateCompany = CompanyFactory.createCorporate(cuit, businessName);

// Polymorphic behavior
console.log(pymeCompany.calculateTransferFee(10000)); // $50
console.log(corporateCompany.calculateTransferFee(10000)); // $10

// Type-specific methods
console.log(pymeCompany.isEligibleForGovernmentSupport()); // true
console.log(corporateCompany.requiresComplianceReporting()); // true
```

## Technology Stack

- **Framework**: NestJS 10+
- **Language**: TypeScript
- **Database**: PostgreSQL (Amazon RDS free-tier in production)
- **ORM**: TypeORM with entities and query builder
- **Validation**: class-validator, class-transformer
- **Documentation**: OpenAPI/Swagger 7.x
- **Testing**: Jest (unit + e2e tests)
- **Architecture**: Hexagonal (Ports & Adapters)
- **Code Quality**: ESLint + Prettier

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm

### Quick Start

```bash
# Clone and install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Wait for database to be ready, then seed data
npm run db:seed

# Start development server
npm run start:dev
```

The application will be available at `http://localhost:3000`

### Database Management

```bash
# Run database migrations (create indexes and materialized view)
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Refresh materialized views (manual, otherwise scheduled nightly at 03:00 UTC)
npm run db:refresh-mv
```

### Performance Optimization

The `/companies` endpoint has been optimized for sub-100ms response times:

- **Database Indexes**: Automatic indexes on `companies.joined_at`, `transfers.company_id`, and `transfers.created_at`
- **Query Optimization**: EXISTS subqueries instead of expensive JOINs
- **Connection Pooling**: Configured for 2-10 concurrent connections
- **Query Caching**: 30-second cache for repeated queries

**Expected Performance:**
- Local development: < 50ms
- AWS RDS free-tier: < 100ms
- Production RDS: < 25ms

## Production (Amazon RDS) Setup

The application is designed to work with Amazon RDS PostgreSQL free-tier in production:

1. **Create RDS Instance**: Use PostgreSQL free-tier instance
2. **Configure Environment**: Set RDS connection details in environment variables:
   ```bash
   DATABASE_HOST=your-rds-endpoint.amazonaws.com
   DATABASE_USERNAME=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=your_database
   ```
3. **Deploy**: The application automatically detects RDS vs local configuration

## Scalability Roadmap

See [ASSUMPTIONS.md](./ASSUMPTIONS.md#scalability-roadmap) for detailed scalability plans:

- **Scale-up**: Bigger RDS instances for increased throughput
- **Scale-out**: Read replicas + optional manual sharding  
- **Aurora Migration**: Seamless upgrade to Aurora PostgreSQL Serverless v2
- **Specialized Storage**: DynamoDB for ultra-low-latency hot paths

## NPM Scripts

### Development
- `npm run start:dev` - Start application in watch mode
- `npm run start` - Start application in production mode
- `npm run build` - Build the application

### Code Quality
- `npm run lint` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier

### Testing
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests

## API Documentation

### Create Company
```bash
curl -X POST http://localhost:3000/v1/companies \
  -H "Content-Type: application/json" \
  -d '{
    "cuit": "30-12345678-1",
    "businessName": "Tech Solutions SA",
    "type": "CORPORATE"
  }'
```

**Response (201):**
```json
{
  "id": "uuid",
  "cuit": "30-12345678-1",
  "businessName": "Tech Solutions SA",
  "type": "CORPORATE",
  "joinedAt": "2023-12-01T10:00:00.000Z"
}
```

### Get All Companies
```bash
curl -X GET http://localhost:3000/v1/companies
```

### Get Companies Joined After Date
```bash
curl -X GET "http://localhost:3000/v1/companies?joinedAfter=2023-12-01T00:00:00Z"
```

### Get Companies with Recent Transfers
```bash
curl -X GET "http://localhost:3000/v1/companies?transfersSince=2023-11-01T00:00:00Z"
```

### Get Companies with Combined Filters
```bash
curl -X GET "http://localhost:3000/v1/companies?joinedAfter=2023-12-01T00:00:00Z&transfersSince=2023-11-01T00:00:00Z"
```

### Get Companies Transfer Report (Last Month)
```bash
curl -X GET "http://localhost:3000/v1/reports/companies/transfer-last-month"
```

**Response Format (200):**
```json
[
  {
    "id": "uuid",
    "cuit": "30-12345678-1",
    "businessName": "Tech Solutions SA",
    "joinedAt": "2023-12-01T10:00:00.000Z",
    "type": "CORPORATE",
    "transferCount": 5,
    "totalAmount": "150000.50"
  }
]
```

### Get Companies Joined Report (Last Month)
```bash
curl -X GET "http://localhost:3000/v1/reports/companies/joined-last-month"
```

**Response Format (200):**
```json
[
  {
    "id": "uuid",
    "cuit": "30-12345678-1",
    "businessName": "Tech Solutions SA",
    "joinedAt": "2023-12-01T10:00:00.000Z",
    "type": "CORPORATE"
  }
]
```

**Companies Endpoint Response Format (200):**
```json
[
  {
    "id": "uuid",
    "cuit": "30-12345678-1",
    "businessName": "Tech Solutions SA",
    "type": "CORPORATE",
    "joinedAt": "2023-12-01T10:00:00.000Z"
  }
]
```

## Query Parameter Behavior

### Date Filtering Logic
- **joinedAfter**: Filters companies where `joinedAt >= provided_date`
- **transfersSince**: Filters companies that have at least one transfer where `createdAt >= provided_date`
- **Combined**: Both filters applied with AND logic
- **No filters**: Returns all companies

### Date Format Requirements
- **Format**: ISO-8601 string (e.g., `2023-12-01T00:00:00Z`)
- **Timezone**: UTC (Z suffix required)
- **Validation**: Returns 400 Bad Request for invalid formats
- **Comparison**: Inclusive (>=) date comparison

### Edge Cases
- **Future dates**: Valid input, may return empty results
- **Empty parameters**: Ignored (same as not providing the parameter)
- **Invalid dates**: Return 400 with validation error message

## Testing

The project includes comprehensive test coverage:

### Unit Tests
- Domain entities validation and business logic
- Application services with mocked dependencies
- Infrastructure repository implementations
- Date provider service with testable date handling
- Query service with filtering logic

### E2E Tests
- Complete API endpoint testing with query parameters
- Request/response validation for all filter combinations
- Error handling scenarios for invalid dates
- Edge case testing (future dates, empty parameters)

```bash
# Run all tests
npm run test

# Generate coverage report
npm run test:cov

# Run specific test suite
npm run test -- --testNamePattern="CompanyQueryService"

# Run E2E tests with query parameter scenarios
npm run test:e2e
```

## OpenAPI/Swagger Documentation

When running the application, visit `http://localhost:3000/api` to access the interactive API documentation with:
- Complete endpoint descriptions
- Query parameter documentation
- Request/response examples
- Try-it-out functionality

## AWS Lambda Implementation

The project includes an AWS Lambda function for company registration at `aws/companyRegistration/`:

### Files
- `handler.ts` - Lambda function code with validation and error handling
- `event.json` - Sample API Gateway event for testing

### Integration Options

**Option 1: API Gateway**
- Direct REST API integration
- Handles HTTP requests/responses
- Built-in CORS support

**Option 2: Event-Driven**
- EventBridge for event routing
- SQS for reliable processing
- SNS for downstream notifications

### Expected Lambda Output
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

## Mock Data

The application includes pre-populated mock data with:
- 5 companies (mix of PYME and CORPORATE types)
- 6 transfers with various dates distributed across time periods
- Companies with recent join dates for testing `joinedAfter` filter
- Recent transfers for testing `transfersSince` filter

Mock data is reset on application restart and can be reset programmatically via `DatabaseService.reset()`.

## Design Decisions

### RESTful Query Parameters
- **Extensibility**: Easy to add new filters without URL path changes
- **Composability**: Multiple filters can be combined naturally
- **Caching**: Query parameters enable better HTTP caching strategies
- **Standards Compliance**: Follows REST conventions for resource filtering

### Hexagonal Architecture
- **Separation of Concerns**: Clear boundaries between layers
- **Testability**: Easy to mock dependencies and test business logic in isolation
- **Flexibility**: Can swap infrastructure components without affecting business logic
- **Query Service**: Dedicated service for complex filtering logic

### Date Handling Strategy
- **DateProvider**: Injectable service for testable date operations
- **UTC Timezone**: Consistent timezone handling across all operations
- **ISO-8601 Format**: Standard date format for API consistency
- **Inclusive Filtering**: `>=` comparison for intuitive date range behavior

### Validation Strategy
- **Input Validation**: class-validator decorators on DTOs with proper error messages
- **Domain Validation**: Business rules enforced in entity constructors
- **Query Validation**: Date format validation with clear error responses
- **Error Handling**: Proper HTTP status codes and descriptive error messages

## Error Handling

The application provides consistent error responses:

- **400 Bad Request**: Validation errors, malformed data, invalid date formats
- **409 Conflict**: Duplicate CUIT registration
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Unexpected application errors

### Query Parameter Error Examples
```json
{
  "statusCode": 400,
  "message": ["joinedAfter must be a valid ISO-8601 date string"],
  "error": "Bad Request"
}
```

## Performance Considerations

### Query Optimization
- **In-Memory Filtering**: Fast operations on small datasets
- **Index Strategy**: Production databases would require indexes on date fields
- **Caching**: HTTP caching headers for GET endpoints
- **Pagination**: Can be added as additional query parameters

## Security Considerations

- Input validation and sanitization for all query parameters
- CORS configuration for cross-origin requests
- No sensitive data exposure in error messages
- Environment variable configuration for secrets
- Rate limiting capabilities (can be added with @nestjs/throttler)

## Monitoring & Observability

The application includes:
- Structured logging with query parameter context
- Request/response logging with filter information
- Error tracking and reporting
- Performance metrics via NestJS interceptors
- OpenAPI documentation for API monitoring

## Deployment

### Local Development
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
npm run start:prod
```

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Write tests for new features and query logic
3. Update OpenAPI documentation for new parameters
4. Use conventional commit messages
5. Test query parameter combinations thoroughly

## License

MIT License - SOOFT Technology Challenge