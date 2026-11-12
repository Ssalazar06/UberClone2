# Guía Completa de Sustentación — UberClone (Versión Conductor)

Este documento resume toda la arquitectura, el flujo técnico archivo por archivo y las **preguntas más probables de sustentación con sus respuestas exactas** basadas en el código real del proyecto.

---

## 1. Arquitectura General del Proyecto

La aplicación sigue una arquitectura **modular por capas** en **React Native (Expo) + JavaScript (ES6+)** conectada en tiempo real a **Firebase Firestore** y a un **backend Node.js + Express** para la pasarela de pagos:

```text
App.js
 ├── DriverRegistrationProvider  (src/context/DriverRegistrationContext.js)
 │     └── Estado del registro (3 pasos), sesión en AsyncStorage y sincronización con drivers/{driverId}
 └── ActiveTripProvider          (src/context/ActiveTripContext.js)
       └── Disponibilidad, solicitudes entrantes, viaje activo, pagos y saldo en plataforma
             └── RootNavigator   (src/navigation/RootNavigator.js)
                   ├── Si registrationStatus !== 'approved' ──► RegistrationNavigator (3 pestañas + pantalla de espera)
                   └── Si registrationStatus === 'approved' ──► MainDrawerNavigator (Drawer lateral)
                         ├── Home     ──► TripStackNavigator (HomeScreen ➔ ActiveTripScreen ➔ TripSummaryScreen)
                         ├── History  ──► HistoryStackNavigator (HistoryScreen ➔ TripDetailScreen)
                         ├── Earnings ──► EarningsScreen (useEarnings con useMemo)
                         └── Profile  ──► ProfileScreen (edición de datos + cerrar sesión)
```

### Separación de responsabilidades
- **`src/screens/`**: Solo interfaz de usuario en español y eventos de interacción.
- **`src/context/` y `src/hooks/`**: Estado global (`useContext`) y lógica reactiva reutilizable (`useDriverLocation`, `useTripRequests`, `useEarnings`, `useKeyboardPadding`).
- **`src/services/`**: Comunicación externa con Firebase Firestore (`driverService.js`, `tripService.js`), Storage (`imageStorageService.js`), AsyncStorage (`localStorageService.js`), backend de pagos (`paymentService.js`) y alertas (`notificationService.js`).
- **`src/utils/`**: Funciones **puras** de negocio y validación (`calculateFare.js`, `calculateDriverBalance.js`, `routeUtils.js`, `validatePersonalInfo.js`, `validateVehicleInfo.js`, `validateDocumentsInfo.js`).
- **`backend/`**: Servidor Express independiente que custodia el `MP_ACCESS_TOKEN` privado y se comunica con la API REST de Mercado Pago y con Firestore.

---

## 2. Explicación Técnica por Módulos (Cómo funciona el código)

### 2.1. Fase 1: Registro del Conductor y Persistencia de Sesión
- **Archivos clave:** `src/context/DriverRegistrationContext.js`, `src/services/driverService.js`, `src/utils/registration/*.js`.
- **Cómo funciona:**
  1. El formulario se divide en 3 pestañas: **Datos personales** (`PersonalInfoScreen`), **Vehículo** (`VehicleInfoScreen`) y **Documentos** (`DocumentsInfoScreen`).
  2. Las validaciones se ejecutan con **`useMemo`** cada vez que cambia un campo:
     - **Edad mínima:** 18 años (`validatePersonalInfo.js`).
     - **Placa colombiana (`ABC123`) y capacidad por categoría:** `XL` exige mínimo 6 pasajeros (`MIN_CAPACITY_BY_CATEGORY` en `registrationOptions.js`).
     - **Revisión técnico-mecánica condicional:** Solo es obligatoria si `añoActual - Number(vehicleInfo.year) >= 5` (`MECHANICAL_INSPECTION_MIN_VEHICLE_AGE = 5`).
  3. **Unicidad en Firestore (`persistRegistration`):**
     - El número de cédula (`documentId`) se usa como ID del documento en `drivers/{documentId}`. Antes de guardar, verifica con `getDriver(newDriverId)` que no pertenezca a otro conductor.
     - Verifica con `findDriverByLicensePlate` que la placa no esté registrada por otro conductor.
  4. **Sesión ligera y segura en `AsyncStorage`:**
     - En `AsyncStorage` (`@uberclone:driver_session`) **solo se guarda `{ driverId }`** (nunca tokens ni datos sensibles). Al abrir la app, `loadSession` lee ese `driverId` y descarga los datos frescos desde Firestore, activando además un listener `onSnapshot` (`subscribeToDriver`) para detectar en tiempo real cuando el estado pasa de `pending_approval` a `approved`.

---

### 2.2. Fase 2: Geolocalización en Tiempo Real y Mapa
- **Archivos clave:** `src/hooks/useDriverLocation.js`, `src/components/trip/SafeMapView.jsx`, `src/screens/home/HomeScreen.jsx`.
- **Cómo funciona:**
  1. `useDriverLocation(isAvailable)` solicita permisos de ubicación (`PermissionsAndroid` / `expo-location`) y obtiene la posición inicial.
  2. Cuando el conductor está **Aprobado (`approved`)** y **Disponible (`isAvailable === true`)**, inicia el seguimiento continuo con `CommunityGeolocation.watchPosition` (de `@react-native-community/geolocation`, con respaldo automático a `Location.watchPositionAsync` en Expo Go).
  3. **Control de escrituras (*Throttling*):** El GPS del celular puede disparar eventos cada segundo. Para no agotar la cuota de Firestore, se usa `lastWriteTimeRef` (`useRef`) de modo que `updateDoc(doc(db, 'drivers', driverId), { currentLocation })` **solo escribe en Firestore máximo una vez cada 5 segundos (`now - lastWriteTimeRef.current >= 5000`)**.
  4. **Limpieza obligatoria (`cleanup`):** En el `return` del `useEffect` se invoca `CommunityGeolocation.clearWatch(watchIdRef.current)` y `expoSubRef.current.remove()`, evitando fugas de memoria y drenaje de batería cuando el conductor pasa a *No disponible* o desmonta la pantalla.

---

### 2.3. Fase 3: Solicitudes Entrantes, Temporizador de 15 s, Transacciones y Rutas
- **Archivos clave:** `src/hooks/useTripRequests.js`, `src/components/trip/IncomingRequestCard.jsx`, `src/services/tripService.js`, `src/utils/routeUtils.js`, `src/utils/calculateFare.js`, `src/screens/trip/ActiveTripScreen.jsx`.
- **Cómo funciona:**
  1. **Escucha en tiempo real (`subscribeToRequestedTrips`):** Cuando el conductor está disponible y sin viaje activo, escucha en Firestore los documentos de `trips` con `status == 'requested'`, filtra los que coinciden con la categoría del vehículo del conductor (`economy`, `xl`, `premium`) y excluye aquellos donde `rejectedBy` ya contiene a `driverId`.
  2. **Temporizador de 15 segundos (`useTripRequests.js`):**
     - Al detectar una solicitud (`currentRequestId`), inicia un `setInterval` de 1000 ms que descuenta `secondsLeft` desde `15` hasta `0`.
     - Si llega a `0`, limpia el intervalo y ejecuta automáticamente `rejectTrip(currentRequestId)`, que agrega el `driverId` al arreglo `rejectedBy` mediante `arrayUnion(driverId)` en Firestore.
     - El `useEffect` retorna `() => clearInterval(timerRef.current)` para garantizar que nunca quede un temporizador huérfano.
  3. **Aceptación atómica con `runTransaction` (`acceptTrip` en `tripService.js`):**
     - Usa `runTransaction(db, async (transaction) => ...)` para leer el estado actual del viaje dentro de una transacción atómica: verifica que `status === 'requested'` y `driverId === null` antes de asignarlo al conductor (`status: 'accepted', driverId`). Si otro conductor lo tomó milisegundos antes, la transacción aborta limpiamente.
  4. **Consumo optimizado de Google Routes API v2 (`routeUtils.js`):**
     - Usa el endpoint moderno `POST https://routes.googleapis.com/directions/v2:computeRoutes` con la cabecera `X-Goog-FieldMask`:
       - Para distancia y duración con tráfico (`fetchDistanceMatrix`): pide solo `'routes.distanceMeters,routes.duration'` **una sola vez** al crear la solicitud.
       - Para dibujar la polilínea (`fetchRouteCoordinates`): pide solo `'routes.polyline.encodedPolyline'` y decodifica la cadena con el algoritmo oficial de Google (`decodeGooglePolyline`). Se llama **solo dos veces en todo el viaje**: al aceptar (ruta hacia el punto de recogida) y al presionar *"Pasajero a bordo"* (`in_progress`, ruta hacia el destino). Si falla la red o no hay API key, cae automáticamente en OSRM / Haversine.
  5. **Fórmula de tarifa (`calculateFare.js`):**
     - Función pura:
       $$\text{rawSum} = 3500 + (\text{distanceKm} \times 1200) + (\text{durationMin} \times 250)$$
       $$\text{fare} = \text{redondearA100}\left(\max(\text{rawSum} \times \text{multiplicadorCategoría},\; 6000)\right)$$
       $$\text{commission} = \text{round}(\text{fare} \times 0.20)$$
       $$\text{driverEarnings} = \text{fare} - \text{commission} + \text{tip}$$
     - La comisión (20%) se calcula únicamente sobre `fare`; la propina (`tip`) es 100% para el conductor.

---

### 2.4. Fase 4: Pagos con Mercado Pago (Checkout Pro + Webhooks) y Saldo
- **Archivos clave:** `backend/src/routes/paymentsRoutes.js`, `backend/src/services/mercadoPagoService.js`, `src/services/paymentService.js`, `src/utils/calculateDriverBalance.js`, `src/screens/trip/TripSummaryScreen.jsx`.
- **Cómo funciona:**
  1. **Por qué hay un backend Express (`/backend`):**
     - Para crear una preferencia de Checkout Pro y consultar pagos en la API de Mercado Pago se necesita el `MP_ACCESS_TOKEN` privado. Por seguridad, esa llave vive en `backend/.env` y nunca viaja al teléfono.
  2. **Creación de la preferencia (`POST /payments/preference`):**
     - Recibe `{ tripId, amount, description }`, llama a `POST https://api.mercadopago.com/checkout/preferences` enviando `external_reference: tripId` y `notification_url: "${BACKEND_PUBLIC_URL}/payments/webhook"`, guarda `paymentPreferenceId` en Firestore y devuelve `initPoint` para que la app lo abra con `Linking.openURL`.
  3. **Confirmación por Webhook + Verificación activa:**
     - **Webhook (`POST /payments/webhook`):** Cuando Mercado Pago notifica un pago a través de la URL pública de `ngrok`, el backend consulta `GET /v1/payments/:id`, extrae `external_reference` (`tripId`) y actualiza Firestore (`paymentStatus: 'approved'`, `status: 'paid'`, `paidAt`).
     - **Verificación activa (`GET /payments/status/:tripId`):** Como respaldo (por si el webhook tarda o el usuario vuelve a la app sin presionar "Volver al sitio"), cuando la app vuelve al primer plano (`AppState` `'active'`) o el conductor toca *"Verificar estado del pago"*, el backend consulta `/v1/payments/search?external_reference=<tripId>` en Mercado Pago y sincroniza Firestore al instante.
     - Como el cliente escucha el viaje con `onSnapshot` (`subscribeToActiveTrip`), apenas Firestore cambia a `status: 'paid'`, `TripSummaryScreen` muestra **"Viaje finalizado y pagado"** sin recargar manualmente.
  4. **Cálculo del saldo en plataforma (`calculateDriverBalance.js`):**
     - Función pura que recorre todos los viajes pagados del conductor:
       - Si el viaje fue pagado por **Mercado Pago (pasarela)**: la plataforma recibió el dinero del pasajero, por lo que le **debe** al conductor su ganancia neta (`+ driverEarnings`).
       - Si el viaje fue pagado en **Efectivo (`cash`)**: el conductor recibió el 100% del billete en mano, por lo que le **debe** a la plataforma el 20% de comisión (`- commission`).
       - **Fórmula:** `balance = gatewayEarnings - cashCommissionsOwed`. Si el conductor hace más viajes en efectivo que por pasarela, el saldo es **negativo** (y se compensa automáticamente cuando hace viajes por Mercado Pago).

---

### 2.5. Fases 5 y 6: Historial Paginado, Ganancias, Perfil y Notificaciones
- **Archivos clave:** `src/screens/history/HistoryScreen.jsx`, `src/screens/history/TripDetailScreen.jsx`, `src/hooks/useEarnings.js`, `src/screens/earnings/EarningsScreen.jsx`, `src/screens/profile/ProfileScreen.jsx`, `src/services/notificationService.js`, `firestore.rules`, `firestore.indexes.json`.
- **Cómo funciona:**
  1. **Paginación con Firestore (`getDriverTripsPage` en `tripService.js`):**
     - Consulta `where('driverId', '==', driverId)`, `orderBy('createdAt', 'desc')`, `limit(20)` y en las siguientes páginas usa `startAfter(lastDoc)` cuando el usuario desliza al final del `FlatList` (`onEndReached`).
     - Incluye un bloque `try/catch` de resiliencia: si el índice compuesto `driverId + createdAt` aún no ha terminado de compilarse en Firebase Console, ordena y pagina en memoria para que la pantalla jamás falle.
  2. **Cálculo de ganancias memorizado (`useEarnings.js`):**
     - Usa `useMemo` sobre los viajes del conductor para clasificar por **Hoy**, **Semana**, **Mes** y **Total**, calculando número de carreras, total facturado bruto, comisiones descontadas, propinas, ganancia neta, promedio por viaje y saldo en plataforma sin hacer lecturas extra a Firestore.
  3. **Edición de perfil y cierre de sesión (`ProfileScreen.jsx`):**
     - Reutiliza `FormInput`, `FormSelect`, `DatePickerField` e `ImagePickerField`. Al guardar (`updateApprovedProfile`), valida las 3 secciones y actualiza `drivers/{driverId}` manteniendo el estado `approved`.
     - Al presionar **Cerrar sesión** (`resetRegistration`), elimina `DRIVER_SESSION` de `AsyncStorage` y limpia el contexto, regresando automáticamente al flujo de registro en `RootNavigator`.

---

## 3. Posibles Preguntas del Profesor y Cómo Responderlas

### Pregunta 1: *"¿Dónde usaste los hooks `useState`, `useEffect`, `useContext`, `useMemo` y `useCallback`, y por qué en esos lugares?"*
- **Respuesta:**
  - **`useContext`**: En `DriverRegistrationContext` y `ActiveTripContext` (consumidos mediante `useDriverRegistration` y `useActiveTrip`) para compartir los datos del conductor, el viaje activo y el saldo entre el mapa, el Drawer, el resumen de pago y la pantalla de ganancias sin pasar *props* manualmente (*prop drilling*).
  - **`useEffect` con función de limpieza (`cleanup`)**:
    1. En `useDriverLocation.js`: para abrir `watchPosition` del GPS y limpiarlo con `clearWatch` cuando el conductor se desconecta.
    2. En `useTripRequests.js`: para el temporizador de 15 segundos (`setInterval`) y limpiarlo con `clearInterval`.
    3. En `ActiveTripContext.js` y `DriverRegistrationContext.js`: para las suscripciones en tiempo real `onSnapshot` de Firestore, retornando `() => unsubscribe()`.
  - **`useMemo`**:
    1. En `DriverRegistrationContext.js`: para ejecutar las validaciones de las 3 pestañas (`validatePersonalInfo`, `validateVehicleInfo`, `validateDocumentsInfo`) solo cuando cambian los datos del formulario.
    2. En `useEarnings.js`: para recalcular los totales financieros por Hoy, Semana y Mes solo cuando cambia la lista de viajes o el filtro de período.
    3. En `IncomingRequestCard.jsx`: para calcular la tarifa estimada con `calculateFare`.
  - **`useCallback`**: En los manejadores de aceptar/rechazar viaje (`handleAccept`, `handleReject` en `useTripRequests.js`) y en `renderTripItem` / `keyExtractor` de `HistoryScreen.jsx` para evitar recrear funciones en cada renderizado del `FlatList`.

---

### Pregunta 2: *"¿Cómo evitas que dos conductores acepten la misma solicitud de viaje al mismo tiempo?"*
- **Respuesta:**
  - En `src/services/tripService.js`, la función `acceptTrip(tripId, driverId)` utiliza **`runTransaction` de Firebase Firestore**.
  - Dentro de la transacción se lee el documento `trips/{tripId}` en el servidor, se comprueba que `status === 'requested'` y que `!data.driverId`, y solo entonces se escribe `status: 'accepted'` y `driverId`. Si otro conductor ya lo había tomado, la transacción lanza un error controlado y devuelve `null`.

---

### Pregunta 3: *"¿Cada cuánto llamas a la API de Google Maps para calcular rutas o distancias? ¿No se consume toda la cuota con el GPS?"*
- **Respuesta:**
  - **Nunca se llama a la API de rutas en cada evento del GPS.**
  - En `src/utils/routeUtils.js` usamos **Google Routes API v2** (`directions/v2:computeRoutes`) con `X-Goog-FieldMask` en momentos puntuales:
    1. `fetchDistanceMatrix` se llama **una sola vez** cuando se crea la solicitud para obtener `distanceKm` y `durationMin`.
    2. `fetchRouteCoordinates` se dispara en `ActiveTripScreen.jsx` dentro de un `useEffect` cuyas dependencias son `[status, activeTrip?.id]`. Eso significa que solo pide la polilínea **una vez** al aceptar el viaje (hacia el punto de recogida) y **una segunda vez** cuando el estado cambia a `in_progress` (hacia el destino).
  - Además, las escrituras del GPS a Firestore en `useDriverLocation.js` tienen un *throttle* de **5 segundos** (`lastWriteTimeRef`).

---

### Pregunta 4: *"Explícame por qué el saldo del conductor puede ser negativo y dónde está programada esa regla."*
- **Respuesta:**
  - Está en la función pura `calculateDriverBalance` (`src/utils/calculateDriverBalance.js`).
  - La plataforma cobra un **20% de comisión** sobre la tarifa base (`fare`), mientras que el **100% de la propina (`tip`)** es del conductor.
  - Cuando el pasajero paga con **Mercado Pago**, el dinero entra a la cuenta de la plataforma, así que la plataforma le suma al conductor su ganancia neta (`+ driverEarnings`).
  - Cuando el pasajero paga en **Efectivo**, el conductor recibe todo el billete directamente (incluyendo el 20% que pertenece a la plataforma). Por eso esa comisión (`- commission`) se descuenta de su saldo en plataforma. Si un conductor recién registrado cobra varios viajes en efectivo seguidos, su saldo queda negativo hasta que se compense con viajes pagados por Mercado Pago.

---

### Pregunta 5: *"¿Cómo funciona la integración con Mercado Pago y cómo se entera la app móvil de que el pago fue aprobado?"*
- **Respuesta:**
  - La integración tiene dos partes para no exponer jamás el `MP_ACCESS_TOKEN` en el cliente:
    1. **Creación (`POST /payments/preference` en `backend/src/routes/paymentsRoutes.js`):** La app envía `{ tripId, amount }` al servidor Express. El servidor llama a la API de Mercado Pago con el token privado del `.env`, asocia `external_reference: tripId` y `notification_url` apuntando al túnel HTTPS de `ngrok`, y devuelve el `initPoint` para abrir Checkout Pro.
    2. **Confirmación en tiempo real:** Cuando el pago se procesa, Mercado Pago envía un `POST /payments/webhook` al backend (o el backend lo verifica en `GET /payments/status/:tripId` al regresar a la app). El backend consulta el estado real en la API de Mercado Pago y actualiza `trips/{tripId}` en Firestore con `paymentStatus: 'approved'` y `status: 'paid'`.
    3. Como `ActiveTripContext.js` mantiene un listener `onSnapshot` activo sobre `trips/{tripId}`, la pantalla `TripSummaryScreen.jsx` cambia automáticamente a **"Viaje finalizado y pagado"** y recalcula el saldo del conductor en vivo.

---

### Pregunta 6: *"¿Qué guardas en `AsyncStorage` y qué NO guardas ahí?"*
- **Respuesta:**
  - En `AsyncStorage` (`src/services/localStorageService.js`) **solo guardamos identificadores y preferencias de interfaz**:
    - `@uberclone:driver_session`: contiene únicamente `{ driverId }` para restaurar la sesión al abrir la app.
    - `@uberclone_driver_availability`: un booleano (`true`/`false`) para recordar si el conductor estaba disponible.
  - **Nunca guardamos** `MP_ACCESS_TOKEN`, credenciales de pago ni tarjetas en `AsyncStorage` ni en el código fuente del cliente.

---

### Pregunta 7: *"¿Cómo resolviste las notificaciones de nuevas solicitudes en Expo Go?"*
- **Respuesta:**
  - En Expo Go (sin *development build* nativo), FCM remoto con `@react-native-firebase/messaging` no está disponible porque requiere código nativo personalizado.
  - Por eso implementamos en `src/services/notificationService.js` una alerta local (patrón de vibración + notificación) disparada reactivamente desde el listener `onSnapshot` de `ActiveTripContext.js` cada vez que entra un nuevo documento con `status: 'requested'` para la categoría del conductor.

---

## 4. Orden Sugerido para la Demostración en Vivo / Video (≤ 5 min)

1. **Registro y Validaciones (45 s):**
   - Mostrar las 3 pestañas de registro, probar una validación en tiempo real (ej. placa o año del vehículo que activa la técnico-mecánica si tiene ≥ 5 años) e ingresar con el conductor aprobado.
2. **Mapa, GPS y Disponibilidad (30 s):**
   - Mostrar el mapa en `HomeScreen`, activar el interruptor **Disponible** y señalar cómo el marcador del vehículo sigue la posición GPS.
3. **Solicitud Entrante y Temporizador de 15 s (45 s):**
   - Simular una solicitud (primero dejar o mencionar el contador regresivo de 15 s en `IncomingRequestCard` que muestra tarifa y ganancia neta estimada) y presionar **Aceptar**.
4. **Ciclo del Viaje y Ruta en `Polyline` (45 s):**
   - Mostrar la polilínea hacia el punto de recogida (`Google Routes API v2`), presionar **Llegué al punto de recogida**, luego **Pasajero a bordo** (ver cómo cambia la ruta hacia el destino) y **Finalizar viaje**.
5. **Pago (Efectivo y Mercado Pago) + Saldo del Conductor (1 min):**
   - En `TripSummaryScreen`, mostrar el desglose (Tarifa, Comisión 20%, Propina 100%, Ganancia neta), abrir **Checkout Pro de Mercado Pago** (o confirmar cobro en efectivo) y mostrar cómo cambia el estado a **Aprobado / Pagado** y cómo varía el **Saldo en plataforma**.
6. **Drawer: Historial, Detalle con Ruta, Ganancias y Perfil (1 min):**
   - Abrir el menú lateral, entrar a **Historial** (filtrar por Hoy/Semana/Mes y método de pago, tocar un viaje para ver su `TripDetailScreen` con la ruta guardada y calificación), pasar a **Ganancias** (`useEarnings` por período) y finalizar en **Perfil** editando un dato o cerrando sesión.

