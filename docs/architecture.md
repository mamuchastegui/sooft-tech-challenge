# Arquitectura

Este proyecto sigue la **Arquitectura Hexagonal** con principios de Código Limpio:

- **Capa de Dominio**: Lógica de negocio central, entidades e interfaces de repositorio
- **Capa de Aplicación**: Casos de uso, servicios y DTOs con filtrado dinámico de consultas
- **Capa de Infraestructura**: Adaptadores de base de datos PostgreSQL, entidades TypeORM y proveedores de fecha
- **Capa de Presentación**: Controladores de API REST con documentación OpenAPI

## Patrón de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Capa de Presentación                     │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Controllers    │  │   OpenAPI/      │                  │
│  │   (REST API)    │  │   Swagger       │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Capa de Aplicación                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Services      │  │      DTOs       │                  │
│  │  (Use Cases)    │  │  (Validation)   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Capa de Dominio                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Entities      │  │  Repositories   │  │   Policies   │ │
│  │ (Business Logic)│  │  (Interfaces)   │  │ (Strategies) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Capa de Infraestructura                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   TypeORM       │  │   PostgreSQL    │  │    Mappers   │ │
│  │  (Entities)     │  │   (Database)    │  │ (Conversion) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Principios de Diseño

### Separación de Responsabilidades
- **Límites claros** entre capas
- **Inyección de dependencias** para bajo acoplamiento
- **Interfaces** definen contratos entre capas

### Testabilidad
- Fácil simulación (mock) de dependencias
- Pruebas unitarias de lógica de negocio en aislamiento
- Pruebas E2E de endpoints completos

### Flexibilidad
- Posibilidad de intercambiar componentes de infraestructura sin afectar la lógica de negocio
- Servicio dedicado para lógica de filtrado complejo
- Patrones Strategy y Factory para extensibilidad

### Estrategia de Manejo de Fechas
- **DateProvider**: Servicio inyectable para operaciones de fecha testeable
- **Timezone UTC**: Manejo consistente de zona horaria en todas las operaciones
- **Formato ISO-8601**: Formato de fecha estándar para consistencia de API
- **Filtrado Inclusivo**: Comparación `>=` para comportamiento intuitivo de rango de fechas

### Estrategia de Validación
- **Validación de Entrada**: Decoradores class-validator en DTOs con mensajes de error apropiados
- **Validación de Dominio**: Reglas de negocio aplicadas en constructores de entidades
- **Validación de Consulta**: Validación de formato de fecha con respuestas de error claras
- **Manejo de Errores**: Códigos de estado HTTP apropiados y mensajes de error descriptivos

## Consideraciones de Rendimiento

### Optimización de Consultas
- **Filtrado en Memoria**: Operaciones rápidas en conjuntos de datos pequeños
- **Estrategia de Índices**: Las bases de datos de producción requieren índices binarios en campos de fecha
- **Caché**: Headers de caché HTTP para endpoints GET
- **Paginación**: Se puede agregar como parámetros de consulta adicionales

### Optimización de Base de Datos
- **Índices automáticos** en `companies.joined_at`, `transfers.company_id` y `transfers.created_at`
- **Optimización de consultas**: Subconsultas EXISTS en lugar de JOINs costosos
- **Pool de conexiones**: Configurado para 2-10 conexiones concurrentes
- **Caché de consultas**: Caché de 30 segundos para consultas repetidas

**Rendimiento Esperado:**
- Desarrollo local: < 50ms
- AWS RDS capa gratuita: < 100ms
- RDS de producción: < 25ms

## Consideraciones de Seguridad

**Implementado:**
- Validación y sanitización de entrada con class-validator
- Configuración CORS para solicitudes cross-origin
- Variables de entorno para configuración
- Whitelist de propiedades en ValidationPipe

**No implementado:**
- Rate limiting / throttling
- Helmet para headers de seguridad
- Logging de eventos de seguridad

## Monitoreo y Observabilidad

La aplicación incluye:
- Documentación OpenAPI para monitoreo de API
- Logs básicos de aplicación (inicio/puerto)

> **Nota**: Features como logging estructurado, interceptores de métricas y seguimiento de errores no están implementadas en la versión actual.