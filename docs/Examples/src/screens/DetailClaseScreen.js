import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useResponsive from "../hooks/useResponsive";
import useReserva from "../hooks/useReserva";
import { colors, spacing, radius, typography, sombra } from "../theme";
import { CLASES, formatearPrecio } from "../data/clases";
import LabelLevel from "../components/LabelLevel";

export default function DetailClase({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { clase } = route.params;
  const { paddingHorizontal, isTable } = useResponsive();
  const esTablet = isTable;

  // Accedemos a la función agregarReserva del contexto
  const { agregarReserva } = useReserva();

  // Buscamos la clase en CLASES para mantener siempre la referencia y los cupos actualizados
  const claseInfo = CLASES.find((claseItem) => String(claseItem.id) === String(clase.id)) || clase;

  // Estado para el horario seleccionado
  const [horario, setHorario] = useState(claseInfo?.horarios?.[0] || "");

  // Estado para llevar conteo reactivo de cupos
  const [cupos, setCupos] = useState(claseInfo.cupos);

  // Mantenemos sincronizado el estado si los cupos cambian (ej: al cancelar una reserva)
  useEffect(() => {
    setCupos(claseInfo.cupos);
  }, [claseInfo.cupos]);

  const handleVolver = () => {
    navigation.navigate("ClasesList");
  };

  const handleReservar = () => {
    if (cupos <= 0) {
      Alert.alert("Sin cupos disponibles", "No quedan cupos para esta clase.");
      return;
    }

    // Intentamos agregar la reserva
    const resultado = agregarReserva(claseInfo, horario);

    // Si hubo conflicto con la reserva
    if (!resultado.ok) {
      Alert.alert("Horario no disponible", resultado.mensaje);
      return;
    }

    // Actualizamos el estado de cupos con el nuevo valor
    setCupos(claseInfo.cupos);

    // Alerta de confirmación con el ID autoincremental
    Alert.alert(
      "¡Reserva Confirmada!",
      `Tu reserva #${resultado.id} para "${claseInfo.titulo}" en el horario ${horario} ha sido realizada con éxito.`,
      [
        {
          text: "Ver mis reservas",
          onPress: () => navigation.navigate("ReservasTab"),
        },
        { text: "Aceptar", style: "cancel" },
      ]
    );
  };

  return (
    <View style={styles.pantalla}>
      {/*Devolverse*/}
      <Pressable
        style={[styles.botonVolver, { top: insets.top + spacing.sm }]}
        onPress={handleVolver}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="arrow-back" size={24} color={colors.texto} />
      </Pressable>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={insets.top} />
        {/* Imagen de portada */}
        <View>
          <Image
            source={{ uri: clase.imagen }}
            resizeMode="cover"
            style={[styles.portada, { height: esTablet ? 300 : 220 }]}
          />
        </View>

        {/* Contenido principal */}
        <View style={[styles.cuerpo, { paddingHorizontal }]}>
          {/* Nivel y Rating */}
          <View style={styles.filaEncabezado}>
            <LabelLevel level={clase.nivel} />
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingTexto}>{clase.rating}</Text>
            </View>
          </View>

          {/* Título y Descripción */}
          <Text style={styles.titulo}>{clase.titulo}</Text>
          <Text style={styles.descripcion}>{clase.descripcion}</Text>

          {/* Nombre y Foto del Profesor */}
          <Text style={styles.seccionTitulo}>Profesor</Text>
          <View style={styles.profesor}>
            <Image
              source={{ uri: clase.profesor.foto }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.profesorNombre}>{clase.profesor.nombre}</Text>
              <Text style={typography.secundario}>{clase.profesor.pais}</Text>
            </View>
          </View>

          {/* Duración, Modalidad y Cupos */}
          <Text style={styles.seccionTitulo}>Detalles de la clase</Text>
          <View style={[styles.datos, sombra]}>
            <View style={styles.dato}>
              <Ionicons name="time-outline" size={20} color={colors.primario} />
              <Text style={typography.secundario}>Duración</Text>
              <Text style={styles.datoValor}>{clase.duracion} min</Text>
            </View>

            <View style={styles.separadorVertical} />

            <View style={styles.dato}>
              <Ionicons
                name={
                  clase.modalidad === "Virtual"
                    ? "videocam-outline"
                    : "location-outline"
                }
                size={20}
                color={colors.primario}
              />
              <Text style={typography.secundario}>Modalidad</Text>
              <Text style={styles.datoValor}>{clase.modalidad}</Text>
            </View>

            <View style={styles.separadorVertical} />

            <View style={styles.dato}>
              <Ionicons name="people-outline" size={20} color={colors.primario} />
              <Text style={typography.secundario}>Cupos</Text>
              <Text style={styles.datoValor}>{cupos}</Text>
            </View>
          </View>

          {/* Horarios disponibles */}
          <Text style={styles.seccionTitulo}>Horarios disponibles</Text>
          <View style={styles.horariosContainer}>
            {clase.horarios.map((item, index) => {
              const activo = horario === item;
              return (
                <Pressable
                  key={index}
                  onPress={() => setHorario(item)}
                  style={[
                    styles.horarioChip,
                    activo && styles.horarioChipActivo,
                  ]}
                >
                  <Ionicons
                    name="alarm-outline"
                    size={16}
                    color={activo ? "#FFFFFF" : colors.textoSuave}
                  />
                  <Text
                    style={[
                      styles.horarioTexto,
                      activo && styles.horarioTextoActivo,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Precio y Botón Reservar Clase */}
      <View
        style={[
          styles.barra,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md),
            paddingHorizontal,
          },
        ]}
      >
        <View>
          <Text style={typography.secundario}>Precio total</Text>
          <Text style={styles.precio}>{formatearPrecio(clase.precio)}</Text>
        </View>
        <Pressable
          style={[
            styles.botonReservar,
            cupos === 0 && { backgroundColor: colors.textoSuave },
          ]}
          onPress={handleReservar}
          
        >
          <Text style={styles.textoBotonReservar}>
            {cupos === 0 ? "Sin Cupos" : "Reservar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  portada: {
    width: "100%",
    backgroundColor: colors.primarioSuave,
  },
  botonVolver: {
    position: "absolute",
    left: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cuerpo: {
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  filaEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingTexto: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.texto,
  },
  titulo: {
    ...typography.titulo,
    fontSize: 22,
  },
  descripcion: {
    ...typography.cuerpo,
    color: colors.textoSuave,
    lineHeight: 22,
  },
  seccionTitulo: {
    ...typography.subtitulo,
    fontSize: 16,
    marginTop: spacing.sm,
  },
  profesor: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.superficie,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borde,
  },
  profesorNombre: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.texto,
  },
  datos: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.superficie,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  dato: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  datoValor: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.texto,
  },
  separadorVertical: {
    width: 1,
    height: "60%",
    backgroundColor: colors.borde,
  },
  horariosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  horarioChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.superficie,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  horarioChipActivo: {
    backgroundColor: colors.primario,
    borderColor: colors.primario,
  },
  horarioTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.texto,
  },
  horarioTextoActivo: {
    color: "#FFFFFF",
  },
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.superficie,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    paddingTop: spacing.md,
  },
  precio: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primario,
  },
  botonReservar: {
    backgroundColor: colors.primario,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  textoBotonReservar: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});