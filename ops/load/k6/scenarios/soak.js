// ops/load/k6/scenarios/soak.js
// Soak test: carga estable prolongada (20-40 usuarios, 30-60 minutos)

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
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 30 },   // Ramp up gradual
        { duration: '40m', target: 30 },  // Soak durante 40 minutos
        { duration: '5m', target: 0 },    // Ramp down gradual
      ],
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    'http_req_duration{scenario:soak}': ['p(95)<800', 'p(99)<1500'],
    'http_req_failed{scenario:soak}': ['rate<0.01'], // Muy estricto: < 1% error rate
    'http_reqs{scenario:soak}': ['rate>8'], // Mínimo 8 RPS sostenido
    
    // Thresholds específicos para detectar memory leaks
    'http_req_duration{scenario:soak}': [
      'p(95)<800',
      'avg<300',    // Latencia promedio debe mantenerse baja
    ],
  },
  tags: {
    service: 'company-service',
    test_type: 'soak'
  }
};

const SCENARIO_NAME = 'soak';
const ranges = getDateRanges();

export default function () {
  // Comportamiento muy similar al baseline pero más conservador
  // Focus en detectar memory leaks y degradación gradual
  
  const iterationNumber = __ITER;
  const timeBucket = Math.floor(iterationNumber / 100); // Cambiar patrón cada ~100 iters
  
  // Rotar patrones para evitar cacheo excesivo
  let endpoint;
  let url;
  
  switch (timeBucket % 4) {
    case 0:
      // Patrón 1: Focus en companies joined
      endpoint = 'companies_joined';
      url = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
      break;
    case 1:
      // Patrón 2: Focus en reports
      endpoint = 'reports_transfer';
      url = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
      break;
    case 2:
      // Patrón 3: Focus en companies transfer
      endpoint = 'companies_transfer';
      url = `${BASE_URL}${ENDPOINTS.COMPANIES_TRANSFER}?transferFrom=${ranges.transferFrom}&transferTo=${ranges.transferTo}`;
      break;
    default:
      // Patrón 4: Mix aleatorio (como baseline)
      const rand = Math.random();
      if (rand < 0.5) {
        endpoint = 'companies_joined';
        url = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
      } else if (rand < 0.8) {
        endpoint = 'reports_transfer';
        url = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
      } else {
        endpoint = 'companies_transfer';
        url = `${BASE_URL}${ENDPOINTS.COMPANIES_TRANSFER}?transferFrom=${ranges.transferFrom}&transferTo=${ranges.transferTo}`;
      }
  }
  
  const response = http.get(url, { headers: defaultHeaders });
  checkResponse(response, 200, SCENARIO_NAME, endpoint);
  
  // Log progreso cada 1000 iteraciones para monitoring de soak
  if (iterationNumber > 0 && iterationNumber % 1000 === 0) {
    console.log(`🔄 Soak test progress: ${iterationNumber} iterations completed, VU: ${__VU}`);
  }
  
  // Think time consistente para detectar degradación
  randomSleep(3, 6);
}