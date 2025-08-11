// ops/load/k6/scenarios/smoke.js
// Smoke test: verificación básica con carga mínima (1-5 usuarios, 30-60s)

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
    smoke: {
      executor: 'constant-vus',
      vus: 3,           // 3 usuarios concurrentes
      duration: '45s',   // Durante 45 segundos
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    'http_req_duration{scenario:smoke}': ['p(95)<500'], // Más estricto en smoke
  },
  tags: {
    service: 'company-service',
    test_type: 'smoke'
  }
};

const SCENARIO_NAME = 'smoke';
const ranges = getDateRanges();

export default function () {
  // Test 1: Health check implícito - GET companies con filtro
  const companiesJoinedUrl = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
  const companiesResp = http.get(companiesJoinedUrl, { headers: defaultHeaders });
  checkResponse(companiesResp, 200, SCENARIO_NAME, 'companies_joined');
  
  randomSleep(0.5, 1.5);
  
  // Test 2: Reports endpoint
  const reportsUrl = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
  const reportsResp = http.get(reportsUrl, { headers: defaultHeaders });
  checkResponse(reportsResp, 200, SCENARIO_NAME, 'reports_transfer');
  
  randomSleep(0.5, 1.5);
  
  // Test 3: Companies con filtro de transfers
  const companiesTransferUrl = `${BASE_URL}${ENDPOINTS.COMPANIES_TRANSFER}?transferFrom=${ranges.transferFrom}&transferTo=${ranges.transferTo}`;
  const transferResp = http.get(companiesTransferUrl, { headers: defaultHeaders });
  checkResponse(transferResp, 200, SCENARIO_NAME, 'companies_transfer');
  
  randomSleep(1, 2);
}