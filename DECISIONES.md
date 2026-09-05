# Registro de Decisiones de Arquitectura y Negocio — Serrucho 🇩🇴

Este documento registra formalmente las resoluciones a los 10 puntos pendientes planteados en la especificación original de la aplicación **Serruchos** (Gastos Colaborativos).

---

### 1. ¿Puede haber más de un Owner por serrucho?
- **Decisión adoptada:** **No.** En esta versión, cada serrucho cuenta con exactamente **un único Owner** (el creador del serrucho).
- **Razón:** Mantiene el modelo de permisos simple, predecible y sin conflictos de administración o cierre durante el ciclo de vida del grupo.

---

### 2. ¿Qué sucede si dos personas seleccionan el mismo participante al entrar por el enlace de invitación?
- **Decisión adoptada:** Una vez que un participante es reclamado e identificado por un usuario desde el enlace de invitación, su identidad queda **bloqueada** para posteriores visitantes.
- **Comportamiento en UI:** La pantalla interactiva *¿Quién eres?* (`/join/[token]`) muestra a los participantes ya reclamados con un estado deshabilitado y el mensaje explicativo: *"Este participante ya fue reclamado"*. Solo se permite seleccionar participantes en estado `INVITED`.

---

### 3. ¿El participante puede cambiar de identidad posteriormente si se equivocó al entrar?
- **Decisión adoptada:** No de forma autónoma por el participante. Si un usuario seleccionó la identidad equivocada, debe solicitar al Owner del serrucho que **reinicie su estado de acceso**.
- **Comportamiento:** El Owner dispone de una acción *"Reiniciar acceso"* en el panel de gestión de participantes que regresa el estado a `INVITED` y desvincula la sesión previa, permitiendo volver a seleccionarlo.

---

### 4. ¿Un gasto puede editarse o eliminarse tras ser registrado?
- **Decisión adoptada:** **Sí.** Solo tienen permisos para editar o eliminar un gasto:
  1. El participante que lo registró (pagador o creador del gasto).
  2. El Owner del serrucho.
- **Comportamiento:** Tras cualquier edición o eliminación, el motor financiero (`@serrucho/core`) recalcula automáticamente y en tiempo real el balance y las obligaciones netas entre todos los participantes.

---

### 5. ¿Qué pasa con los gastos de un participante eliminado?
- **Decisión adoptada:** Los gastos y divisiones históricas en las que participó el integrante eliminado **se conservan intactos en la base de datos y en los balances históricos**.
- **Comportamiento:** El participante queda marcado como inactivo (`is_active = false`) y ya no aparecerá como opción elegible para nuevos gastos ni transferencias futuras.

---

### 6. ¿Quién puede registrar gastos en el serrucho?
- **Decisión adoptada:** Tanto el **Owner** como **cualquier participante** que haya accedido al serrucho mediante el enlace e identificado su participación pueden registrar gastos, transferencias o adjuntar comprobantes.

---

### 7. ¿Quién puede marcar una deuda u obligación como pagada?
- **Decisión adoptada:** Tanto el **deudor** (quien debe el dinero) como el **acreedor** (quien debe recibir el dinero) pueden iniciar y registrar la acción de pago desde el Dashboard o la sección de *Menos Transferencias*.

---

### 8. ¿"Marcar como pagado" requiere aprobación de la otra parte?
- **Decisión adoptada:** **Sí, con diferenciación por rol:**
  - **Si lo registra el deudor:** La deuda pasa al estado *"Pago reportado (Pendiente de confirmación)"*, visible en el dashboard con un indicador de espera.
  - **Si lo registra o confirma el acreedor:** La deuda se salda de inmediato al 100% (el acreedor tiene la última palabra sobre la recepción de los fondos).

---

### 9. ¿Cómo se manejan múltiples monedas?
- **Decisión adoptada:**
  - La moneda principal del serrucho (por defecto **DOP / RD$**) rige el balance general consolidado.
  - Se permite registrar gastos en monedas extranjeras (**USD**, **EUR**) indicando el monto original y la tasa de cambio aplicada (obtenida automáticamente o ajustada manualmente).
  - Los gastos se reflejan tanto en su moneda original como en su equivalente en la moneda base del serrucho para mantener la coherencia financiera del grupo.

---

### 10. ¿Qué ocurre si se agrega un nuevo participante después de haberse registrado gastos previos?
- **Decisión adoptada:** El participante agregado solo participa en los **gastos futuros** (a partir del momento de su incorporación). Los gastos anteriores no se recalculan retroactivamente a menos que el usuario edite explícitamente un gasto previo para incluirlo.

---

*Documento aprobado y en conformidad con las reglas de negocio RN-001 a RN-014 del proyecto Serrucho.*
