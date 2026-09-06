# 🪚 SERRUCHO — Kittysplit Screen Inventory

Inventario detallado de todas las pantallas y vistas de la aplicación tanto en Web como en Mobile.

---

## 1. Pantallas Principales (Core Screens)

### SCR-01: Landing & Quick Create
* **Plataforma:** Web / Mobile Web
* **Ruta:** `/`
* **Propósito:** Presentación de la aplicación y creación instantánea de un Serrucho en 1 pantalla sin fricción.
* **Punto de Entrada:** URL raíz `https://serrucho.do/`.
* **Punto de Salida:** Redirección inmediata a `/k/[id]` tras crear el grupo.
* **Componentes:** Hero banner, formulario rápido inline (Nombre, Tu Nombre, Amigos, Moneda), lista de Serruchos recientes en este dispositivo, footer con acceso a Magic Link.
* **Acciones:**
  * `Crear Serrucho`: Valida nombre, guarda localmente y en base de datos, navega a `/k/[id]`.
  * `Abrir Reciente`: Navega al Serrucho guardado en `localStorage`.
  * `Acceder por Email (Magic Link)`: Abre modal para enviar enlace mágico con todos los grupos.
* **Estados:** Formulario vacío, cargando creación, lista de recientes vacía/poblada.
* **Permisos:** Público / Anónimo (Guest).
* **Referencia:** `[OBSERVED]` (Kittysplit Landing Page).

---

### SCR-02: Dashboard del Serrucho — Tab 1: Gastos (Expenses)
* **Plataforma:** Web (`/k/[id]`, `/dashboard/[id]`) & Mobile (`/serrucho/[id]`)
* **Ruta:** `/k/[id]?tab=expenses`
* **Propósito:** Vista principal del grupo para consultar y registrar gastos, transferencias y reembolsos.
* **Punto de Entrada:** Creación de grupo, enlace compartido, lista de recientes.
* **Punto de Salida:** Modal de añadir gasto, modal de detalle de gasto, cambio de tab.
* **Componentes:**
  * Cabecera con nombre del Serrucho, moneda y botón de compartir por WhatsApp.
  * Tarjeta de métricas: Total gastado (`RD$ XX,XXX.XX`), cantidad de gastos y amigos.
  * Botón principal `+ Añadir Gasto` (destacado en la parte superior y flotante en móvil).
  * Selector de tabs canónico (`Gastos`, `Saldos`, `Ajustes`).
  * Lista cronológica de consumos con icono de categoría, concepto, pagador, desglose y monto.
* **Acciones:**
  * `+ Añadir Gasto`: Abre modal o pantalla de registro de gasto.
  * `Tocar Gasto`: Abre modal de desglose detallado (quién debe cuánto y botón eliminar).
  * `Compartir Serrucho`: Abre diálogo/menú nativo de compartir por WhatsApp.
* **Estados:** Cargando datos, grupo sin gastos (Empty State con CTA), lista con gastos.
* **Permisos:** Miembro (Lectura/Escritura) o Enlace de Solo Lectura (Read-Only: deshabilita añadir y editar).
* **Referencia:** `[OBSERVED]` (Kittysplit Entries View).

---

### SCR-03: Dashboard del Serrucho — Tab 2: Saldos y Liquidación (Balances & Settlements)
* **Plataforma:** Web & Mobile
* **Ruta:** `/k/[id]?tab=balances`
* **Propósito:** Claridad contable en 5 segundos. Muestra cómo saldar todas las deudas con el menor número de pagos posibles y el balance neto individual.
* **Punto de Entrada:** Clic en tab `Saldos ⚖️`.
* **Punto de Salida:** Modal de confirmar pago / marcar como saldado, WhatsApp de cobro.
* **Componentes:**
  * **Sección 1: Menos Transferencias Posibles (Quién paga a quién)**: Tarjetas visuales de transferencia mínima con algoritmo voraz (`simplifyDebts`).
  * **Botón `Saldar ✓`**: Registra la transferencia en 1 clic.
  * **Botón `Cobrar por WhatsApp 📱`**: Abre WhatsApp con mensaje cordial y datos bancarios RD.
  * **Sección 2: Balance de Cada Participante**: Lista de integrantes con desglose (*Pagó: RD$ X | Le toca: RD$ Y*) y badge de saldo neto (Verde `+` acreedor, Rojo `-` deudor, Gris `RD$ 0.00` al día).
* **Acciones:**
  * `Marcar como Saldado`: Abre modal de confirmación y registra una transferencia `SETTLEMENT`.
  * `Cobrar`: Dispara deep link a WhatsApp con el monto y nombre del deudor.
* **Estados:** Todas las cuentas saldadas (`RD$ 0.00` y mensaje de felicitación), deudas pendientes.
* **Permisos:** Miembro o Read-Only (en Read-Only el botón saldar está deshabilitado).
* **Referencia:** `[OBSERVED]` (Kittysplit Balances & Settle Tab).

---

### SCR-04: Dashboard del Serrucho — Tab 3: Ajustes & Participantes (Settings & Members)
* **Plataforma:** Web & Mobile
* **Ruta:** `/k/[id]?tab=settings`
* **Propósito:** Gestión de integrantes del grupo, configuración de moneda, exportación y opciones de borrado.
* **Punto de Entrada:** Clic en tab `Ajustes 👥`.
* **Punto de Salida:** Modal de añadir amigo, modal de editar amigo, exportar Excel, eliminar grupo.
* **Componentes:**
  * Botón `+ Agregar Amigo al Serrucho`.
  * Lista de integrantes con acciones de renombrar (`✏️`) y eliminar (`🗑️` solo si no tiene gastos asociados).
  * Selector de identidad ("¿Quién eres tú en este serrucho?").
  * Configuración de moneda y datos bancarios para cobros.
  * Botones de exportación (Excel XLSX / CSV).
  * Opción de eliminar Serrucho (con confirmación de seguridad).
* **Acciones:**
  * `Añadir Amigo`: Agrega participante al grupo en tiempo real.
  * `Editar Amigo`: Permite cambiar nombre o teléfono.
  * `Eliminar Amigo`: Valida integridad contable y remueve si no tiene gastos.
  * `Exportar`: Descarga archivo Excel formateado.
* **Estados:** Lista de amigos, diálogo de edición, confirmación de borrado.
* **Permisos:** Miembro.
* **Referencia:** `[OBSERVED]` (Kittysplit Settings Tab).

---

### SCR-05: Formulario de Añadir Gasto (Add Expense)
* **Plataforma:** Web (Modal Dialog) & Mobile (Modal Screen `apps/mobile/app/serrucho/add-expense.tsx`)
* **Ruta:** `/serrucho/add-expense?serruchoId=[id]`
* **Propósito:** Registrar un nuevo gasto seleccionando pagador y método de división.
* **Punto de Entrada:** Botón `+ Añadir Gasto`.
* **Punto de Salida:** Guardar (vuelve al dashboard) o Cancelar/Cerrar.
* **Componentes:**
  * Campo: Concepto del gasto (texto obligatorio).
  * Campo: Monto en pesos dominicanos (numérico obligatorio).
  * Selector de Pagador: Chips/Pills horizontales de participantes.
  * Selector de Método de Reparto: 4 botones (`Igual =`, `Por Partes / Cuotas ⚖️`, `Montos Exactos 💵`, `Porcentajes %`).
  * Selector de Participantes: Casillas de verificación para incluir/excluir integrantes con botón "Seleccionar Todos".
  * Campos dinámicos según método: Inputs de %, cuotas o montos individuales.
  * Selector de Categoría: Grid de botones con emojis (Supermercado, Restaurante, Bebidas, Transporte, Hospedaje, Otros).
  * Campo: Nota u observación opcional.
* **Acciones:**
  * `Guardar Gasto`: Valida datos, calcula centavos exactos (`@serrucho/core`), persiste y recalcula saldos.
  * `Cancelar`: Cierra modal sin guardar.
* **Estados:** Formulario inicial, cálculo de suma inválido (ej. porcentajes != 100%), guardando (loading).
* **Permisos:** Miembro con permisos de escritura.
* **Referencia:** `[OBSERVED]` (Kittysplit Add Expense Form).

---

### SCR-06: Vista Móvil de Mis Serruchos (Mobile Home)
* **Plataforma:** Mobile (`apps/mobile/app/(tabs)/index.tsx`)
* **Ruta:** `/(tabs)/`
* **Propósito:** Lista de serruchos activos y liquidados en el dispositivo móvil con acceso rápido a creación.
* **Punto de Entrada:** Inicio de la aplicación móvil.
* **Punto de Salida:** Navegación a `/serrucho/[id]` o modal `/serrucho/create`.
* **Componentes:**
  * Cabecera con logo `SERRUCHO 🪚` y botón `+ Crear`.
  * Tarjetas de estadísticas rápidas (Total, Activos, Liquidados).
  * Barra de búsqueda por nombre.
  * Selector de estado: `En Curso` vs `Liquidados`.
  * Lista de tarjetas de Serrucho con título, descripción, fecha y badge de estado.
  * Empty state amigable cuando no hay grupos registrados.
* **Acciones:**
  * `Tocar Serrucho`: Entra al detalle del grupo.
  * `+ Crear`: Abre modal de nuevo serrucho.
  * `Pull to Refresh`: Recarga datos desde persistencia local.
* **Estados:** Cargando, vacío, con grupos activos/cerrados.
* **Permisos:** Usuario local del dispositivo.
* **Referencia:** `[OBSERVED]` (Kittysplit Mobile App Home).

---

### SCR-07: Acceso por Enlace Mágico (Magic Link Access)
* **Plataforma:** Web
* **Ruta:** `/account/access` o Modal en Home
* **Propósito:** Permitir a un usuario recuperar y listar todos los Serruchos asociados a su correo sin contraseña.
* **Punto de Entrada:** Enlace "Acceder a mis Serruchos" en Home / Footer.
* **Punto de Salida:** Correo electrónico enviado con link de acceso de 1 clic.
* **Componentes:**
  * Input de correo electrónico.
  * Botón `Enviar Enlace Mágico`.
  * Pantalla de confirmación "Revisa tu bandeja de entrada".
* **Acciones:**
  * `Enviar`: Dispara correo vía Supabase / Resend con el token de acceso.
* **Estados:** Inicial, enviando, enviado con éxito, error de correo inválido.
* **Permisos:** Público.
* **Referencia:** `[OBSERVED]` (Kittysplit Access Kitties Flow).

---

### SCR-08: Vista de Solo Lectura (Read-Only Serrucho)
* **Plataforma:** Web & Mobile
* **Ruta:** `/r/[token]` o `/k/[id]?ro=true`
* **Propósito:** Compartir el estado contable con personas externas que solo necesitan auditar las cuentas sin alterar gastos.
* **Punto de Entrada:** Enlace de solo lectura generado en ajustes.
* **Punto de Salida:** Navegación interna entre tabs (Gastos y Saldos).
* **Componentes:**
  * Banner superior informativo: "Estás viendo este Serrucho en Modo Solo Lectura 👁️".
  * Pestaña Gastos (sin botón de añadir ni botones de editar/borrar).
  * Pestaña Saldos (sin botón de saldar activo).
* **Acciones:**
  * `Consultar Gastos y Saldos`: Vista de auditoría.
* **Estados:** Lectura completa.
* **Permisos:** Read-Only Token.
* **Referencia:** `[DOCUMENTED]` (Kittysplit Super Kitty Read-Only Link).
