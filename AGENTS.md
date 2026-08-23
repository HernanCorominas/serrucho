# SERRUCHO — AGENTS.md

Lee primero `Agents/00-MASTER-ORCHESTRATOR.md`.

Agentes:
- `Agents/01-PRODUCT-ARCHITECT.md`
- `Agents/02-BACKEND-DATABASE.md`
- `Agents/03-FRONTEND-UIUX.md`
- `Agents/04-NOTIFICATIONS.md`
- `Agents/05-QA.md`
- `Agents/06-GIT-RELEASE.md`
- `Agents/07-VERCEL-DEPLOY.md`
- `Agents/10-CONTINUOUS-INNOVATION-AGENT.md` (Innovación constante, costo $0 y arquitectura mobile-ready)

Orden recomendado para ciclo de mejoras:
1. Continuous Innovation (`Agents/10-CONTINUOUS-INNOVATION-AGENT.md`): Detección y plan de acción costo cero.
2. Product/Architecture (`Agents/01-PRODUCT-ARCHITECT.md`): Definición de tipos y esquemas de dominio.
3. Backend/DB (`Agents/02-BACKEND-DATABASE.md`): Lógica de persistencia, stores y endpoints.
4. UI/UX + Frontend (`Agents/03-FRONTEND-UIUX.md`): Componentes React, interacciones táctiles y responsive.
5. Notifications (`Agents/04-NOTIFICATIONS.md`): WhatsApp deep links y emails Resend.
6. QA (`Agents/05-QA.md`): Tests unitarios, Playwright E2E y verificaciones.
7. Git/Release (`Agents/06-GIT-RELEASE.md`): Commits limpios.
8. Vercel (`Agents/07-VERCEL-DEPLOY.md`): Despliegue en la nube.

Regla de oro: No declares DONE si no pasa lint, typecheck, tests y build.

## Regla de Ejecución de Prompts (Serrucho_Implementation_Prompts_RD)
- Ejecutar los archivos en orden numérico estricto, uno por uno (01, 02, 03...).
- **NUNCA** pasar al siguiente archivo/prompt sin antes preguntar y recibir la confirmación explícita del usuario.
- No saltar al siguiente hasta que el actual esté 100% implementado, probado y estable.
- Reutilizar lo existente y respetar la adaptación a República Dominicana (DOP/RD$, WhatsApp, $0 costo).

