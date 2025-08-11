// ops/load/k6/scenarios/baseline.js
// Baseline test: carga estable y sostenida (10-30 usuarios, 5-10 minutos)

import http from 'k6/http';
import { 
  BASE_URL, 
  defaultHeaders, 
  getDateRanges, 
  randomSleep, 
  checkResponse, 
  ENDPOINTS,
  BASE_THRESHOLDS 
} from '../shared.js';

// Configuración del escenario
export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-vus',
      vus: 20,           // 20 usuarios concurrentes constantes
      duration: '8m',    // Durante 8 minutos
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    'http_req_duration{scenario:baseline}': ['p(95)<800', 'p(99)<1200'],
    'http_reqs{scenario:baseline}': ['rate>5'], // Mínimo 5 RPS
  },
  tags: {
    service: 'company-service',
    test_type: 'baseline'
  }
};

const SCENARIO_NAME = 'baseline';
const ranges = getDateRanges();

export default function () {
  // Simular comportamiento de usuario típico
  
  // 70% de las veces: consultar companies por fecha de adhesión
  if (Math.random() < 0.7) {
    const companiesJoinedUrl = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
    const companiesResp = http.get(companiesJoinedUrl, { headers: defaultHeaders });
    checkResponse(companiesResp, 200, SCENARIO_NAME, 'companies_joined');
  }
  
  randomSleep(1, 3);
  
  // 60% de las veces: consultar reportes
  if (Math.random() < 0.6) {
    const reportsUrl = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
    const reportsResp = http.get(reportsUrl, { headers: defaultHeaders });
    checkResponse(reportsResp, 200, SCENARIO_NAME, 'reports_transfer');
  }
  
  randomSleep(1, 3);
  
  // 40% de las veces: consultar companies por transfers
  if (Math.random() < 0.4) {
    const companiesTransferUrl = `${BASE_URL}${ENDPOINTS.COMPANIES_TRANSFER}?transferFrom=${ranges.transferFrom}&transferTo=${ranges.transferTo}`;
    const transferResp = http.get(companiesTransferUrl, { headers: defaultHeaders });
    checkResponse(transferResp, 200, SCENARIO_NAME, 'companies_transfer');
  }
  
  // Think time más realista
  randomSleep(2, 5);
}