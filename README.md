# 🪚 Serrucho — Reparto Inteligente de Gastos Grupales 🇩🇴

**Serrucho** es una aplicación colaborativa full-stack (Web + Mobile) creada para organizar y dividir gastos grupales en República Dominicana de manera rápida, equitativa y sin enredos (DOP/RD$, WhatsApp, $0 costo).

---

## 🚀 Características y Módulos Principales (19 Pantallas)

1. **Landing / Pantalla de Bienvenida**: Acceso a creación, calculadora rápida dominicana (ITBIS 18% + 10% Ley) y campo para ingresar o pegar enlaces de invitación.
2. **Wizard de Creación (4 Pasos)**:
   - *Paso 1:* Nombre del evento + Moneda principal (DOP / USD / EUR).
   - *Paso 2:* Datos del organizador / Owner (Nombre + Email).
   - *Paso 3:* Gestión inicial de integrantes (mínimo 1 adicional al Owner, RN-003).
   - *Paso 4:* Resumen y confirmación registrando al creador como Owner (RN-001).
3. **Dashboard Principal del Owner & Participante**: Resumen financiero personal y grupal, sección destacada *"Menos Transferencias"*, historial de movimientos y botón flotante rápido de gastos.
4. **Pantalla interactiva "¿Quién eres?" (`/join/:token`)**: Identificación mediante enlace único sin registro obligatorio (RF-005). Los participantes ya reclamados quedan bloqueados (Decisión #2).
5. **Gestión de Participantes**: Agregar por nombre (RN-014), eliminar integrantes (RN-002: el Owner no puede eliminarse), ver estado de acceso (✓ accedió / ✗ no ha accedido) y botón de *Reiniciar acceso* (Decisión #3).
6. **Enlace Único de Invitación**: Generación y copia de link con un solo toque y mensaje cordial preformateado para WhatsApp en RD$.
7. **Registro de Gastos Flexible**:
   - Sub-vista **Equitativa (Parejo)** con resolución determinista de centavos sobrantes (RN-006).
   - Sub-vista **Por Porcentaje (%)** con validador estricto del 100% (RN-009).
   - Sub-vista **Por Proporción / Cuotas (Shares)** para parejas, familias o niños (RN-008).
   - Selector de moneda (DOP, USD, EUR con tasa de cambio) y adjuntos de recibos.
8. **Motor de Deudas Simplificadas ("Menos Transferencias")**: Algoritmo voraz que reduce deudas cruzadas al mínimo número de transferencias necesarias (RN-010).
9. **Marcar Deuda como Pagada & Liquidación**: Soporte para reporte de pago por el deudor (pendiente de confirmación) y liquidación directa por el acreedor (Decisiones #7 y #8).
10. **Configuración del Serrucho**: Nombre, avatar/ícono y detalles generales (RF-006).
11. **Visor de Detalle de Gasto Individual**: Desglose exacto, comprobante y división por integrante.
12. **Manejo de Estados Vacíos y Errores**: Diseños amigables para grupos nuevos o enlaces inválidos.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Monorepo** | Turborepo + npm workspaces |
| **Frontend Web** | Next.js 15 (App Router), React 19, Tailwind CSS, Lucide Icons |
| **Frontend Mobile** | Expo SDK 54, React Native, Expo Router v5 |
| **Motor Financiero** | `@serrucho/core` (TypeScript puro en centavos enteros) |
| **Persistencia Dual** | Supabase (PostgreSQL + RLS) / In-Memory & IndexedDB |
| **Validaciones** | Zod (Esquemas compartidos) |
| **Testing** | Vitest (Unit) + Playwright (E2E) |
| **Deployment** | Vercel (Web) + EAS (Mobile) |

---

## ⚙️ Instalación y Ejecución Local

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

*(El sistema cuenta con un repositorio dual y funciona al 100% de forma local sin necesidad obligatoria de credenciales externas).*

### 3. Iniciar el Servidor Web

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Seed de Datos "Viaje Punta Cana"

Para cargar el escenario de prueba con **Hernan** (Owner), **Braulin** (Participante) y un gasto de **RD$ 500 al 25%/75%**:

- **Vía API / Navegador:** Abre [http://localhost:3000/api/seed](http://localhost:3000/api/seed)
- **Vía Terminal:**
```bash
npx tsx scripts/seed-punta-cana.ts
```

---

## 🧪 Pruebas y Validación de Calidad

```bash
# 1. Comprobación estricta de tipos TypeScript
npm run typecheck

# 2. Pruebas unitarias de matemática, división, deudas y seed
npm test

# 3. Build de producción
npm run build
```

---

## 📚 Documentación Adicional

- [DECISIONES.md](file:///c:/Users/braul/Downloads/Serrucho/DECISIONES.md): Resolución detallada de los 10 puntos pendientes de especificación.
- [API_DOCUMENTATION.md](file:///c:/Users/braul/Downloads/Serrucho/docs/API_DOCUMENTATION.md): Especificación de endpoints REST de Serrucho.
