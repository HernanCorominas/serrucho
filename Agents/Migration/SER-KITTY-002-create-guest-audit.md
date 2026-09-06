# 🪚 SERRUCHO — Audit Report: Create Serrucho & Guest Access (SER-KITTY-002)

## 1. Estado Previo del Módulo
Antes de este prompt, existía:
* Un formulario de creación inline en la landing page (`apps/web/app/page.tsx`).
* Un diálogo de creación en `apps/web/features/serruchos/components/create-serrucho-dialog.tsx` que requería 4 pasos (wizard) y hacía el email del organizador obligatorio.
* Un formulario de creación móvil en `apps/mobile/app/serrucho/create.tsx` con soporte para persistencia en `AsyncStorage`.
* Persistencia de recientes en `localStorage` (`serrucho_recent_items_v1`) y en `AsyncStorage` (`@serrucho:recents`).
* Rutas de acceso: `/k/[id]`, `/join/[token]`, `/dashboard/[id]`, `/r/[token]`, `/s/[token]`, `/serrucho/create`, `/serrucho/[id]`.

---

## 2. Auditoría de Rutas (Routing Audit)

| Route | Purpose | Canonical? | Action | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Landing page con creación inline y acceso a login | **YES** | KEEP / ALIGNED | Creación instantánea en 1 pantalla sin cuenta obligatoria. |
| `/k/[id]` | Enlace corto compartible para invitados | **YES** | KEEP | Redirige de inmediato a `/dashboard/[id]` con soporte de parámetros. |
| `/dashboard/[id]` | Workspace del grupo (Gastos, Saldos, Ajustes) | **YES** | KEEP | Soporta selector de identidad y permisos de lectura/edición. |
| `/join/[token]` | Pantalla interactiva "¿Quién eres tú?" para invitados | **YES** | KEEP | Permite seleccionar identidad de la lista o agregarse al grupo. |
| `/r/[token]` | Enlace seguro de Solo Lectura | **YES** | KEEP | Redirige a `/dashboard/[id]?ro=[token]` bloqueando mutaciones. |
| `/s/[token]` | Comprobante público de liquidación individual | **YES** | KEEP | Muestra recibo con datos bancarios de cobro/pago. |
| `/serrucho/create` | Pantalla móvil de creación de Serrucho | **YES** | KEEP | Formulario nativo con haptics, DOP por defecto y sin forzar cuenta. |
| `/serrucho/[id]` | Workspace móvil nativo (Expo React Native) | **YES** | KEEP | Pestañas nativas, selector "¿Quién eres tú?", Pull-to-refresh y botón flotante. |

---

## 3. Create Flow (Flujo de Creación)
* **Principio:** 1 sola pantalla, extremadamente rápido, sin registro ni contraseñas.
* **Campos:**
  1. *Nombre del Serrucho / Evento* (Obligatorio, validado contra vacío y whitespace con `.trim().min(2)`).
  2. *Moneda principal* (Predeterminada `DOP / RD$`, con soporte de `USD` y `EUR`).
  3. *Tu Nombre / Apodo* (Obligatorio, registrado como participante de creación).
  4. *Participantes iniciales* (Lista dinámica de amigos, agregar/quitar antes de crear).
  5. *Correo electrónico* (Completamente opcional, no bloquea el modo invitado).
  6. *Fecha del evento y notas* (Opcionales).
* **Acción:** `Crear Serrucho Ahora ➔` valida formulario, crea entidad en persistencia/DB, crea los participantes, guarda en lista de recientes y redirige inmediatamente al workspace.

---

## 4. Guest Access & Join Flow (Modo Invitado)
* No requiere email, password, OAuth ni cuenta previa.
* Todo Serrucho creado tiene enlace directo `/k/[id]` y `/join/[id]`.
* Al abrir el enlace, el participante ve el grupo y responde:
  > **¿Quién eres tú en este Serrucho?**
* Al tocar su nombre o agregarse, se guarda `serrucho_my_id_${id}` en `localStorage` (Web) o `@serrucho:my_id:${id}` en `AsyncStorage` (Mobile).

---

## 5. Mobile Identity Model
* **NUNCA** autoidentifica al creador ni asume que el usuario móvil es "Tú (Organizador)".
* Cada nuevo dispositivo o usuario móvil que accede al Serrucho ve el selector interactivo "¿Quién eres tú?" o permanece como espectador.
* Una vez seleccionado, el participante queda recordado para ese Serrucho en ese dispositivo.

---

## 6. Sharing & WhatsApp Experience
* Diálogo de compartir en Web ([share-serrucho-dialog.tsx](file:///c:/Users/braul/Downloads/Serrucho/apps/web/features/serruchos/components/share-serrucho-dialog.tsx)) y botón nativo en Mobile ([serrucho/[id].tsx](file:///c:/Users/braul/Downloads/Serrucho/apps/mobile/app/serrucho/[id].tsx)).
* Generación de deep link de WhatsApp con texto cordial dominicano:
  > *🌴 {serruchoName} (Serrucho 🇩🇴)*
  > *¡Hola! He creado un grupo en Serrucho para organizar y dividir los gastos.*
  > *Entra aquí para ver las cuentas:*
  > *{joinUrl}*
* Soporta copia al portapapeles, código QR interactivo generado con `qrcode` y Web Share API nativa.

---

## 7. Persistence Architecture
* Arquitectura respetada: `UI` → `Domain / Validations (Zod)` → `Repository Pattern` → `Local Storage / Memory / Supabase`.
* Recientes gestionados en Web mediante [use-recent-serruchos.ts](file:///c:/Users/braul/Downloads/Serrucho/apps/web/lib/hooks/use-recent-serruchos.ts) y en Mobile mediante [storage.ts](file:///c:/Users/braul/Downloads/Serrucho/apps/mobile/src/services/storage.ts).

---

## 8. Authentication Interaction
* La cuenta es 100% opcional (Guest First).
* Si un usuario inicia sesión (Magic Link por email o Google OAuth), sus Serruchos creados se asocian a su cuenta sin romper la experiencia ni los enlaces de los participantes invitados.

---

## 9. Stack Discrepancy Verification (`STACK-DISCREPANCY`)
* **Versiones activas y verificadas:**
  * Next.js: `15.1.6` (React `19.1.0`)
  * Expo: `~57.0.20`
  * React Native: `0.86.3`
  * TypeScript: `^5.7.3`
  * Vitest: `^3.0.4`
  * Turbo: `^2.4.2`
* **Conclusión:** No se requiere migración de paquetes ni cambios de versiones en esta fase.

---

## 10. Código Reutilizado y Eliminado
* **Reutilizado:** `SerruchoService`, `ISerruchoRepository`, `memory-repository`, `supabase-repository`, `useRecentSerruchos`, `mobileStorage`, `math.ts`, `share.ts`.
* **Modificado:** `CreateSerruchoDialog` (simplificado de wizard de 4 pasos a 1 pantalla), `serruchoSchema` (agregado `.trim()` y soporte de `z.input`), copy de landing page (3 métodos canónicos).
* **Eliminado:** Requisito obligatorio de correo electrónico en la creación, auto-asignación de identidad en mobile.
