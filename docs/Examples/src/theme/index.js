import { Platform } from 'react-native';
 
export const colors = {
  fondo: '#F6F7FB',
  superficie: '#FFFFFF',
  primario: '#4F46E5',
  primarioOscuro: '#3730A3',
  primarioSuave: '#EEF0FF',
  acento: '#F59E0B',
  acentoSuave: '#FEF3C7',
  exito: '#0E9F6E',
  peligro: '#E11D48',
  texto: '#111827',
  textoSuave: '#6B7280',
  borde: '#E5E7EB',
};
 
// Escala de espaciado basada en múltiplos de 4
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};
 
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 999,
};
 
export const typography = {
  titulo: { fontSize: 26, fontWeight: '800', color: colors.texto },
  subtitulo: { fontSize: 18, fontWeight: '700', color: colors.texto },
  cuerpo: { fontSize: 15, color: colors.texto },
  secundario: { fontSize: 13, color: colors.textoSuave },
  etiqueta: { fontSize: 12, fontWeight: '600' },
};
 
 
export const sombra = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  android: { elevation: 3 },
});
 
export const coloresPorNivel = {
  Basico: colors.exito,
  Intermedio: colors.primario,
  Avanzado: colors.acento,
  Conversacional: '#7C3AED',
};
 
export default { colors, spacing, radius, typography, sombra, coloresPorNivel };