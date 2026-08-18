<script setup lang="ts">
withDefaults(defineProps<{ options: string[]; modelValue: string; fluid?: boolean }>(), {
  fluid: false,
});
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="segmented-tabs" :class="{ 'segmented-tabs--fluid': fluid }">
    <button
      v-for="opt in options"
      :key="opt"
      type="button"
      class="segmented-tabs__item"
      :class="{ 'segmented-tabs__item--active': opt === modelValue }"
      @click="$emit('update:modelValue', opt)"
    >
      {{ opt }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.segmented-tabs {
  display: flex;
  gap: 0.5rem;
  background: var(--color-bg);
  border-radius: 999px;
  padding: 0.25rem;
  align-self: flex-start;

  &--fluid {
    align-self: stretch;

    .segmented-tabs__item {
      flex: 1;
      padding: 0.45rem 0.4rem;
      font-size: 0.68rem;
    }
  }

  &__item {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    background: transparent;
    border: none;
    color: var(--color-dark);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;

    &--active {
      background: var(--color-primary);
      color: var(--color-bg);
    }
  }
}
</style>
