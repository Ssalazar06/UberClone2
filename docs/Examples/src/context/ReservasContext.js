import React, { useState, useEffect, useCallback, useMemo, createContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CLASES } from "../data/clases";

// Claves de almacenamiento para AsyncStorage
const CLAVE_RESERVAS = "@reservas_ingles";
const CLAVE_CONTADOR = "@contador_reservas_ingles";

export const ReservasContext = createContext(null);

export function ReservaProvider({ children }) {
  const [reservas, setReservas] = useState([]);
  const [ultimoId, setUltimoId] = useState(0);
  const [cargando, setCargando] = useState(true);

  // 1. Cargar las reservas guardadas y el contador al iniciar la aplicación
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const guardado = await AsyncStorage.getItem(CLAVE_RESERVAS);
        const contadorGuardado = await AsyncStorage.getItem(CLAVE_CONTADOR);

        let maxId = 0;
        if (guardado !== null) {
          const lista = JSON.parse(guardado);
          setReservas(lista);
          if (lista.length > 0) {
            maxId = Math.max(...lista.map((reserva) => Number(reserva.id) || 0));

            // Sincronizamos los cupos de CLASES según las reservas guardadas
            lista.forEach((reserva) => {
              const claseEncontrada = CLASES.find((item) => String(item.id) === String(reserva.claseId));
              if (claseEncontrada && claseEncontrada.cupos > 0) {
                claseEncontrada.cupos -= 1;
              }
            });
          }
        }

        const idContador = contadorGuardado ? Number(contadorGuardado) : 0;
        setUltimoId(Math.max(maxId, idContador));
      } catch (error) {
        console.log("Error leyendo reservas desde AsyncStorage:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // 2. Guardar en AsyncStorage automáticamente cuando cambie la lista de reservas
  useEffect(() => {
    if (cargando) return;
    AsyncStorage.setItem(CLAVE_RESERVAS, JSON.stringify(reservas)).catch((error) =>
      console.log("Error al guardar reservas en AsyncStorage:", error)
    );
  }, [reservas, cargando]);

  // 3. Función para agregar una reserva con validaciones
  const agregarReserva = useCallback(
    (clase, horario) => {
      // Validación: No permitir 2 clases el mismo día a la misma hora
      // Compara el texto del horario
      // Si el día es igual pero la hora diferente
      const horarioNormalizado = horario ? horario.trim().toLowerCase() : "";
      const conflicto = reservas.find(
        (reserva) => reserva.horario && reserva.horario.trim().toLowerCase() === horarioNormalizado
      );

      if (conflicto) {
        return {
          ok: false,
          mensaje: `Ya tienes una clase reservada para ${horario} ("${conflicto.titulo}"). No puedes reservar 2 clases el mismo día a la misma hora.`,
        };
      }

      // Restamos el cupo a la clase en memoria
      const claseEncontrada = CLASES.find((claseItem) => String(claseItem.id) === String(clase.id));
      if (claseEncontrada) {
        claseEncontrada.cupos = Math.max(0, claseEncontrada.cupos - 1);
      }

      // ID Autoincremental
      const nuevoId = Math.max(
        ultimoId,
        reservas.length > 0 ? Math.max(...reservas.map((reserva) => Number(reserva.id) || 0)) : 0
      ) + 1;

      // Actualizamos el contador y lo guardamos
      setUltimoId(nuevoId);
      AsyncStorage.setItem(CLAVE_CONTADOR, String(nuevoId)).catch((error) =>
        console.log("Error al guardar contador de id:", error)
      );

      const nueva = {
        id: nuevoId,
        claseId: clase.id,
        titulo: clase.titulo,
        profesor: clase.profesor?.nombre || "Profesor",
        imagen: clase.imagen,
        nivel: clase.nivel,
        modalidad: clase.modalidad,
        precio: clase.precio,
        horario: horario,
        fechaCreacion: new Date().toLocaleDateString("es-CO"),
      };

      setReservas((previas) => [nueva, ...previas]);

      return {
        ok: true,
        id: nuevoId,
        mensaje: "Reserva realizada con éxito",
      };
    },
    [reservas, ultimoId]
  );

  // 4. Función para cancelar/eliminar una reserva por su ID y devolver el cupo
  const cancelarReserva = useCallback((id) => {
    setReservas((previas) => {
      // 1. Buscamos la reserva a cancelar
      const reservaACancelar = previas.find((reserva) => reserva.id === id);

      if (reservaACancelar) {
        // 2. Buscamos la clase en la lista de CLASES para devolverle el cupo
        const claseEncontrada = CLASES.find(
          (claseItem) => String(claseItem.id) === String(reservaACancelar.claseId)
        );

        if (claseEncontrada) {
          claseEncontrada.cupos += 1;
        }
      }

      // 3. Filtramos la lista de reservas
      return previas.filter((reserva) => reserva.id !== id);
    });
  }, []);

  const valor = useMemo(
    () => ({ cargando, reservas, agregarReserva, cancelarReserva }),
    [cargando, reservas, agregarReserva, cancelarReserva]
  );

  return (
    <ReservasContext.Provider value={valor}>
      {children}
    </ReservasContext.Provider>
  );
}