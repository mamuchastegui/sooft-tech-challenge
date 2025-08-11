// ops/load/k6/scenarios/spike.js
// Spike test: picos súbitos de carga (0→150 por 30s→0) repetido 2-3 veces

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
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Primer spike
        { duration: '10s', target: 150 },  // Spike súbito a 150 VUs
        { duration: '30s', target: 150 },  // Mantener 30s
        { duration: '10s', target: 5 },    // Bajar a baseline
        { duration: '2m', target: 5 },     // Recuperación
        
        // Segundo spike 
        { duration: '10s', target: 150 },  // Segundo spike
        { duration: '30s', target: 150 },  // Mantener 30s
        { duration: '10s', target: 5 },    // Bajar a baseline
        { duration: '2m', target: 5 },     // Recuperación
        
        // Tercer spike (el más largo)
        { duration: '10s', target: 150 },  // Tercer spike
        { duration: '45s', target: 150 },  // Mantener 45s
        { duration: '15s', target: 0 },    // Ramp down final
      ],
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    'http_req_duration{scenario:spike}': ['p(95)<2000', 'p(99)<3000'], // Muy permisivo en spikes
    'http_req_failed{scenario:spike}': ['rate<0.10'], // Hasta 10% error rate en spikes
  },
  tags: {
    service: 'company-service',
    test_type: 'spike'
  }
};

const SCENARIO_NAME = 'spike';
const ranges = getDateRanges();

export default function () {
  // Durante spikes, hit más agresivo a endpoints críticos
  const currentStage = getCurrentStageInfo();
  
  let endpoint;
  let url;
  
  if (currentStage.isSpike) {
    // Durante spike: focus en endpoint más común (companies)
    if (Math.random() < 0.8) {
      endpoint = 'companies_joined';
      url = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
    } else {
      endpoint = 'reports_transfer';
      url = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
    }
  } else {
    // Durante recovery: tráfico normal
    const rand = Math.random();
    if (rand < 0.4) {
      endpoint = 'companies_joined';
      url = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
    } else if (rand < 0.7) {
      endpoint = 'reports_transfer';
      url = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
    } else {
      endpoint = 'companies_transfer';
      url = `${BASE_URL}${ENDPOINTS.COMPANIES_TRANSFER}?transferFrom=${ranges.transferFrom}&transferTo=${ranges.transferTo}`;
    }
  }
  
  const response = http.get(url, { headers: defaultHeaders });
  checkResponse(response, 200, SCENARIO_NAME, endpoint);
  
  // Think time basado en si estamos en spike o recovery
  if (currentStage.isSpike) {
    randomSleep(0.1, 0.5);  // Muy rápido durante spike
  } else {
    randomSleep(2, 4);      // Más lento durante recovery
  }
}

// Helper para determinar si estamos en spike o recovery
function getCurrentStageInfo() {
  const elapsed = Math.floor(__ITER * (__VU / 100)); // Aproximación rough
  
  // Definir ventanas de spike (rough estimate)
  const spikeWindows = [
    { start: 0, end: 50 },      // Primer spike
    { start: 200, end: 250 },   // Segundo spike  
    { start: 400, end: 460 }    // Tercer spike
  ];
  
  const isSpike = spikeWindows.some(window => 
    elapsed >= window.start && elapsed <= window.end
  );
  
  return { isSpike };
}