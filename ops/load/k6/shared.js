// ops/load/k6/shared.js
// Utilities compartidas para scripts de k6

import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Configuración base
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const WRITE_ENABLED = __ENV.WRITE_ENABLED === 'true';

// Métricas customizadas
export const errorRate = new Rate('custom_error_rate');
export const apiErrors = new Counter('api_errors');

// Headers comunes
export const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'k6-load-test/1.0'
};

// Utility: generar fechas para filtros de rango
export function getDateRanges() {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    // Rango para companies joined
    joinedFrom: '2025-05-01T00:00:00Z',
    joinedTo: '2025-06-30T23:59:59Z',
    
    // Rango para transfers
    transferFrom: monthAgo.toISOString().split('T')[0] + 'T00:00:00Z',
    transferTo: now.toISOString().split('T')[0] + 'T23:59:59Z'
  };
}

// Utility: generar CUIT válido con checksum correcto
export function generateValidCuit() {
  // Prefijos comunes: 20 (persona física), 30 (empresa), 27 (persona física fem)
  const prefixes = ['20', '30', '27'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  
  // Generar 8 dígitos del documento
  const docNumber = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
  
  // Calcular dígito verificador
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = (prefix + docNumber).split('').map(Number);
  
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }
  
  let checkDigit = 11 - (sum % 11);
  if (checkDigit === 11) checkDigit = 0;
  if (checkDigit === 10) checkDigit = 9;
  
  return `${prefix}-${docNumber}-${checkDigit}`;
}

// Utility: generar nombres de empresa
export function generateCompanyName() {
  const adjectives = ['Tech', 'Global', 'Digital', 'Smart', 'Advanced', 'Premium'];
  const nouns = ['Solutions', 'Systems', 'Corp', 'Group', 'Industries', 'Services'];
  const suffixes = ['SA', 'SRL', 'Inc', 'LLC', 'Ltd'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${adj} ${noun} ${suffix}`;
}

// Utility: sleep aleatorio
export function randomSleep(min = 1, max = 3) {
  const duration = min + Math.random() * (max - min);
  sleep(duration);
}

// Utility: verificar respuesta y registrar métricas
export function checkResponse(response, expectedStatus, scenario, endpoint) {
  const tags = {
    service: 'company-service',
    scenario: scenario,
    endpoint: endpoint,
    status: response.status.toString()
  };
  
  // Verificar status code
  const statusOk = check(response, {
    [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
  }, tags);
  
  if (!statusOk) {
    console.error(`❌ ${scenario}/${endpoint}: Expected ${expectedStatus}, got ${response.status}`);
    console.error(`Response: ${response.body.substring(0, 200)}...`);
    errorRate.add(1, tags);
    apiErrors.add(1, tags);
  } else {
    errorRate.add(0, tags);
  }
  
  // Verificar contenido en GET
  if (expectedStatus === 200 && response.body) {
    check(response, {
      'response has content': (r) => r.body.length > 0,
      'response is valid JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      }
    }, tags);
  }
  
  return statusOk;
}

// Utility: crear payload para POST /v1/companies
export function createCompanyPayload() {
  return {
    name: generateCompanyName(),
    cuit: generateValidCuit(),
    type: Math.random() > 0.5 ? 'PYME' : 'CORPORATE'
  };
}

// Endpoints disponibles
export const ENDPOINTS = {
  COMPANIES_JOINED: '/v1/companies',
  REPORTS_TRANSFER: '/v1/reports/companies/transfer-last-month', 
  COMPANIES_TRANSFER: '/v1/companies',
  CREATE_COMPANY: '/v1/companies'
};

// Configuración de thresholds base
export const BASE_THRESHOLDS = {
  'http_req_duration': ['p(95)<800', 'p(99)<1500'],
  'http_req_failed': ['rate<0.02'], // < 2% error rate
  'custom_error_rate': ['rate<0.02']
};