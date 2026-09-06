# 🪚 SERRUCHO — Kittysplit Unknown Questions & Human Clarifications

Este documento recopila de manera formal todas las dudas de comportamiento, decisiones de producto y puntos de divergencia potencial entre el modelo estricto de Kittysplit y la adaptación a República Dominicana.

---

### QUESTION 01: Pasarela de Pago para Super Serrucho en RD
* **Área:** Monetización / Super Kitty (Super Serrucho)
* **What We Know:** Kittysplit cobra un pago único por Kitty vía Stripe para desbloquear fotos de facturas, multimoneda y más de 10 participantes.
* **What We Don't Know:** Si en República Dominicana se implementará una pasarela formal (ej. Azul, CardNET, PayPal) o si por el momento el Super Serrucho se mantendrá en modo $0 / habilitado para pruebas o simulación.
* **Why It Matters:** Define si se requiere integración de SDKs de cobro bancario o si se mantiene el principio de $0 costo operativo en esta fase.
* **How To Test:** Verificación de flujo de checkout vs bypass de activación.
* **Question for User:** ¿Deseas integrar una pasarela de pago real para Super Serrucho en RD más adelante, o mantenemos el desbloqueo simulado a costo $0 por ahora?

---

### QUESTION 02: Manejo de División Plato por Plato (Itemized Split)
* **Área:** Gastos / División
* **What We Know:** Kittysplit maneja 3 métodos canónicos (Equitativo, Montos Exactos y Cuotas/Shares). En Serrucho existía una pantalla experimental de "Plato por plato" con cálculo de propina legal e ITBIS.
* **What We Don't Know:** Si prefieres mantener la división por plato como un sub-método dentro del formulario de gastos de Serrucho o si debemos ceñirnos estrictamente a los métodos canónicos de Kittysplit.
* **Why It Matters:** Impacta la complejidad del formulario de gastos en móvil y web.
* **How To Test:** Comparación de usabilidad entre el selector de 4 métodos vs desglose línea por línea.
* **Question for User:** ¿Mantenemos la división simplificada por montos exactos y cuotas (estilo Kittysplit) o deseas una opción avanzada de desglose de cuenta de restaurante con ITBIS?

---

### QUESTION 03: Identificación del Participante en Dispositivo Móvil
* **Área:** UX / Guest Mode
* **What We Know:** En Kittysplit web hay un selector "¿Quién eres tú?" para resaltar tu saldo personal con respecto al grupo.
* **What We Don't Know:** Si en la app móvil prefieres que al crear el Serrucho el creador quede automáticamente seleccionado como el usuario activo de ese teléfono.
* **Why It Matters:** Evita tener que preguntar quién es el usuario cada vez que abre la app en su teléfono propio.
* **How To Test:** Apertura de la app tras crear un grupo y verificar qué balance se resalta en el dashboard.
* **Question for User:** ¿Confirmas que en móvil el dispositivo recuerde automáticamente al creador/participante identificado para mostrar sus balances personalizados de inmediato?
