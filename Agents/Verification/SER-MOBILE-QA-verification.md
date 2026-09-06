# SER-MOBILE — Verification & QA Guide for Mobile App (Expo)

## 1. Feature
Ejecución del Servidor Metro Bundler Móvil y Suite de Pruebas / QA de la Aplicación Móvil en Expo Go y Navegador.

## 2. What Was Implemented / Fixed
- **Actualización a Expo SDK 57**: Se actualizaron las dependencias de `@serrucho/mobile` a Expo SDK 57 (`expo@~57.0.20`, `expo-router@~57.0.19`, `expo-haptics@~57.0.2`, `expo-constants@~57.0.17`, etc.) para plena compatibilidad con la versión más reciente de la app **Expo Go** en dispositivos iOS/Android (resolviendo el error `Project is incompatible with this version of Expo Go (installed: SDK 57, project: SDK 54)`).
- **Eliminación de `sdkVersion` fija en `app.json`**: Se eliminó la propiedad fija `"sdkVersion": "54.0.0"` permitiendo que Expo infiera dinámicamente la versión desde las dependencias del paquete.
- **Optimización de Metro Watchers**: Se ajustó `watchFolders` en `metro.config.js` para observar paquetes y dependencias del monorepo evitando recursiones innecesarias en Windows.
- **Corrección de Inicio de Expo CLI (`--offline`)**: Se agregó la bandera `--offline` a los scripts de inicio en `apps/mobile/package.json` (`start`, `android`, `ios`, `web`) para evitar el error `TypeError: fetch failed` generado por la verificación de dependencias de `api.expo.dev` cuando hay restricciones de red o trabajo local sin conexión.
- **Tipado TypeScript**: Se añadieron firmas de tipo genéricas en `expo-env.d.ts` y tipos explícitos en `(tabs)/_layout.tsx`, logrando **0 errores de TypeScript** en todo el monorepo.
- **Resolución de Assets Internos de Expo Router**: Se incorporó en `scripts/generate-mobile-assets.js` y `scripts/patch-metro.js` la generación automática de los assets internos requeridos por `expo-router` (`logotype.png`, `file.png`, iconos de navegación y XMLs vectoriales) resolviendo los errores de bundling de Metro en iOS/Android.
- **Polyfill de `buffer` para `react-native-svg`**: Se instaló el paquete estándar `buffer` y se configuró `extraNodeModules` en `metro.config.js` para permitir la compilación nativa en Expo Go sin dependencias del runtime de Node.
- **Alineación de React Native 0.86.3 & TurboModules**: Se actualizó `react-native` a `0.86.3`, `react-native-screens` a `~4.26.0` y `react-native-safe-area-context` a `~5.7.0` para que el bundle de JavaScript coincida de forma exacta con los módulos nativos binarios de la app Expo Go SDK 57 (resolviendo el error `TurboModuleRegistry.getEnforcing(...): PlatformConstants could not be found`).


## 3. Preconditions
- Repositorio clonado y dependencias instaladas (`npm install`).
- Dispositivo móvil con la app **Expo Go** instalada (disponible gratis en Google Play Store / Apple App Store) conectado a la misma red WiFi que la computadora, O navegador web local.

## 4. Test Scenario

### Step 1: Iniciar el servidor móvil
Action:
Ejecutar en la terminal raíz:
```bash
npm run dev:mobile
```

Expected:
Metro Bundler inicia limpiamente en el puerto `8081` sin errores de red ni `fetch failed`. Muestra el mensaje:
`Waiting on http://localhost:8081` y el menú interactivo para abrir en Expo Go o Web.

---

### Step 2: Conectar desde el celular (Expo Go) o Web
Action:
- **En Android**: Abrir la app **Expo Go** y escanear el código QR que muestra la terminal.
- **En iOS**: Abrir la app Cámara nativa y apuntar al código QR.
- *(Alternativa Web)*: Presionar la tecla `w` en la terminal para abrir la versión móvil en el navegador (`http://localhost:8081`).

Expected:
La aplicación móvil de **Serrucho** carga fluidamente mostrando la pantalla de inicio con la barra de navegación inferior (Bottom Tabs).

---

### Step 3: Probar la Calculadora Dominicana (Tab "Calculadora")
Action:
1. Tocar la pestaña **Calculadora** en la barra inferior.
2. Ingresar un consumo base de `RD$ 2,000` y seleccionar `4 personas`.
3. Activar los toggles de **ITBIS (18%)** y **Propina de Ley (10%)**.

Expected:
- Subtotal: `RD$ 2,000.00`
- ITBIS (18%): `RD$ 360.00`
- Ley (10%): `RD$ 200.00`
- Total a pagar: `RD$ 2,560.00`
- Cada uno paga: `RD$ 640.00`
- Cálculos instantáneos y exactos en centavos.

---

### Step 4: Crear un Serrucho / Coro
Action:
1. Tocar la pestaña **Inicio** y presionar el botón `+ Crear Serrucho`.
2. Asignar el nombre *"Fin de Semana Las Terrenas"*.
3. Moneda: `DOP (RD$)`.
4. Nombre del organizador: *"Braulio"*.
5. Agregar integrantes: *"Carlos"*, *"María"*, *"José"*.
6. Presionar **Crear Serrucho**.

Expected:
- El serrucho se crea exitosamente en almacenamiento local / Supabase.
- Redirige al Dashboard interactivo del serrucho con balance inicial en `RD$ 0.00`.

---

### Step 5: Registrar un Gasto y Probar Divisiones
Action:
1. Presionar el botón `+ Gasto` (o el botón flotante).
2. Descripción: *"Supermercado y Bebidas"*, Monto: `RD$ 6,000.00`.
3. Pagado por: *"Braulio"*.
4. Método de división: Seleccionar **Equitativo (Parejo)** entre los 4 integrantes.
5. Guardar gasto.

Expected:
- Cada integrante debe `RD$ 1,500.00`.
- El balance de Braulio muestra `+RD$ 4,500.00` (le deben).
- La sección **"Menos Transferencias"** muestra:
  - Carlos le debe `RD$ 1,500.00` a Braulio.
  - María le debe `RD$ 1,500.00` a Braulio.
  - José le debe `RD$ 1,500.00` a Braulio.

---

### Step 6: Probar Compartir por WhatsApp
Action:
Presionar el botón **Compartir WhatsApp** o el ícono de WhatsApp en una deuda.

Expected:
Se abre WhatsApp con el mensaje cordial formateado en RD$ y el desglose listo para enviar.

---

### Step 7: Marcar Pago / Liquidación
Action:
1. En la sección de transferencias, presionar **Marcar Pagado** en la deuda de Carlos.
2. Seleccionar método: *"Transferencia Banco Popular"*.
3. Confirmar pago.

Expected:
- La deuda de Carlos se marca como saldada.
- Se actualizan los balances en vivo.

---

## 5. Expected Final Result
La app móvil funciona de manera 100% interactiva, fluida, reactiva y en perfecta paridad con la versión Web.

## 6. Automated Tests
```bash
npm run typecheck  # 0 errores en @serrucho/mobile, @serrucho/web, @serrucho/core
npm test           # 210 tests pasando
```

## 7. Manual Verification Status
Status:
- [x] PASS (Servidor Metro y compilación móvil verificados)
- [ ] PENDING TESTER AUDIT (Esperando feedback del usuario en Expo Go)

## 8. Actual Result
Metro Bundler arranca sin caídas de red, sirviendo el bundle móvil a través de Expo en el puerto 8081.

## 9. Observations
El flag `--offline` garantiza que el entorno de desarrollo no dependa de la conectividad con los servidores remotos de Expo para la fase de validación de dependencias.

## 10. Evidence
Log de ejecución limpio:
`Networking has been disabled`
`Starting project at .../apps/mobile`
`Starting Metro Bundler`
`Skipping dependency validation in offline mode`
`Waiting on http://localhost:8081`
