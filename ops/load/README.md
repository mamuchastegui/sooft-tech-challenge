# Load Testing con k6

Configuración completa de pruebas de carga para la API de Company Service usando k6.

## Requisitos

### Opción 1: k6 Local
```bash
# macOS
brew install k6

# Linux
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Opción 2: Docker (recomendado)
```bash
# Solo Docker requerido
docker --version
```

## Variables de Entorno

Configurar en `.env`:

```bash
# Target
BASE_URL=http://localhost:3000          # URL de la aplicación
WRITE_ENABLED=false                     # ⚠️ Solo true para tests de escritura

# k6 → Grafana Cloud (opcional)
K6_PROMETHEUS_RW_SERVER_URL=https://prometheus-prod-XX-XXX.grafana.net/api/prom/push
K6_PROMETHEUS_RW_USERNAME=1234567       # Instance ID
K6_PROMETHEUS_RW_PASSWORD=glc_xxx...    # API Key
K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true
```

## Escenarios Disponibles

### 1. Smoke Test (Verificación básica)
```bash
# npm
npm run load:smoke

# Docker
docker run --rm -i -e BASE_URL \
  -v $PWD:/scripts -w /scripts grafana/k6:latest \
  run ops/load/k6/scenarios/smoke.js
```
- **Carga**: 3 VUs x 45s
- **Propósito**: Verificación funcional básica
- **Endpoints**: GET companies, reports, companies con filtros

### 2. Baseline Test (Carga normal)
```bash
# npm
npm run load:baseline

# Docker
docker run --rm -i -e BASE_URL \
  -v $PWD:/scripts -w /scripts grafana/k6:latest \
  run ops/load/k6/scenarios/baseline.js
```
- **Carga**: 20 VUs x 8min
- **Propósito**: Establecer métricas de rendimiento normal
- **Thresholds**: P95 < 800ms, error rate < 2%

### 3. Stress Test (Carga progresiva)
```bash
# npm  
npm run load:stress

# Docker
docker run --rm -i -e BASE_URL \
  -v $PWD:/scripts -w /scripts grafana/k6:latest \
  run ops/load/k6/scenarios/stress.js
```
- **Carga**: 0→50→100→150→0 VUs en 20min
- **Propósito**: Encontrar límites de capacidad
- **Thresholds**: P95 < 1200ms, error rate < 5%

### 4. Spike Test (Picos súbitos)
```bash
# npm
npm run load:spike

# Docker  
docker run --rm -i -e BASE_URL \
  -v $PWD:/scripts -w /scripts grafana/k6:latest \
  run ops/load/k6/scenarios/spike.js
```
- **Carga**: 0→150 VUs (30s) x3 spikes
- **Propósito**: Probar recuperación ante picos de tráfico
- **Thresholds**: P95 < 2000ms, error rate < 10%

### 5. Soak Test (Carga sostenida)
```bash
# npm
npm run load:soak

# Docker
docker run --rm -i -e BASE_URL \
  -v $PWD:/scripts -w /scripts grafana/k6:latest \
  run ops/load/k6/scenarios/soak.js
```
- **Carga**: 30 VUs x 40min
- **Propósito**: Detectar memory leaks y degradación
- **Thresholds**: P95 < 800ms, error rate < 1%

### 6. Write Test (Pruebas de escritura)
```bash
# ⚠️ SOLO EN AMBIENTE DE TEST
export WRITE_ENABLED=true

# npm
npm run load:write

# Docker
docker run --rm -i -e BASE_URL -e WRITE_ENABLED=true \
  -v $PWD:/scripts -w /scripts grafana/k6:latest \
  run ops/load/k6/scenarios/write.js
```
- **Carga**: 5 VUs x 3min
- **Propósito**: Probar endpoints POST con datos válidos
- **⚠️ Cuidado**: Crea datos reales en la base de datos

## Salida a Grafana Cloud

### Configurar Prometheus Remote Write
```bash
# Configurar variables k6
export K6_PROMETHEUS_RW_SERVER_URL="https://prometheus-prod-XX-XXX.grafana.net/api/prom/push"
export K6_PROMETHEUS_RW_USERNAME="1234567"
export K6_PROMETHEUS_RW_PASSWORD="glc_xxx..."
export K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=true

# Ejecutar test
npm run load:baseline
```

### Ver Métricas en Grafana
1. **Explore → Prometheus**: Usar queries PromQL
2. **Dashboard**: Importar `ops/grafana/dashboards/k6-mini.json`
3. **Remapear datasource**: `${DS_PROM}` → tu datasource Prometheus

## Salida Offline (JSON + Gráficos)

### Generar archivo JSON
```bash
# k6 local con output JSON
k6 run --out json=ops/load/out/baseline.json ops/load/k6/scenarios/baseline.js

# Docker con output JSON
docker run --rm -i -e BASE_URL \
  -v $PWD:/scripts -w /scripts grafana/k6:latest \
  run --out json=/scripts/ops/load/out/baseline.json ops/load/k6/scenarios/baseline.js
```

### Generar gráficos PNG
```bash
# Instalar dependencias Python
pip3 install matplotlib numpy

# Generar gráficos
python3 ops/load/plot.py ops/load/out/baseline.json

# Output:
# - ops/load/out/baseline_results.png  (gráficos)
# - ops/load/out/baseline_summary.txt  (estadísticas)
```

## Dashboard k6 Mini

El dashboard `k6-mini.json` incluye 4 paneles:

### 1. RPS by Scenario
```promql
sum by (scenario) (rate(k6_http_reqs_total[1m]))
```

### 2. Error Rate %
```promql
100 * sum(rate(k6_http_req_failed_total[5m])) / sum(rate(k6_http_reqs_total[5m]))
```

### 3. Latency P95/P99 (ms)
```promql
# Con histogramas nativos
1000 * histogram_quantile(0.95, sum by (le) (rate(k6_http_req_duration_seconds_bucket[5m])))

# Fallback
1000 * avg(k6_http_req_duration_seconds)
```

### 4. HTTP Status Distribution
```promql
sum by (status) (rate(k6_http_req_duration_seconds_count[5m]))
```

## Correlación con Traces

Para correlacionar métricas de carga con traces:

### 1. Ejecutar Load Test
```bash
# Terminal 1: Iniciar Grafana Alloy + App
docker run -d --name grafana-alloy ...  # (ver docs/observability.md)
npm run start:otel

# Terminal 2: Load test
npm run load:baseline
```

### 2. Ver Traces en Tempo
1. **Explore → Tempo**: `service.name="company-service"`
2. **Time range**: Coincidir con duración del load test
3. **Filtrar por latencia**: `duration > 500ms` para ver requests lentos

### 3. Correlación Visual
- **k6 dashboard**: Ver spikes de latencia/errores
- **Tempo**: Investigar traces específicos en esos momentos
- **Application logs**: Buscar errores correlacionados

## Buenas Prácticas

### ✅ Hacer
- **Calentar cache**: Ejecutar smoke test antes de baseline/stress
- **Aislar write tests**: Nunca en producción
- **Monitoring paralelo**: Ver métricas de app durante tests
- **Documentar resultados**: Guardar JSONs y PNGs importantes
- **Ejecutar fuera de horario**: Evitar impacto a usuarios reales

### ❌ No hacer
- **Commitear secrets**: K6_PROMETHEUS_RW_PASSWORD jamás al repo
- **Write tests en prod**: Solo en ambientes de test
- **Tests simultáneos**: Un escenario a la vez
- **Ignorar baseline**: Siempre establecer baseline antes de stress

## Qué Mostrar en la Demo

### RPS Estable vs Stress
```bash
# 1. Baseline: RPS consistente
npm run load:baseline
# Mostrar: RPS ~15-25, latencia estable

# 2. Stress: Degradación gradual  
npm run load:stress
# Mostrar: RPS varía, latencia aumenta, posibles errores
```

### P95/P99 Bajo Carga
- **Normal**: P95 ~200ms, P99 ~400ms
- **Stress**: P95 ~800ms, P99 ~1500ms
- **Spike**: P95 ~1500ms, P99 ~3000ms

### Error Rate y Recovery
```bash
# Spike test: ver error spikes y recuperación
npm run load:spike
# Mostrar: Error rate 0% → 5-10% → 0%
```

### Traces Correlacionados
1. **Durante baseline**: Traces normales, ~100-300ms
2. **Durante stress**: Traces lentos (>1s), stack traces de DB
3. **Después del test**: Traces vuelven a la normalidad

---

**Tiempo estimado setup**: 15 minutos  
**Tiempo demo completa**: 30 minutos (smoke + baseline + stress)