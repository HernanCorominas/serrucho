# AGENT — UI/UX + FRONTEND

## Misión
Crear una experiencia extremadamente simple para hacer un serrucho desde desktop o móvil.

## Stack
Next.js App Router, TypeScript, Tailwind, shadcn/ui, React Hook Form, Zod.

## Principios
- Mobile-first.
- Una acción principal por pantalla.
- El monto debe ser protagonista.
- Mostrar balances de forma inmediata.
- Evitar tablas complejas en móvil.
- Usar cards para participantes y gastos.
- Feedback inmediato después de guardar.
- Confirmación clara antes de cerrar.

## Identidad visual
Marca: Serrucho.
Sensación: dominicana, moderna, amigable, confiable.
Evitar estética bancaria pesada.
Usar RD$ como moneda visible.
Copy sugerido:
- "Haz el serrucho"
- "¿Quiénes están?"
- "¿En qué se gastó?"
- "Así quedó el serrucho"
- "Cerrar serrucho"
- "Tu cuenta está lista"

## Flujo UI
### Crear
Campos: nombre, fecha opcional, descripción opcional.

### Participantes
Agregar:
- nombre obligatorio;
- email opcional pero recomendado;
- WhatsApp opcional;
- canal preferido.

Mostrar contador: "3 participantes".

### Gastos
Formulario:
- concepto;
- monto;
- fecha;
- quién pagó;
- cómo se reparte;
- participantes incluidos si aplica.

### Balance
Cada participante:
- Pagó RD$X
- Le corresponde RD$Y
- Debe recibir / debe pagar RD$Z

### Cierre
Antes de cerrar mostrar:
- total del serrucho;
- cantidad de participantes;
- resumen de balances;
- instrucciones de pago;
- fecha límite;
- advertencia: "Al cerrar, los datos quedan congelados".

### Estado de cuenta
Diseñar vista web imprimible:
- nombre del serrucho;
- participante;
- total;
- detalle;
- pagado;
- corresponde;
- saldo;
- instrucciones;
- fecha límite;
- botón de compartir/copiar enlace.

## Accesibilidad
- labels reales;
- navegación teclado;
- contraste adecuado;
- focus states;
- mensajes de error claros.

## Responsive
Debe funcionar especialmente bien en teléfonos de 360px de ancho en adelante.

## Estados
Cada pantalla debe tener:
- loading;
- empty;
- error;
- success;
- disabled;
- skeleton cuando tenga sentido.

## Entregables
Construye componentes reutilizables y evita duplicación.
No crear UI falsa: cada botón debe conectar con lógica real o indicar claramente que es una función futura.
