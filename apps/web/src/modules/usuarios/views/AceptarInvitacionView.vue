<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useForm, useField } from 'vee-validate';
import { useRoute } from 'vue-router';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import AuthLayout from '../../../layouts/AuthLayout.vue';
import MobileAuthLayout from '../../../layouts/MobileAuthLayout.vue';
import PasswordInput from '../../auth/components/PasswordInput.vue';
import { usuariosApi, type PrevisualizacionInvitacion } from '../services/usuarios.api';
import { aceptarInvitacionSchema } from '../validation/aceptar-invitacion.schema';

const { isMobile } = useBreakpoint();
const route = useRoute();
const token = String(route.params.token ?? '');

const cargando = ref(true);
const previa = ref<PrevisualizacionInvitacion | null>(null);
const tokenInvalido = ref(false);
const aceptada = ref(false);
const formError = ref('');

async function cargar() {
  if (!token) {
    tokenInvalido.value = true;
    cargando.value = false;
    return;
  }
  try {
    previa.value = await usuariosApi.previsualizarInvitacion(token);
  } catch (error) {
    tokenInvalido.value = true;
    formError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'Esta invitación no es válida.'
      : 'Esta invitación no es válida.';
  } finally {
    cargando.value = false;
  }
}

onMounted(cargar);

// Caso: el email invitado ya es un usuario de la plataforma — solo confirma.
const aceptandoExistente = ref(false);

async function aceptarExistente() {
  formError.value = '';
  aceptandoExistente.value = true;
  try {
    await usuariosApi.aceptarInvitacion(token, {});
    aceptada.value = true;
  } catch (error) {
    formError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo aceptar la invitación.'
      : 'No se pudo aceptar la invitación.';
  } finally {
    aceptandoExistente.value = false;
  }
}

// Caso: email nuevo — pide nombre + contraseña para crear la cuenta.
const { handleSubmit, isSubmitting } = useForm({ validationSchema: aceptarInvitacionSchema });
const { value: nombre, errorMessage: nombreError } = useField<string>('nombre');
const { value: password, errorMessage: passwordError } = useField<string>('password');

const onSubmit = handleSubmit(async (values) => {
  formError.value = '';
  try {
    await usuariosApi.aceptarInvitacion(token, { nombre: values.nombre, password: values.password });
    aceptada.value = true;
  } catch (error) {
    formError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo aceptar la invitación.'
      : 'No se pudo aceptar la invitación.';
  }
});
</script>

<template>
  <component :is="isMobile ? MobileAuthLayout : AuthLayout">
    <div v-if="cargando" class="login-form">
      <div class="login-form__title">Cargando…</div>
    </div>

    <div v-else-if="aceptada" class="login-form">
      <div class="login-form__head">
        <div class="login-form__title">Listo</div>
        <div class="login-form__subtitle">Aceptaste la invitación. Ya podés iniciar sesión.</div>
      </div>
      <router-link to="/login" class="login-form__submit login-form__submit--link">
        Ir a iniciar sesión
      </router-link>
    </div>

    <div v-else-if="tokenInvalido || !previa" class="login-form">
      <div class="login-form__head">
        <div class="login-form__title">Invitación inválida</div>
        <div class="login-form__subtitle">{{ formError || 'Este link no es válido o ya expiró.' }}</div>
      </div>
      <router-link to="/login" class="login-form__submit login-form__submit--link">
        Ir a iniciar sesión
      </router-link>
    </div>

    <div v-else-if="previa.usuarioExistente" class="login-form">
      <div class="login-form__head">
        <div class="login-form__title">Confirmar invitación</div>
        <div class="login-form__subtitle">
          Te invitaron a sumarte a <strong>{{ previa.negocioNombre }}</strong> con tu cuenta ({{ previa.email }}).
        </div>
      </div>
      <div v-if="formError" class="login-form__error login-form__error--form">{{ formError }}</div>
      <button type="button" class="login-form__submit" :disabled="aceptandoExistente" @click="aceptarExistente">
        {{ aceptandoExistente ? 'Aceptando…' : 'Aceptar invitación' }}
      </button>
    </div>

    <form v-else class="login-form" @submit.prevent="onSubmit">
      <div class="login-form__head">
        <div class="login-form__title">Sumate a {{ previa.negocioNombre }}</div>
        <div class="login-form__subtitle">Creá tu cuenta para {{ previa.email }} y aceptá la invitación.</div>
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
          <label class="login-form__label">Contraseña</label>
          <PasswordInput v-model="password" :error="passwordError" />
          <div class="login-form__hint">Mínimo 8 caracteres, con una mayúscula y un número.</div>
        </div>

        <div v-if="formError" class="login-form__error login-form__error--form">{{ formError }}</div>

        <button type="submit" class="login-form__submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creando cuenta…' : 'Aceptar y crear cuenta' }}
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

  &__hint {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.5);
  }

  &__error {
    font-size: 0.7rem;
    color: var(--color-warn);
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
