<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import { useRouter } from 'vue-router';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { formatFecha } from '../../../shared/utils/fecha';
import SectionCard from '../../../shared/components/SectionCard.vue';
import Pill from '../../../shared/components/Pill.vue';
import {
  trabajadoresApi,
  type Cargo,
  type CrearTrabajadorPayload,
  type EstadoTrabajador,
  type ModalidadPago,
  type Trabajador,
  type TipoContratacion,
} from '../services/trabajadores.api';

const { isMobile } = useBreakpoint();
const router = useRouter();

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

const loading = ref(true);
const trabajadores = ref<Trabajador[]>([]);
const total = ref(0);
const cargos = ref<Cargo[]>([]);
const page = ref(1);
const limit = 20;
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / limit)));

const search = ref('');
const filtroEstado = ref<EstadoTrabajador | ''>('ACTIVO');
const filtroCargoId = ref('');

async function cargar() {
  loading.value = true;
  try {
    const [listaResp, cargosResp] = await Promise.all([
      trabajadoresApi.listar({
        page: page.value,
        limit,
        search: search.value || undefined,
        estado: filtroEstado.value || undefined,
        cargoId: filtroCargoId.value || undefined,
      }),
      trabajadoresApi.listarCargos(),
    ]);
    trabajadores.value = listaResp.data;
    total.value = listaResp.total;
    cargos.value = cargosResp;
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);
watch([search, filtroEstado, filtroCargoId], () => {
  page.value = 1;
  cargar();
});

function irAPagina(p: number) {
  if (p < 1 || p > totalPaginas.value) return;
  page.value = p;
  cargar();
}

function irAFicha(id: string) {
  router.push(`/trabajadores/${id}`);
}

// --- Alta de trabajador ------------------------------------------------

const showForm = ref(false);
const form = ref<CrearTrabajadorPayload>({
  nombres: '',
  apellidos: '',
  documento: '',
  cargoId: '',
  fechaIngreso: new Date().toISOString().slice(0, 10),
  tipoContratacion: 'JORNAL',
  modalidadPago: 'DIARIO',
  salarioOJornal: 0,
  fechaNacimiento: '',
  telefono: '',
  email: '',
  direccion: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaTelefono: '',
});
const saving = ref(false);
const errorMsg = ref('');

function resetForm() {
  form.value = {
    nombres: '',
    apellidos: '',
    documento: '',
    cargoId: '',
    fechaIngreso: new Date().toISOString().slice(0, 10),
    tipoContratacion: 'JORNAL',
    modalidadPago: 'DIARIO',
    salarioOJornal: 0,
    fechaNacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
  };
}

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await trabajadoresApi.crear({
      ...form.value,
      salarioOJornal: Number(form.value.salarioOJornal),
      fechaNacimiento: form.value.fechaNacimiento || undefined,
      telefono: form.value.telefono || undefined,
      email: form.value.email || undefined,
      direccion: form.value.direccion || undefined,
      contactoEmergenciaNombre: form.value.contactoEmergenciaNombre || undefined,
      contactoEmergenciaTelefono: form.value.contactoEmergenciaTelefono || undefined,
    });
    resetForm();
    showForm.value = false;
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el trabajador.')
      : 'No se pudo guardar el trabajador.';
  } finally {
    saving.value = false;
  }
}

// --- Cargos (catálogo) --------------------------------------------------

const showCargos = ref(false);
const nuevoCargoNombre = ref('');
const savingCargo = ref(false);
const cargoError = ref('');

async function guardarCargo() {
  cargoError.value = '';
  savingCargo.value = true;
  try {
    await trabajadoresApi.crearCargo({ nombre: nuevoCargoNombre.value });
    nuevoCargoNombre.value = '';
    cargos.value = await trabajadoresApi.listarCargos();
  } catch (error) {
    cargoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el cargo.')
      : 'No se pudo guardar el cargo.';
  } finally {
    savingCargo.value = false;
  }
}

async function inactivarCargo(id: string) {
  await trabajadoresApi.inactivarCargo(id);
  cargos.value = await trabajadoresApi.listarCargos();
}
</script>

<template>
  <div class="trabajadores-view">
    <SectionCard title="Trabajadores">
      <template #actions>
        <button type="button" class="trabajadores-view__link-btn" @click="router.push('/trabajadores/asistencia')">
          Asistencia del día
        </button>
        <button type="button" class="trabajadores-view__link-btn" @click="router.push('/trabajadores/reportes')">
          Reportes
        </button>
        <button type="button" class="trabajadores-view__link-btn" @click="showCargos = !showCargos">
          {{ showCargos ? 'Cerrar cargos' : 'Gestionar cargos' }}
        </button>
        <button type="button" class="trabajadores-view__new-btn" @click="showForm ? (showForm = false) : (showForm = true)">
          {{ showForm ? 'Cerrar formulario' : '+ Nuevo trabajador' }}
        </button>
      </template>

      <div v-if="showCargos" class="trabajadores-view__sub-form">
        <div v-if="cargoError" class="trabajadores-view__error">{{ cargoError }}</div>
        <div class="trabajadores-view__cargo-add">
          <input v-model="nuevoCargoNombre" placeholder="Nombre del cargo" />
          <button
            type="button"
            class="trabajadores-view__submit trabajadores-view__submit--sm"
            :disabled="savingCargo || !nuevoCargoNombre"
            @click="guardarCargo"
          >
            {{ savingCargo ? 'Guardando…' : 'Agregar' }}
          </button>
        </div>
        <div class="trabajadores-view__cargo-list">
          <div v-for="c in cargos" :key="c.id" class="trabajadores-view__cargo-row">
            <span>{{ c.nombre }}</span>
            <button type="button" class="trabajadores-view__btn-ghost" @click="inactivarCargo(c.id)">
              Inactivar
            </button>
          </div>
        </div>
      </div>

      <div v-if="showForm" class="trabajadores-view__sub-form">
        <div v-if="errorMsg" class="trabajadores-view__error">{{ errorMsg }}</div>
        <div class="trabajadores-view__form-grid">
          <div class="trabajadores-view__field">
            <label>Nombres</label>
            <input v-model="form.nombres" />
          </div>
          <div class="trabajadores-view__field">
            <label>Apellidos</label>
            <input v-model="form.apellidos" />
          </div>
          <div class="trabajadores-view__field">
            <label>Documento</label>
            <input v-model="form.documento" />
          </div>
          <div class="trabajadores-view__field">
            <label>Cargo</label>
            <select v-model="form.cargoId">
              <option value="" disabled>Seleccioná un cargo</option>
              <option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="trabajadores-view__field">
            <label>Fecha de ingreso</label>
            <input v-model="form.fechaIngreso" type="date" />
          </div>
          <div class="trabajadores-view__field">
            <label>Tipo de contratación</label>
            <select v-model="form.tipoContratacion">
              <option v-for="(label, valor) in TIPO_CONTRATACION_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="trabajadores-view__field">
            <label>Modalidad de pago</label>
            <select v-model="form.modalidadPago">
              <option v-for="(label, valor) in MODALIDAD_PAGO_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="trabajadores-view__field">
            <label>Salario / valor del jornal</label>
            <input v-model="form.salarioOJornal" type="number" min="0" step="0.01" />
          </div>
          <div class="trabajadores-view__field">
            <label>Fecha de nacimiento (opcional)</label>
            <input v-model="form.fechaNacimiento" type="date" />
          </div>
          <div class="trabajadores-view__field">
            <label>Teléfono (opcional)</label>
            <input v-model="form.telefono" />
          </div>
          <div class="trabajadores-view__field">
            <label>Email (opcional)</label>
            <input v-model="form.email" type="email" />
          </div>
          <div class="trabajadores-view__field">
            <label>Dirección (opcional)</label>
            <input v-model="form.direccion" />
          </div>
          <div class="trabajadores-view__field">
            <label>Contacto de emergencia — nombre (opcional)</label>
            <input v-model="form.contactoEmergenciaNombre" />
          </div>
          <div class="trabajadores-view__field">
            <label>Contacto de emergencia — teléfono (opcional)</label>
            <input v-model="form.contactoEmergenciaTelefono" />
          </div>
        </div>
        <button
          type="button"
          class="trabajadores-view__submit"
          :disabled="saving || !form.nombres || !form.apellidos || !form.documento || !form.cargoId"
          @click="guardar"
        >
          {{ saving ? 'Guardando…' : 'Guardar trabajador' }}
        </button>
      </div>

      <div class="trabajadores-view__filters" :class="{ 'trabajadores-view__filters--mobile': isMobile }">
        <input v-model="search" class="trabajadores-view__search" placeholder="Buscar por nombre o documento…" />
        <select v-model="filtroEstado">
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
        <select v-model="filtroCargoId">
          <option value="">Todos los cargos</option>
          <option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
        </select>
      </div>

      <div v-if="loading" class="trabajadores-view__muted">Cargando…</div>
      <div v-else-if="trabajadores.length === 0" class="trabajadores-view__muted">No hay trabajadores para este filtro.</div>
      <template v-else-if="!isMobile">
        <div class="trabajadores-view__table-head">
          <span>Nombre</span><span>Documento</span><span>Cargo</span><span>Contratación</span><span>Ingreso</span
          ><span>Teléfono</span><span>Estado</span>
        </div>
        <button
          v-for="t in trabajadores"
          :key="t.id"
          type="button"
          class="trabajadores-view__table-row"
          @click="irAFicha(t.id)"
        >
          <span class="trabajadores-view__bold">{{ t.nombres }} {{ t.apellidos }}</span>
          <span class="trabajadores-view__muted">{{ t.documento }}</span>
          <span>{{ t.cargo.nombre }}</span>
          <span>{{ TIPO_CONTRATACION_LABELS[t.tipoContratacion] }}</span>
          <span class="trabajadores-view__muted">{{ formatFecha(t.fechaIngreso) }}</span>
          <span class="trabajadores-view__muted">{{ t.telefono ?? '—' }}</span>
          <Pill :bg="t.estado === 'ACTIVO' ? 'var(--color-neutral-bg)' : 'var(--color-warn-bg)'" :color="t.estado === 'ACTIVO' ? 'var(--color-primary)' : 'var(--color-warn)'">
            {{ t.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
          </Pill>
        </button>
      </template>
      <template v-else>
        <button v-for="t in trabajadores" :key="t.id" type="button" class="trabajadores-view__card" @click="irAFicha(t.id)">
          <div>
            <div class="trabajadores-view__bold">{{ t.nombres }} {{ t.apellidos }}</div>
            <div class="trabajadores-view__muted">{{ t.cargo.nombre }} · {{ t.documento }}</div>
          </div>
          <Pill :bg="t.estado === 'ACTIVO' ? 'var(--color-neutral-bg)' : 'var(--color-warn-bg)'" :color="t.estado === 'ACTIVO' ? 'var(--color-primary)' : 'var(--color-warn)'">
            {{ t.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
          </Pill>
        </button>
      </template>

      <div v-if="totalPaginas > 1" class="trabajadores-view__pagination">
        <button type="button" class="trabajadores-view__btn-ghost" :disabled="page === 1" @click="irAPagina(page - 1)">
          Anterior
        </button>
        <span class="trabajadores-view__muted">Página {{ page }} de {{ totalPaginas }}</span>
        <button
          type="button"
          class="trabajadores-view__btn-ghost"
          :disabled="page === totalPaginas"
          @click="irAPagina(page + 1)"
        >
          Siguiente
        </button>
      </div>
    </SectionCard>
  </div>
</template>

<style scoped lang="scss">
.trabajadores-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

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
  }

  &__new-btn {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.35rem 0.85rem;
    font-family: inherit;
    white-space: nowrap;
  }

  &__sub-form {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__cargo-add {
    display: flex;
    gap: 0.5rem;

    input {
      flex: 1;
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.6rem 0.85rem;
      font-size: 0.82rem;
      background: var(--color-white);
      font-family: inherit;
    }
  }

  &__cargo-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 220px;
    overflow-y: auto;
  }

  &__cargo-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.6rem;
    background: var(--color-white);
    border-radius: 10px;
    font-size: 0.82rem;
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

    &--sm {
      padding: 0.5rem 1rem;
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
      cursor: not-allowed;
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

  &__filters {
    display: flex;
    gap: 0.6rem;

    &--mobile {
      flex-direction: column;
    }

    select {
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.55rem 0.7rem;
      font-size: 0.8rem;
      background: var(--color-white);
      font-family: inherit;
    }
  }

  &__search {
    flex: 1;
    border: 1.5px solid #efead1;
    border-radius: 12px;
    padding: 0.6rem 0.85rem;
    font-size: 0.82rem;
    background: var(--color-white);
    font-family: inherit;
  }

  &__table-head {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1fr 1fr 0.9fr 1fr 0.8fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.66rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 1.3fr 1fr 1fr 1fr 0.9fr 1fr 0.8fr;
    gap: 0.6rem;
    padding: 0.7rem 0.4rem;
    border-top: 1px solid #f2efdd;
    align-items: center;
    font-size: 0.82rem;
    width: 100%;
    background: none;
    border-left: none;
    border-right: none;
    border-bottom: none;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
  }

  &__card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem;
    background: var(--color-white);
    border-radius: 1rem;
    box-shadow: var(--shadow-card);
    width: 100%;
    border: none;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    margin-bottom: 0.6rem;
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding-top: 0.5rem;
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__bold {
    font-weight: 700;
  }
}
</style>
