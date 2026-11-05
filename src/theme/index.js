// AI-assisted: see docs/AI_LOG.md #1
import { Platform } from 'react-native';

/**
 * Global theme (green palette). Keep every screen and component using these
 * tokens instead of raw hex values.
 */
export const colors = {
  primary: '#1B7F3B',
  primaryDark: '#145C2B',
  primarySoft: '#E7F5EC',
  primaryText: '#FFFFFF',
  secondary: '#00A86B',
  background: '#F4F8F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#13201A',
  textSecondary: '#55665C',
  textMuted: '#8A9A90',
  border: '#DCE5DF',
  borderFocus: '#1B7F3B',
  error: '#D32F2F',
  errorLight: '#FDECEC',
  warning: '#B26A00',
  warningLight: '#FFF4E0',
  success: '#2E7D32',
  successLight: '#E8F5E9',
  disabled: '#E3E9E5',
  disabledText: '#9AA79F',
  overlay: 'rgba(10, 20, 14, 0.45)',
};

// Spacing scale based on multiples of 4
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  display: { fontSize: 30, fontWeight: '800', lineHeight: 38, color: colors.text },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 30, color: colors.text },
  subtitle: { fontSize: 17, fontWeight: '600', lineHeight: 24, color: colors.text },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22, color: colors.text },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: colors.text },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16, color: colors.textSecondary },
  button: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
};

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#0F1F16',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    default: { elevation: 1 },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#0F1F16',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    default: { elevation: 3 },
  }),
};

export default { colors, spacing, radius, typography, shadows };

