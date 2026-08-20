# 🪚 Serrucho — Reparto Inteligente de Gastos Grupales 🇩🇴

**Serrucho** es una aplicación web mobile-first creada para organizar y dividir gastos grupales en República Dominicana de manera transparente, equitativa y sin enredos.

---

## 🚀 Características del MVP

- **Crear Serrucho**: Nombre, fecha y notas del coro, viaje, cena o evento.
- **Participantes**: Registro de integrantes con nombre, correo y WhatsApp con selector de canal preferido.
- **Gastos Flexibles**:
  - Reparto **Equitativo (Parejo)** con resolución determinista de centavos sobrantes.
  - Reparto **Por Porcentaje (%)** con control en puntos básicos (10,000 bps = 100.00%).
  - Reparto a **Participantes Específicos** (ej. solo quienes consumieron alcohol o gasolina).
- **Balances en Tiempo Real**: Visualización inmediata de quién pagó, cuánto le corresponde y balance neto (`Pagó - Corresponde`).
- **Cierre Irreversible Lógico**: Congela las cuentas, genera registros inmutables y protege los datos contra modificaciones posteriores.
- **Estados de Cuenta Individuales**: Comprobante imprimible y responsive para cada participante.
- **Enlaces Públicos Seguros**: Acceso directo mediante tokens aleatorios de alta entropía (almacenando únicamente su hash SHA-256 en la base de datos).
- **Notificaciones Automáticas**:
  - **Email** mediante [Resend](https://resend.com) con plantillas HTML responsivas dominicanas.
  - **WhatsApp** mediante Meta WhatsApp Cloud API (adaptador desacoplado opcional con fallback automático a Email).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Full-Stack** | Next.js 15 (App Router) |
| **Lenguaje** | TypeScript Strict |
| **Estilos & UI** | Tailwind CSS + Lucide Icons |
| **Base de Datos & Auth** | Supabase (PostgreSQL + RLS) |
| **Validaciones** | Zod |
| **Notificaciones** | Resend (Email) + WhatsApp Cloud API |
| **Testing** | Vitest (Unit) + Playwright (E2E) |
| **Deployment** | Vercel |

---

## ⚙️ Instalación y Configuración Local

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repositorio>
cd Serrucho
npm install
```

### 2. Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Configura tus credenciales de Supabase y Resend (o deja los valores por defecto para correr en modo local/demo).

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🧪 Quality Gates & Tests

Ejecuta las validaciones de calidad antes de cualquier entrega:

```bash
# 1. Validación de ESLint
npm run lint

# 2. Comprobación estricta de tipos TypeScript
npm run typecheck

# 3. Pruebas unitarias de matemática financiera, Zod y notificaciones
npm test

# 4. Pruebas End-to-End (E2E) con Playwright
npm run test:e2e

# 5. Build de producción
npm run build
```

---

## 🔒 Arquitectura de Seguridad y Finanzas

1. **Cálculos en Centavos Enteros**: Todos los montos se procesan internamente en centavos (`RD$ 1.00 = 100 cents`) evitando errores de punto flotante de JavaScript.
2. **Tokens de Acceso Público**: Los enlaces públicos de los estados de cuenta usan tokens criptográficos de 256 bits generados con `crypto.randomBytes(32)`. Solo el hash SHA-256 es persistido en base de datos.
3. **Row Level Security (RLS)**: Las políticas de PostgreSQL aíslan completamente los serruchos entre propietarios y permiten lectura segura por hash para comprobantes públicos.
