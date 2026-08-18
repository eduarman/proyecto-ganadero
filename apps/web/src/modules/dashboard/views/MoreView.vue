<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppIcon from '../../../shared/components/AppIcon.vue';
import { MORE_NAV } from '../../../shared/nav';

const router = useRouter();
</script>

<template>
  <div class="more-view">
    <div class="more-view__heading">Más módulos</div>
    <button
      v-for="item in MORE_NAV"
      :key="item.key"
      type="button"
      class="more-view__item"
      @click="router.push(item.path)"
    >
      <div class="more-view__icon">
        <AppIcon :name="item.icon" :size="18" />
      </div>
      <div class="more-view__text">
        <div class="more-view__label">{{ item.label }}</div>
        <div class="more-view__desc">{{ item.desc }}</div>
      </div>
      <AppIcon name="chevron" :size="14" style="opacity: 0.4" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.more-view {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  &__heading {
    font-weight: 800;
    font-size: 0.9rem;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem;
    background: var(--color-white);
    border: none;
    border-radius: 1rem;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: inherit;
  }

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    background: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    color: var(--color-primary);
  }

  &__text {
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: 0.82rem;
    font-weight: 700;
  }

  &__desc {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.55);
  }
}
</style>
