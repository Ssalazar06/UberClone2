import React from 'react'
import {Pressable, Text, StyleSheet} from 'react-native'
import {colors, radius, spacing} from '../theme'


function LevelChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        style.chip,
        active && style.chipActivo,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[style.texto, active && style.textoActivo]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default LevelChip;

const style = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.superficie,
    borderWidth: 1.5,
    borderColor: colors.borde,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipActivo: {
    backgroundColor: colors.primario,
    borderColor: colors.primario,
  },
  texto: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.texto,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  textoActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});