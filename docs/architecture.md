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

- Validación y sanitización de entrada para todos los parámetros de consulta
- Configuración CORS para solicitudes cross-origin
- No exposición de datos sensibles en mensajes de error
- Configuración de variables de entorno para secrets
- Capacidades de request limit (se puede agregar con @nestjs/throttler)

## Monitoreo y Observabilidad

La aplicación incluye:
- Registro estructurado con contexto de parámetros de consulta
- Registro de request/response con información de filtros
- Seguimiento y reporte de errores
- Métricas de rendimiento vía interceptores de NestJS
- Documentación OpenAPI para monitoreo de API