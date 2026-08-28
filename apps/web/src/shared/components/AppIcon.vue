<script setup lang="ts">
import { computed } from 'vue';

// Set de íconos tomado 1:1 de los SVG inline del proyecto de diseño
// (Diseño Maqueta Sistema Ganadero). Estilo Lucide (stroke, viewBox 24x24)
// más un ícono custom de "vaca".
const ICONS: Record<string, { strokeWidth?: number; inner: string }> = {
  home: {
    inner:
      '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  },
  cow: {
    strokeWidth: 1.8,
    inner:
      '<path d="M5 9.5c0-1.4 1-2.5 2.2-2.5S9 8.1 9 9.5"/><path d="M15 9.5c0-1.4 1-2.5 2.2-2.5S19 8.1 19 9.5"/><path d="M6.5 10a5.5 5.5 0 0 1 11 0v3a5.5 5.5 0 0 1-11 0z"/><circle cx="9.5" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="14.5" cy="12" r=".7" fill="currentColor" stroke="none"/><path d="M9 16c0 1.1 1.3 2 3 2s3-.9 3-2"/><circle cx="10.3" cy="16.3" r=".55" fill="currentColor" stroke="none"/><circle cx="13.7" cy="16.3" r=".55" fill="currentColor" stroke="none"/>',
  },
  activity: { inner: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
  heart: {
    inner:
      '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  },
  droplet: { inner: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
  wheat: {
    inner:
      '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/>',
  },
  map: {
    inner:
      '<path d="M9 20l-5.447 2.724A1 1 0 0 1 2 21.882V4.618a1 1 0 0 1 .553-.894L9 1l6 3 5.447-2.724A1 1 0 0 1 22 2.118v17.264a1 1 0 0 1-.553.894L15 23z"/><path d="M9 1v19"/><path d="M15 4v19"/>',
  },
  bars: { inner: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>' },
  account: { inner: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },
  users: {
    inner:
      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  search: { inner: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>' },
  bell: {
    inner:
      '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  },
  chevron: { inner: '<path d="M9 18l6-6-6-6"/>' },
  'arrow-left': { inner: '<path d="M15 18l-6-6 6-6"/>' },
  more: { inner: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>' },
  syringe: {
    inner:
      '<path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/>',
  },
  calendar: {
    inner:
      '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  },
  scale: {
    inner:
      '<path d="M16 16h6"/><path d="M2 16h6"/><path d="M12 2v4"/><path d="M12 22v-2"/><circle cx="12" cy="12" r="6"/>',
  },
  plus: { inner: '<path d="M5 12h14"/><path d="M12 5v14"/>' },
  filter: { inner: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>' },
  logout: {
    inner:
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  },
  lock: {
    inner:
      '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  },
  eye: {
    inner:
      '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  },
  'eye-off': {
    inner:
      '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="M2 2l20 20"/><path d="M9.53 9.53a3 3 0 0 0 4.24 4.24"/>',
  },
  briefcase: {
    inner:
      '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  },
};

const props = withDefaults(
  defineProps<{ name: keyof typeof ICONS | string; size?: number | string }>(),
  { size: 18 },
);

const icon = computed(() => ICONS[props.name] ?? ICONS.home);
const px = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size));
</script>

<template>
  <svg
    :width="px"
    :height="px"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="icon.strokeWidth ?? 2"
    stroke-linecap="round"
    stroke-linejoin="round"
    v-html="icon.inner"
  />
</template>
