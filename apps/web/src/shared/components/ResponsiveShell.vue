<script setup lang="ts">
import { useBreakpoint } from '../composables/useBreakpoint';
import AppLayout from '../../layouts/AppLayout.vue';
import MobileLayout from '../../layouts/MobileLayout.vue';

const { isMobile } = useBreakpoint();
</script>

<template>
  <MobileLayout v-if="isMobile" />
  <AppLayout v-else />
</template>
