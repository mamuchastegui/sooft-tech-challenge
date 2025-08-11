// ops/load/k6/scenarios/stress.js
// Stress test: ramping de carga progresivo (0→50→100→150→0) en 15-20 minutos

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
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // Ramp up a 20 VUs
        { duration: '3m', target: 50 },   // Ramp up a 50 VUs
        { duration: '2m', target: 50 },   // Stay at 50 VUs
        { duration: '3m', target: 100 },  // Ramp up a 100 VUs  
        { duration: '2m', target: 100 },  // Stay at 100 VUs
        { duration: '3m', target: 150 },  // Ramp up a 150 VUs (stress)
        { duration: '2m', target: 150 },  // Stay at 150 VUs
        { duration: '3m', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    'http_req_duration{scenario:stress}': ['p(95)<1200', 'p(99)<2000'], // Más permisivo bajo stress
    'http_req_failed{scenario:stress}': ['rate<0.05'], // Hasta 5% error rate en stress
  },
  tags: {
    service: 'company-service',
    test_type: 'stress'
  }
};

const SCENARIO_NAME = 'stress';
const ranges = getDateRanges();

export default function () {
  // Comportamiento más agresivo durante stress test
  const currentVUs = __VU;
  
  // Endpoint selection basada en carga actual
  let endpoint;
  let url;
  
  const rand = Math.random();
  if (rand < 0.5) {
    // 50%: Companies joined (endpoint más común)
    endpoint = 'companies_joined';
    url = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
  } else if (rand < 0.8) {
    // 30%: Reports (endpoint más pesado)
    endpoint = 'reports_transfer';
    url = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
  } else {
    // 20%: Companies transfer
    endpoint = 'companies_transfer';
    url = `${BASE_URL}${ENDPOINTS.COMPANIES_TRANSFER}?transferFrom=${ranges.transferFrom}&transferTo=${ranges.transferTo}`;
  }
  
  const response = http.get(url, { headers: defaultHeaders });
  checkResponse(response, 200, SCENARIO_NAME, endpoint);
  
  // Think time más corto durante stress
  if (currentVUs < 50) {
    randomSleep(1, 3);      // Carga baja: think time normal
  } else if (currentVUs < 100) {
    randomSleep(0.5, 2);    // Carga media: think time reducido
  } else {
    randomSleep(0.2, 1);    // Carga alta: think time mínimo
  }
}