<script setup lang="ts">
import AppIcon from './AppIcon.vue';

withDefaults(
  defineProps<{
    label: string;
    value: string;
    icon: string;
    trend?: string;
    bg?: string;
    color?: string;
    iconBg?: string;
    pillBg?: string;
    pillColor?: string;
  }>(),
  {
    bg: 'var(--color-white)',
    color: 'var(--color-dark)',
    iconBg: 'var(--color-bg)',
    pillBg: 'var(--color-bg)',
    pillColor: 'var(--color-primary)',
  },
);
</script>

<template>
  <div class="kpi-card" :style="{ background: bg, color }">
    <div class="kpi-card__top">
      <div class="kpi-card__icon" :style="{ background: iconBg }">
        <AppIcon :name="icon" :size="18" />
      </div>
      <span v-if="trend" class="kpi-card__pill" :style="{ background: pillBg, color: pillColor }">
        {{ trend }}
      </span>
    </div>
    <div>
      <div class="kpi-card__label">{{ label }}</div>
      <div class="kpi-card__value">{{ value }}</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi-card {
  border-radius: 1.25rem;
  padding: 1.1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-shadow: var(--shadow-card);
  min-width: 0;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  &__pill {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
  }

  &__label {
    font-size: 0.75rem;
    opacity: 0.75;
  }

  &__value {
    font-weight: 800;
    font-size: 1.5rem;
    line-height: 1.2;
  }
}
</style>
