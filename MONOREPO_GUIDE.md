# SERRUCHO — Manual de Operación Monorepo & Puesta en Producción 🪚📱🇩🇴

Este documento contiene la referencia oficial de la arquitectura limpia de **Serrucho**, los comandos listos para usar desde la raíz y los pasos necesarios para habilitar la persistencia en producción con Supabase ($0 costo).

---

## 🏗️ 1. Estructura Limpia del Monorepo

```
Serrucho/
├── apps/
│   ├── web/              ← Next.js 15 (App Router, Tailwind, Shadcn, PWA, Offline IDB)
│   └── mobile/           ← Expo SDK 52 (React Native, Bottom Tabs, Haptics, WhatsApp deep links)
│
├── packages/
│   ├── ui/               ← @serrucho/ui (Tokens de diseño, colores, categorías)
│   ├── core/             ← @serrucho/core (Motor financiero, tipos y validadores Zod)
│   ├── supabase/         ← @serrucho/supabase (Cliente compartido y tipos de BD)
│   └── config/           ← @serrucho/config (tsconfig y eslint base)
│
├── supabase/             ← Migraciones SQL y esquemas de Base de Datos
│   ├── migrations/       ← Scripts de creación de tablas y políticas RLS
│   └── seed.sql          ← Datos de prueba dominicanos (Las Terrenas)
│
├── .env.example          ← Plantilla de variables de entorno
├── turbo.json            ← Orquestador de builds Turborepo
└── package.json          ← Workspaces del Monorepo
```

---

## ⚡ 2. Comandos Listos para Usar desde la Raíz

Ejecuta todos estos comandos directamente desde la carpeta raíz `Serrucho`:

| Comando | Acción | Qué hace |
| :--- | :--- | :--- |
| **`npm run dev:web`** | 🌐 Iniciar Web | Abre Next.js en `http://localhost:3000` |
| **`npm run dev:mobile`** | 📱 Iniciar Mobile (Expo) | Genera el código QR para abrir en **Expo Go** en tu celular |
| **`npm run dev:mobile-web`** | 💻 Iniciar Mobile en Web | Abre la versión Expo en tu navegador (`http://localhost:8081`) |
| **`npm run build:web`** | 🚀 Build Web | Compila la aplicación Next.js optimizada para producción |
| **`npm run typecheck`** | 🔍 Typecheck Monorepo | Valida tipos TypeScript en todos los paquetes |
| **`npm test`** | 🧪 Tests Unitarios | Corre los 38 tests automatizados de finanzas y lógica |
| **`npm run lint`** | 🧹 ESLint | Valida calidad y estilo de código |

---

## 📋 3. Pasos que te tocan a ti para dejar la App 100% Funcional

Para conectar la base de datos real en la nube sin pagar ningún servicio externo ($0.00 USD):

### Paso 1: Crear tu Proyecto en Supabase (Gratuito)
1. Entra a [supabase.com](https://supabase.com) e inicia sesión (con tu GitHub o email).
2. Haz clic en **"New Project"**.
3. Asigna el nombre `Serrucho`, ingresa una contraseña segura para la base de datos y elige la región más cercana (ej. `us-east-1`).

### Paso 2: Ejecutar las Migraciones en Supabase
1. En el menú lateral de tu dashboard de Supabase, entra al **SQL Editor** (ícono de terminal `>_`).
2. Abre tu archivo local [`supabase/migrations/20260819000001_initial_schema.sql`](file:///c:/Users/braul/Downloads/Serrucho/supabase/migrations/20260819000001_initial_schema.sql).
3. Copia todo su contenido, pégalo en el SQL Editor de Supabase y pulsa **"Run"**.
4. Repite el mismo paso con [`supabase/migrations/20260820000001_v2_features.sql`](file:///c:/Users/braul/Downloads/Serrucho/supabase/migrations/20260820000001_v2_features.sql).
5. *(Opcional)* Para cargar datos de prueba dominicanos (Villa Las Terrenas), ejecuta también [`supabase/seed.sql`](file:///c:/Users/braul/Downloads/Serrucho/supabase/seed.sql).

### Paso 3: Configurar tus Variables de Entorno
Crea un archivo `.env.local` en la raíz (y en `apps/web/.env.local`) con tus credenciales de Supabase (las encuentras en **Project Settings ➔ API**):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-secreta

# Opcional (Servicio de correos gratuito 3,000 emails/mes)
RESEND_API_KEY=re_123456789
EMAIL_FROM=onboarding@resend.dev

# URL de la App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Paso 4: Abrir la App en tu Celular
1. Descarga la app gratuita **Expo Go** en tu celular (iOS App Store o Google Play Store).
2. En tu terminal ejecuta:
   ```bash
   npm run dev:mobile
   ```
3. En **iPhone**: Abre la cámara nativa y apunta al código QR que aparece en tu terminal.
4. En **Android**: Abre la app **Expo Go** y pulsa "Scan QR Code".
5. ¡La app móvil nativa se abrirá inmediatamente con soporte háptico, navegación por pestañas y deep links a WhatsApp!
