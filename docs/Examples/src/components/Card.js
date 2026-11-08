import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import LabelLevel from './LabelLevel';
import { colors, radius, spacing, typography } from '../theme';
import { formatearPrecio } from '../data/clases';

export default function Card({ clase, urlImage, onPress, width }) {
  if (!clase) return null;

  const imageUri = clase.imagen || clase.image || urlImage;

  return (
    <Pressable
      style={[style.tarjeta, width ? { width } : null]}
      onPress={onPress}
    >
      {imageUri && (
        <Image source={{ uri: imageUri }} style={style.imagen} />
      )}
      <View style={style.cuerpo}>
        {clase.nivel && <LabelLevel level={clase.nivel} />}
        <Text style={typography.subtitulo}>{clase.titulo}</Text>
        
        <Text style={typography.subtitulo}>{clase.profesor?.nombre}</Text>
        
        <Text style={typography.cuerpo}>
          {Array.isArray(clase.horarios) ? clase.horarios[0] : clase.horarios}
        </Text>
        
        <Text style={typography.cuerpo}>{formatearPrecio(clase.precio)}</Text>
      </View>
    </Pressable>
  );
}

const style = StyleSheet.create({
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  imagen: {
    width: '100%',
    height: 130,
    backgroundColor: colors.primarioSuave,
  },
  cuerpo: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.texto },
  filaProfesor: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.borde },
  profesor: { fontSize: 13, color: colors.textoSuave, flexShrink: 1 },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  filaCentro: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: colors.textoSuave },
  punto: { color: colors.borde, marginHorizontal: 2 },
  precio: { fontSize: 14, fontWeight: '800', color: colors.primario },
});
