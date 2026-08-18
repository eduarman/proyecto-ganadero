<script setup lang="ts">
withDefaults(defineProps<{ title?: string; dark?: boolean }>(), { dark: false });
</script>

<template>
  <div class="section-card" :class="{ 'section-card--dark': dark }">
    <div v-if="title || $slots.actions" class="section-card__head">
      <div v-if="title" class="section-card__title">{{ title }}</div>
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>

<style scoped lang="scss">
.section-card {
  background: var(--color-white);
  border-radius: 1.25rem;
  padding: 1.35rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  &--dark {
    background: var(--color-dark);
    color: var(--color-bg);
    box-shadow: var(--shadow-card-strong);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  &__title {
    font-weight: 800;
    font-size: 1rem;
  }
}
</style>
