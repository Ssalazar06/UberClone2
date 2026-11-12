import { useState, useEffect } from 'react';
import { getData, saveData } from '../context/StorageContext.js';


export const useAsyncStorage = (key, initialValue) => {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await getData(key);
      if (stored !== null) setValue(stored);
      setLoading(false);
    };
    load();
  }, [key]);


  const updateValue = async (newValue) => {
    setValue(newValue);
    await saveData(key, newValue);
  };

  return [value, updateValue, loading];
};