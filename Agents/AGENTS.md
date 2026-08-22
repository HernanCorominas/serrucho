# SERRUCHO — AGENTS.md

Lee primero `00-MASTER-ORCHESTRATOR.md`.

Agentes:
- `01-PRODUCT-ARCHITECT.md`
- `02-BACKEND-DATABASE.md`
- `03-FRONTEND-UIUX.md`
- `04-NOTIFICATIONS.md`
- `05-QA.md`
- `06-GIT-RELEASE.md`
- `07-VERCEL-DEPLOY.md`
- `10-CONTINUOUS-INNOVATION-AGENT.md` (Innovación constante, costo $0 y arquitectura mobile-ready)

Orden recomendado para ciclo de mejoras:
1. Continuous Innovation (`10-CONTINUOUS-INNOVATION-AGENT.md`): Detección y plan de acción costo cero.
2. Product/Architecture (`01-PRODUCT-ARCHITECT.md`): Definición de tipos y esquemas de dominio.
3. Backend/DB (`02-BACKEND-DATABASE.md`): Lógica de persistencia, stores y endpoints.
4. UI/UX + Frontend (`03-FRONTEND-UIUX.md`): Componentes React, interacciones táctiles y responsive.
5. Notifications (`04-NOTIFICATIONS.md`): WhatsApp deep links y emails Resend.
6. QA (`05-QA.md`): Tests unitarios, Playwright E2E y verificaciones.
7. Git/Release (`06-GIT-RELEASE.md`): Commits limpios.
8. Vercel (`07-VERCEL-DEPLOY.md`): Despliegue en la nube.

Regla de oro: No declares DONE si no pasa lint, typecheck, tests y build.
