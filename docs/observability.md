# Observabilidad (Tracing + Spanmetrics)

Configuración completa de observabilidad para NestJS con OpenTelemetry auto-instrumentación, Grafana Alloy y Grafana Cloud (Tempo + Prometheus).

## Resumen de Arquitectura

```
App NestJS → Grafana Alloy (OTLP :4318) → Grafana Cloud
                     ├─ Tempo (traces)
                     └─ Prometheus (spanmetrics)
```

- **NestJS**: Auto-instrumentación OpenTelemetry (HTTP, PostgreSQL, Express)
- **Grafana Alloy**: Collector que recibe OTLP y exporta a múltiples destinos
- **Tempo**: Almacena traces distribuidos
- **Prometheus**: Recibe métricas generadas automáticamente desde spans

## Pre-requisitos

- Docker instalado
- Cuenta Grafana Cloud activa
- Datasources configurados en Grafana:
  - **Tempo** (traces)
  - **Prometheus** (métricas)

## Variables de Entorno

Configurar en `.env`:

```bash
# OpenTelemetry - App
OTEL_SERVICE_NAME=company-service
OTEL_RESOURCE_ATTRIBUTES="service.name=company-service,service.namespace=company-service-group,deployment.environment=production"
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_TRACES_PROTOCOL=http/protobuf
OTEL_LOG_LEVEL=debug

# Grafana Cloud - Alloy
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-sa-east-1.grafana.net/otlp
GRAFANA_CLOUD_PROM_RW_ENDPOINT=https://prometheus-prod-XX-XXX.grafana.net/api/prom/push
GRAFANA_CLOUD_INSTANCE_ID=1234567
GRAFANA_CLOUD_API_KEY=glc_xxx...
```

## Arranque Rápido

### 1. Configurar Variables
```bash
# Copiar variables de ejemplo
cp .env.example .env
# Editar con tus credenciales de Grafana Cloud
```

### 2. Iniciar Grafana Alloy
```bash
docker rm -f grafana-alloy 2>/dev/null || true
docker run -d --name grafana-alloy \
  -p 4317:4317 -p 4318:4318 -p 12345:12345 \
  -v "$(pwd)/ops/config.alloy:/etc/alloy/config.alloy" \
  -e GRAFANA_CLOUD_OTLP_ENDPOINT \
  -e GRAFANA_CLOUD_PROM_RW_ENDPOINT \
  -e GRAFANA_CLOUD_INSTANCE_ID \
  -e GRAFANA_CLOUD_API_KEY \
  grafana/alloy:latest run --server.http.listen-addr=0.0.0.0:12345 /etc/alloy/config.alloy
```

### 3. Iniciar Aplicación
```bash
npm run start:otel
```

### 4. Generar Tráfico
```bash
curl -s http://localhost:3000/health > /dev/null
curl -s "http://localhost:3000/v1/companies?joinedFrom=2025-05-01T00:00:00Z&joinedTo=2025-06-30T23:59:59Z" > /dev/null
curl -s http://localhost:3000/v1/reports/companies/transfer-last-month > /dev/null
```

### 5. Verificar Logs
```bash
# Ver que Alloy está enviando a Tempo y Prometheus
docker logs grafana-alloy --tail 100
```

## Configuración Alloy (River)

El archivo `ops/config.alloy` debe contener:

```river
logging {
  level  = "debug"
  format = "logfmt"
}

otelcol.receiver.otlp "default" {
  // Recibe OTLP de la app
  http { endpoint = "0.0.0.0:4318" }
  grpc { endpoint = "0.0.0.0:4317" }
  output {
    traces = [
      otelcol.processor.resourcedetection.default.input,
      otelcol.processor.spanmetrics.default.input,
    ]
  }
}

otelcol.processor.resourcedetection "default" {
  detectors = ["env", "system"]
  system {
    hostname_sources = ["os"]
  }
  output {
    traces = [otelcol.processor.batch.default.input]
  }
}

otelcol.processor.batch "default" {
  output {
    traces = [otelcol.exporter.otlphttp.tempo.input]
  }
}

otelcol.processor.spanmetrics "default" {
  metrics_exporter = otelcol.exporter.prometheusremotewrite.prom.input
  
  dimensions = ["service.name", "http.method", "http.route", "http.status_code"]
  
  latency_histogram {
    buckets = [10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s]
  }
}

otelcol.auth.basic "grafana_cloud" {
  username = env("GRAFANA_CLOUD_INSTANCE_ID")
  password = env("GRAFANA_CLOUD_API_KEY")
}

otelcol.exporter.otlphttp "tempo" {
  client {
    endpoint = env("GRAFANA_CLOUD_OTLP_ENDPOINT")
    auth     = otelcol.auth.basic.grafana_cloud.handler
  }
}

otelcol.exporter.prometheusremotewrite "prom" {
  endpoint = env("GRAFANA_CLOUD_PROM_RW_ENDPOINT")
  auth     = otelcol.auth.basic.grafana_cloud.handler
  external_labels = { env = "production", service_stack = "company-service" }
}
```

## Queries PromQL

Una vez que los spanmetrics estén fluyendo a Prometheus:

### RPS (Requests Per Second)
```promql
sum by (service_name) (
  rate(traces_spanmetrics_calls_total{service_name="company-service"}[5m])
)
```
*Mide: Throughput de requests por segundo*

### Error Rate (%) - Solo 5xx
```promql
100 *
sum(rate(traces_spanmetrics_calls_total{service_name="company-service", http_status_code=~"5.."}[5m])) /
sum(rate(traces_spanmetrics_calls_total{service_name="company-service"}[5m]))
```

### Error Rate (%) - 4xx + 5xx (alternativa)
```promql
# 100 *
# sum(rate(traces_spanmetrics_calls_total{service_name="company-service", http_status_code=~"[45].."}[5m])) /
# sum(rate(traces_spanmetrics_calls_total{service_name="company-service"}[5m]))
```
*Mide: Porcentaje de requests con errores*

### HTTP Status Distribution
```promql
sum by (http_status_code) (
  rate(traces_spanmetrics_calls_total{service_name="company-service"}[5m])
)
```
*Mide: Distribución de códigos de respuesta HTTP*

### Latencia P95 (ms)
```promql
1000 * histogram_quantile(
  0.95,
  sum by (le) (rate(traces_spanmetrics_duration_bucket{service_name="company-service"}[5m]))
)
```

### Latencia P99 (ms)
```promql
1000 * histogram_quantile(
  0.99,
  sum by (le) (rate(traces_spanmetrics_duration_bucket{service_name="company-service"}[5m]))
)
```
*Nota: Si los buckets ya están en ms, quitar `1000 *`*

## Cómo Ver Datos

### Traces en Tempo
1. Ir a **Explore** → seleccionar datasource **Tempo**
2. Query: `service.name="company-service"`
3. Time range: últimos 15 minutos
4. Hacer click en cualquier trace para ver detalles

### Métricas en Prometheus
1. Ir a **Explore** → seleccionar datasource **Prometheus**  
2. Pegar cualquier query PromQL de arriba
3. Cambiar a vista **Table** o **Graph** según necesidad

### Dashboard
1. Importar `ops/grafana/dashboards/company-service-mini.json`
2. Durante importación, mapear `${DS_PROM}` a tu datasource Prometheus
3. Ver 4 paneles: RPS, Latency, Status Codes, Error Rate

## Troubleshooting

### ❌ 0 Traces en Tempo
```bash
# 1. Verificar que la app esté enviando a Alloy
curl -v http://localhost:4318/v1/traces

# 2. Ver logs de Alloy
docker logs grafana-alloy | grep -i "tempo\|otlp\|error"

# 3. Verificar variables OTEL en la app
echo $OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
```

### ❌ 0 Métricas en Prometheus
```bash
# Ver logs de spanmetrics y prometheus export
docker logs grafana-alloy | grep -i "prom\|metric\|spanmetric"

# Verificar endpoint de Prometheus RW
echo $GRAFANA_CLOUD_PROM_RW_ENDPOINT
```

### ❌ Error 401/403 en Prometheus RW
- Verificar `GRAFANA_CLOUD_INSTANCE_ID` (es tu username, no base64)
- Verificar `GRAFANA_CLOUD_API_KEY` (password en texto plano, no base64)  
- Regenerar API Key en Grafana Cloud si persiste

### ❌ Puerto 4318 Ocupado
```bash
# Detectar proceso usando el puerto
lsof -i :4318

# Cambiar puerto en comando Docker
docker run ... -p 4319:4318 ...
# Y actualizar: OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4319/v1/traces
```

## Verificación Rápida (Copy/Paste)

```bash
# Limpiar y arrancar todo
docker rm -f grafana-alloy 2>/dev/null || true

# Iniciar Alloy (asegurar que las variables estén en el entorno)
source .env
docker run -d --name grafana-alloy \
  -p 4317:4317 -p 4318:4318 -p 12345:12345 \
  -v "$(pwd)/ops/config.alloy:/etc/alloy/config.alloy" \
  -e GRAFANA_CLOUD_OTLP_ENDPOINT \
  -e GRAFANA_CLOUD_PROM_RW_ENDPOINT \
  -e GRAFANA_CLOUD_INSTANCE_ID \
  -e GRAFANA_CLOUD_API_KEY \
  grafana/alloy:latest run --server.http.listen-addr=0.0.0.0:12345 /etc/alloy/config.alloy

# Iniciar app
npm run start:otel &

# Esperar y generar tráfico
sleep 5
curl -s http://localhost:3000/health > /dev/null
curl -s "http://localhost:3000/v1/companies?joinedFrom=2025-05-01T00:00:00Z&joinedTo=2025-06-30T23:59:59Z" > /dev/null
curl -s http://localhost:3000/v1/reports/companies/transfer-last-month > /dev/null

# Verificar logs
docker logs grafana-alloy --tail 100 | grep -E "(tempo|prom|error|success)"
```

### En Grafana:
1. **Explore → Tempo**: `service.name="company-service"`
2. **Explore → Prometheus**: Pegar queries PromQL
3. **Dashboards → Import**: Usar `ops/grafana/dashboards/company-service-mini.json`
