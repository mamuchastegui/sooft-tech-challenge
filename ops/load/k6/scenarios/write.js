// ops/load/k6/scenarios/write.js
// Write test: POST controlado para crear companies (solo si WRITE_ENABLED=true)

import http from 'k6/http';
import { 
  BASE_URL, 
  WRITE_ENABLED,
  defaultHeaders, 
  getDateRanges, 
  randomSleep, 
  checkResponse, 
  createCompanyPayload,
  ENDPOINTS,
  BASE_THRESHOLDS 
} from '../shared.js';

// Configuración del escenario
export const options = {
  scenarios: {
    write_test: {
      executor: 'constant-vus',
      vus: WRITE_ENABLED ? 5 : 0,    // Solo ejecutar si WRITE_ENABLED=true
      duration: WRITE_ENABLED ? '3m' : '10s',
    },
  },
  thresholds: {
    ...BASE_THRESHOLDS,
    'http_req_duration{scenario:write_test}': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed{scenario:write_test}': ['rate<0.05'], // 5% error rate (incluye 409s esperados)
  },
  tags: {
    service: 'company-service',
    test_type: 'write'
  }
};

const SCENARIO_NAME = 'write_test';
const ranges = getDateRanges();

export default function () {
  if (!WRITE_ENABLED) {
    console.log('⚠️  Write test skipped: WRITE_ENABLED=false');
    return;
  }
  
  // Mix de operaciones write y read (70% read, 30% write)
  if (Math.random() < 0.7) {
    // Read operation: verificar que los datos escritos estén disponibles
    const companiesUrl = `${BASE_URL}${ENDPOINTS.COMPANIES_JOINED}?joinedFrom=${ranges.joinedFrom}&joinedTo=${ranges.joinedTo}`;
    const readResp = http.get(companiesUrl, { headers: defaultHeaders });
    checkResponse(readResp, 200, SCENARIO_NAME, 'read_companies');
    
    randomSleep(1, 2);
  } else {
    // Write operation: crear nueva company
    const payload = createCompanyPayload();
    
    console.log(`📝 Creating company: ${payload.name} (${payload.cuit})`);
    
    const writeResp = http.post(
      `${BASE_URL}${ENDPOINTS.CREATE_COMPANY}`,
      JSON.stringify(payload),
      { headers: defaultHeaders }
    );
    
    // Aceptar tanto 201 (created) como 409 (conflict) como válidos
    const isValid = writeResp.status === 201 || writeResp.status === 409;
    
    if (writeResp.status === 201) {
      checkResponse(writeResp, 201, SCENARIO_NAME, 'create_company_success');
      console.log(`✅ Company created: ${payload.name}`);
    } else if (writeResp.status === 409) {
      checkResponse(writeResp, 409, SCENARIO_NAME, 'create_company_conflict');
      console.log(`⚠️  Company conflict (expected): ${payload.name}`);
    } else {
      checkResponse(writeResp, 201, SCENARIO_NAME, 'create_company_error'); // Esto fallará y registrará el error
      console.error(`❌ Unexpected response: ${writeResp.status} - ${writeResp.body}`);
    }
    
    randomSleep(2, 4);
  }
  
  // Ocasionalmente verificar reports para ver el efecto de los writes
  if (Math.random() < 0.1) {
    const reportsUrl = `${BASE_URL}${ENDPOINTS.REPORTS_TRANSFER}`;
    const reportsResp = http.get(reportsUrl, { headers: defaultHeaders });
    checkResponse(reportsResp, 200, SCENARIO_NAME, 'read_reports');
    
    randomSleep(1, 2);
  }
}

// Setup: mostrar configuración al inicio
export function setup() {
  if (!WRITE_ENABLED) {
    console.log('🚫 WRITE_ENABLED=false - Write test will be skipped');
    console.log('💡 To enable: export WRITE_ENABLED=true');
    return;
  }
  
  console.log('✅ WRITE_ENABLED=true - Write test will execute');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log('⚠️  WARNING: This test will create data in the database');
  
  // Test de conectividad antes de comenzar writes
  console.log('🔍 Testing connectivity...');
  const healthResp = http.get(`${BASE_URL}/health`, { headers: defaultHeaders });
  
  if (healthResp.status !== 200) {
    console.error(`❌ Health check failed: ${healthResp.status}`);
    throw new Error('Application not ready for write tests');
  }
  
  console.log('✅ Application ready for write tests');
}

// Teardown: mostrar resumen
export function teardown(data) {
  if (WRITE_ENABLED) {
    console.log('📊 Write test completed');
    console.log('💡 Check database for created companies if needed');
  }
}