<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';
import { NAV_KEYS_VETERINARIO, SIDEBAR_NAV } from '../shared/nav';
import AppIcon from '../shared/components/AppIcon.vue';
import TenantSwitcher from '../shared/components/TenantSwitcher.vue';

const route = useRoute();
const auth = useAuthStore();

const navItems = computed(() =>
  auth.rolActivo === 'VETERINARIO_EXTERNO'
    ? SIDEBAR_NAV.filter((item) => NAV_KEYS_VETERINARIO.has(item.key))
    : SIDEBAR_NAV,
);
</script>

<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <div class="app-layout__brand">
        <div class="app-layout__brand-mark">
          <AppIcon name="cow" :size="20" />
        </div>
        <div>
          <div class="app-layout__brand-name">AgroGanado</div>
          <div class="app-layout__brand-tag">Gestión ganadera</div>
        </div>
      </div>

      <nav class="app-layout__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.path"
          class="app-layout__nav-item"
          :class="{ 'app-layout__nav-item--active': route.path.startsWith(item.path) }"
        >
          <AppIcon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="app-layout__promo">
        <div class="app-layout__promo-title">Temporada de lluvias</div>
        <div class="app-layout__promo-text">
          Revisa el estado de los potreros antes de rotar el hato.
        </div>
      </div>
    </aside>

    <div class="app-layout__main">
      <header class="app-layout__topbar">
        <div class="app-layout__titles">
          <h1>{{ route.meta.title }}</h1>
          <div class="app-layout__subtitle">{{ route.meta.subtitle }}</div>
        </div>

        <div class="app-layout__search">
          <AppIcon name="search" :size="16" style="opacity: 0.6" />
          <span>Buscar…</span>
        </div>

        <TenantSwitcher />

        <div class="app-layout__icon-btn">
          <AppIcon name="bell" :size="16" style="opacity: 0.65" />
        </div>

        <RouterLink to="/cuenta" class="app-layout__user">
          <div class="app-layout__avatar">{{ auth.user.initials }}</div>
          <div>
            <div class="app-layout__user-name">{{ auth.user.name }}</div>
            <div class="app-layout__user-role">{{ auth.user.role }}</div>
          </div>
        </RouterLink>
      </header>

      <main class="app-layout__content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  min-height: 100vh;
  color: var(--color-dark);

  &__sidebar {
    width: 250px;
    flex: none;
    background: var(--color-dark);
    color: var(--color-bg);
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    padding: 1.5rem 1rem;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0 0.5rem 1.5rem;
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
  }

  &__brand-name {
    font-weight: 800;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
  }

  &__brand-tag {
    font-size: 0.65rem;
    opacity: 0.55;
    letter-spacing: 0.03em;
  }

  &__nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow-y: auto;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem;
    border-radius: 12px;
    color: rgba(247, 247, 247, 0.65);
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;

    &:hover {
      color: var(--color-bg);
    }

    &--active {
      background: var(--color-primary);
      color: var(--color-bg);
      font-weight: 700;
    }
  }

  &__promo {
    background: var(--color-primary);
    border-radius: 1rem;
    padding: 1rem;
    margin-top: 0.6rem;
  }

  &__promo-title {
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  &__promo-text {
    font-size: 0.72rem;
    opacity: 0.75;
    line-height: 1.4;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.35rem 2rem 0.6rem;
  }

  &__titles {
    flex: 1;
    min-width: 0;

    h1 {
      font-size: 1.6rem;
      margin: 0;
      font-weight: 800;
      color: var(--color-dark);
    }
  }

  &__subtitle {
    font-size: 0.8rem;
    color: rgba(40, 54, 24, 0.6);
    margin-top: 0.1rem;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--color-white);
    border-radius: 999px;
    padding: 0.55rem 1rem;
    box-shadow: var(--shadow-card);
    font-size: 0.78rem;
    color: rgba(40, 54, 24, 0.5);
  }

  &__icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: var(--color-white);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-card);
    flex: none;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.35rem 0.85rem 0.35rem 0.35rem;
    background: var(--color-white);
    border-radius: 999px;
    box-shadow: var(--shadow-card);
    text-decoration: none;
    color: inherit;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-dark);
    font-weight: 800;
    font-size: 0.8rem;
    flex: none;
  }

  &__user-name {
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.1;
  }

  &__user-role {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.55);
    line-height: 1.1;
  }

  &__content {
    flex: 1;
    padding: 0.9rem 2rem 3.75rem;
  }
}
</style>
