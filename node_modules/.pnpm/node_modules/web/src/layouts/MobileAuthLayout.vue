<script setup lang="ts">
import AppIcon from '../shared/components/AppIcon.vue';
</script>

<template>
  <div class="mobile-auth">
    <div class="mobile-auth__hero">
      <div class="mobile-auth__blob mobile-auth__blob--top" />
      <div class="mobile-auth__blob mobile-auth__blob--bottom" />

      <div class="mobile-auth__logo">
        <div class="mobile-auth__logo-mark">
          <AppIcon name="cow" :size="21" />
        </div>
        <div class="mobile-auth__logo-name">AgroGanado</div>
      </div>

      <div class="mobile-auth__pitch">
        <div class="mobile-auth__headline">Gestiona tu hato con claridad.</div>
        <div class="mobile-auth__subtext">
          Sanidad, reproducción y producción al día, desde tu teléfono.
        </div>
      </div>
    </div>

    <div class="mobile-auth__sheet">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.mobile-auth {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);

  &__hero {
    flex: none;
    background: var(--color-dark);
    color: var(--color-bg);
    padding: 2.75rem 1.5rem 3.75rem;
    position: relative;
    overflow: hidden;
  }

  &__blob {
    position: absolute;
    border-radius: 999px;

    &--top {
      width: 220px;
      height: 220px;
      background: rgba(247, 247, 247, 0.06);
      top: -90px;
      right: -70px;
    }

    &--bottom {
      width: 160px;
      height: 160px;
      background: rgba(221, 161, 94, 0.12);
      bottom: -70px;
      left: -50px;
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    position: relative;
    z-index: 1;
  }

  &__logo-mark {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  &__logo-name {
    font-weight: 800;
    font-size: 1.05rem;
  }

  &__pitch {
    position: relative;
    z-index: 1;
    margin-top: 1.4rem;
  }

  &__headline {
    font-weight: 800;
    font-size: 1.4rem;
    line-height: 1.3;
  }

  &__subtext {
    font-size: 0.8rem;
    opacity: 0.75;
    margin-top: 0.5rem;
    line-height: 1.5;
  }

  &__sheet {
    flex: 1;
    background: var(--color-bg);
    border-radius: 28px 28px 0 0;
    margin-top: -1.5rem;
    padding: 1.6rem 1.5rem 2rem;
    position: relative;
    z-index: 1;
  }
}
</style>
