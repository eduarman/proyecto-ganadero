<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import Pill from '../../../shared/components/Pill.vue';
import { potrerosApi, type Potrero } from '../services/potreros.api';

const { isMobile } = useBreakpoint();

const loading = ref(true);
const saving = ref(false);
const errorMsg = ref('');
const showForm = ref(false);
const potreros = ref<Potrero[]>([]);

async function cargar() {
  loading.value = true;
  try {
    potreros.value = await potrerosApi.listar();
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

const form = ref({ nombre: '', areaHectareas: '', tipoPasto: '', capacidadCarga: '' });

function resetForm() {
  form.value = { nombre: '', areaHectareas: '', tipoPasto: '', capacidadCarga: '' };
}

function cancelarForm() {
  showForm.value = false;
  errorMsg.value = '';
  resetForm();
}

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await potrerosApi.crear({
      nombre: form.value.nombre,
      areaHectareas: Number(form.value.areaHectareas),
      tipoPasto: form.value.tipoPasto || undefined,
      capacidadCarga: form.value.capacidadCarga ? Number(form.value.capacidadCarga) : undefined,
    });
    showForm.value = false;
    resetForm();
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el potrero.')
      : 'No se pudo guardar el potrero.';
  } finally {
    saving.value = false;
  }
}

const inactivandoId = ref<string | null>(null);
const inactivarError = ref('');

async function inactivar(potrero: Potrero) {
  inactivarError.value = '';
  inactivandoId.value = potrero.id;
  try {
    await potrerosApi.inactivar(potrero.id);
    await cargar();
  } catch (error) {
    inactivarError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo inactivar el potrero.')
      : 'No se pudo inactivar el potrero.';
  } finally {
    inactivandoId.value = null;
  }
}

async function activar(potrero: Potrero) {
  inactivarError.value = '';
  inactivandoId.value = potrero.id;
  try {
    await potrerosApi.activar(potrero.id);
    await cargar();
  } catch (error) {
    inactivarError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo reactivar el potrero.')
      : 'No se pudo reactivar el potrero.';
  } finally {
    inactivandoId.value = null;
  }
}

function ocupacionPct(p: Potrero): number | null {
  const capacidad = p.capacidadCarga ? Number(p.capacidadCarga) : null;
  if (!capacidad) return null;
  return Math.min(100, Math.round((p.ocupacionActual / capacidad) * 100));
}

function estadoTag(p: Potrero): { label: string; bg: string; color: string } {
  if (p.estado === 'INACTIVO') {
    return { label: 'Inactivo', bg: 'var(--color-neutral-bg)', color: 'rgba(40, 54, 24, 0.55)' };
  }
  const pct = ocupacionPct(p);
  if (pct !== null && pct >= 90) {
    return { label: 'Sobrecargado', bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' };
  }
  return { label: 'Activo', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' };
}

const potrerosActivos = computed(() => potreros.value.filter((p) => p.estado === 'ACTIVO'));
const potrerosInactivos = computed(() => potreros.value.filter((p) => p.estado === 'INACTIVO'));
</script>

<template>
  <div class="potreros-view">
    <div class="potreros-view__toolbar">
      <button
        type="button"
        class="potreros-view__new-btn"
        @click="showForm ? cancelarForm() : (showForm = true)"
      >
        {{ showForm ? 'Cerrar formulario' : 'Registrar nuevo potrero' }}
      </button>
    </div>

    <SectionCard v-if="showForm" title="Registrar nuevo potrero">
      <div v-if="errorMsg" class="potreros-view__error">{{ errorMsg }}</div>
      <div class="potreros-view__form-grid" :class="{ 'potreros-view__form-grid--mobile': isMobile }">
        <div class="potreros-view__field">
          <label>Nombre</label>
          <input v-model="form.nombre" placeholder="Potrero 5" />
        </div>
        <div class="potreros-view__field">
          <label>Área (hectáreas)</label>
          <input v-model="form.areaHectareas" type="number" min="0" step="0.1" placeholder="12.5" />
        </div>
        <div class="potreros-view__field">
          <label>Tipo de pasto</label>
          <input v-model="form.tipoPasto" placeholder="Brachiaria" />
        </div>
        <div class="potreros-view__field">
          <label>Capacidad de carga (animales)</label>
          <input v-model="form.capacidadCarga" type="number" min="0" placeholder="50" />
        </div>
      </div>
      <button
        type="button"
        class="potreros-view__submit"
        :disabled="saving || !form.nombre || !form.areaHectareas"
        @click="guardar"
      >
        {{ saving ? 'Guardando…' : 'Guardar potrero' }}
      </button>
    </SectionCard>

    <div v-if="inactivarError" class="potreros-view__error">{{ inactivarError }}</div>

    <div v-if="loading" class="potreros-view__empty">Cargando…</div>
    <div v-else-if="potreros.length === 0" class="potreros-view__empty">
      Todavía no hay potreros registrados en este negocio.
    </div>

    <template v-else>
      <div class="potreros-view__grid" :class="{ 'potreros-view__grid--mobile': isMobile }">
        <div v-for="p in potrerosActivos" :key="p.id" class="potreros-view__card">
          <div class="potreros-view__card-head">
            <div class="potreros-view__card-name">{{ p.nombre }}</div>
            <Pill :bg="estadoTag(p).bg" :color="estadoTag(p).color">{{ estadoTag(p).label }}</Pill>
          </div>
          <div class="potreros-view__card-meta">
            {{ p.ocupacionActual }} animal(es)
            <span v-if="p.capacidadCarga"> · cap. {{ p.capacidadCarga }}</span>
            <span v-if="!isMobile && p.tipoPasto"> · {{ p.tipoPasto }}</span>
          </div>
          <div v-if="ocupacionPct(p) !== null" class="potreros-view__track">
            <div class="potreros-view__fill" :style="{ width: ocupacionPct(p) + '%' }" />
          </div>
          <div v-if="!isMobile" class="potreros-view__card-meta">{{ p.areaHectareas }} ha</div>
          <button
            type="button"
            class="potreros-view__inactivar-btn"
            :disabled="inactivandoId === p.id"
            @click="inactivar(p)"
          >
            {{ inactivandoId === p.id ? 'Inactivando…' : 'Inactivar' }}
          </button>
        </div>
      </div>

      <div v-if="potrerosInactivos.length" class="potreros-view__section">
        <div class="potreros-view__heading">Potreros inactivos</div>
        <div v-for="p in potrerosInactivos" :key="p.id" class="potreros-view__history-card">
          <div class="potreros-view__bold">{{ p.nombre }}</div>
          <div class="potreros-view__history-actions">
            <Pill :bg="estadoTag(p).bg" :color="estadoTag(p).color">{{ estadoTag(p).label }}</Pill>
            <button
              type="button"
              class="potreros-view__inactivar-btn"
              :disabled="inactivandoId === p.id"
              @click="activar(p)"
            >
              {{ inactivandoId === p.id ? 'Reactivando…' : 'Reactivar' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <div class="potreros-view__section">
      <div class="potreros-view__heading">Movimientos y rotación</div>
      <div class="potreros-view__placeholder">
        El registro de movimientos entre potreros y el historial de rotación van a estar
        disponibles cuando se conecte el módulo de movimientos de ganado.
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.potreros-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__toolbar {
    display: flex;
    justify-content: flex-end;
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

  &__error {
    background: var(--color-warn-bg);
    color: var(--color-warn);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
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

  &__form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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

    input {
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.65rem 0.85rem;
      font-size: 0.82rem;
      background: var(--color-bg);
      font-family: inherit;
    }
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
    align-self: flex-start;
    margin-top: 0.85rem;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;

    &--mobile {
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
  }

  &__card {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1.1rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    .potreros-view__grid--mobile & {
      border-radius: 1rem;
      padding: 0.85rem;
      gap: 0.5rem;
    }
  }

  &__card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__card-name {
    font-weight: 800;
    font-size: 0.92rem;

    .potreros-view__grid--mobile & {
      font-size: 0.8rem;
    }
  }

  &__card-meta {
    font-size: 0.75rem;
    color: rgba(40, 54, 24, 0.6);
  }

  &__track {
    background: var(--color-bg);
    border-radius: 999px;
    height: 12px;
  }

  &__fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 999px;
  }

  &__inactivar-btn {
    background: transparent;
    border: 1.5px solid #efead1;
    color: var(--color-dark);
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    font-weight: 700;
    font-size: 0.72rem;
    cursor: pointer;
    font-family: inherit;
    align-self: flex-start;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__bold {
    font-weight: 700;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__heading {
    font-weight: 800;
    font-size: 0.9rem;
  }

  &__placeholder {
    font-size: 0.8rem;
    color: rgba(40, 54, 24, 0.55);
    background: var(--color-white);
    border-radius: 1rem;
    padding: 0.9rem 1rem;
    box-shadow: var(--shadow-card);
  }

  &__history-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem;
    background: var(--color-white);
    border-radius: 1rem;
    box-shadow: var(--shadow-card);
  }

  &__history-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
}
</style>
