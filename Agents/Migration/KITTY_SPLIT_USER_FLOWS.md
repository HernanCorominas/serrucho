# 🪚 SERRUCHO — Kittysplit User Flows

Especificación de los 28 flujos de usuario canónicos de Kittysplit adaptados a Serrucho.

---

### FLOW 01: Crear Serrucho (Create Kitty)
1. El usuario accede a la Home (`/` o app móvil).
2. Ingresa el nombre del Serrucho (ej. "Fin de Semana en Las Terrenas 🌴").
3. Ingresa su nombre / apodo y opcionalmente los nombres de los amigos separados por coma.
4. Selecciona la moneda (predeterminada `DOP / RD$`).
5. Presiona `Crear Serrucho ➔`.
6. El sistema genera un ID/slug único, inicializa los participantes, persiste localmente y en Supabase, y redirige instantáneamente al dashboard (`/k/[id]`).

---

### FLOW 02: Unirse a un Serrucho (Join Kitty)
1. Un amigo recibe el enlace por WhatsApp (ej. `https://serrucho.do/k/las-terrenas-2025`).
2. Toca el enlace y entra directamente al grupo sin necesidad de registrarse ni crear contraseña (Guest Mode).
3. El grupo se guarda automáticamente en su lista de Serruchos recientes del dispositivo (`localStorage` / `AsyncStorage`).

---

### FLOW 03: Identificar Participante ("¿Quién eres tú?")
1. Al entrar a un Serrucho, el usuario puede seleccionar su nombre en la lista de participantes.
2. El sistema resalta su balance personal en la parte superior:
   * Si es acreedor: `Te deben: +RD$ 2,500.00` (verde).
   * Si es deudor: `Debes: -RD$ 1,200.00` (rojo).
   * Si está al día: `Estás al día: RD$ 0.00` (gris).

---

### FLOW 04: Añadir Gasto (Add Expense)
1. En la pestaña `Gastos`, el usuario presiona `+ Añadir Gasto`.
2. Escribe el concepto (ej. "Cena en el restaurante") y el monto (ej. `RD$ 3,600.00`).
3. Selecciona quién pagó (por defecto la persona seleccionada o el organizador).
4. Elige el método de reparto (`EQUAL`, `SHARES`, `EXACT`, `PERCENTAGE`).
5. Selecciona la categoría (ej. 🍽️ Restaurante).
6. Presiona `Guardar Gasto`.
7. El sistema registra el consumo, actualiza los balances netos y recalcula la simplificación de deudas.

---

### FLOW 05: División Equitativa (Split Equally)
1. En el modal de gasto, el usuario selecciona el método `Igual =`.
2. Marca o desmarca participantes según quiénes consumieron.
3. El sistema divide el monto en partes iguales usando matemática de centavos enteros con distribución de residuo sin pérdida de precisión.

---

### FLOW 06: División por Monto Exacto (Split by Amount)
1. El usuario selecciona el método `RD$ Exacto`.
2. Ingresa la cantidad específica en pesos que le corresponde pagar a cada persona.
3. El sistema valida en tiempo real que la suma de los montos individuales coincida exactamente con el total del gasto.

---

### FLOW 07: División por Cuotas / Partes (Split by Shares)
1. El usuario selecciona el método `Cuotas ⚖️`.
2. Asigna el número de partes a cada participante (ej. Pareja = 2 cuotas, Soltero = 1 cuota, Niño = 0.5 cuotas).
3. El sistema pondera el reparto proporcionalmente a las cuotas asignadas.

---

### FLOW 08: Registrar Transferencia / Pago Directo (Add Transfer)
1. Un participante le paga directamente a otro para abonar a su deuda.
2. Presiona `Registrar Pago / Transferencia`.
3. Selecciona quién pagó, quién recibió y el monto transferido.
4. El sistema registra la transacción reduciendo la deuda pendiente entre ambos.

---

### FLOW 09: Registrar Reembolso o Ingreso (Add Income)
1. El grupo recibe una devolución de dinero (ej. reembolso de fianza de la villa o descuento devuelto).
2. Se registra como `Ingreso / Reembolso` a favor de los integrantes participantes.
3. El sistema abona el monto a los saldos del grupo.

---

### FLOW 10: Editar Gasto (Edit Expense)
1. El usuario toca un gasto existente en la lista.
2. Modifica el concepto, monto, pagador o participantes incluidos.
3. Presiona `Guardar Cambios`.
4. El sistema recalcula la contabilidad histórica y actualiza los saldos.

---

### FLOW 11: Eliminar Gasto (Delete Expense)
1. El usuario toca un gasto y presiona `Eliminar Gasto` (botón rojo).
2. Aparece un cuadro de confirmación: "¿Deseas eliminar este gasto?".
3. Al confirmar, el gasto se borra y los balances de todos los involucrados se restablecen.

---

### FLOW 12: Gestionar Participantes (Manage Participants)
1. En la pestaña `Ajustes`, el usuario presiona `+ Agregar Amigo`.
2. Escribe el nombre y opcionalmente el teléfono de WhatsApp.
3. Para renombrar a alguien, presiona el icono de lápiz `✏️`.
4. Para eliminar a un participante, presiona el icono de papelera `🗑️` (solo permitido si no tiene transacciones registradas).

---

### FLOW 13: Liquidar Deudas (Settle Debts)
1. El usuario va a la pestaña `Saldos ⚖️`.
2. Revisa la sección **"Menos Transferencias Posibles"** que indica exactamente quién debe pagarle a quién para quedar en cero con el menor número de transferencias.

---

### FLOW 14: Marcar como Saldado en 1 Clic (Mark Settled)
1. Al lado de cada transferencia sugerida, presiona el botón `Saldar ✓`.
2. Se abre un diálogo de confirmación: "¿Confirmar que Carlos le pagó RD$ 1,500.00 a Braulio?".
3. Al presionar confirmar, se genera automáticamente una transferencia que extingue esa deuda en la contabilidad del grupo.

---

### FLOW 15: Compartir Serrucho (Share Kitty)
1. El usuario presiona `Compartir por WhatsApp 🇩🇴` o el botón de copiar enlace.
2. Se genera el enlace único y un mensaje cordial pre-redactado adaptado al tono dominicano.
3. Se abre WhatsApp directamente para seleccionar el grupo o contacto del coro.

---

### FLOW 16: Acceso de Solo Lectura (Read-Only Access)
1. El organizador genera un enlace de solo lectura desde Ajustes.
2. Los receptores acceden a la vista de auditoría (`/r/[token]`): pueden ver todos los gastos y saldos pero los botones de edición y creación están bloqueados.

---

### FLOW 17: Iniciar Sesión / Registro Opcional (Login / Auth)
1. El usuario que desee centralizar sus grupos puede presionar "Acceder".
2. Ingresa su correo electrónico o utiliza Google OAuth.
3. No requiere contraseñas.

---

### FLOW 18: Enlace Mágico (Magic Link)
1. El usuario ingresa su correo en la pantalla de acceso.
2. Recibe un correo con un botón de acceso seguro de un solo clic.
3. Al tocarlo, queda autenticado y visualiza todos los Serruchos asociados a ese correo.

---

### FLOW 19: Cerrar Sesión (Logout)
1. En Ajustes de cuenta, presiona `Cerrar Sesión`.
2. Se limpia la sesión en el navegador/app manteniendo intactos los datos almacenados localmente.

---

### FLOW 20: Ver Cuenta y Lista de Grupos (View Account)
1. El usuario autenticado ve el listado completo de todos sus Serruchos históricos (abiertos y cerrados) con su balance total acumulado.

---

### FLOW 21: Actualizar a Super Serrucho (Upgrade Kitty)
1. Si un grupo supera los 10 participantes o requiere multimoneda y fotos de recibos, se presenta el botón `Super Serrucho 🪚⭐`.
2. Muestra los beneficios del plan único por grupo.
3. Desbloquea las funciones prémium para todos los integrantes del grupo.

---

### FLOW 22: Múltiples Monedas (Multiple Currency)
1. En un grupo con Super Serrucho, se pueden registrar gastos en diferentes divisas (DOP, USD, EUR).
2. Se aplica la tasa de cambio para consolidar los saldos en la moneda base del Serrucho.

---

### FLOW 23: Adjuntar Foto de Factura / Recibo (Receipt Attachments)
1. Al crear un gasto, el usuario puede tomar una foto con la cámara o seleccionarla de la galería.
2. La imagen se almacena en el bucket de recibos y queda visible en el detalle del gasto.

---

### FLOW 24: Filtrar por Categorías (Categories Filter)
1. En la lista de gastos, el usuario puede filtrar por categoría (🛒 Supermercado, 🍽️ Comida, 🚗 Gasolina, 🍺 Bebidas, 🏨 Hospedaje).
2. La lista y el subtotal se filtran al instante.

---

### FLOW 25: Búsqueda de Gastos (Search & Filter)
1. El usuario escribe en la barra de búsqueda (ej. "Uber", "Cervezas", "Peaje").
2. Se filtran los gastos en tiempo real por coincidencia en la descripción o nombre del pagador.

---

### FLOW 26: Exportar a Excel y CSV (Export)
1. En Ajustes, el usuario presiona `Descargar Excel (XLSX)` o `Descargar CSV`.
2. Se descarga una hoja de cálculo estructurada con tres tablas:
   * Resumen general del Serrucho.
   * Lista detallada de gastos con desglose.
   * Matriz de saldos y transferencias de liquidación.

---

### FLOW 27: Eliminar Serrucho (Delete Kitty)
1. En la pestaña Ajustes, el organizador presiona `Eliminar Serrucho definitivamente`.
2. Aparece un modal de advertencia crítica para confirmar la acción.
3. Al confirmar, el grupo y sus transacciones se eliminan de forma irreversible.

---

### FLOW 28: Eliminar Cuenta y Datos Locales (Delete Account / Data)
1. En los ajustes globales, el usuario puede presionar `Borrar historial local y cuenta`.
2. Se purgan las claves en `localStorage` / `AsyncStorage` y la sesión de Supabase.
