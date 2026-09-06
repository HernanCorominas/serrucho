# 🪚 SERRUCHO — Kittysplit Design System

## 1. Fundamentos Visuales (Design Tokens)

El sistema de diseño de Serrucho replica la jerarquía visual, claridad y estética limpia de Kittysplit adaptada con la identidad propia de Serrucho 🪚.

### Paleta de Colores (Color Palette)

| Token | Hex / HSL | Uso / Semántica | Evidencia |
| :--- | :--- | :--- | :--- |
| `primary` | `#00a896` / `hsl(173, 100%, 33%)` | Color primario de marca, botones principales, tabs activas, enlaces | `[OBSERVED]` |
| `primary-dark` | `#028090` / `hsl(187, 97%, 29%)` | Hover/Pressed primario, cabeceras profundas, acentos de marca | `[OBSERVED]` |
| `primary-light` | `#e6f6f4` / `hsl(171, 52%, 94%)` | Fondos de badges activos, selección de chips, banners suaves | `[OBSERVED]` |
| `secondary` | `#028090` | Acciones secundarias, botones de WhatsApp / compartir | `[OBSERVED]` |
| `accent` | `#f26419` / `hsl(21, 90%, 52%)` | Coral cálido para CTAs destacados (`+ Add expense`, Upgrade Super Kitty) | `[OBSERVED]` |
| `success` | `#10b981` | Balances positivos ("Le deben"), estados saldados, badges verdes | `[OBSERVED]` |
| `success-light` | `#ecfdf5` | Fondo para balances positivos y transferencias completadas | `[OBSERVED]` |
| `danger` | `#ef4444` | Balances deudores ("Debe"), acciones destructivas, errores | `[OBSERVED]` |
| `danger-light` | `#fef2f2` | Fondo para balances deudores y alertas | `[OBSERVED]` |
| `warning` | `#f59e0b` | Alertas de límite de participantes, badges de rol | `[OBSERVED]` |
| `warning-light` | `#fef3c7` | Fondo para advertencias y avisos de Super Kitty | `[OBSERVED]` |
| `background-light` | `#f8fafc` | Fondo de página general (limpio, sin saturación) | `[OBSERVED]` |
| `card-light` | `#ffffff` | Fondo de tarjetas y modales en tema claro | `[OBSERVED]` |
| `card-border-light` | `#e2e8f0` | Bordes finos de tarjetas y contenedores | `[OBSERVED]` |
| `text-light` | `#0f172a` | Texto principal de alto contraste | `[OBSERVED]` |
| `text-muted-light` | `#64748b` | Texto secundario, subtítulos, fechas, notas | `[OBSERVED]` |
| `background-dark` | `#090d16` | Fondo general en modo oscuro | `[INFERRED]` |
| `card-dark` | `#111827` | Fondo de tarjetas en modo oscuro | `[INFERRED]` |
| `text-dark` | `#f8fafc` | Texto principal en modo oscuro | `[INFERRED]` |
| `text-muted-dark` | `#94a3b8` | Texto secundario en modo oscuro | `[INFERRED]` |

---

## 2. Tipografía (Typography Scale)

* **Familia**: `Inter, system-ui, -apple-system, sans-serif`
* **Escala y Pesos**:
  * **H1 / Hero Title**: `28px - 32px` | `Font Weight: 900` | Line Height: `1.2`
  * **H2 / Section Title**: `20px - 22px` | `Font Weight: 800` | Line Height: `1.3`
  * **H3 / Card Header**: `16px - 18px` | `Font Weight: 700` | Line Height: `1.4`
  * **Body / Text**: `14px - 15px` | `Font Weight: 400 - 500` | Line Height: `1.5`
  * **Small / Caption**: `12px - 13px` | `Font Weight: 500 - 600` | Line Height: `1.4`
  * **Badge / Micro**: `10px - 11px` | `Font Weight: 700 - 800` | Text Transform: `uppercase`

---

## 3. Espaciado y Radios (Spacing & Radius)

* **Base de Espaciado**: Sistema de múltiplos de 4px (`4, 8, 12, 16, 20, 24, 32, 48px`).
* **Radios de Borde (Border Radius)**:
  * `radius-sm`: `8px` (Inputs inline, botones pequeños)
  * `radius-md`: `12px` (Botones estándar, chips de selección)
  * `radius-lg`: `14px - 18px` (Tarjetas de gastos, contenedores de saldo)
  * `radius-xl`: `24px` (Modales, tarjetas hero de inicio)
  * `radius-full`: `9999px` (Badges de estado, avatares circulares)
* **Sombras y Elevación (Shadows & Elevation)**:
  * `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  * `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)`
  * `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)`

---

## 4. Componentes y Jerarquía Visual

### Botones (Buttons)
* **Primary Button**:
  * Fondo: `#00a896` | Texto: `#ffffff` | Altura: `44px` (móvil `48px`) | Radio: `14px` | Peso: `700`
  * Hover: `#028090` | Active: `#016f7c`
* **Accent CTA (`+ Añadir Gasto` / `Upgrade`)**:
  * Fondo: `#f26419` o `#00a896` | Texto: `#ffffff` | Altura: `48px` | Radio: `14px`
* **Secondary / Outline Button**:
  * Fondo: Transparente | Borde: `1.5px solid #00a896` | Texto: `#00a896`
* **Danger Button**:
  * Fondo: `#ef4444` | Texto: `#ffffff` | Radio: `12px`
* **Ghost Button**:
  * Fondo: Transparente | Texto: `#64748b` | Hover Fondo: `#f1f5f9`

### Tarjetas (Cards)
* **Card Base**: Fondo `#ffffff`, borde `1px solid #e2e8f0`, radio `16px - 18px`, padding `16px`, elevación `shadow-sm`.
* **Expense Row Card**:
  * Icono de categoría a la izquierda en círculo suave (`40x40px`).
  * Título del gasto en negrita (`15px, 700`).
  * Subtítulo con pagador y participantes (`12px, #64748b`).
  * Monto a la derecha en formato monetario (`RD$ XX,XXX.XX`, `16px, 800`).
* **Settlement Transfer Card**:
  * Deudor en rojo suave ➔ Flecha ➔ Acreedor en verde esmeralda.
  * Monto destacado en Teal.
  * Acciones duales: Botón `Saldar ✓` + Botón `WhatsApp 📱`.

### Pestañas Canónicas (Canonical Tabs)
* **Web**: 3 pestañas superiores limpias con indicador activo subrayado en Teal (`#00a896`) y tipografía `font-bold`.
* **Mobile**: Barra segmentada con radio `14px`, fondo suave `#f1f5f9`, botón activo relleno en `#00a896` con texto `#ffffff`.

---

## 5. Comportamiento Responsive y Estados

| Estado | Comportamiento Visual |
| :--- | :--- |
| **Hover (Web)** | Transición suave `150ms ease-in-out`, opacidad `0.9` o elevación ligera `translateY(-1px)`. |
| **Pressed (Mobile)** | Haptic feedback `light/medium`, opacidad `0.85` o color oscurecido. |
| **Disabled** | Fondo `#cbd5e1`, texto `#94a3b8`, cursor `not-allowed`, `pointer-events: none`. |
| **Loading** | `ActivityIndicator` / Spinner blanco o teal, botón deshabilitado temporalmente. |
| **Empty State** | Icono ilustrativo grande (🪚, 🧾, 🎉), título en negrita, mensaje explicativo y botón CTA directo. |
| **Error State** | Borde rojo `#ef4444`, texto de error en `#ef4444` debajo del input (`11px, 600`). |
