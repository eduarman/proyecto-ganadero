<script setup lang="ts">
import { ref } from 'vue';
import { useForm, useField } from 'vee-validate';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import AuthLayout from '../../../layouts/AuthLayout.vue';
import MobileAuthLayout from '../../../layouts/MobileAuthLayout.vue';
import { authApi } from '../services/auth.api';
import { recuperarPasswordSchema } from '../validation/recuperar-password.schema';

const { isMobile } = useBreakpoint();

const { handleSubmit, isSubmitting } = useForm({ validationSchema: recuperarPasswordSchema });
const { value: email, errorMessage: emailError } = useField<string>('email');
const enviado = ref(false);

const onSubmit = handleSubmit(async (values) => {
  // El backend siempre responde igual exista o no el email (anti-enumeración,
  // US-3.1) — el frontend refleja ese mismo mensaje sin distinguir el caso.
  try {
    await authApi.recuperarPassword(values.email);
  } finally {
    enviado.value = true;
  }
});
</script>

<template>
  <component :is="isMobile ? MobileAuthLayout : AuthLayout">
    <div v-if="enviado" class="login-form">
      <div class="login-form__head">
        <div class="login-form__title">Revisá tu correo</div>
        <div class="login-form__subtitle">
          Si existe una cuenta con ese correo, te enviamos un link para restablecer tu contraseña.
        </div>
      </div>
      <router-link to="/login" class="login-form__submit login-form__submit--link">
        Volver a iniciar sesión
      </router-link>
    </div>

    <form v-else class="login-form" @submit.prevent="onSubmit">
      <div class="login-form__head">
        <div class="login-form__title">Recuperar contraseña</div>
        <div class="login-form__subtitle">Ingresá tu correo y te enviamos un link para restablecerla.</div>
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

        <button type="submit" class="login-form__submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Enviando…' : 'Enviar link de recuperación' }}
        </button>

        <div class="login-form__row login-form__row--center">
          <router-link to="/login" class="login-form__link">Volver a iniciar sesión</router-link>
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
}
</style>
