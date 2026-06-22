import { definePreset } from '@primeuix/themes';
import Aura from '@primevue/themes/aura';

export const CockpitPrimePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef2fd',
      100: '#dce4fa',
      200: '#b9c9f5',
      300: '#96aef0',
      400: '#7393eb',
      500: '#4169e1',
      600: '#2f57cf',
      700: '#284bb5',
      800: '#1f3a8c',
      900: '#162964',
      950: '#0d1838',
    },
  },
});

export const cockpitPrimeOptions = {
  darkModeSelector: 'none',
  cssLayer: false,
};
