# Modelo de Dominio Polimórfico

La aplicación implementa polimorfismo orientado a objetos para tipos de empresa, siguiendo arquitectura hexagonal y principios SOLID.

## Patrón de Arquitectura

- **Clase Base Abstracta**: `Company` define comportamiento común y métodos abstractos
- **Subclases Concretas**: `PymeCompany` y `CorporateCompany` implementan reglas de negocio específicas
- **Patrón Strategy**: Interfaces `FeePolicy` y `TransferLimitPolicy` permiten lógica de negocio intercambiable
- **Patrón Factory**: `CompanyFactory` crea instancias de empresa apropiadas según el tipo

## Modelos de Dominio

### Empresa (Company)
**Clase base abstracta** con comportamiento polimórfico:
- **PymeCompany**: Empresas PYME con tarifas planas y límites menores
- **CorporateCompany**: Empresas corporativas con tarifas escalonadas y límites mayores

### Transferencia (Transfer)
- `amount`: Monto de la transferencia
- `companyId`: ID de la empresa
- `debitAccount`: Cuenta de débito
- `creditAccount`: Cuenta de crédito
- `createdAt`: Fecha de creación

## Diferencias de Lógica de Negocio

### Empresas PYME

#### Estructura de Tarifas
- **Tarifa fija**: $50 para todas las transferencias

#### Límites de Transferencia
- **Máximo por transferencia**: $100,000
- **Límite diario**: $50,000
- **Límite mensual**: $500,000

#### Características Especiales
- **Apoyo gubernamental**: Elegibles para programas gubernamentales
- **Documentos requeridos**: 4 documentos básicos incluyendo certificado PYME

### Empresas Corporativas

#### Estructura de Tarifas
**Tarifas basadas en porcentajes escalonados:**
- 0.1% para montos hasta $10,000
- 0.5% para montos $10,001-$100,000
- 1.0% para montos superiores a $100,000

#### Límites de Transferencia
- **Máximo por transferencia**: $1,000,000
- **Límite diario**: $1,000,000
- **Límite mensual**: $10,000,000

#### Características Especiales
- **Apoyo gubernamental**: No elegibles
- **Documentos requeridos**: 6 documentos incluyendo estados financieros auditados
- **Cumplimiento**: Requisitos adicionales de reporte

## Implementación Técnica

### Capa de Dominio
- Lógica de negocio pura sin dependencias de framework
- Interfaces bien definidas para políticas de negocio
- Validaciones de dominio en constructores de entidades

### Capa de Infraestructura
- TypeORM con herencia de tabla única usando columna discriminadora
- Mapeo de entidades con configuración de herencia
- Estrategia de persistencia optimizada

### Persistencia
- **CompanyMapper**: Maneja conversión dominio ↔ entidad
- Separación clara entre modelos de dominio e infraestructura
- Conversión bidireccional con preservación de comportamiento

### Creación de Instancias
- Patrón Factory asegura instanciación correcta según el tipo
- Validación de tipo en tiempo de creación
- Encapsulación de lógica de construcción compleja

## Ejemplos de Uso

### Creación usando Factory
```typescript
// Crear empresas usando factory
const pymeCompany = CompanyFactory.createPyme(cuit, businessName);
const corporateCompany = CompanyFactory.createCorporate(cuit, businessName);
```

### Comportamiento Polimórfico
```typescript
// Comportamiento polimórfico - mismo método, diferentes implementaciones
console.log(pymeCompany.calculateTransferFee(10000)); // $50 (tarifa fija)
console.log(corporateCompany.calculateTransferFee(10000)); // $10 (0.1% de $10,000)
```

### Métodos Específicos por Tipo
```typescript
// Métodos específicos de tipo
console.log(pymeCompany.isEligibleForGovernmentSupport()); // true
console.log(corporateCompany.requiresComplianceReporting()); // true
```

## Ventajas del Diseño

### Extensibilidad
- Fácil agregar nuevos tipos de empresa
- Nuevas políticas se pueden agregar sin modificar código existente
- Separación clara de responsabilidades

### Mantenibilidad
- Cada tipo de empresa encapsula su propia lógica
- Cambios en un tipo no afectan otros tipos
- Código más limpio y organizado

### Testabilidad
- Cada tipo se puede probar independientemente
- Fácil simulación (mock) de políticas específicas
- Pruebas unitarias focalizadas por tipo de empresa

### Cumplimiento de SOLID
- **Single Responsibility**: Cada clase tiene una responsabilidad específica
- **Open/Closed**: Abierto para extensión, cerrado para modificación
- **Liskov Substitution**: Las subclases son sustituibles por la clase base
- **Interface Segregation**: Interfaces específicas para cada comportamiento
- **Dependency Inversion**: Dependencias en abstracciones, no en concreciones