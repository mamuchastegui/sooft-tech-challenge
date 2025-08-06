# Operaciones y Despliegue

## Configuración de Desarrollo Local

### Prerrequisitos
- Node.js 18+
- npm
- PostgreSQL (local o Docker)

### Inicio Rápido

```bash
# Clonar e instalar dependencias
npm install

# Copiar configuración de entorno
cp .env.example .env

# Esperar a que la base de datos esté lista, luego sembrar datos
npm run db:seed

# Iniciar servidor de desarrollo
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

### Gestión de Base de Datos

```bash
# Ejecutar migraciones de base de datos (crear índices y vista materializada)
npm run db:migrate

# Sembrar base de datos con datos de ejemplo
npm run db:seed

# Refrescar vistas materializadas (manual, de otro modo programado nocturnamente a las 03:00 UTC)
npm run db:refresh-mv
```

## Stack Tecnológico

- **Framework**: NestJS 10+
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL (Amazon RDS free-tier en producción)
- **ORM**: TypeORM con entidades y query builder
- **Validación**: class-validator, class-transformer
- **Documentación**: OpenAPI/Swagger 7.x
- **Testing**: Jest (pruebas unitarias + e2e)
- **Arquitectura**: Hexagonal (Puertos y Adaptadores)
- **Calidad de Código**: ESLint + Prettier

## Scripts NPM

### Desarrollo
- `npm run start:dev` - Iniciar aplicación en modo watch
- `npm run start` - Iniciar aplicación en modo producción
- `npm run build` - Compilar la aplicación

### Calidad de Código
- `npm run lint` - Ejecutar ESLint y corregir problemas
- `npm run format` - Formatear código con Prettier

### Testing
- `npm run test` - Ejecutar pruebas unitarias
- `npm run test:watch` - Ejecutar pruebas en modo watch
- `npm run test:cov` - Ejecutar pruebas con reporte de cobertura
- `npm run test:e2e` - Ejecutar pruebas end-to-end

### Base de Datos
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:seed` - Sembrar datos de ejemplo
- `npm run db:refresh-mv` - Refrescar vistas materializadas

## Configuración de Producción (Amazon RDS)

La aplicación está diseñada para funcionar con PostgreSQL de Amazon RDS free-tier en producción:

### 1. Crear Instancia RDS
- Usar instancia PostgreSQL free-tier
- Configurar grupo de seguridad para permitir conexiones
- Habilitar backup automático y point-in-time recovery

### 2. Configurar Variables de Entorno
```bash
DATABASE_HOST=your-rds-endpoint.amazonaws.com
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
DATABASE_PORT=5432
DATABASE_SSL=true
```

### 3. Configuración RDS Adicional
```bash
# Configuración de conexión
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Configuración de seguridad
DATABASE_SSL_REJECT_UNAUTHORIZED=false  # Para RDS certificate

# Configuración de aplicación
NODE_ENV=production
PORT=3000
```

### 4. Despliegue
La aplicación detecta automáticamente configuración RDS vs local

## Hoja de Ruta de Escalabilidad

### Scale-up: Instancias RDS Más Grandes
**Cuándo**: 10,000+ empresas con alta carga de consultas
**Beneficios**: 
- Mayor throughput sin cambios de código
- Mejor rendimiento de consultas complejas
- Más conexiones concurrentes

**Implementación**:
```bash
# Upgrade RDS instance class
aws rds modify-db-instance \
  --db-instance-identifier myapp-db \
  --db-instance-class db.t3.medium \
  --apply-immediately
```

### Scale-out: Read Replicas + Sharding Manual Opcional
**Cuándo**: 50,000+ empresas con lecturas intensivas
**Beneficios**:
- Distribución de carga de lectura
- Mejor disponibilidad
- Capacidad para análisis sin impacto

**Implementación**:
```typescript
// Configuración de read replica
const readConfig = {
  ...dbConfig,
  host: process.env.DATABASE_READ_HOST,
  // Solo para consultas SELECT
};
```

### Migración a Aurora: Aurora PostgreSQL Serverless v2
**Cuándo**: 100,000+ empresas o necesidades de auto-escalado
**Beneficios**:
- Auto-escalado según demanda
- Mejor rendimiento y disponibilidad
- Backup continuo y point-in-time recovery

### Almacenamiento Especializado: DynamoDB para Rutas Ultra-Rápidas
**Cuándo**: Necesidades de latencia < 10ms para consultas específicas
**Beneficios**:
- Latencia ultra-baja para datos hot
- Escalado automático
- Costo efectivo para patrones de acceso predecibles

## Monitoreo y Observabilidad

### Métricas de Aplicación
```typescript
// Configuración de métricas personalizadas
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      config: {
        register: register,
      },
    }),
  ],
})
```

### Logging Estructurado
```typescript
// Configuración de logging
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

WinstonModule.forRoot({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
```

### Alertas y Monitoreo
- **Latencia de API**: Alertas si > 100ms promedio
- **Tasa de Error**: Alertas si > 1% errores 5xx
- **Conexiones DB**: Monitoreo de pool de conexiones
- **Memoria/CPU**: Alertas de uso de recursos

## Configuración de Entorno

### Variables Requeridas
```bash
# Base de datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=sooft_db
DATABASE_SSL=false

# Aplicación
NODE_ENV=development
PORT=3000

# AWS (opcional para Lambda/SQS)
AWS_REGION=us-east-1
COMPANY_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/company-queue
```

### Variables Opcionales
```bash
# Configuración de pool de base de datos
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Configuración de caché
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=30

# Configuración de logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

## Despliegue

### Desarrollo Local
```bash
npm run start:dev
```

### Build de Producción
```bash
npm run build
npm run start:prod
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY .env.production ./.env

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        # Deployment steps here
```

## Backup y Recuperación

### Estrategia de Backup
- **RDS Automated Backup**: 7 días de retención
- **Point-in-time Recovery**: Hasta el segundo
- **Snapshot Manual**: Antes de deployments importantes
- **Backup de Configuración**: Variables de entorno y secretos

### Procedimiento de Recuperación
1. Identificar punto de recuperación necesario
2. Crear nueva instancia desde snapshot
3. Actualizar DNS/load balancer
4. Verificar integridad de datos
5. Monitorear rendimiento post-recuperación

## Seguridad

### Configuración de Red
- VPC privada para RDS
- Security Groups restrictivos
- SSL/TLS obligatorio para conexiones
- No acceso público directo a base de datos

### Gestión de Secretos
- AWS Secrets Manager para credenciales de producción
- Variables de entorno para configuración local
- Rotación automática de passwords
- Auditoría de acceso a secretos

### Configuración de Aplicación
- CORS configurado apropiadamente
- Rate limiting habilitado
- Input validation y sanitization
- Error handling sin exposición de información sensible