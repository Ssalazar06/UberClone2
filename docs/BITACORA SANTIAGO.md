# Bitácora de uso de IA — UberClone Conductor

## Rama: santiago

### Entrada #1
- **Fecha:** 2026-11-02
- **Integrante:** Santiago Salazar Atehortua (Rama: `santiago`)
- **Herramienta:** Gemini 3.8 Flash
- **Objetivo:** Diseñar e implementar un sistema de diseño y tema visual centralizado con paleta de colores verde para la aplicación móvil UberClone Conductor.
- **Prompt:** "solicito tu ayuda con la creacion de un tema y paleta de colores en verde para mi proyecto, tener en cuenta que sera un proyecto de una apliacion parecida a uber"
- **Resumen de la respuesta:** Se estructuró un sistema de diseño completo con paleta semántica basada en tonos verdes (primary: `#1B7F3B`, secondary: `#00A86B`, estados de conductor, background y surface), escala modular de espaciados basada en múltiplos de 4 (`spacing`), radios de borde (`radius`), presets de tipografía estandarizados y sombras multiplataforma (`shadows` con `Platform.select`).
- **Qué se usó / modificó / descartó:** Se creó la estructura en `src/theme/index.js` y `src/theme/theme.js` con tokens semánticos en JavaScript puro, adaptados a las necesidades de una app de movilidad tipo Uber (botones de acción, estados de disponibilidad y contraste para lectura rápida en ruta), y se descartó instalar librerías externas de UI para mantener estilos ligeros y nativos con `StyleSheet`.
- **Archivos y commit:** `src/theme/index.js`, `src/theme/theme.js` — `<pendiente_hash_commit>`
- **Verificación:** Importación de `colors`, `spacing`, `radius` y `typography` en `App.js` y en los componentes de registro, comprobando en el dispositivo que la paleta verde, contrastes y jerarquías tipográficas se visualicen correctamente.
- **Aprendizaje:** Centralizar los tokens de diseño en un único archivo temático desacopla la identidad visual de los componentes, garantizando consistencia en toda la interfaz y facilitando cambios globales de marca sin alterar el código de las pantallas.

### Entrada #2
- **Fecha:** 2026-11-03
- **Integrante:** Santiago Salazar Atehortua (Rama: `santiago`)
- **Herramienta:** Gemini 3.8 Flash
- **Objetivo:** Implementar funciones puras de validación para Información Personal (Pestaña 1) e Información del Vehículo (Pestaña 2) con reglas de negocio estrictas y listas desplegables.
- **Prompt:** "Me ayudas haciendo las validaciones para la informacion personal y la informacion de los vehiculos, tener en cuenta que se pueden utilizar tildes para nombre, no debe de teenr numeros o caracteres especiales, el numero del documento solo debe aceptar numeros de 0 a 9 y no letras, de igual forma el numero de telefono, la fecha de nacimiento que debe de ser mayor de 18 anios
Porfavor tener en cuenta las listas desplegables para lso datos que se tienen en registration option"
- **Resumen de la respuesta:** Se implementaron `validatePersonalInfo` y `validateVehicleInfo` como funciones puras en `src/utils/registration/`. Se programaron reglas regex para nombres con tildes (sin números/símbolos), documento de identidad (6 a 10 dígitos 0-9), celular (10 dígitos 0-9), cálculo dinámico de edad (>= 18 años), validación de listas desplegables contra `registrationOptions.js`, placa colombiana `ABC123` en mayúsculas, año `<= año actual` y capacidad mínima de 6 pasajeros para categoría `xl`.
- **Qué se usó / modificó / descartó:** Se importaron `GENDER_OPTIONS`, `VEHICLE_CATEGORY_OPTIONS` y `VEHICLE_COLOR_OPTIONS` desde `src/data/registrationOptions.js`, se implementaron funciones de validación con retorno `{ isValid, errors }` y se descartó el uso de librerías de terceros (Yup/Zod) para no inflar el tamaño de la aplicación con dependencias innecesarias.
- **Archivos y commit:** `src/utils/registration/validatePersonalInfo.js`, `src/utils/registration/validateVehicleInfo.js`, `docs/AI_LOG.md` — `<pendiente_hash_commit>`
- **Verificación:** Ejecución de pruebas unitarias con Node.js verificando casos válidos e inválidos (menor de edad, placa minúscula, categoría XL con 4 pasajeros, nombres con tildes y sin símbolos).
- **Aprendizaje:** El cálculo preciso de edad en JavaScript requiere comparar tanto el año como el mes y día exactos con la fecha actual para evitar errores de desfase por año calendario.

## Entrada #3
- **Fecha:** 2026-11-05
- **Integrante:** Santiago Salazar Atehortua (Rama: `santiago`)
- **Herramienta:** Gemini 3.8 Flash
- **Objetivo:** Explicación técnica del funcionamiento del almacenamiento local de fotografías (file://) y su persistencia en Firestore en conformidad con la especificación.
- **Prompt:** "Como puedo hacer para guardar las fotos, como se especifica en el documento que se recomienda hacerlo con almacenamiento local"
- **Resumen de la respuesta:** Se detalló el ciclo de vida de captura con `expo-image-picker`, la generación de URIs locales en la memoria interna del dispositivo (`file:///...`), la persistencia de dicha referencia en los documentos de Firestore (`drivers`) y su renderizado directo mediante `<Image source={{ uri }} />`, fundamentando por qué la especificación técnica sugiere esta estrategia frente a las restricciones de pago de Firebase Storage.
- **Qué se usó / modificó / descartó:** Se creo el flujo de imágenes implementado en `ImagePickerField.jsx` y `DriverRegistrationContext.js`
- **Archivos y commit:** `src/components/registration/ImagePickerField.jsx`, `src/context/DriverRegistrationContext.js` — `<pendiente_hash_commit>`
- **Verificación:** Toma de fotografía de prueba en el componente y verificación de la URI generada en consola (`file://...`).
- **Aprendizaje:** Las URIs con protocolo `file://` permiten a React Native desacoplar el almacenamiento de medios binarios pesados de la base de datos documental, garantizando funcionamiento fluido y sin costos de infraestructura en entornos de prueba y sustentación.

## Rama: santiago

### Entrada #4
- **Fecha:** 2026-11-10
- **Integrante:** Santiago Salazar Atehortua (Rama: `santiago`)
- **Herramienta:** Gemini 3.8 Flash
- **Objetivo:** Integrar `@react-native-community/geolocation` (`watchPosition` y `clearWatch`) y las APIs actualizadas de Google Maps Platform (`Routes API` v2, `Geocoding API`, `Places API (New)`, `Maps SDK for Android` y `Maps JavaScript API`).
- **Prompt:** "Necesito tu ayuda para integrar estas librerias y ser las que se usaran en el proyecto, pues la de mapas que esta usando no me funciona, las que integragramos en el en el proyecto seran: @react-native-community/geolocation, Routes API, Geocoding API, Places API (New), Maps SDK for Android y Maps JavaScrip API, "
- **Resumen de la respuesta:** Se instaló y configuró `@react-native-community/geolocation` en `useDriverLocation.js` utilizando `watchPosition` y limpieza con `clearWatch` en `useEffect`, manteniendo respaldo en `expo-location` para Expo Go. Se implementó en `routeUtils.js` el consumo de **Google Routes API v2** (`POST https://routes.googleapis.com/directions/v2:computeRoutes` con cabeceras `X-Goog-Api-Key` y `X-Goog-FieldMask`), que unifica el cálculo de distancia/duración con tráfico (`routes.distanceMeters,routes.duration`) y el trazado de polilínea (`routes.polyline.encodedPolyline`), además de proteger `.env` en `.gitignore`.
- **Qué se usó / modificó / descartó:** Se usó el endpoint moderno `directions/v2:computeRoutes` de `Routes API` en lugar de los endpoints heredados de `Directions` y `Distance Matrix`, se modificó `routeUtils.js` para enviar peticiones POST con `X-Goog-FieldMask` optimizado y se descartó versionar el archivo `.env` agregándolo a `.gitignore`.
- **Archivos y commit:** `package.json`, `app.json`, `.gitignore`, `.env.example`, `src/config/appConfig.js`, `src/hooks/useDriverLocation.js`, `src/utils/routeUtils.js`, `src/services/tripService.js`, `src/components/trip/SafeMapView.jsx` — `<pendiente_hash_commit>`
- **Verificación:** Configurar `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env`, reiniciar Expo con `npx expo start -c`, activar Disponible y simular una solicitud verificando que `Routes API` calcule `distanceKm`, `durationMin` y trace la ruta sobre el mapa de Google Maps.
- **Aprendizaje:** Google `Routes API` (`computeRoutes` v2) reemplaza y unifica las antiguas `Directions API` y `Distance Matrix API`, exigiendo el encabezado `X-Goog-FieldMask` para solicitar únicamente los campos necesarios (`distanceMeters`, `duration` o `encodedPolyline`) y reducir la latencia y el costo por petición.
