<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-brand">
        <img src="/logo.svg" alt="" class="login-logo" />
        <h1>Open Planning Platform</h1>
        <p>Modular · Extensible · Open</p>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <label>
          E-Mail
          <input v-model="email" type="email" autocomplete="username" required />
        </label>
        <label>
          Passwort
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="auth.error" class="login-error">{{ auth.error }}</p>
        <button class="btn btn-primary login-btn" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Anmelden…' : 'Anmelden' }}
        </button>
      </form>

      <p class="login-hint">
        Demo: <code>admin@localhost</code> / <code>admin123</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('admin@localhost');
const password = ref('admin123');

async function submit() {
  await auth.login(email.value, password.value);
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
  await router.push(redirect);
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.18), transparent 40%),
    var(--PCP-bg);
}

.login-card {
  width: min(420px, 100%);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.login-brand { text-align: center; }

.login-logo {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
}

.login-brand h1 {
  font-size: 20px;
  font-weight: 700;
}

.login-brand p {
  margin-top: 4px;
  font-size: 12px;
  color: var(--PCP-text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: var(--PCP-text-muted);
}

.login-form input {
  padding: 10px 12px;
  border-radius: var(--PCP-radius);
  border: 1px solid var(--PCP-border);
  background: var(--PCP-surface2);
  color: var(--PCP-text);
  font-size: 14px;
}

.login-error {
  color: #fca5a5;
  font-size: 13px;
}

.login-btn { width: 100%; }

.login-hint {
  text-align: center;
  font-size: 12px;
  color: var(--PCP-text-muted);
}

.login-hint code {
  font-family: 'JetBrains Mono', monospace;
  color: var(--PCP-primary);
}
</style>
