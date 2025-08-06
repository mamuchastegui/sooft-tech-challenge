# Estrategia de Testing

El proyecto incluye cobertura de pruebas integral con Jest y Supertest.

## Pruebas Unitarias

### Cobertura de Dominio
- **Entidades**: Validación y lógica de negocio de entidades de dominio
- **Servicios de Aplicación**: Servicios con dependencias simuladas
- **Repositorios**: Implementaciones de repositorio
- **Factories**: Patrón Factory para creación de empresas
- **Policies**: Estrategias de tarifas y límites de transferencia

### Estructura de Pruebas
```
src/
├── domain/
│   ├── entities/*.spec.ts - Pruebas de entidades y lógica de negocio
│   ├── factories/*.spec.ts - Pruebas de factory pattern
│   └── policies/*.spec.ts - Pruebas de strategy pattern
├── application/
│   └── services/*.spec.ts - Pruebas de servicios con mocks
└── infrastructure/
    ├── repositories/*.spec.ts - Pruebas de repositorios
    └── mappers/*.spec.ts - Pruebas de mappers
```

## Pruebas End-to-End (E2E)

### Cobertura de API
- **Pruebas de endpoints completas** con parámetros de consulta
- **Validación de request/response** para todas las combinaciones de filtros
- **Escenarios de manejo de errores** para fechas inválidas
- **Pruebas de casos extremos** y edge cases

### Suites de Pruebas E2E

#### Core Negative Tests
- Escenarios básicos de CUIT duplicado (409)
- Parámetros de fecha inválidos (400)
- Errores básicos de validación

#### Comprehensive Negative Tests
- Escenarios avanzados de CUIT duplicado
- Validación completa de formato de fecha
- Casos extremos de validación
- Manejo de caracteres especiales
- Generación de CUITs únicos para evitar conflictos

#### Positive Flow Tests
- Creación exitosa de empresas PYME y Corporate
- Consultas con filtros de fecha
- Reportes de vistas materializadas

## Comandos de Testing

### Ejecutar Pruebas
```bash
# Ejecutar todas las pruebas
npm run test

# Generar reporte de cobertura
npm run test:cov

# Ejecutar pruebas E2E
npm run test:e2e

# Ejecutar pruebas negativas específicas
npm run test:negative
```

### Pruebas en Modo Watch
```bash
# Ejecutar pruebas en modo watch
npm run test:watch
```

## Configuración de Testing

### Jest Configuration
- Configurado para TypeScript con ts-jest
- Cobertura automática en directorio `coverage/`
- Timeout configurado para pruebas E2E
- Archivos de configuración: `jest.config.js` y `test/jest-e2e.json`

### Datos de Testing
- **Generación de CUITs únicos**: Función utilitaria para evitar conflictos
- **5 empresas mock**: Mezcla de tipos PYME y CORPORATE
- **6 transferencias**: Con fechas distribuidas para testing
- **Reset automático**: Datos se reinician en cada ejecución

## Estrategias de Testing

### Pruebas de Unidad
- **Aislamiento**: Cada componente probado independientemente
- **Mocking**: Dependencias simuladas con jest.fn()
- **Comportamiento**: Foco en lógica de negocio y validaciones
- **Coverage**: Objetivo > 80% cobertura de líneas

### Pruebas E2E
- **Integración completa**: App completa con base de datos
- **Validación HTTP**: Status codes, headers, body
- **Casos negativos**: Validación de errores y edge cases
- **CUITs únicos**: Generación automática para evitar conflictos

### Validación de Negocio
- **Polimorfismo**: PymeCompany vs CorporateCompany
- **Tarifas**: Cálculo correcto según tipo de empresa
- **Límites**: Validación de límites de transferencia
- **Fechas**: Validación de rangos y formatos ISO-8601

## Métricas de Calidad

### Cobertura de Código
- **Objetivo**: > 80% cobertura de líneas
- **Dominio**: > 90% (lógica de negocio crítica)
- **Aplicación**: > 85% (servicios y casos de uso)
- **Infraestructura**: > 75% (adaptadores)

### Estado Actual
- ✅ **21/21 pruebas E2E** pasando (incluyendo casos negativos)
- ✅ **Generación de CUITs únicos** para evitar conflictos
- ✅ **Validación completa** de casos extremos y errores
- ✅ **Cobertura integral** de funcionalidad principal

## Datos Mock

### Empresas de Ejemplo
- 3 empresas PYME con tarifas planas
- 2 empresas Corporate con tarifas escalonadas
- Fechas de adhesión distribuidas para testing de filtros

### Transferencias de Ejemplo  
- 6 transferencias con montos variados
- Fechas distribuidas en diferentes períodos
- Asociadas a diferentes empresas para testing de reportes

### Generación de Datos Únicos
- Función `generateCuit()` para CUITs únicos y válidos
- Cálculo automático de dígito verificador
- Timestamps para evitar duplicados en tests paralelos