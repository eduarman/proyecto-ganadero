<script setup lang="ts">
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import { useForm, useField } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import AuthLayout from '../../../layouts/AuthLayout.vue';
import MobileAuthLayout from '../../../layouts/MobileAuthLayout.vue';
import PasswordInput from '../components/PasswordInput.vue';
import { authApi } from '../services/auth.api';
import { resetPasswordSchema } from '../validation/reset-password.schema';

const { isMobile } = useBreakpoint();
const route = useRoute();
const router = useRouter();
const token = String(route.query.token ?? '');

const { handleSubmit, isSubmitting } = useForm({ validationSchema: resetPasswordSchema });
const { value: password, errorMessage: passwordError } = useField<string>('password');
const { value: confirmarPassword, errorMessage: confirmarPasswordError } = useField<string>('confirmarPassword');
const formError = ref('');
const tokenInvalido = ref(false);

const onSubmit = handleSubmit(async (values) => {
  formError.value = '';
  tokenInvalido.value = false;
  try {
    await authApi.resetPassword(token, values.password);
    router.push({ name: 'login' });
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 400) {
      tokenInvalido.value = true;
    }
    formError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo actualizar la contraseña.'
      : 'No se pudo actualizar la contraseña.';
  }
});
</script>

<template>
  <component :is="isMobile ? MobileAuthLayout : AuthLayout">
    <div v-if="!token" class="login-form">
      <div class="login-form__head">
        <div class="login-form__title">Link inválido</div>
        <div class="login-form__subtitle">Este link no incluye un token de recuperación válido.</div>
      </div>
      <router-link to="/recuperar-password" class="login-form__submit login-form__submit--link">
        Pedir un nuevo link
      </router-link>
    </div>

    <form v-else class="login-form" @submit.prevent="onSubmit">
      <div class="login-form__head">
        <div class="login-form__title">Elegí tu nueva contraseña</div>
        <div class="login-form__subtitle">Definí una nueva contraseña para tu cuenta.</div>
      </div>

      <div class="login-form__fields">
        <div class="login-form__field">
          <label class="login-form__label">Nueva contraseña</label>
          <PasswordInput v-model="password" :error="passwordError" />
          <div class="login-form__hint">Mínimo 8 caracteres, con una mayúscula y un número.</div>
        </div>

        <div class="login-form__field">
          <label class="login-form__label">Confirmar contraseña</label>
          <PasswordInput v-model="confirmarPassword" :error="confirmarPasswordError" />
        </div>

        <div v-if="formError" class="login-form__error login-form__error--form">
          {{ formError }}
          <router-link v-if="tokenInvalido" to="/recuperar-password" class="login-form__link">
            Pedir un nuevo link
          </router-link>
        </div>

        <button type="submit" class="login-form__submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Guardando…' : 'Guardar nueva contraseña' }}
        </button>
      </div>
    </form>
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

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  &__label {
    font-size: 0.7rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.6);
  }

  &__hint {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.5);
  }

  &__error {
    font-size: 0.7rem;
    color: var(--color-warn);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__link {
    font-size: 0.8rem;
    font-weight: 600;
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
    margin-top: 0.3rem;
    text-align: center;
    text-decoration: none;
    display: block;

    &:disabled {
      opacity: 0.7;
      cursor: progress;
    }

    &--link {
      margin-top: 0;
    }
  }

  &__error--form {
    text-align: center;
  }
}
</style>
