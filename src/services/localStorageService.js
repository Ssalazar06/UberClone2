import AsyncStorage from '@react-native-async-storage/async-storage';

// 1) Save data
export const saveData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.log(`Error saving "${key}":`, error);
  }
};

// 2) Read data
export const getData = async (key) => {
  try {
    const json = await AsyncStorage.getItem(key);
    return json !== null ? JSON.parse(json) : null;
  } catch (error) {
    console.log(`Error reading "${key}":`, error);
    return null;
  }
};

// 3) Remove data
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.log(`Error removing "${key}":`, error);
  }
};

