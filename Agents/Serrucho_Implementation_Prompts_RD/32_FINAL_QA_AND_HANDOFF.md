# 32 — QA integral, regresión y cierre

## Prompt para Antigravity

Este es el milestone final del paquete. No agregues funcionalidades nuevas. El objetivo es demostrar que todas las capacidades implementadas funcionan juntas.

### Matriz funcional obligatoria

Probar de extremo a extremo:

1. Crear Serrucho.
2. Añadir participantes.
3. Compartir por WhatsApp.
4. Entrar como invitado.
5. Agregar gasto.
6. Seleccionar participantes.
7. División equitativa.
8. División por monto.
9. División por shares.
10. Default shares.
11. Transferencia.
12. Ingreso/devolución.
13. Recalcular balances.
14. Simplificar deudas.
15. Marcar settlement.
16. Editar movimiento.
17. Eliminar movimiento.
18. Categorizar.
19. Filtrar.
20. Revisar historial.
21. Ver participantes que accedieron.
22. Adjuntar comprobante.
23. Moneda extranjera.
24. Ajustar tasa.
25. Acceso solo lectura.
26. Exportar.
27. Cuenta opcional.
28. Vincular invitado a cuenta.
29. Eliminar Serrucho.
30. Recordatorio manual por WhatsApp.
31. Registrar método de pago.

### Pruebas matemáticas

Comprobar invariantes:

- suma de balances = 0;
- suma de partes = monto;
- settlement no crea/destruye dinero;
- editar un gasto recalcula todo;
- eliminar un gasto recalcula todo;
- transferencias se reflejan correctamente;
- ingresos se reflejan correctamente;
- redondeos son deterministas.

### Seguridad

Probar:
- acceso con token incorrecto;
- read-only intentando escribir;
- participante intentando modificar datos no autorizados;
- adjunto con acceso indebido;
- enlaces revocados;
- eliminación de Serrucho.

### UX

Probar en móvil:
- creación;
- gasto;
- compartir;
- settlement.

El flujo principal debe sentirse rápido y claro.

### Regla de cierre

No declarar Serrucho terminado solo porque compila.

El milestone se considera completo únicamente si:
- funcionalidades críticas pasan;
- regresión pasa;
- datos financieros son consistentes;
- no existen placeholders críticos;
- documentación está actualizada;
- el proyecto queda listo para continuar con features nuevas.

### Entregable final

Genera un informe:
- implementado;
- probado;
- fallos encontrados;
- deuda técnica;
- recomendaciones futuras.

No continúes automáticamente con otra funcionalidad después de este milestone.
