---
name: uber-clone-conductor
description: Asistente de desarrollo y gestor automático de bitácora de IA para el proyecto universitario UberClone - Versión Conductor en React Native (Expo) con Firebase. Úsalo siempre que el usuario consulte dudas de código, arquitectura, hooks, Firebase (Firestore, Storage, Auth), pasarelas de pago (Mercado Pago/Stripe), o pida registrar avances en las ramas de santiago o emmanuel.
---
# UberClone Conductor & Bitácora IA

Esta skill guía el desarrollo técnico de la aplicación móvil **UberClone - Versión Conductor** en React Native con Expo (JavaScript + Expo Router / React Navigation, sin TypeScript), integrando **Firebase** como backend de almacenamiento y sincronización en tiempo real, y automatiza la generación de entradas para la bitácora obligatoria de inteligencia artificial (`docs/AI_LOG.md` o `docs/BITACORA SANTIAGO.md` / `docs/BITACORA EMMANUEL.md`), separadas por las ramas de trabajo (`santiago` y `emmanuel`).

## Cuándo usar esta skill

* Cuando el usuario haga consultas de código, diseño de pantallas, estado global, hooks o integraciones para el proyecto **UberClone - Versión Conductor**.
* Cuando se trabaje en persistencia de datos, consultas, subida de documentos o suscripciones en tiempo real con **Firebase Firestore** o **Firebase Storage**.
* Cuando el usuario pida generar, actualizar o formatear entradas para la bitácora de inteligencia artificial.
* Cuando se mencione el trabajo en las ramas de `santiago` o `emmanuel`.

## Reglas de Idioma (UI vs. Código)

* **Interfaz de Usuario (UI) únicamente en Español**: Toda la aplicación visible para el conductor (textos en pantalla, etiquetas, botones, mensajes de error debajo de cada campo, estados traducidos en UI) debe estar **100% en español**. **No** se incluye selector de idioma (Español/Inglés) ni soporte multi-idioma (`i18n`) en el registro ni en la configuración.
* **Lenguaje: JavaScript (ES6+) con archivos `.js`**, sin TypeScript (no usar `.ts`/`.tsx`; los tipos se documentan con JSDoc si hace falta).
* **Código 100% en Inglés**: Todo el código fuente debe mantenerse estrictamente en inglés: nombres de archivos, carpetas, rutas, componentes, variables, funciones, custom hooks, contextos, propiedades del modelo de datos (`driverId`, `fullName`, `licensePlate`, `vehicleCategory`, etc.) y comentarios técnicos.

## Reglas Técnicas del Proyecto

### 1. Navegación y Flujo de Pantallas
* `Tabs`: Registro del conductor dividido en 3 pestañas:
  * **Pestaña 1 — Datos personales (`personal-info`)**: Foto de perfil (cámara/galería, obligatoria), Nombre completo (máx. 50 caracteres, solo letras y espacios con tildes permitidas), Documento de identidad (numérico, 6 a 10 dígitos), Número de celular (numérico, 10 dígitos), Fecha de nacimiento (selector de fecha, mayor de 18 años), Género (lista desplegable: `GENDER_OPTIONS`), Correo electrónico (validación de `@` y dominio). *(Sin campo de idioma)*.
  * **Pestaña 2 — Vehículo (`vehicle-info`)**: Categoría (`economy`, `xl`, `premium`), Placa (formato colombiano `ABC123`, convertir a mayúsculas antes de validar), Marca y modelo (texto, máx. 30 caracteres cada uno), Año (numérico, 4 dígitos, no mayor al año actual), Color (lista desplegable: `VEHICLE_COLOR_OPTIONS`), Capacidad de pasajeros (numérico; `xl` exige mínimo 6), Foto del vehículo (obligatoria donde se vea la placa).
  * **Pestaña 3 — Documentos y pagos (`documents-info`)**: Licencia de conducción (número + foto + fecha de vencimiento posterior a hoy), SOAT (foto + fecha de vencimiento posterior a hoy), Revisión técnico-mecánica (foto + fecha de vencimiento si aplica según año del vehículo), Correo de cuenta de Mercado Pago (formato de correo válido), Aceptación de términos (checkbox obligatorio con porcentaje de comisión visible).
  * **Reglas de envío**: Botón "Enviar registro" habilitado solo cuando las 3 pestañas están completas y válidas. Errores mostrados debajo de cada campo (prohibido usar `Alert`). Al enviar a Firebase, la cuenta queda en estado `pending_approval` (*Pendiente de aprobación*).
* `Stack`: Flujo del viaje activo (`requested`, `accepted`, `driver_arriving`, `in_progress`, `completed`, `paid`, `cancelled`).
* `Drawer`: Perfil y configuración (sin selector de idioma), Historial de carreras (con `FlatList`, filtros y paginación de 20 ítems) y Ganancias.

### 2. Persistencia y Almacenamiento con Firebase (Firestore & Storage)
La configuración de Firebase ya está inicializada en `src/config/firebaseConfig.js`, la cual exporta la instancia de Firestore:
```javascript
import { db } from '../config/firebaseConfig.js';
```

**Reglas obligatorias para Firebase:**
* **SDK Modular (v9+)**: Usar siempre las funciones modulares de Firebase (`getDoc`, `setDoc`, `updateDoc`, `addDoc`, `collection`, `doc`, `query`, `where`, `orderBy`, `limit`, `onSnapshot`, `serverTimestamp`). Nunca usar sintaxis heredada v8 (`db.collection().doc()`).
* **Colección `drivers`**:
  * Cada conductor se almacena con su `driverId` (UID de Auth o ID generado).
  * Al completar el registro, los datos se guardan o actualizan estructurados:
    ```javascript
    {
      personalInfo: { fullName, documentId, phoneNumber, birthDate, gender, email, profilePhotoUri },
      vehicleInfo: { category, licensePlate, brand, model, year, color, passengerCapacity, vehiclePhotoUri },
      documentsInfo: { driverLicenseNumber, driverLicensePhotoUri, driverLicenseExpiryDate, soatPhotoUri, soatExpiryDate, mechanicalInspectionPhotoUri, mechanicalInspectionExpiryDate, mercadoPagoEmail, termsAccepted: true },
      status: 'pending_approval', // Estados: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'suspended'
      isAvailable: false,
      currentLocation: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    ```
* **Colección `trips`**:
  * Solicitudes y carreras activas.
  * Escuchar viajes disponibles o viaje activo mediante suscripción en tiempo real con `onSnapshot`.
* **Manejo de Limpieza en `useEffect` (Memory Leaks)**:
  Toda suscripción `onSnapshot` debe retornar obligatoriamente su función de desuscripción:
  ```javascript
  useEffect(() => {
    const tripQuery = query(collection(db, 'trips'), where('status', '==', 'requested'));
    const unsubscribe = onSnapshot(tripQuery, (snapshot) => {
      // Manejar solicitudes entrantes
    }, (error) => {
      console.error('Error listening to trips:', error);
    });
    return () => unsubscribe();
  }, []);
  ```
* **Firebase Storage**: Las fotos capturadas o seleccionadas de la galería se suben a Firebase Storage (`getStorage`) en rutas organizadas por conductor (ej. `drivers/${driverId}/documents/...`), almacenando en Firestore las URLs de descarga públicas (`getDownloadURL`).
* **Seguridad**: Nunca guardar credenciales maestras, tokens privados de pasarelas ni contraseñas en texto plano dentro de Firestore ni en `AsyncStorage`.

### 3. Hooks obligatorios
* `useState`: Disponibilidad, solicitud activa y formularios.
* `useEffect` (con función de limpieza obligatoria): Seguimiento de ubicación (`watchPosition`), temporizador de 15 segundos de solicitud entrante y suscripciones en tiempo real (`onSnapshot` de Firestore).
* `useContext` o Redux: Sesión del conductor / formulario de registro y viaje activo.
* `useMemo`: Cálculo de totales en pantalla de Ganancias (hoy, semana, mes) y validación agregada de las 3 pestañas del formulario.
* `useCallback`: Manejadores para aceptar y rechazar viajes y handlers de formulario.
* **Custom Hooks mínimos**: `useDriverLocation`, `useTripRequests`, `useEarnings`.

### 4. Cálculo de tarifas (`src/config/pricing.js` y `src/utils/calculateFare.js`)
* Manejar valores en **pesos colombianos enteros (COP)**.
* Parámetros base: Base = 3500, Valor km = 1200, Valor min = 250, Mínima = 6000, Multiplicadores (`economy`: 1.0, `xl`: 1.4, `premium`: 1.8), Comisión = 20% (0.20).
* Redondear la tarifa al múltiplo de 100 COP más cercano antes de calcular la comisión. Las propinas van 100% al conductor.
* Función pura requerida: `calculateFare({ distanceKm, durationMin, category, tip })` que retorne `{ fare, commission, driverEarnings }`.

### 5. Seguridad, Pagos y APIs
* Nunca guardar tarjetas, cuentas bancarias ni llaves secretas en la app o `AsyncStorage`. `AsyncStorage` es únicamente para la sesión y el último estado de disponibilidad.
* `access_token` de Mercado Pago o `sk_test` de Stripe van únicamente en el `.env` del backend.
* Llamar a Google Distance Matrix API solo al crear la solicitud y al aceptarla (nunca en cada cambio de ubicación).

## Flujo de Trabajo y Registro en Bitácora

En **cada respuesta** donde generes código, resuelvas un problema técnico o diseñes arquitectura para el proyecto, sigue estos pasos:

### 1. Identificar la Rama / Integrante
* Verifica si el usuario indicó quién hace la consulta (`santiago` o `emmanuel`).
* Si no lo especificó, asume por defecto a **Santiago Salazar Atehortua** (rama `santiago`), pero indícale que puede cambiarlo si la consulta es para la rama de `emmanuel`.

### 2. Marcar el Código Asistido
* En todo bloque de código que entregues, incluye el comentario obligatorio en inglés indicando el número de entrada correspondiente:
  ```javascript
  // AI-assisted: see docs/AI_LOG.md #<N>
  ```

### 3. Generar el Bloque de Bitácora al Final de la Respuesta
Al final de cada respuesta técnica, entrega un bloque Markdown listo para copiar y pegar en la bitácora (`docs/AI_LOG.md` o `docs/BITACORA SANTIAGO.md`), cumpliendo estrictamente la plantilla oficial:

```markdown
## Rama: <santiago | emmanuel>

### Entrada #<N>
- **Fecha:** YYYY-MM-DD
- **Integrante:** <Santiago Salazar Atehortua | Emmanuel [Apellido]> (Rama: `<santiago | emmanuel>`)
- **Herramienta:** Gemini 3.8 Flash
- **Objetivo:** <Descripción concisa de lo solicitado>
- **Prompt:** "<Texto exacto y completo del prompt enviado por el usuario sin resumir>"
- **Resumen de la respuesta:** <Resumen de 2 a 3 líneas de la solución entregada>
- **Qué se usó / modificó / descartó:** <Plantilla sugerida: "Se usó la estructura base de X, se adaptó Y para el modelo de datos y se descartó Z">
- **Archivos y commit:** `<ruta/sugerida/del/archivo.js>` — `<pendiente_hash_commit>`
- **Verificación:** <Sugerencia concreta de cómo probarlo en el emulador o consola>
- **Aprendizaje:** <Resumen breve del concepto clave aplicado para defender en la sustentación>
```

## Gotchas y Errores Comunes a Evitar
* **No resumir el prompt**: Copiar el texto íntegro enviado por el usuario.
* **Credenciales expuestas**: Si el usuario pega una API Key o token real en el prompt, reemplazar por `<REDACTED_API_KEY>` en la bitácora.
* **Fugas de memoria en Firestore y GPS**: Retornar siempre `unsubscribe()` en listeners de Firestore (`onSnapshot`) y `clearWatch` en geolocalización.
* **SDK modular vs namespaced**: Usar siempre sintaxis modular de Firebase (`doc(db, 'drivers', id)`), nunca sintaxis v8 (`db.collection(...)`).

