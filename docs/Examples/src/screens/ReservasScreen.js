import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import useReserva from "../hooks/useReserva";
import useResponsive from "../hooks/useResponsive";
import LabelLevel from "../components/LabelLevel";
import EmptyState from "../components/EmptyState";
import { formatearPrecio } from "../data/clases";
import { colors, spacing, radius, typography, sombra } from "../theme";

export default function ReservasScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { paddingHorizontal } = useResponsive();

  // Obtenemos los datos y funciones desde el contexto de reservas
  const { reservas, cargando, cancelarReserva } = useReserva();

  // Función para confirmar la cancelación de una reserva y devolver el cupo
  const handleCancelar = (reserva) => {
    Alert.alert(
      "Cancelar Reserva",
      `¿Estás seguro de que deseas cancelar la Reserva #${reserva.id} de "${reserva.titulo}"?`,
      [
        { text: "No, mantener", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => {
            cancelarReserva(reserva.id);
            Alert.alert(
              "Reserva cancelada",
              "Tu reserva ha sido cancelada y el cupo se ha devuelto a la clase con éxito."
            );
          },
        },
      ]
    );
  };

  // Pantalla de carga mientras se lee AsyncStorage
  if (cargando) {
    return (
      <View style={[styles.pantalla, styles.centrado]}>
        <ActivityIndicator size="large" color={colors.primario} />
        <Text style={styles.textoCargando}>Cargando reservas</Text>
      </View>
    );
  }

  return (
    <View style={[styles.pantalla, { paddingTop: insets.top }]}>
      {/* Encabezado de la pantalla */}
      <View style={[styles.encabezado, { paddingHorizontal }]}>
        <View style={styles.filaTitulo}>
          <Text style={styles.titulo}>Mis Reservas</Text>
          <View style={styles.badgeContador}>
            <Text style={styles.textoBadge}>
              {reservas.length} {reservas.length === 1 ? "clase" : "clases"}
            </Text>
          </View>
        </View>
        <Text style={styles.subtitulo}>
          Historial y gestión de tus clases reservadas
        </Text>
      </View>

      {/* Si no hay reservas, mostrar vacio*/}
      {reservas.length === 0 ? (
        <View style={styles.contenedorVacio}>
          <EmptyState
            icono="calendar-outline"
            titulo="No tienes reservas activas"
            mensaje="Aún no has reservado ninguna clase de inglés. Explora el catálogo y agenda tu horario."
          />
          <Pressable
            style={styles.botonExplorar}
            onPress={() => navigation.navigate("ClasesTab")}
          >
            <Ionicons name="book-outline" size={18} color="#FFFFFF" />
            <Text style={styles.textoBotonExplorar}>Explorar Clases</Text>
          </Pressable>
        </View>
      ) : (
        /* Lista de reservas */
        <FlatList
          data={reservas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listaContenido,
            { paddingHorizontal, paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.tarjetaReserva, sombra]}>
              {/* Barra superior de la tarjeta: ID autoincremental y Nivel */}
              <View style={styles.cabeceraTarjeta}>
                <View style={styles.badgeId}>
                  <Ionicons
                    name="bookmark"
                    size={14}
                    color={colors.primario}
                  />
                  <Text style={styles.textoId}>Reserva #{item.id}</Text>
                </View>

                {item.nivel ? <LabelLevel level={item.nivel} /> : null}
              </View>

              {/* Contenido con imagen, título y profesor */}
              <View style={styles.filaPrincipal}>
                {item.imagen ? (
                  <Image
                    source={{ uri: item.imagen }}
                    style={styles.imagenClase}
                  />
                ) : null}

                <View style={styles.infoClase}>
                  <Text style={styles.tituloClase} numberOfLines={2}>
                    {item.titulo}
                  </Text>
                  <View style={styles.filaProfesor}>
                    <Ionicons
                      name="person-circle-outline"
                      size={16}
                      color={colors.textoSuave}
                    />
                    <Text style={styles.textoProfesor}>{item.profesor}</Text>
                  </View>
                </View>
              </View>

              {/* Detalles: Horario, Modalidad y Precio */}
              <View style={styles.seccionDetalles}>
                {/* Horario reservado */}
                <View style={styles.filaDetalle}>
                  <Ionicons
                    name="time"
                    size={16}
                    color={colors.primario}
                  />
                  <Text style={styles.textoDetalleResaltado}>
                    Horario: {item.horario}
                  </Text>
                </View>

                <View style={styles.filaDetalle}>
                  <Ionicons
                    name={
                      item.modalidad === "Virtual"
                        ? "videocam-outline"
                        : "location-outline"
                    }
                    size={16}
                    color={colors.textoSuave}
                  />
                  <Text style={styles.textoDetalle}>
                    Modalidad: {item.modalidad || "Virtual"}
                  </Text>
                </View>

                <View style={styles.filaDetalle}>
                  <Ionicons
                    name="pricetag-outline"
                    size={16}
                    color={colors.textoSuave}
                  />
                  <Text style={styles.textoPrecio}>
                    {formatearPrecio(item.precio)}
                  </Text>
                </View>
              </View>

              {/*Fecha de reserva y Botón cancelar */}
              <View style={styles.pieTarjeta}>
                <Text style={styles.fechaTexto}>
                  Reservado el: {item.fechaCreacion}
                </Text>

                <Pressable
                  style={styles.botonCancelar}
                  onPress={() => handleCancelar(item)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.peligro}
                  />
                  <Text style={styles.textoBotonCancelar}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.fondo,
  },
  centrado: {
    justifyContent: "center",
    alignItems: "center",
  },
  textoCargando: {
    marginTop: spacing.sm,
    ...typography.cuerpo,
    color: colors.textoSuave,
  },
  encabezado: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  filaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titulo: {
    ...typography.titulo,
    fontSize: 24,
  },
  subtitulo: {
    ...typography.secundario,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  badgeContador: {
    backgroundColor: colors.primarioSuave,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  textoBadge: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primario,
  },
  contenedorVacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: spacing.xxl,
  },
  botonExplorar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primario,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  textoBotonExplorar: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  listaContenido: {
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  tarjetaReserva: {
    backgroundColor: colors.superficie,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  cabeceraTarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badgeId: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarioSuave,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  textoId: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primario,
  },
  filaPrincipal: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  imagenClase: {
    width: 65,
    height: 65,
    borderRadius: radius.md,
    backgroundColor: colors.primarioSuave,
  },
  infoClase: {
    flex: 1,
    justifyContent: "center",
  },
  tituloClase: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.texto,
    marginBottom: 4,
  },
  filaProfesor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  textoProfesor: {
    fontSize: 13,
    color: colors.textoSuave,
  },
  seccionDetalles: {
    backgroundColor: colors.fondo,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.md,
  },
  filaDetalle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  textoDetalle: {
    fontSize: 13,
    color: colors.texto,
  },
  textoDetalleResaltado: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primario,
  },
  textoPrecio: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.texto,
  },
  pieTarjeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    paddingTop: spacing.md,
  },
  fechaTexto: {
    fontSize: 12,
    color: colors.textoSuave,
  },
  botonCancelar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  textoBotonCancelar: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.peligro,
  },
});
