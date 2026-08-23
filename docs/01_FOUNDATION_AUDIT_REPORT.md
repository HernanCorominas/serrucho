# 01 — Informe de Auditoría Técnica de la Fundación de Serrucho

**Fecha:** 22 de Agosto de 2026  
**Línea Base:** Milestone 01 — Auditoría Técnica y Preparación  
**Estado:** ✅ Verificado y Estable (0 errores de TypeScript, 40/40 tests pasando)

---

## 1. Arquitectura del Monorepo

El proyecto está estructurado como un Monorepo modular impulsado por **Turborepo** y **npm workspaces**:

```
Serrucho/
├── packages/
│   ├── core/           # Motor financiero puro TypeScript (sin dependencias UI/Node)
│   ├── supabase/       # Cliente tipado y esquemas de base de datos Supabase
│   ├── ui/             # Tokens de diseño, metadatos de categorías y temas
│   └── config/         # Configuraciones base de TypeScript y herramientas
├── apps/
│   ├── web/            # Next.js 15 (App Router), React 19, Tailwind CSS, Vitest, Playwright
│   └── mobile/         # Expo SDK 54, React Native 0.81.5, Expo Router v5, AsyncStorage
└── supabase/
    └── migrations/     # Migraciones PostgreSQL iniciales (schema MVP)
```

---

## 2. Mapa de Entidades y Modelos Actuales (`@serrucho/core`)

| Entidad | Propósito | Campos Clave | Estado Actual |
| :--- | :--- | :--- | :--- |
| **`Serrucho`** | Grupo o evento de gastos | `id`, `owner_id`, `name`, `currency` (DOP), `status` (OPEN/CLOSED), `event_date`, `payment_instructions`, `payment_deadline`, `closed_at` | ✅ Completo |
| **`Participant`** | Integrante del grupo | `id`, `serrucho_id`, `name`, `email`, `phone`, `preferred_channel` (EMAIL/WHATSAPP) | ✅ Completo |
| **`Expense`** | Gasto individual registrado | `id`, `serrucho_id`, `description`, `amount_cents`, `paid_by_participant_id`, `category`, `split_method` | ✅ Completo |
| **`ExpenseParticipant`** | División / asignación por persona | `expense_id`, `participant_id`, `owed_cents`, `percentage_basis_points` | ✅ Completo |
| **`SettlementSnapshot`** | Balance inmutable al cerrar el serrucho | `id`, `serrucho_id`, `participant_id`, `total_expenses_cents`, `owed_cents`, `paid_cents`, `balance_cents`, `public_token_hash` | ✅ Completo |
| **`NotificationLog`** | Registro de envíos de cobro | `id`, `serrucho_id`, `participant_id`, `channel`, `status`, `sent_at` | ✅ Completo |

---

## 3. Estado de Funcionalidades Existentes vs. Roadmap

| Módulo / Funcionalidad | Implementación Existente | Gap Identificado (Prompts Futuros) |
| :--- | :--- | :--- |
| **Creación de Serrucho** | Formulario Web + Pantalla Mobile, soporte offline en IndexedDB / AsyncStorage | Validaciones adicionales de moneda y descripción rica (Prompt 02) |
| **Participantes** | Registro de nombre, teléfono y correo; selección de canal | Soporte de grupos/familias, shares por defecto (Prompts 03, 12) |
| **Modo Invitado (Sin Cuenta)** | Repositorio en memoria / local storage sin forzar autenticación | Vinculación retroactiva al iniciar sesión (Prompt 04) |
| **Compartir por WhatsApp** | Deep links nativos con formato RD$ y desglose formateado | Plantillas dinámicas de cobro y recordatorio personalizado (Prompts 05, 30) |
| **Motor de Gastos** | División EQUAL, PERCENTAGE e ITEMIZED (con desglose de ITBIS 18% y Ley 10%) | Métodos FIXED_AMOUNT (monto fijo) y SHARES (pesos) (Prompts 10, 11) |
| **Transferencias P2P** | No implementado como entidad separada | Entidad `Transfer` y liquidaciones directas entre miembros (Prompt 13) |
| **Ingresos / Devoluciones** | No implementado | Entidad `Income` / reembolsos que restan saldo (Prompt 14) |
| **Motor de Deudas** | Algoritmo voraz `calculateOptimalSettlements` (mínimas transferencias) | Marcado de deudas como saldadas y comprobantes (Prompts 15, 16) |
| **Adjuntos de Facturas** | Lector OCR local de comprobantes dominicanos (`receipt-parser.ts`) | Almacenamiento en Supabase Storage y galería de fotos (Prompt 21) |
| **Historial de Cambios** | Solo fechas `created_at` / `updated_at` | Tabla de auditoría `activity_logs` (Prompt 19) |
| **Multidivisa y Tasa de Cambio** | Estructura para divisas en `@serrucho/core/src/finance/currency.ts` | Tasa manual y selector de moneda por gasto (Prompt 22) |
| **Enlace de Solo Lectura** | Vista pública `/s/[token]` de recibos | Modo espectador para el dashboard completo (Prompt 23) |
| **Exportación** | No implementado | Exportación a CSV / PDF / Excel (Prompt 24) |

---

## 4. Puntos de Extensión Definidos

1. **`packages/core/src/types/domain.ts`**:
   - `SplitMethod = 'EQUAL' | 'PERCENTAGE' | 'FIXED_AMOUNT' | 'SHARES' | 'ITEMIZED'`
   - `Transfer`: `{ id, serrucho_id, from_participant_id, to_participant_id, amount_cents, payment_method, proof_url, settled_at }`
   - `Income`: `{ id, serrucho_id, received_by_participant_id, description, amount_cents, split_method }`
   - `Attachment`: `{ id, expense_id, url, mime_type, file_size_bytes, uploaded_by_participant_id }`
   - `ActivityLog`: `{ id, serrucho_id, action, actor_name, details, created_at }`
2. **`packages/core/src/finance/math.ts`**:
   - `splitByFixedAmount(totalCents, amountsMap)`
   - `splitByShares(totalCents, sharesMap)`
   - `applyTransfersAndIncomes(participants, expenses, transfers, incomes)`
3. **Capa de Persistencia Dual (`Repository` en Web y Mobile)**:
   - Extender interfaces en `apps/web/lib/store/repository.ts` y `apps/mobile/src/services/storage.ts` para que toda nueva entidad funcione tanto offline como en Supabase.

---

## 5. Verificación de Compilación y Pruebas

- **TypeScript Typecheck (`npm run typecheck`):**
  - `@serrucho/core` ➔ 0 errores.
  - `@serrucho/web` ➔ 0 errores.
  - `@serrucho/mobile` ➔ 0 errores.
- **Suite de Pruebas Unitarias (`npm test`):**
  - **40 tests ejecutados y aprobados (100%)**.
  - Módulos verificados: `math.test.ts`, `validations.test.ts`, `settlement.test.ts`, `receipt-parser.test.ts`, `notifications.test.ts`, `tokens.test.ts`.

---

## 6. Conclusión y Gate del Milestone 01

La base del código es sólida, tipada al 100%, con pruebas unitarias pasando y sin dependencias rotas. El terreno está completamente preparado para avanzar de forma incremental al **Prompt 02: `02_CREATE_SERRUCHO.md`**.
