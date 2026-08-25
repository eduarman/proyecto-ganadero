<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import Pill from '../../../shared/components/Pill.vue';
import type { RolUsuario } from '../../auth/services/auth.api';
import { usuariosApi, type ListaUsuarios, type RolInvitable } from '../services/usuarios.api';

const { isMobile } = useBreakpoint();

const ROL_LABELS: Record<RolUsuario, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_NEGOCIO: 'Administrador',
  MAYORDOMO: 'Mayordomo',
  OPERARIO: 'Operario',
  VETERINARIO_EXTERNO: 'Veterinario',
};

const ROLES_INVITABLES: RolInvitable[] = ['MAYORDOMO', 'OPERARIO', 'VETERINARIO_EXTERNO'];

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

const loading = ref(true);
const data = ref<ListaUsuarios>({ usuarios: [], invitacionesPendientes: [], usoPlan: { actual: 0, limite: 0 } });

async function cargar() {
  loading.value = true;
  try {
    data.value = await usuariosApi.listar();
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

const limiteAlcanzado = computed(() => data.value.usoPlan.actual >= data.value.usoPlan.limite);

const showForm = ref(false);
const form = ref({ email: '', rol: 'OPERARIO' as RolInvitable });
const saving = ref(false);
const errorMsg = ref('');

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await usuariosApi.invitar({ email: form.value.email, rol: form.value.rol });
    form.value = { email: '', rol: 'OPERARIO' };
    showForm.value = false;
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo enviar la invitación.')
      : 'No se pudo enviar la invitación.';
  } finally {
    saving.value = false;
  }
}

const accionEnCursoId = ref<string | null>(null);

async function reenviar(id: string) {
  accionEnCursoId.value = id;
  try {
    await usuariosApi.reenviarInvitacion(id);
    await cargar();
  } finally {
    accionEnCursoId.value = null;
  }
}

async function cancelar(id: string) {
  accionEnCursoId.value = id;
  try {
    await usuariosApi.cancelarInvitacion(id);
    await cargar();
  } finally {
    accionEnCursoId.value = null;
  }
}

async function cambiarRolUsuario(usuarioId: string, rol: RolInvitable) {
  accionEnCursoId.value = usuarioId;
  try {
    await usuariosApi.cambiarRol(usuarioId, rol);
    await cargar();
  } finally {
    accionEnCursoId.value = null;
  }
}

async function desactivarUsuario(usuarioId: string) {
  if (!confirm('¿Desactivar a este usuario? Va a perder acceso al negocio y se cierran sus sesiones activas.')) {
    return;
  }
  accionEnCursoId.value = usuarioId;
  try {
    await usuariosApi.desactivar(usuarioId);
    await cargar();
  } finally {
    accionEnCursoId.value = null;
  }
}
</script>

<template>
  <div class="usuarios-view">
    <SectionCard title="Equipo del negocio">
      <template #actions>
        <Pill :bg="limiteAlcanzado ? 'var(--color-warn-bg)' : 'var(--color-neutral-bg)'" :color="limiteAlcanzado ? 'var(--color-warn)' : 'var(--color-primary)'">
          {{ data.usoPlan.actual }} de {{ data.usoPlan.limite }} usuarios
        </Pill>
        <button type="button" class="usuarios-view__link-btn" :disabled="limiteAlcanzado" @click="showForm = !showForm">
          {{ showForm ? 'Cancelar' : '+ Invitar usuario' }}
        </button>
      </template>

      <div v-if="showForm" class="usuarios-view__form">
        <div v-if="errorMsg" class="usuarios-view__error">{{ errorMsg }}</div>
        <div class="usuarios-view__form-grid" :class="{ 'usuarios-view__form-grid--mobile': isMobile }">
          <div class="usuarios-view__field">
            <label>Correo electrónico</label>
            <input v-model="form.email" type="email" placeholder="persona@ejemplo.com" />
          </div>
          <div class="usuarios-view__field">
            <label>Rol</label>
            <select v-model="form.rol">
              <option v-for="r in ROLES_INVITABLES" :key="r" :value="r">{{ ROL_LABELS[r] }}</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          class="usuarios-view__submit"
          :disabled="saving || !form.email"
          @click="guardar"
        >
          {{ saving ? 'Enviando…' : 'Enviar invitación' }}
        </button>
      </div>

      <div v-if="loading" class="usuarios-view__muted">Cargando…</div>
      <template v-else>
        <div class="usuarios-view__table-head">
          <span>Nombre</span><span>Correo</span><span>Rol</span><span>Estado</span><span></span>
        </div>
        <div v-for="u in data.usuarios" :key="u.id" class="usuarios-view__table-row">
          <span class="usuarios-view__bold">{{ u.nombre }}</span>
          <span class="usuarios-view__muted">{{ u.email }}</span>
          <span>
            <select
              v-if="u.rol !== 'ADMIN_NEGOCIO' && u.activo"
              :value="u.rol"
              :disabled="accionEnCursoId === u.id"
              @change="cambiarRolUsuario(u.id, ($event.target as HTMLSelectElement).value as RolInvitable)"
            >
              <option v-for="r in ROLES_INVITABLES" :key="r" :value="r">{{ ROL_LABELS[r] }}</option>
            </select>
            <span v-else>{{ ROL_LABELS[u.rol] }}</span>
          </span>
          <Pill :bg="u.activo ? 'var(--color-neutral-bg)' : 'var(--color-warn-bg)'" :color="u.activo ? 'var(--color-primary)' : 'var(--color-warn)'">
            {{ u.activo ? 'Activo' : 'Inactivo' }}
          </Pill>
          <button
            v-if="u.rol !== 'ADMIN_NEGOCIO' && u.activo"
            type="button"
            class="usuarios-view__btn-ghost"
            :disabled="accionEnCursoId === u.id"
            @click="desactivarUsuario(u.id)"
          >
            Desactivar
          </button>
        </div>

        <template v-if="data.invitacionesPendientes.length > 0">
          <div class="usuarios-view__heading">Invitaciones pendientes</div>
          <div v-for="i in data.invitacionesPendientes" :key="i.id" class="usuarios-view__table-row">
            <span class="usuarios-view__bold">{{ i.email }}</span>
            <span class="usuarios-view__muted">Vence {{ formatFecha(i.expiraEn) }}</span>
            <span>{{ ROL_LABELS[i.rol] }}</span>
            <Pill bg="var(--color-neutral-bg)" color="var(--color-primary)">Pendiente</Pill>
            <div class="usuarios-view__row-actions">
              <button type="button" class="usuarios-view__btn-ghost" :disabled="accionEnCursoId === i.id" @click="reenviar(i.id)">
                Reenviar
              </button>
              <button type="button" class="usuarios-view__btn-ghost" :disabled="accionEnCursoId === i.id" @click="cancelar(i.id)">
                Cancelar
              </button>
            </div>
          </div>
        </template>
      </template>
    </SectionCard>
  </div>
</template>

<style scoped lang="scss">
.usuarios-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__form {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;

    &--mobile {
      grid-template-columns: 1fr;
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
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.65rem 0.85rem;
      font-size: 0.82rem;
      background: var(--color-white);
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

  &__link-btn {
    background: var(--color-neutral-bg);
    border: 1.5px solid var(--color-primary);
    border-radius: 999px;
    color: var(--color-primary);
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.35rem 0.85rem;
    font-family: inherit;
    white-space: nowrap;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__btn-ghost {
    background: transparent;
    border: 1.5px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-dark);
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.4rem 0.85rem;
    font-family: inherit;

    &:disabled {
      opacity: 0.5;
      cursor: progress;
    }
  }

  &__error {
    background: var(--color-warn-bg);
    color: var(--color-warn);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
  }

  &__table-head {
    display: grid;
    grid-template-columns: 1.2fr 1.4fr 1fr 0.8fr 0.8fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 1.2fr 1.4fr 1fr 0.8fr 0.8fr;
    gap: 0.6rem;
    padding: 0.7rem 0.4rem;
    border-top: 1px solid #f2efdd;
    align-items: center;
    font-size: 0.82rem;

    select {
      border: 1.5px solid #efead1;
      border-radius: 10px;
      padding: 0.4rem 0.6rem;
      font-size: 0.78rem;
      background: var(--color-white);
      font-family: inherit;
    }
  }

  &__row-actions {
    display: flex;
    gap: 0.4rem;
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__bold {
    font-weight: 700;
  }

  &__heading {
    font-weight: 800;
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
}
</style>
