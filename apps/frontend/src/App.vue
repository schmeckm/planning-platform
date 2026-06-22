<template>
  <Toast position="top-right" />
  <RouterView />
  <CookieBanner />
</template>

<script setup>
import { RouterView } from 'vue-router';
import Toast from 'primevue/toast';
import CookieBanner from '@portal/components/legal/CookieBanner.vue';
</script>
