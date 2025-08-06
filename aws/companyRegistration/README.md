### Explicación breve de la arquitectura

**Objetivo**
Permitir dos vías de alta de empresas — una **síncrona** para el back-office interno y otra **asíncrona / event-driven** para partners o cargas masivas, manteniendo una única lógica de negocio en el microservicio `company-service`.

---

#### 1. Flujo síncrono (back-office)

1. El usuario del back-office llama a **API Gateway** (ruta REST tradicional).
2. `company-service` procesa la solicitud en tiempo real, valida reglas de negocio y persiste la empresa en la **DB**.
3. Devuelve 201 o el error correspondiente al cliente.

> Este camino se usa cuando el operador necesita respuesta inmediata.

---

#### 2. Flujo asíncrono (partners / lotes)

1. **API Gateway** envía un `PutEvents` al **EventBridge Bus** (o los partners suben un CSV a **S3**, que también genera un evento).
2. **EventBridge** aplica reglas/filtros y dispara la **Lambda Ingest**.
3. La Lambda valida formato (usa librería compartida del monorepo) y publica el mensaje en **SQS**.
4. El **consumer** (`company-consumer`) hace **long-poll** de la queue, llama a la misma lógica de negocio de registro de empresa, y guarda en la **DB** (es el mismo repo en otra instancia dedicada).
5. Si todo sale bien, emite un evento «company registered» a **SNS** para notificar otros sistemas (e-mails, auditoría, etc.).
6. Si el procesamiento falla, SQS reintenta, tras **> 3 intentos** el mensaje pasa a la **DLQ** para análisis manual.

*Vale aclarar que la parte de notificar a otros sistemas con SNS es solo conceptual, no fue implementada. También asumir que los eventos serían consumidos un modelo push para aprovechar el mismo servicio.*

> Así se desacoplan picos de carga, se gana resiliencia y se evita impactar la API síncrona.

---

#### Beneficios clave
- **Escalabilidad**: API Gateway + Lambda escalan automáticamente, **SQS** amortigua grandes requests concurrentes.
- **Resiliencia**: Si la DB o el microservicio están caídos, los mensajes quedan en SQS, nada se pierde.
- **Evolución**: **EventBridge** permite añadir nuevos inputs de datos o destinos sin tocar código, solo se crean reglas.
- **Observabilidad**: CloudWatch en Lambda y servicio. `MessageId` de SQS y `traceId` facilitan el tracking end-to-end.
- **Seguridad**: Principio de mínimo privilegio (IAM por servicio). Datos cifrados en reposo (S3, SQS). 
- **Error handling**: Política de reintentos automática y **DLQ** para reintentos post-mortem.
