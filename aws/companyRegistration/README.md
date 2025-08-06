### Explicación breve de la arquitectura

**Objetivo**
Permitir dos vías de alta de empresas — una **síncrona** para el back-office interno y otra **asíncrona / event-driven** para partners o cargas masivas— manteniendo una única lógica de negocio en el microservicio `interbanking-api`.

---

#### 1. Flujo síncrono (back-office)

1. El usuario del back-office llama a **API Gateway** (ruta REST tradicional).
2. `interbanking-api` procesa la solicitud en tiempo real, valida reglas de negocio y persiste la empresa en la **DB**.
3. Devuelve 201 o el error correspondiente al cliente.

> Este camino se usa cuando el operador necesita respuesta inmediata.

---

#### 2. Flujo asíncrono (partners / lotes)

1. **API Gateway** envía un `PutEvents` al **EventBridge Bus** (o los partners suben un CSV a **S3**, que también genera un evento).
2. **EventBridge** aplica reglas/filtros y dispara la **Lambda Ingest**.
3. La Lambda valida formato (usa librería compartida del monorepo) y publica el mensaje en **SQS**.
4. El **consumer** (`interbanking-consumer`) hace *long-poll* de la cola, llama al mismo caso de uso `RegistrarEmpresa`, y guarda en la **DB**.
5. Si todo sale bien, emite un evento «company registered» a **SNS** para notificar otros sistemas (e-mails, auditoría, etc.).
6. Si el procesamiento falla, SQS reintenta; tras **> 3 intentos** el mensaje pasa a la **DLQ** para análisis manual.

> Así se desacoplan picos de carga, se gana resiliencia y se evita impactar la API síncrona.

---

#### Beneficios clave

| Aspecto            | Cómo se logra                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Escalabilidad**  | API Gateway + Lambda escalan automáticamente; **SQS** amortigua ráfagas.                                  |
| **Resiliencia**    | Si la base o el microservicio están caídos, los mensajes quedan en SQS; nada se pierde.                   |
| **Evolución**      | **EventBridge** permite añadir nuevas fuentes o destinos sin tocar código; solo se crean reglas.          |
| **Observabilidad** | CloudWatch + X-Ray en Lambda y servicio; `MessageId` de SQS y `traceId` facilitan el tracking end-to-end. |
| **Seguridad**      | Principio de mínimo privilegio (IAM por servicio); datos cifrados en reposo (S3, SQS).                    |
| **Error handling** | Política de reintentos automática y **DLQ** para investigaciones post-mortem.                             |
