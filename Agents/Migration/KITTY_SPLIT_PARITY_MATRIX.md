# 🪚 SERRUCHO — KITTYsplit Parity Matrix

Esta matriz documenta la comparación exhaustiva entre cada funcionalidad del producto de referencia (**Kittysplit**) y el estado actual de **Serrucho**, definiendo la acción requerida para alcanzar paridad funcional y de UX con adaptación dominicana.

---

## Leyenda de Acciones
* `KEEP`: Se mantiene (ya está alineado con Kittysplit y la adaptación RD).
* `MODIFY`: Requiere adaptación en UI/UX, flujo o lógica para coincidir con Kittysplit.
* `REBUILD`: Requiere reconstrucción completa para alinearse a la experiencia de Kittysplit.
* `DELETE`: No existe en Kittysplit ni en la propuesta central; debe eliminarse de extremo a extremo.
* `ADD`: Existe en Kittysplit pero falta en Serrucho; debe implementarse.
* `UNCLEAR`: Requiere confirmación/decisión humana explícita del usuario.

---

## 1. Landing Page, Creación y Acceso

| Área / Funcionalidad | Comportamiento Kittysplit | Estado Actual Serrucho | Acción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Creación Rápida Inline** | Formulario directo en Home: Nombre del Kitty, Tu nombre, Moneda, Email opcional. Crea el grupo en 1 clic. | Modal emergente con pasos y campos adicionales. | `MODIFY` | Pendiente |
| **Acceso por Enlace (Guest Mode)** | Acceso instantáneo total sin registro ni login con solo tener el link único del Kitty (`/k/[slug]`). | Existe vía `/dashboard/[id]` y `/s/[token]`, pero tiene redirecciones intermedias (`/join`). | `MODIFY` | Pendiente |
| **Acceso a Mis Kitties (Magic Link)** | Formulario "Access your Kitties" ingresando email. Envía un enlace mágico que lista todos los grupos de ese email. | Hook `use-recent-serruchos` (localStorage) y Supabase Auth. | `MODIFY` | Pendiente |
| **Calculadora Independiente** | No existe calculadora aislada en la Home ni en el menú. | Existe en `/calculadora` y tab móvil dedicada. | `DELETE` | Pendiente |
| **Banner Promocional / Descarga App** | No existe en Kittysplit (es web pura, sin forzar registro). | Banners de "Descarga la app / Crea tu cuenta" en el dashboard. | `DELETE` | Pendiente |

---

## 2. Estructura y Navegación del Grupo (Kitty / Serrucho)

| Área / Funcionalidad | Comportamiento Kittysplit | Estado Actual Serrucho | Acción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Pestaña 1: Gastos (Entries)** | Lista cronológica de todos los gastos, transferencias y reembolsos. Botón destacado `+ Add expense`. | Existe pestaña "Gastos" separada de "Transferencias" y "Reembolsos". | `MODIFY` | Pendiente |
| **Pestaña 2: Saldos (Balances)** | Muestra: 1) Balances netos de cada persona (verde `+` / rojo `-`), 2) "Cómo saldar" con transferencias mínimas y botón "Saldar". | Pestaña "Balances" con BalanceRing y cards de liquidación. | `MODIFY` | Pendiente |
| **Pestaña 3: Serrucho / Ajustes (Kitty)** | Datos del Kitty (nombre, moneda), lista de participantes (añadir, editar, borrar), compartir enlace, exportar, Super Kitty, eliminar. | Dividido entre diálogos flotantes, botón settings y tabs. | `MODIFY` | Pendiente |
| **Premios del Coro (Coro Awards)** | No existe gamificación de premios. | Componente `coro-awards-card.tsx` y tab móvil dedicada `awards.tsx`. | `DELETE` | Pendiente |
| **Story para Redes Sociales** | No existe generador de historias para Instagram. | Diálogo `shareable-story-dialog.tsx`. | `DELETE` | Pendiente |
| **Cierre Inmutable / Snapshots** | No bloquea el grupo; las deudas se liquidan agregando pagos/transferencias en cualquier momento. | Asistente de cierre `close-serrucho-wizard.tsx` y tablas `settlement_snapshots`. | `MODIFY` | Pendiente |

---

## 3. Gestión de Participantes

| Área / Funcionalidad | Comportamiento Kittysplit | Estado Actual Serrucho | Acción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Añadir Participante** | Añadir por nombre simple en cualquier momento. | Formulario con nombre, email opcional, teléfono y canal de notificación. | `MODIFY` | Pendiente |
| **Editar / Renombrar Participante** | Editar nombre directamente en la pestaña del Kitty. | Permitido en diálogo de participantes. | `KEEP` | Al día |
| **Eliminar Participante** | Permitido si no tiene gastos asociados; si tiene, advierte que debe reasignarse o borrarse sus gastos. | Lógica de borrado con validación de dependencias. | `KEEP` | Al día |
| **Selector de Identidad ("¿Quién eres tú?")** | Permite elegir qué participante eres en este dispositivo para resaltar tu balance personal. | Implementado con selector visual. | `KEEP` | Al día |
| **Límite de Participantes** | Gratis hasta 10 participantes; Super Kitty para grupos mayores (>10). | Implementado en Super Serrucho. | `KEEP` | Al día |

---

## 4. Gastos y Métodos de División

| Área / Funcionalidad | Comportamiento Kittysplit | Estado Actual Serrucho | Acción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Añadir Gasto** | Quién pagó (1 pagador en gratis, varios en Super), Descripción, Monto, Fecha, Categoría, Para quiénes. | Formulario con pagador, descripción, monto, fecha, categoría y división. | `KEEP` | Al día |
| **División Equitativa (Checkboxes)** | Casillas para seleccionar quiénes participan ("Todos" o subconjunto). | Implementado en `splitEqually`. | `KEEP` | Al día |
| **División Desigual / Pesos (Shares)** | Ponderación numérica por participante (ej. 2 partes para parejas, 0.5 para niños). | Implementado en `splitByShares` y `default_shares`. | `KEEP` | Al día |
| **División por Monto Exacto** | Asignar montos numéricos fijos a cada participante. | Implementado en `splitByExact`. | `KEEP` | Al día |
| **División por Porcentajes** | Asignar % a cada integrante sumando 100%. | Implementado en `splitByPercentage`. | `KEEP` | Al día |
| **División Plato por Plato (Itemized)** | No existe en Kittysplit estándar (Kittysplit usa división por ítems manual o montos exactos). | Pantalla móvil dedicada `itemized.tsx` e `ItemizedExpenseLine`. | `UNCLEAR` | Preguntar |
| **Categorías de Gasto** | Categorías estándar con iconos: Supermercado, Restaurante, Hospedaje, Transporte, Bebidas, Ocio, Otros. | Categorías dominicanizadas completas. | `KEEP` | Al día |
| **Fotos de Facturas / Comprobantes** | Adjuntar foto de factura (función de Super Kitty). | Servicio de almacenamiento de recibos y galería. | `KEEP` | Al día |

---

## 5. Pagos, Transferencias y Liquidación (Settlement)

| Área / Funcionalidad | Comportamiento Kittysplit | Estado Actual Serrucho | Acción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Cálculo de Deuda Mínima** | Algoritmo voraz (Greedy) que minimiza el número total de transacciones para saldar el grupo. | Implementado en `@serrucho/core` (`simplifyDebts`). | `KEEP` | Al día |
| **Registrar Pago / Transferencia** | Botón "Saldar / Record a payment" que crea una transferencia "A pagó a B $X". | Implementado en `transfers` y `add-transfer-dialog.tsx`. | `KEEP` | Al día |
| **Marcar como Pagado** | En la lista de "Cómo saldar", 1 clic para registrar el pago y balancear la deuda. | Implementado en `mark-settled-dialog.tsx`. | `KEEP` | Al día |
| **Reembolsos / Ingresos** | Registrar entrada de dinero (ej. devolución de fianza/hotel) a favor del grupo. | Implementado en `incomes` y `add-income-dialog.tsx`. | `KEEP` | Al día |
| **Adaptación Dominicana (Bancos & WhatsApp)** | Opciones de pago dominicanas (Popular, BHD, Banreservas, tPago, Efectivo) y cobrar por WhatsApp. | Adaptado con deep links cordiales en RD$. | `KEEP` | Al día |

---

## 6. Exportación y Super Kitty / Monetización

| Área / Funcionalidad | Comportamiento Kittysplit | Estado Actual Serrucho | Acción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Exportar a Excel (XLSX) / CSV** | Descarga resumen financiero, lista de gastos y balances en hoja de cálculo. | Implementado con exportación XLSX y CSV. | `KEEP` | Al día |
| **Super Kitty (Super Serrucho)** | Pago único por Kitty para desbloquear multimoneda, fotos ilimitadas, más de 10 personas, enlace de solo lectura. | Modelos `SuperSerruchoPlan` y `SerruchoEntitlement`. | `KEEP` | Al día |
| **Enlace de Solo Lectura** | Generar enlace para que terceros solo vean balances sin editar. | Implementado con token de solo lectura (`isReadOnly`). | `KEEP` | Al día |
| **Eliminar Kitty** | Confirmación para borrar definitivamente el grupo. | Implementado en `delete-serrucho-dialog.tsx`. | `KEEP` | Al día |

---

## 7. Mobile App (Expo / React Native)

| Área / Funcionalidad | Comportamiento Kittysplit | Estado Actual Serrucho | Acción | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Paridad de Navegación** | Mismas 3 vistas (Gastos, Saldos, Ajustes) en UI nativa móvil. | Tenía tabs separadas de Calculadora y Premios que no existen en el grupo. | `REBUILD` | Pendiente |
| **Persistencia Offline** | Almacenamiento local para ver y registrar gastos sin conexión. | Implementado con AsyncStorage y SQLite/local cache. | `KEEP` | Al día |
| **Gestos y Bottom Sheets** | Flujos táctiles rápidos para añadir gasto y registrar transferencia. | Implementado en componentes React Native. | `KEEP` | Al día |
