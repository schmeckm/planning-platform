import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';
import { i18n } from './i18n/index.js';
import { setupCockpitPlugins } from './cockpit/setup.js';
import { useThemeStore } from '@portal/stores/themeStore';
import { useAuthStore } from '@portal/stores/authStore';
import '@portal/styles/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
setupCockpitPlugins(app);
app.use(i18n);
app.use(router);

const themeStore = useThemeStore(pinia);
themeStore.init();

async function bootstrap() {
  const authStore = useAuthStore(pinia);
  if (authStore.isAuthenticated) {
    await authStore.bootstrapSession();
  }
  app.mount('#app');
}

bootstrap();
