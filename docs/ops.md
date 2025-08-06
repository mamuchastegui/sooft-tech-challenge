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

# Ejecutar migraciones y sembrar datos
npm run db:migrate
npm run db:seed

# Iniciar servidor de desarrollo
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

### Gestión de Base de Datos

```bash
# Ejecutar migraciones de base de datos
npm run db:migrate

# Sembrar base de datos con datos de ejemplo
npm run db:seed  # Inserta 5 empresas mock + ~50 transferencias aleatorias para testing realista de reportes

# Refrescar vistas materializadas
npm run db:refresh-mv
```

## Stack Tecnológico

- **Framework**: NestJS 10+
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
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
- `npm run test:negative` - Ejecutar pruebas negativas específicas

### Base de Datos
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:seed` - Sembrar datos de ejemplo
- `npm run db:refresh-mv` - Refrescar vistas materializadas

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
```

### Variables Opcionales
```bash
# AWS (opcional para Lambda/SQS)
AWS_REGION=us-east-1
COMPANY_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/company-queue
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

## Configuración de Producción (Amazon RDS)

La aplicación está diseñada para funcionar con PostgreSQL de Amazon RDS:

### 1. Crear Instancia RDS
- Usar instancia PostgreSQL
- Configurar grupo de seguridad para permitir conexiones
- Habilitar backup automático

### 2. Configurar Variables de Entorno
```bash
DATABASE_HOST=your-rds-endpoint.amazonaws.com
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
DATABASE_PORT=5432
DATABASE_SSL=true
NODE_ENV=production
```

### 3. Despliegue
La aplicación detecta automáticamente configuración RDS vs local mediante las variables de entorno.

## Hoja de Ruta de Escalabilidad

### Scale-up: Instancias RDS Más Grandes
- Mejor throughput sin cambios de código
- Mayor rendimiento de consultas complejas
- Más conexiones concurrentes

### Scale-out: Read Replicas
- Distribución de carga de lectura
- Mejor disponibilidad
- Capacidad para análisis sin impacto

### Migración a Aurora
- Auto-escalado según demanda
- Mejor rendimiento y disponibilidad
- Backup continuo

## Seguridad

### Configuración Implementada
- Validación de entrada con class-validator
- CORS configurado
- Variables de entorno para secretos
- SSL/TLS para conexiones de producción

### Configuración Recomendada (No Implementada)
- Rate limiting con @nestjs/throttler
- Headers de seguridad con Helmet
- Logging estructurado
- Monitoreo de eventos de seguridad