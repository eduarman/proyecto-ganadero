<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { BOTTOM_NAV, MORE_KEYS, NAV_KEYS_VETERINARIO } from '../shared/nav';
import AppIcon from '../shared/components/AppIcon.vue';
import TenantSwitcher from '../shared/components/TenantSwitcher.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const navKey = computed(() => (route.meta.navKey as string) ?? 'dashboard');
const showBack = computed(() => navKey.value !== 'dashboard' && navKey.value !== 'more');
const showLogo = computed(() => navKey.value === 'dashboard' || navKey.value === 'more');

const navItems = computed(() =>
  auth.rolActivo === 'VETERINARIO_EXTERNO'
    ? BOTTOM_NAV.filter((item) => NAV_KEYS_VETERINARIO.has(item.key))
    : BOTTOM_NAV,
);

function isActive(key: string) {
  return key === 'more' ? MORE_KEYS.has(navKey.value) : navKey.value === key;
}
</script>

<template>
  <div class="mobile-layout">
    <header class="mobile-layout__topbar">
      <div class="mobile-layout__title-group">
        <button
          v-if="showBack"
          type="button"
          class="mobile-layout__icon-btn"
          @click="router.push('/dashboard')"
        >
          <AppIcon name="arrow-left" :size="16" />
        </button>
        <div v-if="showLogo" class="mobile-layout__brand-mark">
          <AppIcon name="cow" :size="19" />
        </div>
        <div>
          <div class="mobile-layout__title">{{ route.meta.title }}</div>
          <div class="mobile-layout__subtitle">{{ route.meta.subtitle }}</div>
        </div>
      </div>
      <div class="mobile-layout__actions">
        <TenantSwitcher />
        <div class="mobile-layout__icon-btn">
          <AppIcon name="bell" :size="15" style="opacity: 0.7" />
        </div>
        <RouterLink to="/cuenta" class="mobile-layout__avatar">{{ auth.user.initials }}</RouterLink>
      </div>
    </header>

    <main class="mobile-layout__content no-scrollbar">
      <RouterView />
    </main>

    <nav class="mobile-layout__bottom-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.key"
        :to="item.path"
        class="mobile-layout__nav-item"
        :class="{ 'mobile-layout__nav-item--active': isActive(item.key) }"
      >
        <AppIcon :name="item.icon" :size="19" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.mobile-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);

  &__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem 1rem 0.75rem;
    flex: none;
  }

  &__title-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  &__brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    color: var(--color-bg);
  }

  &__title {
    font-weight: 800;
    font-size: 0.95rem;
    line-height: 1.1;
  }

  &__subtitle {
    font-size: 0.66rem;
    color: rgba(40, 54, 24, 0.5);
    line-height: 1.1;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: none;
  }

  &__icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: var(--color-white);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-card);
    flex: none;
    color: var(--color-dark);
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: var(--color-accent);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-dark);
    font-weight: 800;
    font-size: 0.78rem;
    text-decoration: none;
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    padding: 0.4rem 1rem 6.5rem;
  }

  &__bottom-nav {
    position: fixed;
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    background: var(--color-dark);
    border-radius: 24px;
    padding: 0.6rem 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--shadow-float);
    z-index: 10;
  }

  &__nav-item {
    border: none;
    background: transparent;
    border-radius: 16px;
    padding: 0.55rem 0.6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    flex: 1;
    color: rgba(247, 247, 247, 0.55);
    text-decoration: none;
    font-size: 0.6rem;
    font-weight: 700;

    &--active {
      background: var(--color-primary);
      color: var(--color-bg);
    }
  }
}
</style>
