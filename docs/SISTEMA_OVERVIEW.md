# 🪚 SERRUCHO — Documento Integral de Arquitectura, Sistema y Estado 🇩🇴

---

## 📌 1. ¿De qué trata Serrucho? (Propósito, Contexto & Dominio)

**Serrucho** es una plataforma colaborativa full-stack (Web y Móvil) diseñada a medida para el mercado de la **República Dominicana**, cuyo objetivo principal es **organizar, dividir y saldar gastos grupales** ("hacer un serrucho", "hacer vaca", "el coro", "la villa", "la junta de la oficina") de manera justa, transparente y sin complicaciones.

### El Problema que Resuelve
En la República Dominicana y Latinoamérica, coordinar gastos en actividades colectivas suele generar fricción debido a:
1. **Complicaciones fiscales y de propina**: Facturas con **18% de ITBIS** y el **10% de Propina Legal** que complican el cálculo manual.
2. **Barrera de entrada alta**: Plataformas como Splitwise exigen que cada integrante descargue una app, cree una cuenta y recuerde una contraseña.
3. **Desconexión con la banca y canales locales**: Falta de integración natural con **WhatsApp** y con los métodos de pago dominicanos (Banco Popular, Banreservas, BHD, Qik Banco Digital, tPago y Efectivo).
4. **Deudas cruzadas caóticas**: Si 6 personas pagaron cosas distintas durante un fin de semana en Las Terrenas o Punta Cana, calcular quién le debe a quién termina en discusiones y transferencias innecesarias.

### La Propuesta de Valor de Serrucho
- **Cero Fricción (Guest Mode)**: Nadie está obligado a registrarse ni a crear contraseñas para entrar a ver su saldo. Basta con abrir un enlace de invitación único y seleccionar quién es.
- **Enfoque Dominicano Nativo**: Precios en **RD$ (DOP)**, cálculo automático de ITBIS (18%) + Ley (10%), mensajes listos para WhatsApp y soporte para todos los bancos dominicanos.
- **Costo Operativo $0**: Arquitectura serverless optimizada para operar a perpetuidad en niveles gratuitos sin costos mensuales.
- **Mínimas Transferencias**: Motor matemático voraz que simplifica todas las deudas cruzadas al menor número de transacciones posibles.

---

## 🚦 2. ¿A qué punto está el proyecto? (Estado Actual)

El sistema se encuentra en un estado **100% implementado, funcional y estable**, habiendo completado los **32 Prompts de la especificación técnica**:

- ✅ **32 Módulos Funcionales Completos**: Desde la creación, gestión de miembros y división de gastos, hasta multidivisa, OCR de comprobantes, importación de Splitwise y exportación a PDF/Excel.
- ✅ **100% de Pruebas Unitarias Aprobadas**: **35 suites de pruebas con 210 tests automatizados pasando** en Vitest.
- ✅ **0 Errores de Tipado**: TypeScript estricto validado en todo el Monorepo (`npm run typecheck`).
- ✅ **Persistencia Dual Operativa**: Funciona de forma 100% autónoma en modo local/offline (IndexedDB en Web, AsyncStorage en Móvil, MemoryRepository) y en la nube con **Supabase PostgreSQL**.
- ✅ **Paridad Web + Mobile**: Aplicación Web en **Next.js 15 (App Router)** y aplicación Móvil nativa en **Expo SDK 54 (React Native)** compartiendo la misma lógica de negocio (`@serrucho/core`).

---

## 🛠️ 3. Stack Tecnológico

El proyecto está estructurado bajo un **Monorepo moderno con Turborepo y npm workspaces**:

```
Serrucho/
├── apps/
│   ├── web/              ← Next.js 15 (App Router, React 19, Tailwind CSS, PWA, IndexedDB)
│   └── mobile/           ← Expo SDK 54 (React Native, Expo Router v5, Bottom Tabs, Haptics)
│
├── packages/
│   ├── core/             ← @serrucho/core (Motor financiero puro TypeScript, validadores Zod)
│   ├── ui/               ← @serrucho/ui (Tokens de diseño, categorías, paletas y constantes)
│   ├── supabase/         ← @serrucho/supabase (Cliente Supabase, esquemas SQL y tipos generados)
│   └── config/           ← @serrucho/config (Configuraciones base de ESLint y TypeScript)
│
└── supabase/
    ├── migrations/       ← Migraciones SQL con Row Level Security (RLS)
    └── seed.sql          ← Datos de prueba de contexto dominicano
```

### Detalle por Capa Tecnológica

| Capa | Tecnologías Clave | Propósito |
| :--- | :--- | :--- |
| **Monorepo** | Turborepo, npm workspaces, TypeScript 5.x | Orquestación de compilación, ejecución de tests y tipado estricto unificado. |
| **Motor de Dominio** | `@serrucho/core`, Zod, Decimal.js | Lógica financiera agnóstica a la UI. Trabaja **exclusivamente en centavos enteros (`amount_cents`)** para evitar errores de precisión flotante. |
| **Frontend Web** | Next.js 15, React 19, Tailwind CSS, Lucide Icons, Canvas Confetti | PWA responsive, interfaz moderna, Server/Client components, soporte offline con IndexedDB. |
| **Frontend Mobile** | Expo SDK 54, React Native 0.81, Expo Router v5, Expo Haptics | Experiencia nativa para iOS y Android con respuesta háptica, pestañas inferiores y deep linking. |
| **Base de Datos & Backend** | Supabase (PostgreSQL 15), Row Level Security (RLS) | Persistencia relacional en la nube, seguridad por políticas a nivel de fila y API REST auto-generada. |
| **Persistencia Local** | IndexedDB (`idb-keyval` / Web) + AsyncStorage (Mobile) + MemoryRepository | Permite utilizar la app de forma 100% offline o en modo demo sin necesidad de configurar credenciales. |
| **Testing & Calidad** | Vitest, Testing Library, Playwright E2E | Pruebas de regresión, matemáticas financieras, simulaciones de deudas y flujos de usuario. |
| **Mensajería & Notificaciones** | Deep Links de WhatsApp, Resend API ($0 cuota gratuita) | Compartición instantánea de resúmenes y notificaciones transaccionales opcionales. |

---

## ⚙️ 4. ¿Qué hace el sistema? (Módulos y Funcionalidades)

### 1. Calculadora Rápida Dominicana (ITBIS 18% + 10% Ley)
- Permite calcular al instante el desglose de una cuenta de restaurante o bar en RD.
- Calcula el subtotal, el 18% de ITBIS y el 10% de propina legal obligatoria, dividiendo el total exacto entre el número de personas.

### 2. Wizard de Creación en 4 Pasos
- **Paso 1**: Nombre del evento/coro + Moneda principal (DOP, USD, EUR).
- **Paso 2**: Datos del organizador (Owner) con nombre y correo.
- **Paso 3**: Integrantes iniciales (mínimo 1 integrante adicional).
- **Paso 4**: Resumen, confirmación y generación del enlace de acceso.

### 3. Sistema de Acceso Sin Registro (Frictionless Guest Mode)
- Cada serrucho genera un enlace de invitación único con token criptográfico seguro (`/join/[token]`).
- Pantalla interactiva **"¿Quién eres?"**: Los participantes eligen su nombre con un clic.
- **Protección de Identidad**: Una vez que un participante es reclamado, queda bloqueado para otros usuarios.
- El Owner tiene la facultad de **"Reiniciar acceso"** si alguien reclamó un perfil por equivocación.

### 4. Motor de Gastos con 5 Métodos de División
1. **Equitativo (Parejo)**: División exacta con algoritmo determinista de centavos sobrantes (nadie paga una fracción de centavo extra y la suma siempre cuadra al 100%).
2. **Porcentual (%)**: Asignación por porcentaje con validación estricta de 10,000 puntos básicos (100.00%).
3. **Por Cuotas / Proporciones (Shares)**: Ideal para familias, parejas que pagan juntas (2 cuotas) o niños (0.5 cuotas).
4. **Por Monto Fijo (Exact Amount)**: Asignación personalizada de montos específicos en centavos.
5. **Desglosado por Ítems (Itemized)**: Asignación ítem por ítem con cálculo proporcional de impuestos y propina.

### 5. Motor de Deudas Simplificadas ("Menos Transferencias")
- Implementa un **algoritmo voraz (*Greedy Debt Reduction Algorithm*)** en `@serrucho/core`.
- Transforma una red compleja de deudas cruzadas entre múltiples personas en el **número mínimo matemático de pagos necesarios** para saldar el grupo.

### 6. Transferencias P2P y Liquidaciones
- Registro de pagos directos entre integrantes.
- **Doble validación según el rol**:
  - Si el **deudor** reporta un pago: Queda en estado *"Pago reportado (Pendiente de confirmación)"*.
  - Si el **acreedor** registra o confirma el pago: Se marca de inmediato como *"Liquidado / Saldado (SETTLED)"*.
- Métodos de pago adaptados a RD: Banco Popular, Banreservas, BHD, Qik, tPago y Efectivo.

### 7. Integración Nativa con WhatsApp
- Generación con un solo toque de mensajes de cobro cordiales, claros y formateados con la jerga y cortesía dominicana.
- Desglose detallado de quién le debe a quién, monto en RD$ y enlace directo para ver la cuenta.

### 8. Multidivisa y Tasa de Cambio
- Moneda base en **DOP (RD$)** con soporte para registrar gastos en **USD ($)** y **EUR (€)**.
- Conversión transparente a la moneda base con tasas de cambio automáticas o personalizadas por gasto.

### 9. Lector de Comprobantes Fiscales y Recibos (OCR)
- Parser inteligente (`receipt-parser.ts`) capaz de leer facturas dominicanas, detectar totales, ITBIS desglosado y números de comprobante fiscal (NCF).

### 10. Ingresos, Reembolsos y Fondos Comunes
- Soporte para registrar devoluciones, dinero sobrante o aportes a un pote/fondo común que disminuyen la deuda de los participantes.

### 11. Auditoría y Registro de Actividad
- Registro histórico inmutable de todos los movimientos: quién creó el grupo, quién añadió un gasto, quién editó una división y cuándo se reportó un pago.

### 12. Modo Espectador / Enlace de Solo Lectura (`/s/[token]`)
- Enlace público seguro para que cualquier persona o familiar pueda auditar los gastos y balances sin peligro de editar ni alterar los datos.

### 13. Importación y Exportación Universal
- **Exportación**: Descarga del reporte completo en **PDF imprimible**, hojas de cálculo **Excel (.xlsx)**, **CSV** y texto plano para WhatsApp.
- **Importación desde Splitwise**: Lector de archivos CSV exportados de Splitwise para migrar coros y viajes en segundos.

### 14. Monetización Ética ("Super Serrucho" & Jarra de Propinas)
- Mantiene el costo de infraestructura en $0.
- Soporte para jarra de propinas voluntaria (*Tip Jar*) y temas visuales avanzados sin bloquear las funciones esenciales.

### 15. Seguridad, Cuentas Multi-dispositivo y Privacidad
- Vinculación opcional de sesión por correo electrónico para acceder desde múltiples dispositivos (Laptop, Celular, Tablet).
- Opciones completas de privacidad: eliminación total de datos y derecho al olvido.

---

## 🎯 5. Filosofía y Enfoque del Proyecto

1. **Costo de Operación Cero Absoluto ($0 USD)**:
   - Todo el sistema está diseñado para correr en tiers gratuitos de Vercel (Front/API), Supabase (Base de Datos PostgreSQL de 500MB), Expo (EAS/Mobile) y Resend (3,000 emails/mes).
2. **Offline-First & Resiliencia en Conectividad**:
   - Pensado para viajes al interior de RD (playas, campos, montañas) donde el internet puede ser intermitente. La app guarda todo localmente y permite continuar operando sin conexión.
3. **Localización Cultural Dominicana**:
   - No es una traducción genérica de una app en inglés. Incorpora la cultura financiera dominicana: propina de ley, ITBIS, bancos locales, tono amigable y lenguaje coloquial respetuoso.
4. **Rigor Matemático Financiero**:
   - Prohibido el uso de números de punto flotante binario (`Float`) para saldos monetarios. Todos los cálculos se realizan en **centavos enteros (`amount_cents`)**, garantizando que la suma de todas las deudas y balances siempre sea exactamente igual a **0 centavos**.

---

## 🎨 6. Diseño del Frontend y Arquitectura del Backend

### 🌟 Diseño del Frontend (UI / UX)

- **Estilo Visual**: Moderno, premium y fresco (*Vibrant & Sleek*). Utiliza una paleta inspirada en el trópico caribeño dominicano:
  - **Color Primario**: Esmeralda/Teal (`#059669` / `#10B981`) que transmite solidez financiera y frescura.
  - **Acentos**: Tonos ámbar/dorado para pagos pendientes y coral suave para saldos deudores.
  - **Superficies**: Efectos de cristal sutil (*Glassmorphism*), sombras suaves y modo oscuro armonioso.
- **Ergonomía Mobile-First**:
  - **Botón de Acción Flotante (FAB)** para registro inmediato de gastos en 1 toque.
  - **Hojas Inferiores (Bottom Sheets)** y diálogos táctiles adaptados a pantallas de teléfonos.
  - **Feedback Táctil y Háptico**: Vibraciones sutiles en mobile al confirmar pagos y animaciones de confeti al saldar deudas.
  - **Micro-interacciones**: Transiciones fluidas, badges de estado claros (`INVITED`, `IDENTIFIED`, `SETTLED`) y visualizadores de progreso.

### 🏛️ Arquitectura del Backend y Capa de Persistencia

- **Arquitectura en Capas Limpia (Clean Layered Architecture)**:
  1. **Capa de Presentación**: Componentes Next.js (Web) y pantallas Expo Router (Mobile).
  2. **Capa de Negocio y Dominio (`@serrucho/core`)**: Funciones puras de cálculo (`math.ts`), esquemas de validación Zod (`validations.ts`) y definiciones de tipos inmutables (`types/domain.ts`).
  3. **Capa de Abstracción de Datos (Repository Pattern)**:
     - Interfaz abstracta `Repository` que define todas las operaciones CRUD.
     - **`MemoryRepository`**: Repositorio en memoria volátil para pruebas y ejecución ultrarrápida.
     - **`OfflineStore`**: Repositorio en `IndexedDB` / `AsyncStorage` para operar sin backend ni internet.
     - **`SupabaseRepository`**: Repositorio relacional en PostgreSQL conectado mediante `@supabase/supabase-js`.
- **Seguridad en Base de Datos**:
  - Tablas PostgreSQL con políticas **Row Level Security (RLS)**.
  - Hashing de tokens de acceso (`public_token_hash`) para prevenir filtración de enlaces privados.
  - Snapshots inmutables (`settlement_snapshots`) generados al cerrar un serrucho para auditoría permanente.

---

## 📊 7. Resumen de la Estructura de Base de Datos (Supabase)

| Tabla | Descripción |
| :--- | :--- |
| **`serruchos`** | Eventos/grupos de gastos (`id`, `name`, `owner_id`, `currency`, `status`, `event_date`). |
| **`participants`** | Miembros del grupo (`id`, `serrucho_id`, `name`, `email`, `phone`, `status`, `is_active`). |
| **`expenses`** | Gastos registrados (`id`, `serrucho_id`, `description`, `amount_cents`, `paid_by`, `category`, `split_method`). |
| **`expense_participants`** | Divisiones individuales (`expense_id`, `participant_id`, `owed_cents`, `percentage_basis_points`). |
| **`transfers`** | Pagos y liquidaciones directas (`from_id`, `to_id`, `amount_cents`, `status`, `payment_method`). |
| **`incomes`** | Devoluciones, descuentos y fondos comunes (`serrucho_id`, `received_by`, `amount_cents`). |
| **`settlement_snapshots`** | Balances congelados al cerrar el evento para archivo histórico. |
| **`activity_logs`** | Registro de auditoría de cada acción realizada en el grupo. |
| **`attachments`** | Fotos de recibos y facturas asociadas a gastos. |

---

## 🚀 8. Comandos de Operación Rápida

```bash
# Iniciar frontend web
npm run dev:web

# Iniciar app móvil en Expo
npm run dev:mobile

# Validar tipado TypeScript en todo el monorepo
npm run typecheck

# Correr las 35 suites de pruebas unitarias (210 tests)
npm test

# Compilar para producción
npm run build
```

---
*Documento oficial del proyecto Serrucho 🇩🇴 — Reparto Inteligente de Gastos Grupales.*
