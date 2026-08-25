<script setup lang="ts">
import { isAxiosError } from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { useAuthStore } from '../../../stores/auth.store';
import { authApi } from '../../auth/services/auth.api';

const { isMobile } = useBreakpoint();
const auth = useAuthStore();
const router = useRouter();

const cerrandoTodas = ref(false);

async function logout() {
  await auth.logout();
  router.push('/login');
}

async function logoutAll() {
  cerrandoTodas.value = true;
  try {
    await authApi.logoutAll();
  } finally {
    auth.clearSession();
    router.push('/login');
  }
}

const nombre = ref(auth.usuario?.nombre ?? '');
const savingNombre = ref(false);
const nombreError = ref('');
const nombreOk = ref(false);

async function guardarNombre() {
  nombreError.value = '';
  nombreOk.value = false;
  savingNombre.value = true;
  try {
    await authApi.actualizarPerfil(nombre.value);
    auth.actualizarNombre(nombre.value);
    nombreOk.value = true;
  } catch (error) {
    nombreError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el nombre.'
      : 'No se pudo guardar el nombre.';
  } finally {
    savingNombre.value = false;
  }
}

const passwordActual = ref('');
const passwordNueva = ref('');
const savingPassword = ref(false);
const passwordError = ref('');
const passwordOk = ref(false);

async function guardarPassword() {
  passwordError.value = '';
  passwordOk.value = false;
  savingPassword.value = true;
  try {
    await authApi.cambiarPassword({ passwordActual: passwordActual.value, passwordNueva: passwordNueva.value });
    passwordActual.value = '';
    passwordNueva.value = '';
    passwordOk.value = true;
  } catch (error) {
    passwordError.value = isAxiosError(error)
      ? (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo actualizar la contraseña.'
      : 'No se pudo actualizar la contraseña.';
  } finally {
    savingPassword.value = false;
  }
}
</script>

<template>
  <div class="cuenta-view">
    <div class="cuenta-view__layout" :class="{ 'cuenta-view__layout--mobile': isMobile }">
      <div class="cuenta-view__profile">
        <div class="cuenta-view__avatar">{{ auth.user.initials }}</div>
        <div>
          <div class="cuenta-view__name">{{ auth.user.name }}</div>
          <div class="cuenta-view__role">{{ auth.user.role }}</div>
        </div>

        <template v-if="!isMobile">
          <div class="cuenta-view__divider" />
          <div class="cuenta-view__meta">
            <div class="cuenta-view__meta-row">
              <span class="cuenta-view__meta-label">Correo</span>
              <span class="cuenta-view__meta-value">{{ auth.usuario?.email }}</span>
            </div>
          </div>
          <button type="button" class="cuenta-view__photo-btn">Cambiar foto</button>
        </template>
      </div>

      <div class="cuenta-view__settings">
        <div class="cuenta-view__card">
          <div class="cuenta-view__card-title">Información personal</div>
          <div v-if="nombreError" class="cuenta-view__form-error">{{ nombreError }}</div>
          <div v-if="nombreOk" class="cuenta-view__form-ok">Guardado.</div>
          <div class="cuenta-view__form-grid" :class="{ 'cuenta-view__form-grid--mobile': isMobile }">
            <div class="cuenta-view__field">
              <label v-if="!isMobile">Nombre completo</label>
              <input v-model="nombre" />
            </div>
            <div class="cuenta-view__field">
              <label v-if="!isMobile">Correo electrónico</label>
              <input :value="auth.usuario?.email" disabled />
            </div>
            <div v-if="!isMobile" class="cuenta-view__field">
              <label>Rol</label>
              <input :value="auth.user.role" disabled />
            </div>
          </div>
          <button
            type="button"
            class="cuenta-view__submit"
            :disabled="savingNombre || !nombre"
            @click="guardarNombre"
          >
            {{ savingNombre ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>

        <div v-if="!isMobile" class="cuenta-view__card">
          <div class="cuenta-view__card-title">Seguridad</div>
          <div v-if="passwordError" class="cuenta-view__form-error">{{ passwordError }}</div>
          <div v-if="passwordOk" class="cuenta-view__form-ok">
            Contraseña actualizada. Se cerraron las demás sesiones.
          </div>
          <div class="cuenta-view__form-grid">
            <div class="cuenta-view__field">
              <label>Contraseña actual</label>
              <input v-model="passwordActual" type="password" placeholder="••••••••" />
            </div>
            <div class="cuenta-view__field">
              <label>Nueva contraseña</label>
              <input v-model="passwordNueva" type="password" placeholder="••••••••" />
            </div>
          </div>
          <button
            type="button"
            class="cuenta-view__btn-ghost"
            :disabled="savingPassword || !passwordActual || !passwordNueva"
            @click="guardarPassword"
          >
            {{ savingPassword ? 'Actualizando…' : 'Actualizar contraseña' }}
          </button>
        </div>

        <div class="cuenta-view__card cuenta-view__logout-card">
          <div>
            <div class="cuenta-view__card-title">Cerrar sesión</div>
            <div class="cuenta-view__logout-hint">
              {{ isMobile ? 'Salir de este dispositivo' : 'Salir de tu cuenta en este dispositivo.' }}
            </div>
          </div>
          <button type="button" class="cuenta-view__logout-btn" @click="logout">
            {{ isMobile ? 'Salir' : 'Cerrar sesión' }}
          </button>
        </div>

        <div class="cuenta-view__card cuenta-view__logout-card">
          <div>
            <div class="cuenta-view__card-title">Cerrar sesión en todos los dispositivos</div>
            <div class="cuenta-view__logout-hint">
              {{ isMobile ? 'Salir de todos lados' : 'Invalida la sesión en todos tus dispositivos activos.' }}
            </div>
          </div>
          <button
            type="button"
            class="cuenta-view__logout-btn"
            :disabled="cerrandoTodas"
            @click="logoutAll"
          >
            {{ cerrandoTodas ? 'Cerrando…' : (isMobile ? 'Salir todo' : 'Cerrar todas') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cuenta-view {
  &__layout {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: 1.25rem;
    align-items: start;

    &--mobile {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  &__profile {
    background: var(--color-dark);
    border-radius: 1.25rem;
    padding: 1.75rem;
    box-shadow: var(--shadow-card-strong);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    color: var(--color-bg);
    text-align: center;

    .cuenta-view__layout--mobile & {
      padding: 1.35rem;
      border-radius: 1rem;
    }
  }

  &__avatar {
    width: 84px;
    height: 84px;
    border-radius: 999px;
    background: var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-dark);
    font-weight: 800;
    font-size: 1.75rem;

    .cuenta-view__layout--mobile & {
      width: 68px;
      height: 68px;
      font-size: 1.35rem;
    }
  }

  &__name {
    font-weight: 800;
    font-size: 1.1rem;
  }

  &__role {
    font-size: 0.78rem;
    opacity: 0.7;
    margin-top: 0.1rem;
  }

  &__divider {
    width: 100%;
    height: 1px;
    background: rgba(247, 247, 247, 0.12);
    margin: 0.4rem 0;
  }

  &__meta {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    text-align: left;
  }

  &__meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
  }

  &__meta-label {
    opacity: 0.65;
  }

  &__meta-value {
    font-weight: 600;
  }

  &__photo-btn {
    width: 100%;
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.75rem;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    font-family: inherit;
    margin-top: 0.4rem;
  }

  &__settings {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__card {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1.35rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  &__card-title {
    font-weight: 800;
    font-size: 1rem;
  }

  &__form-error {
    background: var(--color-warn-bg);
    color: var(--color-warn);
    border-radius: 12px;
    padding: 0.6rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 600;
  }

  &__form-ok {
    background: var(--color-neutral-bg);
    color: var(--color-primary);
    border-radius: 12px;
    padding: 0.6rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 600;
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;

    &--mobile {
      grid-template-columns: 1fr;
      gap: 0.6rem;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    label {
      font-size: 0.7rem;
      font-weight: 700;
      color: rgba(40, 54, 24, 0.6);
    }

    input,
    select {
      border: 1.5px solid var(--color-border);
      border-radius: 12px;
      padding: 0.65rem 0.85rem;
      font-size: 0.82rem;
      background: var(--color-bg);
      font-family: inherit;
    }
  }

  &__submit {
    align-self: flex-start;
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.3rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__btn-ghost {
    align-self: flex-start;
    background: transparent;
    border: 1.5px solid var(--color-border);
    color: var(--color-dark);
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    font-family: inherit;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__logout-card {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  &__logout-hint {
    font-size: 0.78rem;
    color: rgba(40, 54, 24, 0.6);
  }

  &__logout-btn {
    background: var(--color-warn-bg);
    color: var(--color-warn);
    border: none;
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    font-family: inherit;
    flex: none;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }
}
</style>
