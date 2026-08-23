<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useRoute } from 'vue-router';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import AuthLayout from '../../../layouts/AuthLayout.vue';
import MobileAuthLayout from '../../../layouts/MobileAuthLayout.vue';
import { authApi } from '../services/auth.api';

const { isMobile } = useBreakpoint();
const route = useRoute();

const estado = ref<'cargando' | 'ok' | 'error'>('cargando');
const errorMsg = ref('');

onMounted(async () => {
  const token = String(route.query.token ?? '');
  if (!token) {
    estado.value = 'error';
    errorMsg.value = 'Este link no incluye un token de verificación válido.';
    return;
  }
  try {
    await authApi.verificarEmail(token);
    estado.value = 'ok';
  } catch (error) {
    estado.value = 'error';
    errorMsg.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo verificar tu cuenta.'
      : 'No se pudo verificar tu cuenta.';
  }
});
</script>

<template>
  <component :is="isMobile ? MobileAuthLayout : AuthLayout">
    <div class="login-form">
      <template v-if="estado === 'cargando'">
        <div class="login-form__head">
          <div class="login-form__title">Verificando tu cuenta…</div>
        </div>
      </template>

      <template v-else-if="estado === 'ok'">
        <div class="login-form__head">
          <div class="login-form__title">¡Cuenta verificada!</div>
          <div class="login-form__subtitle">Ya podés iniciar sesión con tu correo y contraseña.</div>
        </div>
        <router-link to="/login" class="login-form__submit login-form__submit--link">
          Ir a iniciar sesión
        </router-link>
      </template>

      <template v-else>
        <div class="login-form__head">
          <div class="login-form__title">No pudimos verificar tu cuenta</div>
          <div class="login-form__subtitle">{{ errorMsg }}</div>
        </div>
        <router-link to="/login" class="login-form__submit login-form__submit--link">
          Volver a iniciar sesión
        </router-link>
      </template>
    </div>
  </component>
</template>

<style scoped lang="scss">
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  &__title {
    font-weight: 800;
    font-size: 1.5rem;
  }

  &__subtitle {
    font-size: 0.8rem;
    color: rgba(40, 54, 24, 0.6);
    margin-top: 0.35rem;
  }

  &__submit {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.8rem;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    font-family: inherit;
    text-align: center;
    text-decoration: none;
    display: block;
  }
}
</style>
