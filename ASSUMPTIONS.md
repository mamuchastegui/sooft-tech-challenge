# Technical Assumptions and Design Decisions

## Business Logic Assumptions

### Company Management
- **CUIT Format**: Assumed standard Argentine CUIT format (XX-XXXXXXXX-X)
- **Business Name**: Maximum 255 characters, cannot be empty
- **Company Types**: Only PYME and CORPORATE are valid types
- **Duplicate Prevention**: Companies are unique by CUIT, not by business name
- **Joining Date**: Automatically set to current timestamp on creation

### Transfer Logic
- **Account Format**: Assumed format XXX-XXXXXX-XX for bank accounts
- **Amount Validation**: Must be positive numbers, no currency validation
- **Transfer Direction**: Assumed debit/credit accounts are sufficient for tracking
- **Company Association**: Transfers must belong to existing companies
- **Date Tracking**: Creation timestamp is automatically assigned

## REST API Design Decisions

### Dynamic Date Range Filtering
- **Why Date Ranges**: Date ranges (from/to) are preferred over single dates because:
  1. **Flexibility**: Users can specify exact time periods without hardcoded logic
  2. **Business Alignment**: Real business queries often need specific date ranges
  3. **Scalability**: No need to update code for different time periods
  4. **Query Efficiency**: Database can optimize range queries with proper indexing
  5. **User Control**: Frontend applications can provide date pickers for precise filtering

### Date Filtering Parameters
- **joinedFrom/joinedTo**: Filter companies by their join date range (inclusive)
- **transferFrom/transferTo**: Filter companies that have transfers within the specified date range
- **Combined Logic**: All parameters work together with AND logic for precise filtering
- **Optional Parameters**: All filters are optional - omit for broader results
- **Range Flexibility**: Can specify only 'from' or only 'to' for open-ended ranges

### Date Filtering Logic
- **Inclusive Comparison**: All date filters use `>=` (greater than or equal) comparison for intuitive behavior
  - `joinedAfter=2023-12-01T00:00:00Z` includes companies joined exactly at midnight on Dec 1st
  - `transfersSince=2023-11-01T00:00:00Z` includes transfers created exactly at midnight on Nov 1st
- **Combined Filters**: When both `joinedAfter` and `transfersSince` are provided, they are combined with AND logic
  - Returns companies that satisfy BOTH conditions
  - More restrictive than either filter alone
- **No Filters Provided**: Returns all companies in the system
- **Empty Result Handling**: Valid query that returns no matches results in empty array `[]` with 200 status

### Date Format Requirements
- **ISO-8601 Standard**: Required format is `YYYY-MM-DDTHH:mm:ssZ` (e.g., `2023-12-01T10:30:00Z`)
- **UTC Timezone**: All dates must include `Z` suffix indicating UTC timezone
- **Validation Strategy**: 
  - Invalid format returns 400 Bad Request with specific error message
  - Valid format but future dates are accepted (may return empty results)
  - Empty parameters are ignored (treated as if parameter not provided)

### Edge Case Decisions
- **Future Dates**: Accepted as valid input, typically returns empty results
- **Past Dates Before Data Exists**: Returns empty results (not an error)
- **Malformed Parameters**: Return 400 Bad Request with validation details
- **Mixed Valid/Invalid Parameters**: Entire request fails validation if any parameter is invalid
- **Case Sensitivity**: Parameter names are case-sensitive (`joinedAfter` not `joinedafter`)

## Technical Architecture Decisions

### Hexagonal Architecture Implementation
- **Domain Independence**: Core business logic has no external dependencies
- **Repository Pattern**: Interfaces defined in domain, implemented in infrastructure
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Query Service**: Dedicated `CompanyQueryService` separates filtering logic from generic CRUD operations
- **Date Provider**: Injectable service enables deterministic testing of date-dependent logic

### Data Persistence Strategy
- **In-Memory Storage**: Chosen for simplicity and no external dependencies
- **Mock Data**: Pre-populated with realistic test data covering various time periods
- **Data Reset**: Automatically resets on application restart
- **Production Consideration**: Would be replaced with actual database with proper indexing on date fields

### Validation Strategy
- **Multi-Layer Validation**: 
  - DTO level: class-validator for input validation with custom error messages
  - Domain level: Business rule validation in entities
  - Query level: Date format validation with ISO-8601 requirements
  - Infrastructure level: Data integrity checks
- **Error Propagation**: Validation errors bubble up with proper HTTP status codes and descriptive messages

### API Design Choices
- **RESTful Endpoints**: Following REST conventions with resource-based URLs
- **Versioning**: API versioned with /v1 prefix for future compatibility
- **Response Format**: Consistent JSON responses with proper HTTP status codes
- **Error Handling**: Standardized error responses with meaningful messages and field-specific validation errors
- **OpenAPI Documentation**: Complete API specification with examples and parameter descriptions

## Date Handling Strategy

### DateProvider Service
- **Testability**: Injectable service allows mocking of current date for deterministic tests
- **Consistency**: Central place for all date operations ensures uniform behavior
- **Timezone Handling**: All operations assume UTC timezone for consistency
- **ISO-8601 Parsing**: Robust parsing with proper error handling for invalid formats

### Time Range Calculations
- **"Last Month" Logic**: Calculated as current date minus 1 month using JavaScript Date methods
- **Time Zone**: Uses system/server timezone (configurable via environment)
- **Inclusive Range**: Includes data from exactly the specified timestamp
- **Edge Cases**: Month boundaries handled by JavaScript Date object (accounts for varying month lengths)

## Security Assumptions

### Input Security
- **SQL Injection**: Not applicable with in-memory storage, but patterns established for DB migration
- **XSS Prevention**: Input sanitization through class-validator and proper JSON serialization
- **CORS**: Permissive for development, should be restricted in production
- **Query Parameter Injection**: Parameters are validated before use in filtering logic

### Authentication & Authorization
- **No Authentication**: Assumed for this challenge, but architecture supports adding JWT/OAuth
- **Public Endpoints**: All endpoints are publicly accessible
- **Rate Limiting**: Not implemented but can be added with @nestjs/throttler

## AWS Lambda Assumptions

### Integration Pattern
- **API Gateway**: Primary integration method for HTTP requests with proper error handling
- **Event-Driven Alternative**: EventBridge + SQS for asynchronous processing
- **Error Handling**: Lambda returns proper HTTP status codes for API Gateway integration

### Data Persistence
- **DynamoDB**: Assumed for Lambda persistence (commented implementation provided)
- **Event Publishing**: EventBridge/SNS for downstream system notifications
- **IAM Permissions**: Lambda execution role needs DynamoDB and EventBridge permissions

### Cold Start Optimization
- **Function Size**: Minimal dependencies to reduce cold start time
- **Connection Pooling**: Would implement for database connections
- **Memory Allocation**: Assumed 512MB for typical workloads

## Performance Assumptions

### Scalability
- **Small Dataset**: Mock data sufficient for demonstration
- **Production Scale**: Would require database indexing on CUIT, joinedAt, and createdAt fields
- **Caching Strategy**: Query parameter combinations enable effective HTTP caching
- **Filter Performance**: In-memory filtering is O(n) but acceptable for demo data size

### Response Times
- **In-Memory Speed**: Sub-millisecond response times expected for current dataset
- **Database Migration**: Would add connection pooling and query optimization
- **API Rate Limits**: 100 requests/minute assumed reasonable for business API
- **Query Complexity**: Current filtering logic is linear but would benefit from database indexes

## Testing Strategy Assumptions

### Test Coverage
- **Unit Tests**: Focus on business logic, date handling, and query filtering
- **Integration Tests**: Test complete request/response cycles with various parameter combinations
- **Mock Strategy**: Repository and DateProvider mocks for service testing
- **E2E Tests**: Full application stack testing with realistic query scenarios

### Test Data
- **Deterministic**: Consistent mock data for reliable testing
- **Edge Cases**: Validation errors, boundary conditions, and parameter combinations
- **Date Sensitivity**: Tests account for relative date calculations using DateProvider mocks

## Development Environment

### Local Development
- **Node.js Version**: Assumed 18+ for modern features
- **NPM vs Yarn**: NPM used for package management
- **Development Database**: In-memory sufficient for development
- **Hot Reload**: Watch mode for development productivity

### Production Readiness
- **Environment Variables**: All configuration externalized
- **Logging**: Structured logging for production monitoring with query context
- **Health Checks**: Basic health endpoint available
- **Graceful Shutdown**: Application handles SIGTERM properly

## Migration Path to Production

### Database Integration
- **PostgreSQL**: Recommended for relational data with ACID properties
- **Indexes Required**: 
  - `companies.joined_at` for `joinedAfter` filtering
  - `transfers.created_at` for `transfersSince` filtering
  - Composite indexes for combined queries
- **TypeORM/Prisma**: ORM integration for type safety
- **Migrations**: Database schema versioning
- **Connection Pooling**: Production-grade connection management

### Query Optimization
- **Database Indexes**: Proper indexing strategy for date-based queries
- **Query Analysis**: EXPLAIN plans for complex filtering operations
- **Pagination**: Add `limit` and `offset` query parameters for large result sets
- **Result Caching**: Redis caching for frequently accessed filtered results

### API Enhancement
- **Swagger UI**: Complete OpenAPI documentation accessible at `/api`
- **Response Headers**: Proper cache control headers for GET endpoints
- **Compression**: GZIP compression for JSON responses
- **CORS Configuration**: Restrict origins in production environment

### Monitoring & Observability
- **APM Integration**: New Relic, DataDog, or similar
- **Log Aggregation**: ELK stack or CloudWatch with query parameter context
- **Metrics Collection**: Prometheus + Grafana for API performance
- **Query Performance**: Track response times by filter combination
- **Alerting**: Based on error rates and response times

### Security Hardening
- **JWT Authentication**: Token-based authentication for protected endpoints
- **Rate Limiting**: Per-user and global rate limits with @nestjs/throttler
- **Input Validation**: Additional sanitization layers for query parameters
- **HTTPS Only**: TLS termination at load balancer

## Limitations & Future Enhancements

### Current Limitations
- **Data Persistence**: In-memory only, lost on restart
- **Concurrent Access**: No locking mechanism for race conditions
- **Bulk Operations**: No batch processing for large datasets
- **Search Capabilities**: Limited to exact date filtering, no fuzzy search
- **Pagination**: Not implemented, could be problematic with large result sets

### Planned Enhancements
- **Database Integration**: PostgreSQL with TypeORM and proper indexing
- **Advanced Filtering**: Support for date ranges (e.g., `joinedBetween`)
- **Sorting**: Add `sortBy` and `sortOrder` query parameters
- **Pagination**: Add `limit`, `offset`, and cursor-based pagination
- **Field Selection**: Add `fields` parameter for response field selection
- **Audit Trail**: Track all data modifications with timestamps
- **Webhook Support**: Real-time notifications for external systems
- **GraphQL**: Alternative query interface for complex filtering needs

## Query Parameter Standards

This implementation follows established REST conventions and can serve as a template for other filtering endpoints:

1. **Consistent Naming**: Use camelCase for parameter names
2. **Clear Semantics**: Parameter names clearly indicate their function
3. **Composable**: Multiple parameters combine logically
4. **Extensible**: New parameters can be added without breaking changes
5. **Documented**: OpenAPI specs provide complete parameter documentation

## Documentation Completeness

This document covers all major technical decisions and assumptions made during the REST API refactoring. The query parameter approach provides a solid foundation for extending the API with additional filtering capabilities while maintaining backward compatibility and RESTful design principles.