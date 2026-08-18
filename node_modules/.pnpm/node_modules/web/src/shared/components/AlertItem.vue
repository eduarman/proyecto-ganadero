<script setup lang="ts">
import Pill from './Pill.vue';

withDefaults(
  defineProps<{
    tag: string;
    title: string;
    detail: string;
    pillBg?: string;
    pillColor?: string;
  }>(),
  { pillBg: 'var(--color-neutral-bg)', pillColor: 'var(--color-primary)' },
);
</script>

<template>
  <div class="alert-item">
    <Pill :bg="pillBg" :color="pillColor" class="alert-item__tag">{{ tag }}</Pill>
    <div class="alert-item__body">
      <div class="alert-item__title">{{ title }}</div>
      <div class="alert-item__detail">{{ detail }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.alert-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.9rem;
  background: var(--color-bg);

  &__tag {
    flex: none;
    height: fit-content;
  }

  &__body {
    min-width: 0;
  }

  &__title {
    font-size: 0.82rem;
    font-weight: 700;
  }

  &__detail {
    font-size: 0.75rem;
    color: rgba(40, 54, 24, 0.6);
  }
}
</style>
