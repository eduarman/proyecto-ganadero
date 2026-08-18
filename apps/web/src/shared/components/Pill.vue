<script setup lang="ts">
withDefaults(
  defineProps<{ bg?: string; color?: string }>(),
  { bg: 'var(--color-bg)', color: 'var(--color-primary)' },
);
</script>

<template>
  <span class="pill" :style="{ background: bg, color }">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  white-space: nowrap;
}
</style>
