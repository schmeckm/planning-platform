import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';
import { cockpitAliasPlugin } from './vite.cockpit-alias.js';
import { resolveHaeMonorepoRoot, resolveHaePaths } from '../../scripts/resolve-hae-root.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const haePaths = resolveHaePaths(resolveHaeMonorepoRoot(__dirname));
const webNodeModules = path.resolve(__dirname, 'node_modules');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const oppApi = env.VITE_OPP_API_URL ?? 'http://127.0.0.1:3100';
  const authApi = env.VITE_AUTH_API_URL ?? 'http://127.0.0.1:3000';
  const haeApi = env.VITE_HAE_API_URL ?? 'http://127.0.0.1:8000';

  const fsAllow = [
    haePaths.haeRoot,
    haePaths.styles,
    haePaths.cockpitSrc,
    haePaths.portalSrc,
    haePaths.config,
    haePaths.processDefinitions,
    path.resolve(__dirname, '../..'),
  ];

  return {
    publicDir: haePaths.portalPublic,
    plugins: [cockpitAliasPlugin(), vue()],
    resolve: {
      dedupe: ['vue', 'pinia', 'vue-router', 'primevue', '@primevue/themes', 'vue-i18n'],
      alias: {
        primevue: path.resolve(webNodeModules, 'primevue'),
        '@portal': haePaths.portalSrc,
        '@cockpit': haePaths.cockpitSrc,
        '@styles': haePaths.styles,
      },
    },
    optimizeDeps: {
      include: [
        'element-plus',
        '@element-plus/icons-vue',
        'primevue/config',
        'primevue/toast',
        'primevue/toastservice',
        'primevue/confirmationservice',
        'primevue/useconfirm',
        'primevue/confirmdialog',
        'primevue/usetoast',
        'primevue/toasteventbus',
        '@primevue/themes/aura',
        'chart.js',
        'vue-chartjs',
        'frappe-gantt',
        'vue-i18n',
      ],
    },
    server: {
      fs: {
        allow: fsAllow,
      },
      port: Number(env.VITE_DEV_PORT ?? 5173),
      proxy: {
        '/api/pcp/v1': { target: oppApi, changeOrigin: true },
        '/api/v1': { target: haeApi, changeOrigin: true },
        '/api/v2': { target: haeApi, changeOrigin: true },
        '/api/v3': { target: haeApi, changeOrigin: true },
        '/api/v4': { target: haeApi, changeOrigin: true },
        '/api/v5': { target: haeApi, changeOrigin: true },
        '/ws': { target: haeApi, ws: true, changeOrigin: true },
        '/api': { target: authApi, changeOrigin: true },
        '/uploads': { target: authApi, changeOrigin: true },
        '/socket.io': { target: authApi, ws: true },
      },
    },
  };
});
