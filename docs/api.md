# Documentación de API

## Endpoints Principales

### 1. POST /v1/companies
Registrar nueva adhesión de empresa

### 2. GET /v1/companies
Obtener empresas con filtros opcionales de rango de fechas:
- `?joinedFrom=2023-12-01T00:00:00Z&joinedTo=2023-12-31T23:59:59Z` - Empresas que se adhirieron dentro del rango de fechas
- `?transferFrom=2023-11-01T00:00:00Z&transferTo=2023-11-30T23:59:59Z` - Empresas que realizaron transferencias dentro del rango de fechas
- Todos los parámetros se pueden combinar y son opcionales (filtrado inclusivo)

### 3. GET /v1/reports/companies/transfer-last-month
Empresas con transferencias en el mes anterior (materialized view)

### 4. GET /v1/reports/companies/joined-last-month
Empresas que se unieron en el mes anterior (materialized view)

## Ejemplos de Uso

### Crear Empresa
```bash
curl -X POST http://localhost:3000/v1/companies \
  -H "Content-Type: application/json" \
  -d '{
    "cuit": "30-12345678-1",
    "name": "Tech Solutions SA",
    "type": "CORPORATE"
  }'
```

**Respuesta (201):**
```json
{
  "id": "uuid",
  "cuit": "30-12345678-1",
  "name": "Tech Solutions SA",
  "type": "CORPORATE",
  "joinedAt": "2023-12-01T10:00:00.000Z"
}
```

### Obtener Todas las Empresas
```bash
curl -X GET http://localhost:3000/v1/companies
```

### Obtener Empresas Unidas Después de una Fecha
```bash
curl -X GET "http://localhost:3000/v1/companies?joinedFrom=2023-12-01T00:00:00Z"
```

### Obtener Empresas con Transferencias Recientes
```bash
curl -X GET "http://localhost:3000/v1/companies?transferFrom=2023-11-01T00:00:00Z"
```

### Obtener Empresas con Filtros Combinados
```bash
curl -X GET "http://localhost:3000/v1/companies?joinedFrom=2023-12-01T00:00:00Z&transferFrom=2023-11-01T00:00:00Z"
```

### Obtener Reporte de Transferencias de Empresas (Último Mes)
```bash
curl -X GET "http://localhost:3000/v1/reports/companies/transfer-last-month"
```

**Formato de Respuesta (200):**
```json
[
  {
    "id": "uuid",
    "cuit": "30-12345678-1",
    "name": "Tech Solutions SA",
    "joinedAt": "2023-12-01T10:00:00.000Z",
    "type": "CORPORATE",
    "transferCount": 5,
    "totalAmount": "150000.50"
  }
]
```

### Obtener Reporte de Empresas Adheridas en el Último Mes
```bash
curl -X GET "http://localhost:3000/v1/reports/companies/joined-last-month"
```

**Formato de Respuesta (200):**
```json
[
  {
    "id": "uuid",
    "cuit": "30-12345678-1",
    "name": "Tech Solutions SA",
    "joinedAt": "2023-12-01T10:00:00.000Z",
    "type": "CORPORATE"
  }
]
```

**Formato de Respuesta del Endpoint de Empresas (200):**
```json
[
  {
    "id": "uuid",
    "cuit": "30-12345678-1",
    "name": "Tech Solutions SA",
    "type": "CORPORATE",
    "joinedAt": "2023-12-01T10:00:00.000Z"
  }
]
```

## Comportamiento de Parámetros de Consulta

### Lógica de Filtrado por Fechas
- **joinedFrom/joinedTo**: Filtra empresas donde `joinedAt` está dentro del rango proporcionado
- **transferFrom/transferTo**: Filtra empresas que tienen al menos una transferencia donde `createdAt` está dentro del rango proporcionado
- **Combinados**: Ambos filtros aplicados con lógica AND
- **Sin filtros**: Retorna todas las empresas

### Requisitos de Formato de Fecha
- **Formato**: Cadena ISO-8601 (ej., `2023-12-01T00:00:00Z`)
- **Zona horaria**: UTC (sufijo Z requerido)
- **Validación**: Retorna 400 Bad Request para formatos inválidos
- **Comparación**: Comparación de fecha inclusiva (>=)

### Casos Extremos
- **Fechas futuras**: Entrada válida, puede retornar resultados vacíos
- **Parámetros vacíos**: Ignorados (igual que no proporcionar el parámetro)
- **Fechas inválidas**: Retorna 400 con mensaje de error de validación

## Manejo de Errores

La aplicación proporciona respuestas de error consistentes:

- **400 Bad Request**: Errores de validación, datos malformados, formatos de fecha inválidos
- **409 Conflict**: Registro de CUIT duplicado
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Errores no controlados de aplicación

### Ejemplos de Error de Parámetros de Consulta
```json
{
  "statusCode": 400,
  "message": ["joinedFrom must be a valid ISO-8601 date string"],
  "error": "Bad Request"
}
```

### Error de CUIT Duplicado
```json
{
  "statusCode": 409,
  "message": "Company with CUIT 30-12345678-1 already exists",
  "error": "Conflict"
}
```

### Error de Validación de Empresa
```json
{
  "statusCode": 400,
  "message": [
    "cuit should not be empty",
    "name should not be empty",
    "type must be either PYME or CORPORATE"
  ],
  "error": "Bad Request"
}
```

## Documentación OpenAPI/Swagger

Cuando ejecutes la aplicación, visita `http://localhost:3000/api` para acceder a la documentación interactiva de la API con:
- Descripciones completas de endpoints
- Documentación de parámetros de consulta
- Ejemplos de request/response
- Funcionalidad de prueba integrada

## Consideraciones de Rendimiento

### Caché HTTP
- Headers de caché para endpoints GET
- ETags para validación de caché
- Caché de 30 segundos para consultas repetidas

### Paginación (Extensible)
```bash
# Ejemplo de implementación futura
curl -X GET "http://localhost:3000/v1/companies?page=1&limit=10&joinedFrom=2023-12-01T00:00:00Z"
```

### Limitación de Velocidad
La aplicación puede configurarse con request limit usando `@nestjs/throttler`:
```bash
# Respuesta cuando se excede el límite
HTTP 429 Too Many Requests
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

## Seguridad

- **Validación de entrada** para todos los parámetros
- **Sanitización** de datos de consulta
- **Configuración CORS** para solicitudes cross-origin
- **Sin exposición** de datos sensibles en errores
- **Variables de entorno** para configuración de secrets