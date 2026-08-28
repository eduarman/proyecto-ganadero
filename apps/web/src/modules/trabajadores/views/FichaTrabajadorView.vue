<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { formatFecha } from '../../../shared/utils/fecha';
import SectionCard from '../../../shared/components/SectionCard.vue';
import Pill from '../../../shared/components/Pill.vue';
import {
  trabajadoresApi,
  type ActualizarTrabajadorPayload,
  type Cargo,
  type ModalidadPago,
  type TipoContratacion,
  type TrabajadorConAntiguedad,
} from '../services/trabajadores.api';

const TIPO_CONTRATACION_LABELS: Record<TipoContratacion, string> = {
  MENSUAL: 'Mensual',
  JORNAL: 'Jornal',
  POR_ACTIVIDAD: 'Por actividad',
  TEMPORAL: 'Temporal',
  OTRO: 'Otro',
};

const MODALIDAD_PAGO_LABELS: Record<ModalidadPago, string> = {
  MENSUAL: 'Mensual',
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  DIARIO: 'Diario',
  POR_ACTIVIDAD: 'Por actividad',
};

const route = useRoute();
const router = useRouter();
const id = String(route.params.id);

const loading = ref(true);
const trabajador = ref<TrabajadorConAntiguedad | null>(null);
const cargos = ref<Cargo[]>([]);

const editando = ref(false);
const form = ref<ActualizarTrabajadorPayload>({});
const saving = ref(false);
const errorMsg = ref('');
const cambiandoEstado = ref(false);

async function cargar() {
  loading.value = true;
  try {
    const [trabajadorResp, cargosResp] = await Promise.all([
      trabajadoresApi.obtener(id),
      trabajadoresApi.listarCargos(),
    ]);
    trabajador.value = trabajadorResp;
    cargos.value = cargosResp;
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

function abrirEdicion() {
  if (!trabajador.value) return;
  const t = trabajador.value;
  form.value = {
    nombres: t.nombres,
    apellidos: t.apellidos,
    documento: t.documento,
    cargoId: t.cargoId,
    fechaIngreso: t.fechaIngreso.slice(0, 10),
    tipoContratacion: t.tipoContratacion,
    modalidadPago: t.modalidadPago,
    salarioOJornal: Number(t.salarioOJornal),
    fechaNacimiento: t.fechaNacimiento?.slice(0, 10) ?? '',
    telefono: t.telefono ?? '',
    email: t.email ?? '',
    direccion: t.direccion ?? '',
    contactoEmergenciaNombre: t.contactoEmergenciaNombre ?? '',
    contactoEmergenciaTelefono: t.contactoEmergenciaTelefono ?? '',
  };
  errorMsg.value = '';
  editando.value = true;
}

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await trabajadoresApi.actualizar(id, {
      ...form.value,
      salarioOJornal: form.value.salarioOJornal !== undefined ? Number(form.value.salarioOJornal) : undefined,
      fechaNacimiento: form.value.fechaNacimiento || undefined,
      telefono: form.value.telefono || undefined,
      email: form.value.email || undefined,
      direccion: form.value.direccion || undefined,
      contactoEmergenciaNombre: form.value.contactoEmergenciaNombre || undefined,
      contactoEmergenciaTelefono: form.value.contactoEmergenciaTelefono || undefined,
    });
    editando.value = false;
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el trabajador.')
      : 'No se pudo guardar el trabajador.';
  } finally {
    saving.value = false;
  }
}

async function toggleEstado() {
  if (!trabajador.value) return;
  cambiandoEstado.value = true;
  try {
    if (trabajador.value.estado === 'ACTIVO') {
      await trabajadoresApi.inactivar(id);
    } else {
      await trabajadoresApi.activar(id);
    }
    await cargar();
  } finally {
    cambiandoEstado.value = false;
  }
}

function formatAntiguedad(a: { anios: number; meses: number }): string {
  const partes: string[] = [];
  if (a.anios > 0) partes.push(`${a.anios} año${a.anios === 1 ? '' : 's'}`);
  partes.push(`${a.meses} mes${a.meses === 1 ? '' : 'es'}`);
  return partes.join(', ');
}
</script>

<template>
  <div class="ficha-trabajador-view">
    <button type="button" class="ficha-trabajador-view__back" @click="router.push('/trabajadores')">
      ← Volver a Trabajadores
    </button>

    <div v-if="loading" class="ficha-trabajador-view__muted">Cargando…</div>

    <template v-else-if="trabajador">
      <SectionCard>
        <div class="ficha-trabajador-view__head">
          <div>
            <div class="ficha-trabajador-view__name-row">
              <h2>{{ trabajador.nombres }} {{ trabajador.apellidos }}</h2>
              <Pill
                :bg="trabajador.estado === 'ACTIVO' ? 'var(--color-neutral-bg)' : 'var(--color-warn-bg)'"
                :color="trabajador.estado === 'ACTIVO' ? 'var(--color-primary)' : 'var(--color-warn)'"
              >
                {{ trabajador.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
              </Pill>
            </div>
            <div class="ficha-trabajador-view__muted">
              {{ trabajador.cargo.nombre }} · Ingresó el {{ formatFecha(trabajador.fechaIngreso) }} · Antigüedad:
              {{ formatAntiguedad(trabajador.antiguedad) }}
            </div>
          </div>
          <div class="ficha-trabajador-view__head-actions">
            <button type="button" class="ficha-trabajador-view__btn-ghost" @click="abrirEdicion">Editar</button>
            <button
              type="button"
              class="ficha-trabajador-view__btn-ghost"
              :disabled="cambiandoEstado"
              @click="toggleEstado"
            >
              {{ trabajador.estado === 'ACTIVO' ? 'Inactivar' : 'Activar' }}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-if="!editando" title="Información general">
        <div class="ficha-trabajador-view__grid">
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Documento</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.documento }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Tipo de contratación</div>
            <div class="ficha-trabajador-view__stat-value">{{ TIPO_CONTRATACION_LABELS[trabajador.tipoContratacion] }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Modalidad de pago</div>
            <div class="ficha-trabajador-view__stat-value">{{ MODALIDAD_PAGO_LABELS[trabajador.modalidadPago] }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Salario / valor del jornal</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.salarioOJornal }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Fecha de nacimiento</div>
            <div class="ficha-trabajador-view__stat-value">
              {{ trabajador.fechaNacimiento ? formatFecha(trabajador.fechaNacimiento) : '—' }}
            </div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Teléfono</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.telefono ?? '—' }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Email</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.email ?? '—' }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Dirección</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.direccion ?? '—' }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Contacto de emergencia</div>
            <div class="ficha-trabajador-view__stat-value">
              {{ trabajador.contactoEmergenciaNombre ?? '—' }}
              <span v-if="trabajador.contactoEmergenciaTelefono"> · {{ trabajador.contactoEmergenciaTelefono }}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-else title="Editar información general">
        <div v-if="errorMsg" class="ficha-trabajador-view__error">{{ errorMsg }}</div>
        <div class="ficha-trabajador-view__form-grid">
          <div class="ficha-trabajador-view__field">
            <label>Nombres</label>
            <input v-model="form.nombres" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Apellidos</label>
            <input v-model="form.apellidos" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Documento</label>
            <input v-model="form.documento" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Cargo</label>
            <select v-model="form.cargoId">
              <option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Fecha de ingreso</label>
            <input v-model="form.fechaIngreso" type="date" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Tipo de contratación</label>
            <select v-model="form.tipoContratacion">
              <option v-for="(label, valor) in TIPO_CONTRATACION_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Modalidad de pago</label>
            <select v-model="form.modalidadPago">
              <option v-for="(label, valor) in MODALIDAD_PAGO_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Salario / valor del jornal</label>
            <input v-model="form.salarioOJornal" type="number" min="0" step="0.01" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Fecha de nacimiento</label>
            <input v-model="form.fechaNacimiento" type="date" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Teléfono</label>
            <input v-model="form.telefono" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Email</label>
            <input v-model="form.email" type="email" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Dirección</label>
            <input v-model="form.direccion" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Contacto de emergencia — nombre</label>
            <input v-model="form.contactoEmergenciaNombre" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Contacto de emergencia — teléfono</label>
            <input v-model="form.contactoEmergenciaTelefono" />
          </div>
        </div>
        <div class="ficha-trabajador-view__form-actions">
          <button type="button" class="ficha-trabajador-view__btn-ghost" @click="editando = false">Cancelar</button>
          <button type="button" class="ficha-trabajador-view__submit" :disabled="saving" @click="guardar">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </SectionCard>
    </template>
  </div>
</template>

<style scoped lang="scss">
.ficha-trabajador-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__back {
    align-self: flex-start;
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    h2 {
      margin: 0;
    }
  }

  &__head-actions {
    display: flex;
    gap: 0.5rem;
    flex: none;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  &__stat-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.5);
    text-transform: uppercase;
  }

  &__stat-value {
    font-size: 0.88rem;
    font-weight: 600;
    margin-top: 0.2rem;
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
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

  &__form-actions {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.85rem;
  }

  &__submit {
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
    background: transparent;
    border: 1.5px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-dark);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.6rem 1.1rem;
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
    margin-bottom: 0.6rem;
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }
}
</style>
