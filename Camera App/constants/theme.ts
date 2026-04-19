/**
 * Little Letters — Design System & Theme
 *
 * Playful, kid-friendly color palette with large touch targets,
 * rounded shapes, and bouncy animations.
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary palette
  sunnyYellow: '#FFD60A',
  skyBlue: '#4CC9F0',
  coral: '#F72585',
  grassGreen: '#06D6A0',
  purple: '#7B2FF7',
  orange: '#FF9E00',

  // Neutrals
  white: '#FFFFFF',
  softWhite: '#FFF8F0',
  lightGray: '#F0F0F0',
  midGray: '#B0B0B0',
  darkGray: '#4A4A4A',
  charcoal: '#2D2D2D',
  black: '#000000',

  // Functional
  success: '#06D6A0',
  warning: '#FF9E00',
  error: '#F72585',
  info: '#4CC9F0',

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.85)',
} as const;

/** Pastel variants for letter cards — each letter gets a unique card color */
export const LetterCardColors = [
  '#FFE0E6', // pink
  '#FFE8CC', // peach
  '#FFF3CC', // yellow
  '#D4F5D4', // mint
  '#CCF0FF', // sky
  '#E0D4FF', // lavender
  '#FFD4E8', // rose
  '#D4FFED', // seafoam
  '#FFE6D4', // salmon
  '#D4E8FF', // periwinkle
] as const;

export const Fonts = {
  family: {
    regular: 'Nunito_400Regular',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    display: 64,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: Platform.select({
    web: { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  })!,
  md: Platform.select({
    web: { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  })!,
  lg: Platform.select({
    web: { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.2)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  })!,
};

/** Minimum touch target size (accessibility + kid-friendly) */
export const MIN_TOUCH_TARGET = 56;

/** Animation presets for react-native-reanimated */
export const AnimationConfig = {
  spring: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  },
  bounce: {
    damping: 8,
    stiffness: 200,
    mass: 0.6,
  },
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
} as const;
