<script setup lang="ts">
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import { useForm, useField } from 'vee-validate';
import { useRouter } from 'vue-router';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { useAuthStore } from '../../../stores/auth.store';
import AuthLayout from '../../../layouts/AuthLayout.vue';
import MobileAuthLayout from '../../../layouts/MobileAuthLayout.vue';
import PasswordInput from '../components/PasswordInput.vue';
import { loginSchema } from '../validation/login.schema';

const { isMobile } = useBreakpoint();
const router = useRouter();
const auth = useAuthStore();

const { handleSubmit, isSubmitting } = useForm({ validationSchema: loginSchema });
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');
const remember = ref(false);
const formError = ref('');

const onSubmit = handleSubmit(async (values) => {
  formError.value = '';
  try {
    await auth.login(values.email, values.password);
    router.push('/dashboard');
  } catch (error) {
    formError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo iniciar sesión.'
      : 'No se pudo iniciar sesión.';
  }
});
</script>

<template>
  <component :is="isMobile ? MobileAuthLayout : AuthLayout">
    <form class="login-form" @submit.prevent="onSubmit">
      <div class="login-form__head">
        <div class="login-form__title">Iniciar sesión</div>
        <div class="login-form__subtitle">Ingresa tus credenciales para acceder al sistema.</div>
      </div>

      <div class="login-form__fields">
        <div class="login-form__field">
          <label class="login-form__label">Correo electrónico</label>
          <input
            v-model="email"
            type="email"
            class="login-form__input"
            :class="{ 'login-form__input--error': emailError }"
            placeholder="nombre@agroganado.com"
          />
          <div v-if="emailError" class="login-form__error">{{ emailError }}</div>
        </div>

        <div class="login-form__field">
          <label class="login-form__label">Contraseña</label>
          <PasswordInput v-model="password" :error="passwordError" />
        </div>

        <div class="login-form__row">
          <label class="login-form__remember">
            <input v-model="remember" type="checkbox" />
            Recordarme
          </label>
          <a href="#" class="login-form__link">¿Olvidaste tu contraseña?</a>
        </div>

        <div v-if="formError" class="login-form__error login-form__error--form">{{ formError }}</div>

        <button type="submit" class="login-form__submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Ingresando…' : 'Ingresar' }}
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

  &__input {
    border: 1.5px solid var(--color-border);
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
    font-size: 0.85rem;
    background: var(--color-bg);
    font-family: inherit;

    &--error {
      border-color: var(--color-warn);
    }
  }

  &__error {
    font-size: 0.7rem;
    color: var(--color-warn);
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__remember {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: rgba(40, 54, 24, 0.7);
    cursor: pointer;

    input {
      accent-color: var(--color-primary);
      width: 15px;
      height: 15px;
    }
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

    &:disabled {
      opacity: 0.7;
      cursor: progress;
    }
  }

  &__error--form {
    text-align: center;
  }
}
</style>
