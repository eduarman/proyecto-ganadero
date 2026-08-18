<script setup lang="ts">
withDefaults(
  defineProps<{ day: string; month: string; size?: 'sm' | 'md'; bg?: string }>(),
  { size: 'md', bg: 'var(--color-white)' },
);
</script>

<template>
  <div class="day-badge" :class="`day-badge--${size}`" :style="{ background: bg }">
    <div class="day-badge__day">{{ day }}</div>
    <div class="day-badge__month">{{ month }}</div>
  </div>
</template>

<style scoped lang="scss">
.day-badge {
  flex: none;
  text-align: center;
  border-radius: 10px;
  padding: 0.5rem 0;

  &__day {
    font-weight: 800;
    line-height: 1;
    color: var(--color-dark);
  }

  &__month {
    color: rgba(40, 54, 24, 0.5);
    text-transform: uppercase;
    font-weight: 700;
  }

  &--md {
    width: 50px;

    .day-badge__day {
      font-size: 1rem;
    }
    .day-badge__month {
      font-size: 0.6rem;
    }
  }

  &--sm {
    width: 44px;

    .day-badge__day {
      font-size: 0.875rem;
    }
    .day-badge__month {
      font-size: 0.53rem;
    }
  }
}
</style>
