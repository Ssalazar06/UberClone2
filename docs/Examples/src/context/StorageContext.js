import AsyncStorage from '@react-native-async-storage/async-storage';


// 1) Guardar datos

export const saveData = async (key, value) => {
  try {
    const json = JSON.stringify(value);
    await AsyncStorage.setItem(key, json);
    console.log(`setItem("${key}")`, json);
  } catch (error) {
    console.log('Error guardando:', error);
  }
};

// 2) Consultar datos

export const getData = async (key) => {
  try {
    const json = await AsyncStorage.getItem(key);
    console.log(`getItem("${key}")`, json);
    return json !== null ? JSON.parse(json) : null;
  } catch (error) {
    console.log('Error leyendo:', error);
    return null;
  }
};

// 3) Eliminar

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`removeItem("${key}")`);
  } catch (error) {
    console.log('Error eliminando:', error);
  }
};

// 4) Borrar TODO el almacenamiento de la app

export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    console.log('clear()');
  } catch (error) {
    console.log('Error limpiando:', error);
  }
};

// ver TODO lo guardado

export const getAllRaw = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return await AsyncStorage.multiGet(keys);
  } catch (error) {
    console.log('Error leyendo todo:', error);
    return [];
  }
};
