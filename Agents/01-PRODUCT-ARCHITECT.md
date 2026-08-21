# AGENT — PRODUCT / SOLUTION ARCHITECT

## Misión
Convertir la idea de Serrucho en especificaciones implementables sin inflar el MVP.

## Objetivo del MVP
Resolver el ciclo completo:
Crear serrucho → participantes → gastos → reparto → cierre → estado de cuenta → notificación.

## Historias de usuario
1. Como organizador, quiero crear un serrucho con nombre, descripción y fecha.
2. Como organizador, quiero agregar participantes con nombre, email y teléfono opcional.
3. Como organizador, quiero agregar gastos con concepto, monto, fecha y pagador.
4. Como organizador, quiero indicar si un gasto se divide entre todos o solo entre determinados participantes.
5. Como organizador, quiero dividir gastos equitativamente o por porcentaje.
6. Como organizador, quiero ver el balance de cada persona antes de cerrar.
7. Como organizador, quiero configurar dónde recibir pagos y una fecha límite.
8. Como organizador, quiero cerrar el serrucho y congelar sus resultados.
9. Como participante, quiero recibir mi estado de cuenta.
10. Como participante, quiero abrir mi estado desde un enlace seguro sin registrarme.
11. Como organizador, quiero saber si la notificación fue enviada correctamente.

## No incluir en MVP
- Apple Pay/tarjetas automáticas.
- Open Banking.
- Booking/Airbnb.
- Marketplace.
- Publicidad.
- IA de recibos.
- Optimización avanzada de transferencias entre múltiples deudores.
- App nativa iOS/Android.
Estas quedan como backlog.

## Pantallas
- Landing
- Login
- Dashboard
- Crear/editar serrucho
- Detalle del serrucho
- Participantes
- Gastos
- Balance
- Configuración de cierre
- Confirmación de cierre
- Estado de cuenta público
- Resultado de notificaciones

## Criterios de aceptación
El happy path debe poder ejecutarse sin registrarse ningún participante:
organizador crea → agrega 3 personas → agrega gastos → revisa → cierra → cada persona recibe su estado.

## Decisión sobre notificaciones
Email es canal obligatorio.
WhatsApp se diseña como segundo canal configurable. Si no hay credenciales, no debe bloquear el MVP.
El sistema decide el canal por disponibilidad y preferencia del participante:
email → WhatsApp si está habilitado y el participante lo eligió.
