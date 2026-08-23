# Serrucho — Kittysplit Feature Implementation Prompt Pack

## Propósito

Este paquete convierte las funcionalidades públicas actuales de Kittysplit en una secuencia de prompts de implementación para Antigravity, adaptadas al contexto dominicano y al producto Serrucho.

**Fecha de investigación:** 22 de agosto de 2026.

## Cómo usarlo

Ejecutar los archivos **en orden numérico, uno por uno**. No saltar al siguiente hasta que Antigravity haya terminado, probado y dejado estable el anterior.

Cada prompt contiene:
- objetivo funcional;
- alcance;
- comportamiento esperado;
- reglas de negocio;
- adaptación a República Dominicana;
- criterios de aceptación;
- condición explícita de cierre antes de continuar.

## Regla crítica para Antigravity

No reconstruir arquitectura ni reemplazar infraestructura existente de Serrucho sin necesidad. Antes de modificar código:
1. inspeccionar el estado actual del repositorio;
2. identificar qué ya existe;
3. reutilizar componentes, servicios, modelos y patrones existentes;
4. implementar únicamente lo necesario para el milestone;
5. ejecutar pruebas y validaciones;
6. documentar lo realizado;
7. no marcar el milestone como completo si existe funcionalidad rota.

## Principio de progresión

Cada milestone debe dejar el proyecto en un estado ejecutable. Si una dependencia del milestone no existe, construir primero la mínima pieza necesaria dentro del mismo milestone. No crear placeholders que hagan parecer terminada una función.

## Adaptación dominicana

Cuando una funcionalidad original de Kittysplit dependa de hábitos europeos o genéricos, Serrucho debe priorizar:
- DOP como moneda local por defecto;
- RD$ en presentación cuando corresponda;
- WhatsApp como canal principal de compartir y recordatorios;
- pagos y transferencias comunes en RD, sin asumir que todos usan una misma plataforma;
- lenguaje natural dominicano, pero profesional;
- fechas y formatos locales;
- posibilidad de efectivo;
- contexto de colmado, supermercado, delivery, gasolina, restaurante, alquiler, servicios del hogar, viajes y actividades sociales.

**Importante:** Kittysplit no documenta actualmente recordatorios por SMS/WhatsApp como función principal. Los recordatorios por WhatsApp incluidos en este paquete son una **adaptación/product improvement para Serrucho**, no una afirmación de que Kittysplit tenga esa función.

## Fuentes públicas utilizadas

- Kittysplit Help: https://www.kittysplit.com/en/help
- Kittysplit Help en español: https://www.kittysplit.com/es/help
- Kittysplit Android: https://play.google.com/store/apps/details?id=com.kittysplit
- Kittysplit Expense Categories: https://blog.kittysplit.com/expense-categories/
- Kittysplit Expense Attachments: https://blog.kittysplit.com/expense-attachments/
- Kittysplit Mobile Apps: https://blog.kittysplit.com/building-kittysplit-apps-in-cmp/
- Kittysplit Super Kitties: https://blog.kittysplit.com/kittysplit-premium-features/
- Kittysplit Splitwise import: https://www.kittysplit.com/en/import/splitwise

## Funciones confirmadas

El paquete cubre las funciones públicas actuales documentadas, incluyendo:
- creación de grupos/eventos;
- participación sin registro;
- cuentas opcionales;
- enlace compartible;
- gastos;
- participantes por gasto;
- división equitativa;
- división por monto;
- división por shares/pesos;
- default shares;
- grupos/familias/parejas;
- transferencias entre participantes;
- ingresos/devoluciones;
- cálculo óptimo de deudas;
- marcar deuda como saldada;
- edición/eliminación;
- categorías y filtros;
- historial de cambios;
- estado de quién ya accedió;
- adjuntos de gastos;
- múltiples monedas y conversión;
- ajuste manual de tasa de cambio;
- enlace de solo lectura;
- exportación;
- cuentas/multi-dispositivo;
- eliminación de datos;
- experiencia web + Android + iOS;
- modelo Super Kitty/pago por grupo;
- importación desde Splitwise.

Además se incluye una capa específica para Serrucho:
- compartir y recordar por WhatsApp;
- métodos de pago relevantes para RD;
- comprobantes y confirmación de pago;
- controles de permisos;
- QA y gates de continuidad.

## Orden recomendado

01–05: fundamento y colaboración  
06–17: motor de gastos y deudas  
18–25: organización, historial y funciones avanzadas  
26–29: cuenta, privacidad, plataforma y monetización  
30–32: adaptación dominicana y endurecimiento final
