<script setup lang="ts">
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import { useForm, useField } from 'vee-validate';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import AuthLayout from '../../../layouts/AuthLayout.vue';
import MobileAuthLayout from '../../../layouts/MobileAuthLayout.vue';
import PasswordInput from '../components/PasswordInput.vue';
import { authApi } from '../services/auth.api';
import { registroSchema } from '../validation/registro.schema';

const { isMobile } = useBreakpoint();

const { handleSubmit, isSubmitting } = useForm({ validationSchema: registroSchema });
const { value: nombre, errorMessage: nombreError } = useField<string>('nombre');
const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');
const formError = ref('');
const registrado = ref(false);

const onSubmit = handleSubmit(async (values) => {
  formError.value = '';
  try {
    await authApi.registro({ nombre: values.nombre, email: values.email, password: values.password });
    registrado.value = true;
  } catch (error) {
    formError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo crear la cuenta.'
      : 'No se pudo crear la cuenta.';
  }
});
</script>

<template>
  <component :is="isMobile ? MobileAuthLayout : AuthLayout">
    <div v-if="registrado" class="login-form">
      <div class="login-form__head">
        <div class="login-form__title">Revisá tu correo</div>
        <div class="login-form__subtitle">
          Te enviamos un link para verificar tu cuenta. Una vez verificada, ya podés iniciar sesión.
        </div>
      </div>
      <router-link to="/login" class="login-form__submit login-form__submit--link">
        Ir a iniciar sesión
      </router-link>
    </div>

    <form v-else class="login-form" @submit.prevent="onSubmit">
      <div class="login-form__head">
        <div class="login-form__title">Crear cuenta</div>
        <div class="login-form__subtitle">Empezá a gestionar tu hato en minutos.</div>
      </div>

      <div class="login-form__fields">
        <div class="login-form__field">
          <label class="login-form__label">Nombre completo</label>
          <input
            v-model="nombre"
            type="text"
            class="login-form__input"
            :class="{ 'login-form__input--error': nombreError }"
            placeholder="Tu nombre"
          />
          <div v-if="nombreError" class="login-form__error">{{ nombreError }}</div>
        </div>

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
          <div class="login-form__hint">Mínimo 8 caracteres, con una mayúscula y un número.</div>
        </div>

        <div v-if="formError" class="login-form__error login-form__error--form">{{ formError }}</div>

        <button type="submit" class="login-form__submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creando cuenta…' : 'Crear cuenta' }}
        </button>

        <div class="login-form__row login-form__row--center">
          <router-link to="/login" class="login-form__link">Ya tengo cuenta, iniciar sesión</router-link>
        </div>
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

  &__hint {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.5);
  }

  &__error {
    font-size: 0.7rem;
    color: var(--color-warn);
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &--center {
      justify-content: center;
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
