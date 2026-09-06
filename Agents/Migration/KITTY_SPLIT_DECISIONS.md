# 🪚 SERRUCHO — Kittysplit Migration Decisions Log

Este documento registra todas las decisiones arquitectónicas, de experiencia de usuario y funcionales requeridas para la migración hacia la paridad con **Kittysplit**.

---

## QUESTION REQUIRED #1

**AREA:** URL Structure & Guest Access Navigation

**WHAT I FOUND:**
Actualmente en Serrucho el grupo se abre principalmente en `/dashboard/[id]` (que presupone una vista de dashboard administrativo) y `/s/[token]` (que mostraba un comprobante de liquidación).

**KITTYsplit REFERENCE:**
En Kittysplit el enlace de cada Kitty es directo y público (ej. `/k/fin-de-semana-terrenas-x8z9` o `/k/[id]`). Cualquier usuario que hace clic en el enlace entra inmediatamente a la vista completa del Kitty sin pasar por login ni pantallas intermedias.

**CONFLICT / AMBIGUITY:**
¿Qué estructura de ruta principal debemos adoptar para los Serruchos?

**OPTIONS:**
* **A. (Recomendado)** Adoptar rutas limpias tipo `/k/[id]` (o `/s/[id]`) como la vista principal y directa del Serrucho para todos los participantes (creador e invitados), eliminando la distinción entre "dashboard de dueño" y "vista de invitado".
* **B.** Mantener `/dashboard/[id]` como ruta principal.

**RECOMMENDATION:**
Opción A. Alinea la experiencia al modelo mental de enlace compartido de Kittysplit.

**WAITING FOR USER DECISION.**

---

## QUESTION REQUIRED #2

**AREA:** Continuous Live Settlement vs Immutable Closed Snapshots

**WHAT I FOUND:**
Actualmente en Serrucho existe un botón "Liquidar" que ejecuta un wizard (`close-serrucho-wizard.tsx`), cambia el estado del Serrucho a `CLOSED`, bloquea la adición de nuevos gastos y genera registros estáticos en `settlement_snapshots`.

**KITTYsplit REFERENCE:**
En Kittysplit un Kitty **nunca se bloquea de forma irreversible**. Es un grupo continuo y vivo donde:
1. Las deudas se liquidan simplemente registrando pagos/transferencias ("A pagó a B RD$ X").
2. Cuando se registran los pagos, los balances de todos llegan automáticamente a RD$ 0.00.
3. Se puede seguir añadiendo o corrigiendo gastos en cualquier momento, o archivar/eliminar el Kitty si ya concluyó.

**CONFLICT / AMBIGUITY:**
¿Debemos eliminar el asistente de bloqueo inmutable y adoptar la liquidación viva de Kittysplit basada en transferencias directas?

**OPTIONS:**
* **A. (Recomendado)** Adoptar el modelo 100% Kittysplit: eliminar el bloqueo inmutable y el asistente de cierre; saldar cuentas registrando transferencias que balancean los saldos a cero en tiempo real.
* **B.** Mantener el estado `CLOSED` como una opción adicional de archivado.

**RECOMMENDATION:**
Opción A. Simplifica el producto radicalmente y elimina fricción de uso.

**WAITING FOR USER DECISION.**

---

## QUESTION REQUIRED #3

**AREA:** Itemized Splitting (División Plato por Plato)

**WHAT I FOUND:**
En Serrucho móvil existe una pantalla `itemized.tsx` y en el core tipos `ItemizedExpenseLine` para desglosar ítems individuales de una cuenta (con impuestos y propinas por ítem).

**KITTYsplit REFERENCE:**
Kittysplit no tiene un sub-módulo complejo de escaneo o desglose plato por plato dentro de los gastos. Maneja división equitativa, por partes/pesos (shares), por porcentajes y por montos exactos.

**CONFLICT / AMBIGUITY:**
¿Debemos remover la división "Itemized" para preservar la simplicidad estricta de Kittysplit, o mantenerla dentro del selector de métodos de división como monto exacto?

**OPTIONS:**
* **A. (Recomendado)** Eliminar la pantalla y flujo `itemized` para lograr paridad exacta con los 4 métodos estándar de Kittysplit (Equitativo, Pesos/Partes, Montos Exactos, Porcentajes).
* **B.** Conservar el cálculo de ítems pero simplificado dentro del formulario de gasto.

**RECOMMENDATION:**
Opción A. Cumple con la regla de simplicidad y paridad estricta con Kittysplit.

**WAITING FOR USER DECISION.**

---

## QUESTION REQUIRED #4

**AREA:** Autenticación y "Mis Serruchos" (Magic Link Passwordless)

**WHAT I FOUND:**
Serrucho tiene Supabase Auth con soporte para email/password y magic link, además de almacenamiento local en `localStorage` / `AsyncStorage`.

**KITTYsplit REFERENCE:**
En Kittysplit **no existen contraseñas**. El usuario puede:
1. Usar el grupo como invitado anónimo con solo el link.
2. Acceder a "My Kitties" ingresando su correo, lo cual le envía un enlace mágico (Magic Link) que abre la lista de todos sus Kitties creados o vinculados.

**CONFLICT / AMBIGUITY:**
¿Confirmamos que la experiencia de login en Serrucho sea 100% passwordless (Magic Link por email + guardado local automático en ese navegador/dispositivo)?

**OPTIONS:**
* **A. (Recomendado)** Sí, experiencia 100% passwordless: Magic Link para recuperación/acceso multi-dispositivo y lista local automática en el dispositivo actual.
* **B.** Mantener opción de contraseña tradicional.

**RECOMMENDATION:**
Opción A. Elimina fricción y coincide exactamente con Kittysplit.

**WAITING FOR USER DECISION.**

---

## QUESTION REQUIRED #5

**AREA:** Arquitectura de Navegación en la App Móvil (Expo)

**WHAT I FOUND:**
En la app móvil actual, las pestañas inferiores (`Bottom Tabs`) están fijadas a nivel global: `[Inicio | Calculadora | Premios | Ajustes]`, y al abrir un serrucho se abre una pantalla modal `[id].tsx`.

**KITTYsplit REFERENCE:**
En Kittysplit, la navegación se enfoca en el Kitty:
1. Pantalla principal: Lista de Mis Serruchos + Botón "Crear Serrucho".
2. Al entrar a un Serrucho: Se entra a las 3 vistas del grupo: `[Gastos (Entries) | Saldos (Balances) | Ajustes (Kitty)]`.

**CONFLICT / AMBIGUITY:**
¿Reestructuramos la navegación móvil para que las 3 pestañas principales correspondan al Serrucho activo `[Gastos | Saldos | Ajustes]`, eliminando las pestañas globales de Calculadora y Premios?

**OPTIONS:**
* **A. (Recomendado)** Sí, reestructurar la navegación móvil para reflejar exactamente las 3 vistas de Kittysplit dentro de cada Serrucho, con navegación nativa fluida.
* **B.** Mantener pestañas globales en el pie de página móvil.

**RECOMMENDATION:**
Opción A. Garantiza paridad total de experiencia entre Web y Mobile.

**WAITING FOR USER DECISION.**
