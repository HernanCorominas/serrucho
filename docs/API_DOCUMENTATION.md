# Documentación de la API REST — Serrucho 🇩🇴

Esta API REST permite la gestión colaborativa integral de gastos grupales, participantes, estados de presencia, liquidaciones y deudas netas simplificadas.

---

## 1. Serruchos (Grupos / Eventos)

### `GET /api/serruchos`
Lista todos los serruchos pertenecientes al usuario u organizador.
- **Respuesta `200 OK`**:
```json
[
  {
    "id": "serrucho-uuid",
    "name": "Viaje Punta Cana 🌴",
    "description": "Gastos compartidos",
    "currency": "DOP",
    "status": "OPEN",
    "event_date": "2026-08-27",
    "created_at": "2026-08-27T12:00:00.000Z"
  }
]
```

### `POST /api/serruchos`
Crea un nuevo serrucho. Registra al creador automáticamente como Owner y Participante #1 (RN-001).
- **Body (`application/json`)**:
```json
{
  "name": "Viaje Punta Cana 🌴",
  "description": "Gastos de la villa",
  "currency": "DOP",
  "creator_name": "Hernan",
  "creator_email": "hernan@ejemplo.do",
  "initial_participants": ["Braulin"],
  "event_date": "2026-08-27"
}
```
- **Respuesta `201 Created`**: Objeto `Serrucho` creado con token de lectura y acceso.

### `GET /api/serruchos/:id`
Obtiene los detalles del serrucho, participantes, balance en vivo y resumen.
- **Respuesta `200 OK`**:
```json
{
  "serrucho": { "id": "...", "name": "...", "currency": "DOP", "status": "OPEN" },
  "participants": [ ... ],
  "expensesCount": 5,
  "snapshots": [ ... ]
}
```

### `PATCH /api/serruchos/:id`
Actualiza nombre, descripción, fecha o configuración del serrucho (RF-006).

### `DELETE /api/serruchos/:id`
Elimina el serrucho y sus transacciones asociadas.

---

## 2. Participantes & Identidad

### `GET /api/serruchos/:id/participants`
Lista los integrantes del coro con su estado de acceso (`INVITED`, `ACCESSED`, `IDENTIFIED`, `LINKED_ACCOUNT`).

### `POST /api/serruchos/:id/participants`
Agrega un participante por nombre (RN-014).
- **Body**: `{ "name": "Carlos", "email": "carlos@ejemplo.do", "phone": "8095551234" }`

### `DELETE /api/serruchos/:id/participants/:pId`
Elimina un participante. El Owner no puede eliminarse a sí mismo (RN-002).

### `POST /api/serruchos/:id/participants/:pId/seen`
Registra que el participante accedió o se identificó mediante el enlace de invitación (RN-011, RN-012).
- **Body**: `{ "status": "IDENTIFIED" }`

### `POST /api/serruchos/:id/participants/:pId/reset-access`
Reinicia el estado de acceso de un participante a `INVITED` en caso de que alguien lo haya reclamado por error (Decisión #3).

---

## 3. Gastos & Divisiones

### `GET /api/serruchos/:id/expenses`
Lista los gastos registrados con su distribución por participante.

### `POST /api/serruchos/:id/expenses`
Registra un nuevo gasto con división en centavos enteros.
- **Body**:
```json
{
  "description": "Picadera y Bebidas",
  "amount": 500,
  "paid_by_participant_id": "hernan-id",
  "category": "FOOD_GROCERIES",
  "split_method": "PERCENTAGE",
  "expense_date": "2026-08-27",
  "splits": [
    { "participant_id": "hernan-id", "owed_cents": 12500, "percentage_basis_points": 2500 },
    { "participant_id": "braulin-id", "owed_cents": 37500, "percentage_basis_points": 7500 }
  ]
}
```

### `PATCH /api/serruchos/:id/expenses/:expId`
Edita un gasto existente y recalcula automáticamente los saldos netos (Decisión #4).

### `DELETE /api/serruchos/:id/expenses/:expId`
Elimina un gasto y recalcula balances (Decisión #4).

---

## 4. Deudas & Liquidaciones ("Menos Transferencias")

### `GET /api/serruchos/:id/settlement`
Calcula en tiempo real los balances individuales y las transferencias óptimas para saldar el coro con el menor número de pagos posibles (Algoritmo Voraz `@serrucho/core`).

### `POST /api/serruchos/:id/settlements/pay`
Registra el cumplimiento de un pago o transferencia directa (Decisiones #7 y #8).
- **Body**:
```json
{
  "from_participant_id": "braulin-id",
  "to_participant_id": "hernan-id",
  "amount": 375,
  "payment_date": "2026-08-27",
  "payment_method": "TRANSFER_POPULAR",
  "status": "SETTLED",
  "notes": "Pago vía transferencia Popular"
}
```

---

## 5. Seed de Ejemplo

### `POST /api/seed` (o `GET /api/seed`)
Genera el caso de ejemplo "Viaje Punta Cana" con Hernan y Braulin y el gasto de RD$ 500 al 25%/75%.
