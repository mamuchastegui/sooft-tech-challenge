# Estrategia de Testing

El proyecto incluye cobertura de pruebas integral:

## Pruebas Unitarias

### Cobertura de Dominio
- **Entidades**: Validación y lógica de negocio de entidades de dominio
- **Servicios de Aplicación**: Servicios con dependencias simuladas (mocked)
- **Repositorios de Infraestructura**: Implementaciones de repositorio
- **Proveedor de Fechas**: Servicio con manejo testeable de fechas
- **Servicio de Consultas**: Servicio con lógica de filtrado

### Estructura de Pruebas
```
src/
├── domain/
│   ├── entities/
│   │   ├── company.base.spec.ts
│   │   ├── pyme-company.entity.spec.ts
│   │   └── corporate-company.entity.spec.ts
│   ├── factories/
│   │   └── company.factory.spec.ts
│   └── policies/
│       ├── fee-policy.spec.ts
│       └── transfer-limit-policy.spec.ts
├── application/
│   └── services/
│       └── company.service.spec.ts
└── infrastructure/
    ├── repositories/
    │   └── company.repository.spec.ts
    └── mappers/
        └── company.mapper.spec.ts
```

## Pruebas End-to-End (E2E)

### Cobertura de API
- **Pruebas de endpoints completas** con parámetros de consulta
- **Validación de request/response** para todas las combinaciones de filtros
- **Escenarios de manejo de errores** para fechas inválidas
- **Pruebas de casos extremos** (fechas futuras, parámetros vacíos)

### Suites de Pruebas E2E

#### Core Negative Tests
```typescript
// test/e2e/company-negative-core.e2e-spec.ts
describe('CompanyController Core Negative Paths (e2e)', () => {
  // Escenarios de CUIT duplicado
  // Parámetros de fecha inválidos
  // Errores básicos de validación
});
```

#### Comprehensive Negative Tests
```typescript
// test/e2e/company-negative.e2e-spec.ts
describe('CompanyController Negative Paths (e2e)', () => {
  // Escenarios de CUIT duplicado avanzados
  // Validación de formato de fecha completa
  // Casos extremos de validación
  // Manejo de caracteres especiales
  // Pruebas de inyección y seguridad
});
```

#### Positive Flow Tests
```typescript
// test/e2e/company.e2e-spec.ts
describe('CompanyController (e2e)', () => {
  // Creación exitosa de empresas
  // Consultas con filtros
  // Reportes de vistas materializadas
});
```

## Comandos de Testing

### Ejecutar Pruebas
```bash
# Ejecutar todas las pruebas
npm run test

# Generar reporte de cobertura
npm run test:cov

# Ejecutar suite de pruebas específica
npm run test -- --testNamePattern="CompanyQueryService"

# Ejecutar pruebas E2E con escenarios de parámetros de consulta
npm run test:e2e
```

### Pruebas en Modo Watch
```bash
# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas E2E específicas en watch
npm run test:e2e -- --watch
```

### Pruebas con Filtros
```bash
# Ejecutar solo pruebas de dominio
npm run test -- src/domain

# Ejecutar solo pruebas de servicios
npm run test -- --testNamePattern="Service"

# Ejecutar pruebas con cobertura mínima
npm run test:cov -- --coverageThreshold.global.statements=80
```

## Configuración de Testing

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

### E2E Jest Configuration
```javascript
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## Estrategias de Testing

### Pruebas de Unidad - Dominio

#### Entidades de Dominio
```typescript
describe('PymeCompany', () => {
  it('should calculate flat fee for any transfer amount', () => {
    const company = new PymeCompany('id', '30-12345678-1', 'Test Corp');
    expect(company.calculateTransferFee(1000)).toBe(50);
    expect(company.calculateTransferFee(50000)).toBe(50);
  });

  it('should validate transfer limits correctly', () => {
    const company = new PymeCompany('id', '30-12345678-1', 'Test Corp');
    expect(() => company.validateTransferAmount(150000))
      .toThrow('Transfer amount exceeds PYME limit');
  });
});
```

#### Factory Pattern Testing
```typescript
describe('CompanyFactory', () => {
  it('should create correct company type based on input', () => {
    const pymeCompany = CompanyFactory.create({
      type: 'PYME',
      cuit: '30-12345678-1',
      businessName: 'Test PYME'
    });
    expect(pymeCompany).toBeInstanceOf(PymeCompany);
  });
});
```

### Pruebas de Aplicación

#### Servicios con Mocks
```typescript
describe('CompanyService', () => {
  let service: CompanyService;
  let mockRepository: jest.Mocked<CompanyRepository>;

  beforeEach(() => {
    mockRepository = {
      findByCuit: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
    } as any;

    service = new CompanyService(mockRepository);
  });

  it('should throw conflict error for duplicate CUIT', async () => {
    mockRepository.findByCuit.mockResolvedValue(existingCompany);

    await expect(service.createCompany(createDto))
      .rejects.toThrow(ConflictException);
  });
});
```

### Pruebas E2E

#### Pruebas de Integración Completa
```typescript
describe('Company API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create company and return 201', () => {
    return request(app.getHttpServer())
      .post('/v1/companies')
      .send({
        cuit: '30-12345678-1',
        businessName: 'Test Company',
        type: 'PYME'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.cuit).toBe('30-12345678-1');
        expect(res.body.type).toBe('PYME');
      });
  });
});
```

#### Pruebas de Validación Negativa
```typescript
describe('Negative Path Testing', () => {
  it('should return 400 for invalid CUIT format', () => {
    return request(app.getHttpServer())
      .post('/v1/companies')
      .send({
        cuit: '12345',  // Formato inválido
        businessName: 'Test Company',
        type: 'PYME'
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('CUIT must follow the format');
      });
  });

  it('should return 409 for duplicate CUIT', async () => {
    const uniqueCuit = generateCuit();
    
    // Primera creación - debe ser exitosa
    await request(app.getHttpServer())
      .post('/v1/companies')
      .send({
        cuit: uniqueCuit,
        businessName: 'First Company',
        type: 'PYME'
      })
      .expect(201);

    // Segunda creación - debe fallar con 409
    return request(app.getHttpServer())
      .post('/v1/companies')
      .send({
        cuit: uniqueCuit,
        businessName: 'Duplicate Company',
        type: 'CORPORATE'
      })
      .expect(409);
  });
});
```

## Métricas de Calidad

### Cobertura de Código
- **Objetivo**: > 80% de cobertura de líneas
- **Dominio**: > 90% de cobertura (lógica de negocio crítica)
- **Aplicación**: > 85% de cobertura (servicios y casos de uso)
- **Infraestructura**: > 75% de cobertura (adaptadores)

### Métricas de Testing
```bash
# Reporte de cobertura detallado
npm run test:cov

# Output esperado:
# ------------------------|---------|----------|---------|---------|
# File                    | % Stmts | % Branch | % Funcs | % Lines |
# ------------------------|---------|----------|---------|---------|
# All files              |   85.32 |    78.45 |   89.12 |   84.76 |
#  domain/               |   92.15 |    87.34 |   94.23 |   91.87 |
#  application/          |   87.43 |    82.17 |   88.95 |   86.34 |
#  infrastructure/       |   78.21 |    71.56 |   82.34 |   77.89 |
# ------------------------|---------|----------|---------|---------|
```

## Datos de Testing

### Mock Data Strategy
```typescript
// Función utilitaria para generar CUITs únicos
function generateCuit(prefix = '30'): string {
  const middle = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, '0');
  const base = `${prefix}${middle}`;
  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = base.split('').map(Number);
  const sum = mult.reduce((acc, m, i) => acc + m * digits[i], 0);
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) check = 9;
  return `${prefix}-${middle}-${check}`;
}
```

### Datos de Prueba
- **5 empresas** (mezcla de tipos PYME y CORPORATE)
- **6 transferencias** con varias fechas distribuidas a través de períodos de tiempo
- **Empresas con fechas de unión recientes** para probar filtro `joinedFrom`
- **Transferencias recientes** para probar filtro `transferFrom`

Los datos mock se reinician al reiniciar la aplicación y se pueden reiniciar programáticamente vía `DatabaseService.reset()`.

## Integración Continua

### GitHub Actions
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:cov
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        DATABASE_HOST: localhost
        DATABASE_USER: postgres
        DATABASE_PASSWORD: postgres
        DATABASE_NAME: test_db
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

## Debugging de Tests

### Configuración de Debug
```bash
# Ejecutar pruebas con debugging
npm run test:debug

# Ejecutar E2E con logging detallado
DEBUG=* npm run test:e2e
```

### Herramientas de Debugging
- **Jest Debug**: Integración con VS Code
- **Supertest Debug**: Logging detallado de requests HTTP
- **TypeORM Logging**: Queries SQL en tests E2E
- **Custom Loggers**: Para debugging de lógica de negocio específica