# SOOFT Technology Backend Challenge

Una aplicación backend NestJS que implementa arquitectura hexagonal para gestión de empresas y seguimiento de transferencias con base de datos PostgreSQL y filtrado dinámico por rango de fechas.

## 🚀 Inicio Rápido

```bash
# Clonar e instalar dependencias
npm install

# Copiar configuración de entorno y actualizar variables de entorno de la DB
cp .env.example .env

# Ejecutar migraciones y sembrar datos
npm run db:migrate
npm run db:seed

# Iniciar servidor de desarrollo
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📋 Endpoints Principales

- **POST /v1/companies** - [Registrar nueva empresa](docs/api.md#crear-empresa)
- **GET /v1/companies** - [Listar empresas con filtros de fecha](docs/api.md#obtener-empresas-con-filtros-combinados)
- **GET /v1/reports/companies/transfer-last-month** - [Reporte de transferencias mensuales](docs/api.md#obtener-reporte-de-transferencias-de-empresas-último-mes)
- **GET /v1/reports/companies/joined-last-month** - [Reporte de empresas nuevas](docs/api.md#obtener-reporte-de-empresas-unidas-último-mes)

## 🏗️ Arquitectura

Este proyecto sigue **Arquitectura Hexagonal** con principios de Código Limpio:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Controllers    │────│   Services      │────│   Entities      │
│   (REST API)    │    │  (Use Cases)    │    │ (Business Logic)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OpenAPI/      │    │      DTOs       │    │  Repositories   │
│   Swagger       │    │  (Validation)   │    │  (Interfaces)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                               ┌─────────────────┐    ┌─────────────────┐
                               │   TypeORM       │────│   PostgreSQL    │
                               │  (Entities)     │    │   (Database)    │
                               └─────────────────┘    └─────────────────┘
```

**Separación clara de capas:**
- **Presentación**: Controladores REST con documentación OpenAPI
- **Aplicación**: Servicios y casos de uso con validación
- **Dominio**: Lógica de negocio pura con modelo polimórfico de empresas
- **Infraestructura**: Adaptadores de base de datos y persistencia

Ver [documentación completa de arquitectura](docs/architecture.md)

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm run test

# Pruebas con cobertura
npm run test:cov

# Pruebas end-to-end
npm run test:e2e
```

**Cobertura integral:**
- Pruebas unitarias de dominio y lógica de negocio
- Pruebas de integración con base de datos
- Pruebas E2E de endpoints completos con validación negativa

## 🛠️ Stack Tecnológico

- **Framework**: NestJS 10+ con TypeScript
- **Base de Datos**: PostgreSQL con TypeORM
- **Arquitectura**: Hexagonal (Puertos y Adaptadores)
- **Validación**: class-validator + class-transformer
- **Testing**: Jest (unitarias + E2E)
- **Documentación**: OpenAPI/Swagger
- **Despliegue**: AWS RDS + Lambda

## 📖 Documentación Adicional

| Tema | Descripción | Link |
|------|-------------|------|
| **🏛️ Arquitectura** | Patrones de diseño, capas y principios SOLID | [docs/architecture.md](docs/architecture.md) |
| **🏢 Modelo de Dominio** | Polimorfismo de empresas PYME/Corporate, Factory y Strategy patterns | [docs/domain.md](docs/domain.md) |
| **🔌 API** | Endpoints, ejemplos de uso, validación y manejo de errores | [docs/api.md](docs/api.md) |
| **💾 Modelo de Datos** | Rendimiento, índices, vistas materializadas y escalabilidad | [docs/data-model.md](docs/data-model.md) |
| **⚙️ Operaciones** | Despliegue, configuración, monitoreo y variables de entorno | [docs/ops.md](docs/ops.md) |
| **🧪 Testing** | Estrategias de prueba, cobertura y CI/CD | [docs/testing.md](docs/testing.md) |
| **☁️ AWS Lambda** | Implementación serverless, integración y despliegue | [docs/aws-lambda.md](docs/aws-lambda.md) |

## 🌟 Características Destacadas

### Modelo Polimórfico de Empresas
- **PYME**: Tarifas planas ($50), límites menores, elegible para programas gubernamentales
- **Corporate**: Tarifas escalonadas (0.1%-1.0%), límites mayores, requisitos de compliance
- **Patrón Factory**: Creación type-safe de instancias
- **Patrón Strategy**: Políticas de tarifas y límites intercambiables

### Rendimiento Optimizado
- **Sub-100ms**: Respuestas optimizadas con índices automáticos
- **Vistas Materializadas**: Reportes mensuales pre-calculados
- **Pool de Conexiones**: 2-10 conexiones concurrentes
- **Caché de Consultas**: 30 segundos para consultas repetidas

### Testing Integral
- **21/21 pruebas E2E** pasando (incluyendo casos negativos)
- **Cobertura > 80%** con métricas de calidad
- **Generación de CUITs únicos** para evitar conflictos en testing
- **Validación completa** de casos extremos y errores

## 📝 Scripts Principales

```bash
# Desarrollo
npm run start:dev          # Servidor con hot-reload
npm run build             # Compilar aplicación
npm run start:prod        # Ejecutar en producción

# Base de datos
npm run db:migrate        # Ejecutar migraciones
npm run db:seed          # Sembrar datos de prueba
npm run db:refresh-mv    # Refrescar vistas materializadas

# Calidad de código
npm run lint             # ESLint + auto-fix
npm run format          # Prettier formatting
```

## 🔧 Configuración

Ver [.env.example](.env.example) para variables de entorno requeridas.

**Variables principales:**
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=sooft_db
NODE_ENV=development
PORT=3000
```

**Documentación Swagger**: http://localhost:3000/api (cuando la app esté ejecutándose)