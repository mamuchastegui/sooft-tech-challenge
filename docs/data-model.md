# Modelo de Datos y Rendimiento

## Optimización de Rendimiento

El endpoint `/companies` ha sido optimizado para tiempos de respuesta sub-100ms:

- **Índices de Base de Datos**: Índices automáticos en `companies.joined_at`, `transfers.company_id` y `transfers.created_at`
- **Optimización de Consultas**: Subconsultas EXISTS en lugar de JOINs costosos
- **Pool de Conexiones**: Configurado para 2-10 conexiones concurrentes
- **Caché de Consultas**: Caché de 30 segundos para consultas repetidas

**Rendimiento Esperado:**
- Desarrollo local: < 50ms
- AWS RDS capa gratuita: < 100ms
- RDS de producción: < 25ms

## Vistas Materializadas

### Refresco de Vista Materializada

Los reportes mensuales se sirven desde vistas materializadas. En producción estas vistas se refrescan nocturnas por un trabajo programado (pg_cron o una tarea CI externa). En local/dev puedes ejecutar `npm run db:refresh-mv` después de hacer seed para poblar las vistas materializadas con datos actuales.

### Vista Materializada: Empresas con Transferencias (Último Mes)
```sql
CREATE MATERIALIZED VIEW mv_companies_transfer_last_month AS
SELECT 
  c.id,
  c.cuit,
  c.business_name,
  c.joined_at,
  c.type,
  COUNT(t.id) as transfer_count,
  COALESCE(SUM(t.amount), 0) as total_amount
FROM companies c
LEFT JOIN transfers t ON c.id = t.company_id 
  AND t.created_at >= (CURRENT_DATE - INTERVAL '1 month')::timestamp
  AND t.created_at < CURRENT_DATE::timestamp
GROUP BY c.id, c.cuit, c.business_name, c.joined_at, c.type
HAVING COUNT(t.id) > 0;
```

### Vista Materializada: Empresas Unidas (Último Mes)
```sql
CREATE MATERIALIZED VIEW mv_companies_joined_last_month AS
SELECT 
  id,
  cuit,
  business_name,
  joined_at,
  type
FROM companies
WHERE joined_at >= (CURRENT_DATE - INTERVAL '1 month')::timestamp
  AND joined_at < CURRENT_DATE::timestamp;
```

## Estrategia de Índices

### Índices Principales
```sql
-- Índice para filtrado por fecha de unión
CREATE INDEX idx_companies_joined_at ON companies (joined_at);

-- Índice para relaciones de transferencias
CREATE INDEX idx_transfers_company_id ON transfers (company_id);

-- Índice para filtrado por fecha de transferencia
CREATE INDEX idx_transfers_created_at ON transfers (created_at);

-- Índice compuesto para consultas de transferencias por empresa y fecha
CREATE INDEX idx_transfers_company_created ON transfers (company_id, created_at);

-- Índice para tipo de empresa (útil para reportes)
CREATE INDEX idx_companies_type ON companies (type);
```

### Estrategia de Consultas

#### Filtrado por Fecha de Unión
```sql
-- Optimizado con índice en joined_at
SELECT * FROM companies 
WHERE joined_at >= '2023-12-01T00:00:00Z';
```

#### Filtrado por Transferencias
```sql
-- Optimizado con subconsulta EXISTS
SELECT c.* FROM companies c
WHERE EXISTS (
  SELECT 1 FROM transfers t 
  WHERE t.company_id = c.id 
    AND t.created_at >= '2023-11-01T00:00:00Z'
);
```

#### Consultas Combinadas
```sql
-- Ambos filtros con optimización de índices
SELECT c.* FROM companies c
WHERE c.joined_at >= '2023-12-01T00:00:00Z'
  AND EXISTS (
    SELECT 1 FROM transfers t 
    WHERE t.company_id = c.id 
      AND t.created_at >= '2023-11-01T00:00:00Z'
  );
```

## Consideraciones de Escalabilidad

### Optimización de Consultas
- **Filtrado en Memoria**: Operaciones rápidas en conjuntos de datos pequeños
- **Estrategia de Índices**: Bases de datos de producción requieren índices en campos de fecha
- **Caché**: Headers de caché HTTP para endpoints GET
- **Paginación**: Se puede agregar como parámetros de consulta adicionales

### Monitoreo de Rendimiento
- Registro de consultas lentas (> 100ms)
- Métricas de uso de índices
- Estadísticas de pool de conexiones
- Monitoring de caché hit ratio

### Estrategias de Crecimiento

#### Hasta 100,000 empresas
- Configuración actual es suficiente
- Índices existentes proveen rendimiento óptimo
- RDS free-tier maneja la carga

#### 100,000 - 1,000,000 empresas
- Upgrade a RDS instancia más grande
- Implementar paginación obligatoria
- Considerar read replicas para consultas de solo lectura

#### Más de 1,000,000 empresas
- Migrar a Aurora PostgreSQL Serverless v2
- Implementar particionado de tablas por fecha

## Configuración de TypeORM

### Pool de Conexiones
```typescript
{
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  // Pool configuration for performance
  extra: {
    min: 2,        // Minimum connections
    max: 10,       // Maximum connections
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  }
}
```

## Migración de Datos

### Scripts de Migración
- `1691599999_create_mv_companies_last_month.sql`: Crea vista materializada para transferencias
- `1691608888_create_mv_companies_joined_last_month.sql`: Crea vista materializada para empresas unidas
- `1691629999_fix_company_type_enum.sql`: Corrige conflicto de enum con herencia TypeORM

### Estrategia de Backup
- Backup automático diario en RDS
- Point-in-time recovery habilitado
- Backup de vistas materializadas antes de recrear

### Monitoreo de Integridad
- Validación de constrains referencial
- Verificación de consistencia de vistas materializadas
- Alertas para consultas anómalas