import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import 'primeicons/primeicons.css';
import { CockpitPrimePreset, cockpitPrimeOptions } from './primeTheme.js';
import '../../../../../cockpit/src/styles/main.css';

let registered = false;

export function setupCockpitPlugins(app) {
  if (registered) return;
  registered = true;

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  app.use(ElementPlus);
  app.use(PrimeVue, {
    theme: { preset: CockpitPrimePreset, options: cockpitPrimeOptions },
  });
  app.use(ToastService);
  app.use(ConfirmationService);
}
