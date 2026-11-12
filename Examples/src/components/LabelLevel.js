import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, coloresPorNivel } from '../theme';

export default function LabelLevel({ level }) {
  const color = (coloresPorNivel && coloresPorNivel[level]) || colors.primario;

  return (
    <View style={[styles.container, { borderColor: color, backgroundColor: color + '15' }]}>
      <Text style={[styles.text, { color }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 2
  },
  text: {
    fontSize: 12,
    fontWeight: '800'
  },
});