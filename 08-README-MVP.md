# Serrucho MVP — Especificación ejecutiva

## Qué estamos construyendo
Una aplicación web mobile-first para hacer y cerrar un "serrucho" dominicano: organizar participantes, registrar gastos, calcular cuánto corresponde a cada persona y enviar un estado de cuenta al finalizar.

El documento original define Serrucho como una app para dividir gastos grupales y recomienda iniciar con registro de grupos, gastos manuales/por foto y reparto parejo o por porcentaje. Este MVP reduce aún más el alcance para garantizar que el flujo central sea sólido. fileciteturn0file0L39-L51

## MVP
### Incluido
- autenticación del organizador;
- creación de serrucho;
- participantes;
- email/teléfono;
- gastos manuales;
- división equitativa;
- división por porcentaje;
- gastos aplicables a participantes específicos;
- balances;
- instrucciones de pago;
- fecha límite;
- cierre;
- snapshots;
- estado de cuenta;
- enlace público seguro;
- email automático;
- adaptador opcional de WhatsApp;
- historial de notificaciones.

### Fuera de alcance
El documento original también contempla IA para recibos, integraciones de pago y ofertas; quedan fuera de esta primera versión. fileciteturn0file0L22-L32

## Flujo
`Crear → Participantes → Gastos → Balance → Configurar pago → Cerrar → Snapshot → Notificar`

## Regla más importante
Cerrar un serrucho significa congelar el resultado financiero. Después del cierre no se editan gastos ni participantes.

## Stack
Next.js + TypeScript + Supabase + Tailwind + shadcn/ui + Zod + Resend + Vercel + GitHub.

## Estructura
```text
serrucho/
├── app/
├── components/
├── features/
│   ├── serruchos/
│   ├── participants/
│   ├── expenses/
│   ├── settlements/
│   └── notifications/
├── lib/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   └── e2e/
├── public/
├── .env.example
├── AGENTS.md
└── README.md
```

## Comandos esperados
```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Definition of Done
El usuario puede completar un serrucho real de principio a fin y los cálculos coinciden exactamente con los gastos registrados.
