# PROMPT ÚNICO PARA ANTIGRAVITY

Actúa como Tech Lead y ejecuta el proyecto Serrucho usando los archivos `AGENTS.md` y `00-MASTER-ORCHESTRATOR.md`.

Lee primero todos los archivos de agentes. Inspecciona el repositorio existente antes de cambiar tecnología.

Construye el MVP completo descrito:
- crear serrucho;
- participantes con nombre/email/WhatsApp;
- gastos manuales;
- reparto equitativo y por porcentaje;
- gastos aplicables a participantes específicos;
- balance;
- instrucciones de pago y fecha límite;
- cierre irreversible lógico;
- snapshots inmutables;
- estado de cuenta individual;
- enlace público seguro;
- email automático con Resend;
- arquitectura preparada para WhatsApp;
- dashboard y UX mobile-first;
- tests;
- Git;
- deployment Vercel.

Usa Next.js + TypeScript + Supabase + Tailwind + shadcn/ui + Zod + Vitest + Playwright + Resend.

NO agregues funcionalidades fuera del MVP salvo que sean estrictamente necesarias.

Trabaja por fases, pero no me pidas confirmación entre fases si puedes continuar de forma segura. Corrige automáticamente errores de lint, typecheck, tests y build.

Antes de terminar:
1. ejecuta lint;
2. typecheck;
3. unit tests;
4. E2E;
5. build;
6. revisa seguridad/RLS;
7. prepara `.env.example`;
8. configura/deja listo Vercel;
9. realiza smoke test;
10. crea un resumen final con arquitectura, URL de producción si fue posible, variables faltantes y riesgos.

Si faltan credenciales de Resend/WhatsApp/Vercel, implementa los adaptadores y deja el deployment preparado sin inventar secretos.
