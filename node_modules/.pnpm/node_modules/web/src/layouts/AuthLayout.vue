<script setup lang="ts">
import AppIcon from '../shared/components/AppIcon.vue';
</script>

<template>
  <div class="auth-layout">
    <div class="auth-layout__brand">
      <div class="auth-layout__blob auth-layout__blob--top" />
      <div class="auth-layout__blob auth-layout__blob--bottom" />

      <div class="auth-layout__logo">
        <div class="auth-layout__logo-mark">
          <AppIcon name="cow" :size="22" />
        </div>
        <div class="auth-layout__logo-name">AgroGanado</div>
      </div>

      <div class="auth-layout__pitch">
        <div class="auth-layout__headline">Gestiona tu hato con claridad.</div>
        <div class="auth-layout__subtext">
          Sanidad, reproducción, producción y potreros en un solo lugar, con datos al día para
          tomar mejores decisiones.
        </div>
      </div>

      <div class="auth-layout__footer">
        <span>© 2026 AgroGanado</span>
        <a href="#">Soporte</a>
      </div>
    </div>

    <div class="auth-layout__form">
      <div class="auth-layout__form-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  display: flex;
  min-height: 100vh;
  color: var(--color-dark);

  &__brand {
    flex: 1;
    background: var(--color-dark);
    color: var(--color-bg);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem;
    position: relative;
    overflow: hidden;
  }

  &__blob {
    position: absolute;
    border-radius: 999px;

    &--top {
      width: 420px;
      height: 420px;
      background: rgba(247, 247, 247, 0.05);
      top: -120px;
      right: -140px;
    }

    &--bottom {
      width: 300px;
      height: 300px;
      background: rgba(221, 161, 94, 0.1);
      bottom: -100px;
      left: -80px;
    }
  }

  &__logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
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
    font-size: 1.2rem;
  }

  &__pitch {
    z-index: 1;
    max-width: 420px;
  }

  &__headline {
    font-weight: 800;
    font-size: 2.1rem;
    line-height: 1.2;
    margin-bottom: 0.9rem;
  }

  &__subtext {
    font-size: 0.9rem;
    opacity: 0.75;
    line-height: 1.6;
  }

  &__footer {
    z-index: 1;
    display: flex;
    gap: 1.5rem;
    font-size: 0.78rem;
    opacity: 0.65;

    a {
      color: var(--color-bg);
      opacity: 0.85;
      text-decoration: none;
    }
  }

  &__form {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2.5rem;
  }

  &__form-inner {
    width: 100%;
    max-width: 380px;
  }
}
</style>
