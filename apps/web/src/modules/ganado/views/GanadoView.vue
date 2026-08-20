<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import AppIcon from '../../../shared/components/AppIcon.vue';
import { ganadoApi, type Animal, type MotivoBaja, type SexoAnimal } from '../services/ganado.api';
import { potrerosApi, type Potrero } from '../../potreros/services/potreros.api';

const { isMobile } = useBreakpoint();

const search = ref('');
const activeId = ref<string | null>(null);
const showForm = ref(false);
const editandoId = ref<string | null>(null);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref('');
const animales = ref<Animal[]>([]);
const potreros = ref<Potrero[]>([]);

function nombrePotrero(id: string | null): string {
  if (!id) return 'Sin asignar';
  return potreros.value.find((p) => p.id === id)?.nombre ?? 'Sin asignar';
}

const MOTIVO_BAJA_LABELS: Record<MotivoBaja, string> = {
  VENTA: 'Venta',
  MUERTE: 'Muerte',
  TRASLADO: 'Traslado',
  OTRO: 'Otro',
};

const ESTADO_LABELS: Record<string, string> = {
  ACTIVO: 'Activo',
  VENDIDO: 'Vendido',
  MUERTO: 'Muerto',
  EN_TRANSITO: 'En tránsito',
  INACTIVO: 'Inactivo',
};
const ESTADO_ATENCION = new Set(['EN_TRANSITO', 'INACTIVO']);

function estiloEstado(estado: string) {
  return ESTADO_ATENCION.has(estado)
    ? { pillBg: 'var(--color-warn-bg)', pillColor: 'var(--color-warn)' }
    : { pillBg: 'var(--color-neutral-bg)', pillColor: 'var(--color-primary)' };
}

function formatFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES');
}

async function cargar() {
  loading.value = true;
  try {
    const [resp, potrerosResp] = await Promise.all([
      ganadoApi.listar({ limit: 100 }),
      potrerosApi.listar(),
    ]);
    animales.value = resp.data;
    potreros.value = potrerosResp.filter((p) => p.estado === 'ACTIVO');
    if (!animales.value.some((a) => a.id === activeId.value)) {
      activeId.value = animales.value[0]?.id ?? null;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

const filteredCows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return animales.value;
  return animales.value.filter((a) => a.identificador.toLowerCase().includes(q));
});

const selected = computed(
  () => animales.value.find((a) => a.id === activeId.value) ?? animales.value[0],
);

function selectCow(id: string) {
  activeId.value = id;
}

function toggleAccordion(id: string) {
  activeId.value = activeId.value === id ? null : id;
}

const form = ref({
  identificador: '',
  sexo: 'HEMBRA' as SexoAnimal,
  raza: '',
  fechaNacimiento: '',
  padreRefExterna: '',
  madreRefExterna: '',
  potreroActualId: '',
});

function resetForm() {
  form.value = {
    identificador: '',
    sexo: 'HEMBRA',
    raza: '',
    fechaNacimiento: '',
    padreRefExterna: '',
    madreRefExterna: '',
    potreroActualId: '',
  };
}

function cancelarForm() {
  showForm.value = false;
  editandoId.value = null;
  errorMsg.value = '';
  resetForm();
}

function abrirEdicion(animal: Animal) {
  editandoId.value = animal.id;
  form.value = {
    identificador: animal.identificador,
    sexo: animal.sexo,
    raza: animal.raza ?? '',
    fechaNacimiento: animal.fechaNacimiento ? animal.fechaNacimiento.slice(0, 10) : '',
    padreRefExterna: animal.padreRefExterna ?? '',
    madreRefExterna: animal.madreRefExterna ?? '',
    potreroActualId: animal.potreroActualId ?? '',
  };
  errorMsg.value = '';
  showForm.value = true;
  mostrarBaja.value = false;
}

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    const payload = {
      identificador: form.value.identificador,
      especie: 'BOVINO' as const,
      sexo: form.value.sexo,
      raza: form.value.raza || undefined,
      fechaNacimiento: form.value.fechaNacimiento || undefined,
      padreRefExterna: form.value.padreRefExterna || undefined,
      madreRefExterna: form.value.madreRefExterna || undefined,
      potreroActualId: form.value.potreroActualId || undefined,
    };
    const guardado = editandoId.value
      ? await ganadoApi.actualizar(editandoId.value, payload)
      : await ganadoApi.crear(payload);
    showForm.value = false;
    editandoId.value = null;
    resetForm();
    await cargar();
    activeId.value = guardado.id;
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el animal.')
      : 'No se pudo guardar el animal.';
  } finally {
    saving.value = false;
  }
}

const mostrarBaja = ref(false);
const dandoBaja = ref(false);
const bajaError = ref('');
const bajaForm = ref({
  motivo: 'VENTA' as MotivoBaja,
  fecha: new Date().toISOString().slice(0, 10),
  observaciones: '',
});

function abrirBaja() {
  showForm.value = false;
  bajaForm.value = { motivo: 'VENTA', fecha: new Date().toISOString().slice(0, 10), observaciones: '' };
  bajaError.value = '';
  mostrarBaja.value = true;
}

async function confirmarBaja() {
  if (!selected.value) return;
  bajaError.value = '';
  dandoBaja.value = true;
  try {
    await ganadoApi.darBaja(selected.value.id, {
      motivo: bajaForm.value.motivo,
      fecha: bajaForm.value.fecha,
      observaciones: bajaForm.value.observaciones || undefined,
    });
    mostrarBaja.value = false;
    await cargar();
  } catch (error) {
    bajaError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo dar de baja al animal.')
      : 'No se pudo dar de baja al animal.';
  } finally {
    dandoBaja.value = false;
  }
}
</script>

<template>
  <div class="ganado-view">
    <div class="ganado-view__toolbar">
      <div v-if="isMobile" class="ganado-view__search-row">
        <input v-model="search" class="ganado-view__search" placeholder="Buscar por identificador…" />
        <button type="button" class="ganado-view__add-btn" @click="showForm ? cancelarForm() : (showForm = true)">
          <AppIcon name="plus" :size="18" />
        </button>
      </div>
      <button
        v-else
        type="button"
        class="ganado-view__new-btn"
        @click="showForm ? cancelarForm() : (showForm = true)"
      >
        {{ showForm ? 'Cerrar formulario' : 'Registrar nuevo bovino' }}
      </button>
    </div>

    <div v-if="showForm" class="ganado-view__form">
      <div class="ganado-view__form-title">
        {{ editandoId ? 'Editar bovino' : 'Registrar nuevo bovino' }}
      </div>
      <div v-if="errorMsg" class="ganado-view__form-error">{{ errorMsg }}</div>
      <div class="ganado-view__form-grid">
        <div class="ganado-view__field">
          <label>Identificador (arete/RFID)</label>
          <input v-model="form.identificador" placeholder="004829" />
        </div>
        <div class="ganado-view__field">
          <label>Sexo</label>
          <select v-model="form.sexo">
            <option value="HEMBRA">Hembra</option>
            <option value="MACHO">Macho</option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Raza</label>
          <input v-model="form.raza" placeholder="Holstein" />
        </div>
        <div class="ganado-view__field">
          <label>Fecha de nacimiento</label>
          <input v-model="form.fechaNacimiento" type="date" />
        </div>
        <div class="ganado-view__field">
          <label>Padre</label>
          <input v-model="form.padreRefExterna" placeholder="Toro Max" />
        </div>
        <div class="ganado-view__field">
          <label>Madre</label>
          <input v-model="form.madreRefExterna" placeholder="Bonita" />
        </div>
        <div class="ganado-view__field">
          <label>Potrero actual</label>
          <select v-model="form.potreroActualId">
            <option value="">Sin asignar</option>
            <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </div>
      </div>
      <div class="ganado-view__form-actions">
        <button type="button" class="ganado-view__btn-ghost" @click="cancelarForm">Cancelar</button>
        <button
          type="button"
          class="ganado-view__btn-primary"
          :disabled="saving || !form.identificador"
          @click="guardar"
        >
          {{ saving ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Guardar bovino' }}
        </button>
      </div>
    </div>

    <div v-if="mostrarBaja && selected" class="ganado-view__form">
      <div class="ganado-view__form-title">Dar de baja a {{ selected.identificador }}</div>
      <div v-if="bajaError" class="ganado-view__form-error">{{ bajaError }}</div>
      <div class="ganado-view__form-grid">
        <div class="ganado-view__field">
          <label>Motivo</label>
          <select v-model="bajaForm.motivo">
            <option v-for="(label, valor) in MOTIVO_BAJA_LABELS" :key="valor" :value="valor">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Fecha</label>
          <input v-model="bajaForm.fecha" type="date" />
        </div>
        <div class="ganado-view__field">
          <label>Observaciones</label>
          <input v-model="bajaForm.observaciones" placeholder="Opcional" />
        </div>
      </div>
      <div class="ganado-view__form-actions">
        <button type="button" class="ganado-view__btn-ghost" @click="mostrarBaja = false">
          Cancelar
        </button>
        <button
          type="button"
          class="ganado-view__btn-primary"
          :disabled="dandoBaja"
          @click="confirmarBaja"
        >
          {{ dandoBaja ? 'Guardando…' : 'Confirmar baja' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="ganado-view__empty">Cargando…</div>
    <div v-else-if="animales.length === 0" class="ganado-view__empty">
      Todavía no hay animales registrados en este negocio.
    </div>

    <!-- Mobile: acordeón -->
    <div v-else-if="isMobile" class="ganado-view__accordion">
      <div v-for="c in filteredCows" :key="c.id" class="ganado-view__acc-item">
        <button type="button" class="ganado-view__acc-head" @click="toggleAccordion(c.id)">
          <div>
            <div class="ganado-view__acc-name">{{ c.identificador }}</div>
            <div class="ganado-view__acc-meta">{{ c.raza ?? 'Raza sin registrar' }}</div>
          </div>
          <span
            class="ganado-view__status"
            :style="estiloEstado(c.estado)"
          >
            {{ ESTADO_LABELS[c.estado] }}
          </span>
        </button>
        <div v-if="activeId === c.id" class="ganado-view__acc-body">
          <div class="ganado-view__acc-photo-row">
            <div class="ganado-view__photo ganado-view__photo--sm">
              <AppIcon name="cow" :size="22" />
            </div>
            <div>
              <div class="ganado-view__acc-birth">
                Nacida {{ formatFecha(c.fechaNacimiento) }} · {{ nombrePotrero(c.potreroActualId) }}
              </div>
              <div class="ganado-view__acc-avg">{{ c.categoria ?? 'Categoría sin calcular' }}</div>
            </div>
          </div>
          <div class="ganado-view__acc-stats">
            <div class="ganado-view__stat">
              <div class="ganado-view__stat-label">Padre</div>
              <div class="ganado-view__stat-value">{{ c.padreRefExterna ?? '—' }}</div>
            </div>
            <div class="ganado-view__stat">
              <div class="ganado-view__stat-label">Madre</div>
              <div class="ganado-view__stat-value">{{ c.madreRefExterna ?? '—' }}</div>
            </div>
          </div>
          <div class="ganado-view__detail-actions">
            <button type="button" class="ganado-view__btn-ghost" @click="abrirEdicion(c)">
              Editar
            </button>
            <button
              v-if="c.estado === 'ACTIVO'"
              type="button"
              class="ganado-view__btn-ghost"
              @click="activeId = c.id; abrirBaja()"
            >
              Dar de baja
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: lista + detalle -->
    <div v-else class="ganado-view__columns">
      <div class="ganado-view__list">
        <input v-model="search" class="ganado-view__search" placeholder="Buscar por identificador…" />
        <div class="ganado-view__list-items">
          <button
            v-for="c in filteredCows"
            :key="c.id"
            type="button"
            class="ganado-view__list-item"
            :class="{ 'ganado-view__list-item--active': c.id === activeId }"
            @click="selectCow(c.id)"
          >
            <div>
              <div class="ganado-view__acc-name">{{ c.identificador }}</div>
              <div class="ganado-view__acc-meta">{{ c.raza ?? 'Raza sin registrar' }}</div>
            </div>
            <span class="ganado-view__status" :style="estiloEstado(c.estado)">
              {{ ESTADO_LABELS[c.estado] }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="selected" class="ganado-view__detail">
        <div class="ganado-view__detail-head">
          <div class="ganado-view__photo">
            <AppIcon name="cow" :size="36" />
          </div>
          <div class="ganado-view__detail-info">
            <div class="ganado-view__detail-title-row">
              <h2>{{ selected.identificador }}</h2>
              <span class="ganado-view__status" :style="estiloEstado(selected.estado)">
                {{ ESTADO_LABELS[selected.estado] }}
              </span>
            </div>
            <div class="ganado-view__detail-line">
              {{ selected.raza ?? 'Raza sin registrar' }} · Nacida {{ formatFecha(selected.fechaNacimiento) }}
            </div>
            <div class="ganado-view__detail-line">
              Potrero actual: {{ nombrePotrero(selected.potreroActualId) }}
            </div>
            <div class="ganado-view__detail-actions">
              <button type="button" class="ganado-view__btn-ghost" @click="abrirEdicion(selected)">
                Editar
              </button>
              <button
                v-if="selected.estado === 'ACTIVO'"
                type="button"
                class="ganado-view__btn-ghost"
                @click="abrirBaja"
              >
                Dar de baja
              </button>
            </div>
          </div>
        </div>

        <div class="ganado-view__stats-grid">
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Categoría</div>
            <div class="ganado-view__stat-value ganado-view__stat-value--lg">
              {{ selected.categoria ?? '—' }}
            </div>
          </div>
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Padre</div>
            <div class="ganado-view__stat-value">{{ selected.padreRefExterna ?? '—' }}</div>
          </div>
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Madre</div>
            <div class="ganado-view__stat-value">{{ selected.madreRefExterna ?? '—' }}</div>
          </div>
        </div>

        <div>
          <div class="ganado-view__history-title">Historial reciente</div>
          <div class="ganado-view__history-empty">
            El historial de eventos (producción, sanidad, reproducción) va a estar disponible acá
            cuando se conecten esos módulos.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ganado-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__toolbar {
    display: flex;
    justify-content: flex-end;
  }

  &__search-row {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  &__search {
    flex: 1;
    border: 1.5px solid var(--color-border);
    border-radius: 999px;
    padding: 0.65rem 1rem;
    font-size: 0.8rem;
    background: var(--color-white);
    font-family: inherit;
  }

  &__add-btn {
    width: 40px;
    height: 40px;
    flex: none;
    border: none;
    border-radius: 999px;
    background: var(--color-primary);
    color: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  &__new-btn {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.3rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  &__form {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1.35rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__form-title {
    font-weight: 800;
    font-size: 1rem;
  }

  &__form-error {
    background: var(--color-warn-bg);
    color: var(--color-warn);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
  }

  &__form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    @media (max-width: 900px) {
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
      background: var(--color-bg);
      font-family: inherit;
    }
  }

  &__form-actions {
    display: flex;
    gap: 0.6rem;
    justify-content: flex-end;
  }

  &__btn-ghost {
    background: transparent;
    border: 1.5px solid #efead1;
    color: var(--color-dark);
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  &__btn-primary {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__empty {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 2rem;
    box-shadow: var(--shadow-card);
    text-align: center;
    color: rgba(40, 54, 24, 0.6);
    font-size: 0.85rem;
  }

  &__columns {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1.25rem;
    align-items: start;
  }

  &__list {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__list-items {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.3rem;
  }

  &__list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 14px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    color: inherit;

    &--active {
      background: var(--color-bg);
    }
  }

  &__acc-name {
    font-size: 0.85rem;
    font-weight: 700;
  }

  &__acc-meta {
    font-size: 0.7rem;
    color: rgba(40, 54, 24, 0.55);
  }

  &__status {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    white-space: nowrap;
  }

  &__detail {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1.35rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  &__detail-head {
    display: flex;
    gap: 1rem;
  }

  &__photo {
    width: 96px;
    height: 96px;
    flex: none;
    background: var(--color-bg);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);

    &--sm {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--color-white);
    }
  }

  &__detail-info {
    flex: 1;
    min-width: 0;
  }

  &__detail-title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
    }
  }

  &__detail-line {
    font-size: 0.82rem;
    color: rgba(40, 54, 24, 0.6);
    margin-top: 0.2rem;
  }

  &__detail-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.6rem;

    .ganado-view__btn-ghost {
      padding: 0.5rem 0.9rem;
      font-size: 0.75rem;
    }
  }

  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem;
  }

  &__stat {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
  }

  &__stat-label {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 700;
  }

  &__stat-value {
    font-size: 0.85rem;
    font-weight: 700;
    margin-top: 0.25rem;

    &--lg {
      font-size: 1.1rem;
      font-weight: 800;
    }
  }

  &__history-title {
    font-weight: 800;
    font-size: 0.92rem;
    margin-bottom: 0.5rem;
  }

  &__history-empty {
    font-size: 0.8rem;
    color: rgba(40, 54, 24, 0.55);
    padding: 0.6rem 0;
    border-top: 1px solid #f2efdd;
  }

  &__accordion {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__acc-item {
    display: flex;
    flex-direction: column;
  }

  &__acc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.75rem 0.85rem;
    background: var(--color-white);
    border: none;
    border-radius: 1rem;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    box-shadow: var(--shadow-card);
  }

  &__acc-body {
    background: var(--color-bg);
    border-radius: 1rem;
    padding: 0.85rem;
    margin-top: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__acc-photo-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  &__acc-birth {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.55);
  }

  &__acc-avg {
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 0.15rem;
  }

  &__acc-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;

    .ganado-view__stat {
      background: var(--color-white);
      padding: 0.6rem;
      border-radius: 12px;
    }
  }

  @media (max-width: 900px) {
    &__columns {
      grid-template-columns: 1fr;
    }
  }
}
</style>
