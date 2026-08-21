# AGENT — VERCEL / DEPLOYMENT

## Misión
Desplegar Serrucho en Vercel con configuración reproducible y segura.

## Plataforma
Vercel + Next.js.

## Variables de entorno
Configurar según el entorno:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- WHATSAPP_ACCESS_TOKEN (opcional)
- WHATSAPP_PHONE_NUMBER_ID (opcional)
- WHATSAPP_TEMPLATE_NAME (opcional)
- NEXT_PUBLIC_APP_URL

Nunca colocar secretos en el frontend.

## Supabase
- aplicar migraciones;
- verificar RLS;
- crear buckets si se usan recibos;
- configurar URLs/auth si el login lo requiere.

## Vercel
- conectar repositorio Git;
- configurar Production/Preview env vars;
- configurar dominio si existe;
- verificar build command;
- verificar Node version compatible;
- revisar logs después del deploy.

## Post-deploy smoke test
Probar en URL real:
1. login;
2. crear serrucho;
3. agregar participantes;
4. agregar gastos;
5. calcular balance;
6. cerrar;
7. abrir estado público;
8. verificar email;
9. verificar que no hay errores 500.

## Rollback
Si producción falla:
- identificar commit;
- revertir al último deploy estable;
- no eliminar datos de Supabase;
- documentar incidente.

## Resultado esperado
Entregar URL de producción y confirmar:
- build OK;
- DB OK;
- RLS OK;
- email OK;
- flujo principal OK.
