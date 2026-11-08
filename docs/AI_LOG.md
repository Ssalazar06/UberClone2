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

### Entrada #3
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

### Entrada #8
- **Fecha:** 2026-11-07
- **Integrante:** Santiago Salazar Atehortua (Rama: `santiago`)
- **Herramienta:** Gemini 3.8 Flash
- **Objetivo:** Implementar la Fase 1 del modo conductor: función pura de cálculo de tarifas, constantes de estado de viajes, servicio de Firestore para viajes con transacciones atómicas, simulador de pasajeros en consola, contexto de viaje activo y arquitectura de navegación Root (Registro vs MainDrawer).
- **Prompt:** "Si, empecemso porfa con la fase 1, recuerda seguir la misma estructura que llevamos y que sea parecido a lso ejemplso que tenemos en examples"
- **Resumen de la respuesta:** Se estructuró el cálculo de tarifa en pesos colombianos cumpliendo la fórmula oficial y redondeo a 100 COP. Se creó `tripService.js` siguiendo el patrón modular de `ExamplesServicesBd.js` e incorporando `runTransaction` para aceptar solicitudes sin colisiones. Se implementó el script `scripts/simulatePassenger.mjs` para simular solicitudes, cancelaciones y pagos de pasajeros. Se construyeron `ActiveTripContext.js`, el hook `useActiveTrip.js`, el navegador de cajón `MainDrawerNavigator.js` y el selector `RootNavigator.js`.
- **Qué se usó / modificó / descartó:** Se usó la sintaxis modular de Firebase vista en `docs/Examples/ExamplesServicesBd.js`, se adaptó el flujo con `runTransaction` y `onSnapshot` con limpieza de memoria para solicitudes en tiempo real, y se descartó delegar la simulación a la app móvil, centralizándola en un script de Node para no ensuciar la lógica del conductor.
- **Archivos y commit:** `src/utils/calculateFare.js`, `src/constants/tripStatus.js`, `src/services/tripService.js`, `scripts/simulatePassenger.mjs`, `src/context/ActiveTripContext.js`, `src/hooks/useActiveTrip.js`, `src/navigation/MainDrawerNavigator.js`, `src/navigation/RootNavigator.js`, `App.js` — `<pendiente_hash_commit>`
- **Verificación:** Ejecución de pruebas unitarias sobre `calculateFare.js` con Node.js comprobando los valores del documento (Económico 19.200 COP y XL 26.900 COP), y verificación del menú de ayuda del simulador `scripts/simulatePassenger.mjs`.
- **Aprendizaje:** Emplear `runTransaction` en Firestore previene condiciones de carrera cuando múltiples conductores intentan aceptar la misma carrera o cuando el pasajero cancela en el mismo milisegundo. Desacoplar el simulador como un proceso externo permite probar la aplicación del conductor exactamente como funcionaría en producción.