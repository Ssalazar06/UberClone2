# UberClone — Versión Conductor (React Native + Expo + Firebase)

Aplicación móvil para conductores desarrollada en **React Native (Expo)** con **Firebase Firestore** en tiempo real, rutas con **Google Routes API v2** y pasarela de pagos **Mercado Pago (Checkout Pro + Webhooks)** mediante un servidor **Node.js + Express**.

---

## 1. Requisitos previos

- **Node.js** >= 18
- **Expo Go** en dispositivo físico o Emulador Android / iOS
- Proyecto en **Firebase** con **Cloud Firestore** habilitado
- Cuenta de desarrollador en **Mercado Pago Developers** (credenciales de prueba)
- Clave de **Google Maps Platform** (con *Routes API*, *Maps SDK for Android*, *Geocoding API* y *Places API (New)* habilitadas)

---

## 2. Instalación y configuración

### 2.1. Instalar dependencias de la app móvil

```bash
npm install
```

### 2.2. Configurar variables de entorno de la app (`.env`)

Copia el archivo `.env.example` a `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Variables incluidas en `.env.example`:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=tu_google_maps_api_key
EXPO_PUBLIC_PAYMENT_API_URL=http://localhost:3001
EXPO_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:000000000000
```

### 2.3. Instalar y configurar el backend de pagos (`/backend`)

```bash
npm --prefix backend install
cp backend/.env.example backend/.env
```

Edita `backend/.env` con tu `MP_ACCESS_TOKEN` de prueba y la URL pública (`ngrok` si pruebas webhooks reales desde Mercado Pago):

```env
PORT=3001
MP_ACCESS_TOKEN=APP_USR-tu-access-token-de-prueba
BACKEND_PUBLIC_URL=http://localhost:3001
```

> **Seguridad:** El `MP_ACCESS_TOKEN` privado vive únicamente en `backend/.env` y jamás se incluye en la app móvil ni en `AsyncStorage`.

---

## 3. Ejecución del proyecto

### 3.1. Iniciar el backend de pagos

```bash
npm --prefix backend start
```

Si deseas recibir webhooks públicos de Mercado Pago en local:

```bash
ngrok http 3001
```

### 3.2. Iniciar la aplicación en Expo

```bash
npx expo start
```

---

## 4. Simulador de pasajero (`scripts/simulatePassenger.mjs`)

Dado que el proyecto corresponde a la **Versión Conductor**, se incluye un script CLI y controles de simulación en desarrollo para generar solicitudes y eventos de viaje en Firestore:

```bash
# Crear solicitud de viaje (efectivo o mercadopago)
node scripts/simulatePassenger.mjs request --category economy --payment cash
node scripts/simulatePassenger.mjs request --category economy --payment mercadopago

# Aprobar un conductor por su documento
node scripts/simulatePassenger.mjs approve 1000123456

# Poblar historial y ganancias de prueba (hoy, semana y mes)
node scripts/simulatePassenger.mjs seed --driver 1000123456 --count 15

# Listar viajes o cancelar solicitudes activas
node scripts/simulatePassenger.mjs trips
node scripts/simulatePassenger.mjs cancel-active
```

---

## 5. Estructura principal del proyecto

```text
├── backend/                     # Servidor Express para Checkout Pro y Webhooks de Mercado Pago
│   └── src/
│       ├── config/              # Variables de entorno y conexión a Firestore
│       ├── routes/              # POST /payments/preference, POST /payments/webhook, GET /payments/status/:tripId
│       └── services/            # Integración con API de Mercado Pago
├── docs/                        # Bitácora de uso de IA (BITACORA SANTIAGO.md)
├── scripts/                     # Simulador CLI de pasajero (simulatePassenger.mjs)
├── src/
│   ├── components/              # Componentes reutilizables de formularios y mapas (SafeMapView)
│   ├── config/                  # Configuración de Firebase, tarifas y variables de entorno
│   ├── constants/               # Estados de viaje, métodos de pago y claves de AsyncStorage
│   ├── context/                 # Contextos globales (DriverRegistrationContext y ActiveTripContext)
│   ├── hooks/                   # Custom hooks (useDriverLocation, useEarnings, useActiveTrip, etc.)
│   ├── navigation/              # RootNavigator, RegistrationTabNavigator, MainDrawerNavigator, Stacks
│   ├── screens/                 # Pantallas de Registro, Inicio/Viaje, Historial, Ganancias y Perfil
│   ├── services/                # Servicios modulares de Firestore, Storage, Pagos y Notificaciones
│   ├── theme/                   # Paleta de colores, tipografía y espaciado global
│   └── utils/                   # Funciones puras (calculateFare, calculateDriverBalance, validaciones)
├── firestore.rules              # Reglas de seguridad de Cloud Firestore
└── firestore.indexes.json       # Índices compuestos para consultas de historial y solicitudes
```

---

## 6. Uso de Inteligencia Artificial (Política Académica)

El desarrollo de este proyecto contó con asistencia de herramientas de IA generativa siguiendo la política académica del curso:

- **Rol de la IA:** Asistencia en estructuración de servicios con el SDK modular de Firebase v13, integración de Google Routes API v2, configuración del backend Express para Mercado Pago Checkout Pro y generación de pantallas base bajo supervisión del autor.
- **Revisión y autoría:** Todas las decisiones de arquitectura, reglas de validación, fórmulas de negocio (`calculateFare`, `calculateDriverBalance`), pruebas en dispositivo/emulador y ajustes de interfaz fueron verificados e integrados por **Santiago Salazar** en la rama `santiago`.
- **Bitácora detallada:** El registro cronológico completo de prompts, archivos intervenidos, modificaciones manuales y verificaciones se encuentra documentado en [`docs/BITACORA SANTIAGO.md`](./docs/BITACORA%20SANTIAGO.md).

