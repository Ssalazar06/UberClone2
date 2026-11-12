import { useState, useEffect, useCallback, act } from "react";

import AsyncStorage from '@react-native-async-storage/async-storage'

export default function useAlmacenamiento(clave, valorInicial){
    const [valor,setValor] = useState(valorInicial);
    const [listo,setListo] = useState(false);

    useEffect(() => {
        let activo = true;
        AsyncStorage.getItem(clave)
        .then((guardando) => {
            if(activo && guardando != null){
                setValor(JSON.parse(guardando))
            }
        })
        .catch((error) => {console.log(`Error leyendo ${clave, error}`)
        })
        .finally(()=>activo && setListo(true));

        return ()=>{
            activo = false
        }
    }, [clave])

    const actualizar = useCallback(
        async(nuevoValor) => {
            setValor(nuevoValor);
            try {
                await AsyncStorage.setItem(clave, JSON.stringify(nuevoValor));
            } catch (error) {
                console.log('Error guardando: ' + {clave, error});
            }
        }, [clave]
    )
}; //cierre funcion