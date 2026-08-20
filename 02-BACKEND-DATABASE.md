# AGENT — BACKEND / DATABASE

## Misión
Construir el backend seguro, consistente y testeable del MVP.

## Stack
Next.js server actions/API routes + TypeScript + Supabase PostgreSQL + Zod.

## Modelo de datos
### profiles
- id UUID PK
- email
- full_name
- created_at

### serruchos
- id UUID PK
- owner_id UUID FK profiles
- name
- description nullable
- currency default DOP
- event_date nullable
- status enum: OPEN, CLOSED
- payment_instructions nullable text
- payment_deadline nullable date
- public_slug/token metadata only if needed
- closed_at nullable
- created_at
- updated_at

### participants
- id UUID PK
- serrucho_id FK
- name
- email nullable
- phone nullable
- preferred_channel enum EMAIL, WHATSAPP
- created_at
- updated_at

### expenses
- id UUID PK
- serrucho_id FK
- description
- amount_cents bigint
- paid_by_participant_id FK
- expense_date
- split_method enum EQUAL, PERCENTAGE
- created_at
- updated_at

### expense_participants
- expense_id FK
- participant_id FK
- percentage_basis_points nullable
- owed_cents bigint
- PK(expense_id, participant_id)

### settlement_snapshots
- id UUID PK
- serrucho_id FK
- participant_id FK
- total_expenses_cents
- owed_cents
- paid_cents
- balance_cents
- payment_instructions
- payment_deadline
- public_token_hash
- created_at

### settlement_items
- id UUID PK
- snapshot_id FK
- expense_id nullable
- description
- paid_by_name
- amount_cents
- participant_owed_cents

### notification_logs
- id UUID PK
- serrucho_id FK
- participant_id FK
- snapshot_id nullable
- channel
- destination_masked
- status
- provider_message_id nullable
- error_message nullable
- sent_at nullable
- created_at

## Reglas críticas
1. Todos los montos en bigint/cents.
2. No usar `number` para cálculos monetarios sin control.
3. Toda mutación valida con Zod.
4. Un serrucho CLOSED no permite editar gastos/participantes.
5. Cerrar debe ejecutarse en transacción lógica idempotente.
6. Snapshot debe ser inmutable.
7. El token público nunca se almacena en texto plano; almacenar hash.
8. El endpoint público solo puede devolver información del snapshot asociado al token.
9. RLS debe impedir que un usuario vea serruchos ajenos.

## Servicios
- `SerruchoService`
- `ParticipantService`
- `ExpenseService`
- `SettlementService`
- `NotificationService`

## Funciones clave
- createSerrucho
- addParticipant
- addExpense
- updateExpense
- calculateSettlement
- closeSerrucho
- createSettlementSnapshots
- generatePublicSettlementToken
- sendSettlementNotifications

## Tests mínimos
- reparto exacto entre 2, 3, 7 personas;
- centavos sobrantes;
- porcentajes;
- gasto aplicado solo a algunos participantes;
- balance correcto;
- cierre idempotente;
- no se puede modificar cerrado;
- token inválido;
- autorización RLS.

## Entregables
- migraciones SQL;
- seed de desarrollo;
- servicios;
- schemas Zod;
- tests;
- README de variables de entorno;
- documentación breve de endpoints/actions.
