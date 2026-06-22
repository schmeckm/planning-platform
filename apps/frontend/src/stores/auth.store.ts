import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const TOKEN_KEY = 'opp.auth.token';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  displayName?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY));
  const user = ref<AuthUser | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(token.value));

  function setSession(newToken: string, newUser: AuthUser) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem(TOKEN_KEY, newToken);
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await axios.post<{ token: string; user: AuthUser }>(
        '/api/auth/login',
        { email, password, privacyConsent: true, privacyPolicyVersion: '1.0' },
      );
      setSession(res.data.token, res.data.user);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        error.value = e.response?.data?.error?.message ?? 'Login failed';
      } else {
        error.value = e instanceof Error ? e.message : 'Login failed';
      }
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe() {
    if (!token.value) return;
    try {
      const res = await axios.get<AuthUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      user.value = res.data;
    } catch {
      clearSession();
    }
  }

  function logout() {
    clearSession();
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    fetchMe,
    logout,
  };
});
