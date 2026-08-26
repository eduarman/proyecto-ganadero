<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { formatFechaCorta } from '../../../shared/utils/fecha';
import SectionCard from '../../../shared/components/SectionCard.vue';
import { useAuthStore } from '../../../stores/auth.store';
import { ganadoApi, type Animal } from '../../ganado/services/ganado.api';
import { potrerosApi, type Potrero } from '../../potreros/services/potreros.api';
import {
  alimentacionApi,
  type CostoPorInsumo,
  type Costos,
  type DestinoPlanItem,
  type FrecuenciaSuministro,
  type Insumo,
  type Plan,
  type Suministro,
  type SuministroRecurrente,
  type TipoPlanAlimentacion,
  type UnidadTiempoPlan,
} from '../services/alimentacion.api';

const { isMobile } = useBreakpoint();
const authStore = useAuthStore();

const canVerCostos = computed(() =>
  ['ADMIN_NEGOCIO', 'MAYORDOMO'].includes(authStore.negocioActivo?.rol ?? ''),
);

const TIPO_PLAN_LABELS: Record<TipoPlanAlimentacion, string> = {
  PASTOREO: 'Pastoreo',
  SUPLEMENTACION: 'Suplementación',
  ESTABULADO: 'Estabulado',
  MIXTO: 'Mixto',
};
const UNIDAD_TIEMPO_LABELS: Record<UnidadTiempoPlan, string> = { DIA: 'por día', SEMANA: 'por semana' };
const POR_LABELS: Record<DestinoPlanItem, string> = { ANIMAL: 'por animal', LOTE: 'por lote' };
const FRECUENCIA_LABELS: Record<FrecuenciaSuministro, string> = { DIARIA: 'Diaria', SEMANAL: 'Semanal' };
const BAR_COLORS = ['var(--color-dark)', 'var(--color-primary)', 'var(--color-accent)', 'var(--color-warn)'];

function formatFecha(iso: string) {
  return formatFechaCorta(iso);
}
function formatMoneda(valor: number) {
  return `$${valor.toFixed(2)}`;
}

const loading = ref(true);
const insumos = ref<Insumo[]>([]);
const planes = ref<Plan[]>([]);
const potreros = ref<Potrero[]>([]);
const animales = ref<Animal[]>([]);
const suministros = ref<Suministro[]>([]);
const suministrosRecurrentes = ref<SuministroRecurrente[]>([]);
const costos = ref<Costos | null>(null);
const costosDesde = ref('');
const costosHasta = ref('');

const animalesById = computed(() => new Map(animales.value.map((a) => [a.id, a])));
const insumosActivos = computed(() => insumos.value.filter((i) => i.estado === 'ACTIVO'));
const animalesActivos = computed(() => animales.value.filter((a) => a.estado === 'ACTIVO'));
const recurrentesActivas = computed(() => suministrosRecurrentes.value.filter((r) => r.activo));

function destinoLabel(s: Suministro): string {
  if (s.potrero) return s.potrero.nombre;
  const animal = s.animalIds[0] ? animalesById.value.get(s.animalIds[0]) : undefined;
  return animal?.identificador ?? '—';
}
function costoSuministro(s: Suministro): string {
  const costoUnitario = s.insumo.costoUnitario !== null ? Number(s.insumo.costoUnitario) : null;
  return costoUnitario !== null ? formatMoneda(Number(s.cantidad) * costoUnitario) : '—';
}
function destinoRecurrenteLabel(r: SuministroRecurrente): string {
  if (r.potrero) return r.potrero.nombre;
  const animal = r.animalIds[0] ? animalesById.value.get(r.animalIds[0]) : undefined;
  return animal?.identificador ?? '—';
}

async function cargarCostos() {
  if (!canVerCostos.value) return;
  try {
    costos.value = await alimentacionApi.costos({
      desde: costosDesde.value || undefined,
      hasta: costosHasta.value || undefined,
    });
  } catch {
    costos.value = null;
  }
}

async function cargar() {
  loading.value = true;
  try {
    const [insumosResp, planesResp, potrerosResp, animalesResp, suministrosResp, recurrentesResp] = await Promise.all([
      alimentacionApi.listarInsumos(),
      alimentacionApi.listarPlanes(),
      potrerosApi.listar(),
      ganadoApi.listar({ limit: 100 }),
      alimentacionApi.listarSuministros(),
      alimentacionApi.listarSuministrosRecurrentes(),
    ]);
    insumos.value = insumosResp;
    planes.value = planesResp;
    potreros.value = potrerosResp;
    animales.value = animalesResp.data;
    suministros.value = suministrosResp;
    suministrosRecurrentes.value = recurrentesResp;
  } finally {
    loading.value = false;
  }

  await cargarCostos();
}

onMounted(cargar);

function barPct(c: CostoPorInsumo, max: number): string {
  if (c.costoTotal === null || max === 0) return '0%';
  return `${Math.round((c.costoTotal / max) * 100)}%`;
}
const maxCosto = computed(() =>
  Math.max(0, ...(costos.value?.porTipo.map((c) => c.costoTotal ?? 0) ?? [])),
);

// --- Registro de suministro ---------------------------------------------

const form = ref({ destino: '', insumoId: '', cantidad: '', fecha: new Date().toISOString().slice(0, 10) });
const saving = ref(false);
const errorMsg = ref('');

function resetForm() {
  form.value = { destino: '', insumoId: '', cantidad: '', fecha: new Date().toISOString().slice(0, 10) };
}

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    const [tipoDestino, destinoId] = form.value.destino.split(':');
    await alimentacionApi.crearSuministro({
      fecha: form.value.fecha,
      insumoId: form.value.insumoId,
      potreroId: tipoDestino === 'potrero' ? destinoId : undefined,
      animalIds: tipoDestino === 'animal' ? [destinoId] : undefined,
      cantidad: Number(form.value.cantidad),
    });
    resetForm();
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el registro.')
      : 'No se pudo guardar el registro.';
  } finally {
    saving.value = false;
  }
}

// --- Suministros recurrentes (US-2.2) --------------------------------------

const showRecurrenteForm = ref(false);
const recurrenteForm = ref({
  destino: '',
  insumoId: '',
  cantidad: '',
  frecuencia: 'DIARIA' as FrecuenciaSuministro,
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: '',
});
const savingRecurrente = ref(false);
const recurrenteError = ref('');

function resetRecurrenteForm() {
  recurrenteForm.value = {
    destino: '',
    insumoId: '',
    cantidad: '',
    frecuencia: 'DIARIA',
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: '',
  };
}

async function guardarRecurrente() {
  recurrenteError.value = '';
  savingRecurrente.value = true;
  try {
    const [tipoDestino, destinoId] = recurrenteForm.value.destino.split(':');
    await alimentacionApi.crearSuministroRecurrente({
      insumoId: recurrenteForm.value.insumoId,
      potreroId: tipoDestino === 'potrero' ? destinoId : undefined,
      animalIds: tipoDestino === 'animal' ? [destinoId] : undefined,
      cantidad: Number(recurrenteForm.value.cantidad),
      frecuencia: recurrenteForm.value.frecuencia,
      fechaInicio: recurrenteForm.value.fechaInicio,
      fechaFin: recurrenteForm.value.fechaFin || undefined,
    });
    resetRecurrenteForm();
    showRecurrenteForm.value = false;
    await cargar();
  } catch (error) {
    recurrenteError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar la regla.')
      : 'No se pudo guardar la regla.';
  } finally {
    savingRecurrente.value = false;
  }
}

async function cancelarRecurrente(regla: SuministroRecurrente) {
  await alimentacionApi.actualizarSuministroRecurrente(regla.id, { activo: false });
  await cargar();
}

// --- Insumos --------------------------------------------------------------

const showInsumoForm = ref(false);
const insumoForm = ref({ nombre: '', unidadMedida: 'kg', costoUnitario: '' });
const savingInsumo = ref(false);
const insumoError = ref('');

async function guardarInsumo() {
  insumoError.value = '';
  savingInsumo.value = true;
  try {
    const creado = await alimentacionApi.crearInsumo({
      nombre: insumoForm.value.nombre,
      unidadMedida: insumoForm.value.unidadMedida,
      costoUnitario: insumoForm.value.costoUnitario ? Number(insumoForm.value.costoUnitario) : undefined,
    });
    insumos.value = [...insumos.value, creado].sort((a, b) => a.nombre.localeCompare(b.nombre));
    insumoForm.value = { nombre: '', unidadMedida: 'kg', costoUnitario: '' };
    showInsumoForm.value = false;
  } catch (error) {
    insumoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el insumo.')
      : 'No se pudo guardar el insumo.';
  } finally {
    savingInsumo.value = false;
  }
}

async function alternarInsumo(insumo: Insumo) {
  if (insumo.estado === 'ACTIVO') {
    await alimentacionApi.inactivarInsumo(insumo.id);
  } else {
    await alimentacionApi.activarInsumo(insumo.id);
  }
  await cargar();
}

// --- Planes de alimentación -------------------------------------------

const showPlanForm = ref(false);
const planForm = ref({
  nombre: '',
  tipo: 'MIXTO' as TipoPlanAlimentacion,
  items: [{ insumoId: '', cantidad: '', unidadTiempo: 'DIA' as UnidadTiempoPlan, por: 'ANIMAL' as DestinoPlanItem }],
});
const savingPlan = ref(false);
const planError = ref('');

function agregarItem() {
  planForm.value.items.push({ insumoId: '', cantidad: '', unidadTiempo: 'DIA', por: 'ANIMAL' });
}
function quitarItem(idx: number) {
  if (planForm.value.items.length > 1) planForm.value.items.splice(idx, 1);
}

async function guardarPlan() {
  planError.value = '';
  savingPlan.value = true;
  try {
    await alimentacionApi.crearPlan({
      nombre: planForm.value.nombre,
      tipo: planForm.value.tipo,
      items: planForm.value.items.map((i) => ({
        insumoId: i.insumoId,
        cantidad: Number(i.cantidad),
        unidadTiempo: i.unidadTiempo,
        por: i.por,
      })),
    });
    planForm.value = {
      nombre: '',
      tipo: 'MIXTO',
      items: [{ insumoId: '', cantidad: '', unidadTiempo: 'DIA', por: 'ANIMAL' }],
    };
    showPlanForm.value = false;
    await cargar();
  } catch (error) {
    planError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el plan.')
      : 'No se pudo guardar el plan.';
  } finally {
    savingPlan.value = false;
  }
}

// --- Asignación de plan a potrero/lote ----------------------------------

const asignandoPlanId = ref<string | null>(null);
const asignacionForm = ref({
  destinoTipo: 'potrero' as 'potrero' | 'lote',
  potreroId: '',
  animalIds: [] as string[],
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: '',
});
const savingAsignacion = ref(false);
const asignacionError = ref('');
const asignacionOk = ref<string | null>(null);

function abrirAsignacion(planId: string) {
  asignandoPlanId.value = asignandoPlanId.value === planId ? null : planId;
  asignacionError.value = '';
  asignacionOk.value = null;
  asignacionForm.value = {
    destinoTipo: 'potrero',
    potreroId: '',
    animalIds: [],
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: '',
  };
}

function toggleAnimalAsignacion(animalId: string) {
  const idx = asignacionForm.value.animalIds.indexOf(animalId);
  if (idx === -1) asignacionForm.value.animalIds.push(animalId);
  else asignacionForm.value.animalIds.splice(idx, 1);
}

async function guardarAsignacion(planId: string) {
  asignacionError.value = '';
  savingAsignacion.value = true;
  try {
    await alimentacionApi.crearAsignacion(planId, {
      potreroId: asignacionForm.value.destinoTipo === 'potrero' ? asignacionForm.value.potreroId : undefined,
      animalIds: asignacionForm.value.destinoTipo === 'lote' ? asignacionForm.value.animalIds : undefined,
      fechaInicio: asignacionForm.value.fechaInicio,
      fechaFin: asignacionForm.value.fechaFin || undefined,
    });
    asignacionOk.value = 'Plan asignado correctamente.';
    asignandoPlanId.value = null;
  } catch (error) {
    asignacionError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo asignar el plan.')
      : 'No se pudo asignar el plan.';
  } finally {
    savingAsignacion.value = false;
  }
}
</script>

<template>
  <div class="alimentacion-view">
    <div v-if="canVerCostos && costos" class="alimentacion-view__kpis" :class="{ 'alimentacion-view__kpis--mobile': isMobile }">
      <div class="alimentacion-view__kpi" style="background: var(--color-dark); color: var(--color-bg)">
        <div class="alimentacion-view__kpi-label">Consumo total</div>
        <div class="alimentacion-view__kpi-value">{{ costos.consumoTotalKg.toFixed(1) }} kg</div>
        <div v-if="!isMobile" class="alimentacion-view__kpi-hint">Todo el hato registrado</div>
      </div>
      <div class="alimentacion-view__kpi" style="background: var(--color-primary); color: var(--color-bg)">
        <div class="alimentacion-view__kpi-label">Consumo promedio</div>
        <div class="alimentacion-view__kpi-value">{{ costos.consumoPromedioPorAnimal.toFixed(1) }} kg</div>
        <div v-if="!isMobile" class="alimentacion-view__kpi-hint">Por animal activo</div>
      </div>
      <div class="alimentacion-view__kpi" style="background: var(--color-white); color: var(--color-dark)">
        <div class="alimentacion-view__kpi-label">Costo total</div>
        <div class="alimentacion-view__kpi-value">{{ formatMoneda(costos.costoTotalGeneral) }}</div>
        <div v-if="!isMobile" class="alimentacion-view__kpi-hint">
          {{ costos.costoParcial ? 'Costo parcial — hay insumos sin costo cargado' : 'Alimento + suplementos' }}
        </div>
      </div>
    </div>

    <div class="alimentacion-view__top" :class="{ 'alimentacion-view__top--mobile': isMobile }">
      <SectionCard :title="isMobile ? 'Registrar alimentación' : 'Registrar alimentación / suplemento'">
        <div v-if="errorMsg" class="alimentacion-view__error">{{ errorMsg }}</div>
        <div class="alimentacion-view__field">
          <label v-if="!isMobile">Destino</label>
          <select v-model="form.destino">
            <option value="" disabled>Seleccioná un potrero o un animal</option>
            <optgroup label="Potreros">
              <option v-for="p in potreros" :key="p.id" :value="`potrero:${p.id}`">{{ p.nombre }}</option>
            </optgroup>
            <optgroup label="Animales">
              <option v-for="a in animalesActivos" :key="a.id" :value="`animal:${a.id}`">{{ a.identificador }}</option>
            </optgroup>
          </select>
        </div>
        <div class="alimentacion-view__form-grid">
          <div class="alimentacion-view__field">
            <label v-if="!isMobile">Alimento</label>
            <select v-model="form.insumoId">
              <option value="" disabled>Seleccioná un insumo</option>
              <option v-for="i in insumosActivos" :key="i.id" :value="i.id">{{ i.nombre }}</option>
            </select>
          </div>
          <div class="alimentacion-view__field">
            <label v-if="!isMobile">Cantidad ({{ insumos.find((i) => i.id === form.insumoId)?.unidadMedida ?? 'kg' }})</label>
            <input v-model="form.cantidad" type="number" min="0" step="0.1" placeholder="5" />
          </div>
        </div>
        <div v-if="!isMobile" class="alimentacion-view__field">
          <label>Fecha</label>
          <input v-model="form.fecha" type="date" />
        </div>
        <button
          type="button"
          class="alimentacion-view__submit"
          :disabled="saving || !form.destino || !form.insumoId || !form.cantidad"
          @click="guardar"
        >
          {{ saving ? 'Guardando…' : 'Guardar alimentación' }}
        </button>
      </SectionCard>

      <SectionCard v-if="canVerCostos" :title="isMobile ? 'Costo por tipo' : 'Costo de alimentación por tipo'">
        <div class="alimentacion-view__costos-filtros">
          <div class="alimentacion-view__field">
            <label>Desde</label>
            <input v-model="costosDesde" type="date" @change="cargarCostos" />
          </div>
          <div class="alimentacion-view__field">
            <label>Hasta</label>
            <input v-model="costosHasta" type="date" @change="cargarCostos" />
          </div>
        </div>
        <div v-if="!loading && (!costos || costos.porTipo.length === 0)" class="alimentacion-view__muted">
          Todavía no hay consumo registrado.
        </div>
        <div v-for="(c, i) in costos?.porTipo ?? []" :key="c.insumoId" class="alimentacion-view__cost-row">
          <div class="alimentacion-view__cost-label">{{ c.nombre }}</div>
          <div class="alimentacion-view__cost-track">
            <div
              class="alimentacion-view__cost-fill"
              :style="{ width: barPct(c, maxCosto), background: BAR_COLORS[i % BAR_COLORS.length] }"
            />
          </div>
          <div class="alimentacion-view__cost-value">{{ c.costoTotal !== null ? formatMoneda(c.costoTotal) : 'sin costo' }}</div>
        </div>
      </SectionCard>
    </div>

    <SectionCard title="Insumos">
      <template #actions>
        <button type="button" class="alimentacion-view__link-btn" @click="showInsumoForm = !showInsumoForm">
          {{ showInsumoForm ? 'Cancelar' : '+ Nuevo insumo' }}
        </button>
      </template>

      <div v-if="showInsumoForm" class="alimentacion-view__sub-form">
        <div v-if="insumoError" class="alimentacion-view__error">{{ insumoError }}</div>
        <div class="alimentacion-view__form-grid" :class="{ 'alimentacion-view__form-grid--mobile': isMobile }">
          <div class="alimentacion-view__field">
            <label>Nombre</label>
            <input v-model="insumoForm.nombre" placeholder="Ensilaje de maíz" />
          </div>
          <div class="alimentacion-view__field">
            <label>Unidad</label>
            <input v-model="insumoForm.unidadMedida" placeholder="kg" />
          </div>
          <div class="alimentacion-view__field">
            <label>Costo unitario (opcional)</label>
            <input v-model="insumoForm.costoUnitario" type="number" min="0" step="0.01" placeholder="0.80" />
          </div>
        </div>
        <button
          type="button"
          class="alimentacion-view__submit alimentacion-view__submit--sm"
          :disabled="savingInsumo || !insumoForm.nombre || !insumoForm.unidadMedida"
          @click="guardarInsumo"
        >
          {{ savingInsumo ? 'Guardando…' : 'Guardar insumo' }}
        </button>
      </div>

      <div v-if="!loading && insumos.length === 0" class="alimentacion-view__muted">Todavía no hay insumos.</div>
      <div v-for="i in insumos" :key="i.id" class="alimentacion-view__insumo-row">
        <div>
          <span class="alimentacion-view__bold">{{ i.nombre }}</span>
          <span class="alimentacion-view__muted"> · {{ i.unidadMedida }}</span>
          <span v-if="i.costoUnitario" class="alimentacion-view__muted"> · {{ formatMoneda(Number(i.costoUnitario)) }}</span>
        </div>
        <button type="button" class="alimentacion-view__link-btn" @click="alternarInsumo(i)">
          {{ i.estado === 'ACTIVO' ? 'Inactivar' : 'Reactivar' }}
        </button>
      </div>
    </SectionCard>

    <SectionCard title="Suministros recurrentes">
      <template #actions>
        <button type="button" class="alimentacion-view__link-btn" @click="showRecurrenteForm = !showRecurrenteForm">
          {{ showRecurrenteForm ? 'Cancelar' : '+ Nueva regla' }}
        </button>
      </template>

      <div v-if="showRecurrenteForm" class="alimentacion-view__sub-form">
        <div v-if="recurrenteError" class="alimentacion-view__error">{{ recurrenteError }}</div>
        <div class="alimentacion-view__field">
          <label>Destino</label>
          <select v-model="recurrenteForm.destino">
            <option value="" disabled>Seleccioná un potrero o un animal</option>
            <optgroup label="Potreros">
              <option v-for="p in potreros" :key="p.id" :value="`potrero:${p.id}`">{{ p.nombre }}</option>
            </optgroup>
            <optgroup label="Animales">
              <option v-for="a in animalesActivos" :key="a.id" :value="`animal:${a.id}`">{{ a.identificador }}</option>
            </optgroup>
          </select>
        </div>
        <div class="alimentacion-view__form-grid" :class="{ 'alimentacion-view__form-grid--mobile': isMobile }">
          <div class="alimentacion-view__field">
            <label>Alimento</label>
            <select v-model="recurrenteForm.insumoId">
              <option value="" disabled>Seleccioná un insumo</option>
              <option v-for="i in insumosActivos" :key="i.id" :value="i.id">{{ i.nombre }}</option>
            </select>
          </div>
          <div class="alimentacion-view__field">
            <label>Cantidad</label>
            <input v-model="recurrenteForm.cantidad" type="number" min="0" step="0.1" placeholder="5" />
          </div>
          <div class="alimentacion-view__field">
            <label>Frecuencia</label>
            <select v-model="recurrenteForm.frecuencia">
              <option v-for="(label, valor) in FRECUENCIA_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="alimentacion-view__field">
            <label>Fecha inicio</label>
            <input v-model="recurrenteForm.fechaInicio" type="date" />
          </div>
          <div class="alimentacion-view__field">
            <label>Fecha fin (opcional)</label>
            <input v-model="recurrenteForm.fechaFin" type="date" />
          </div>
        </div>
        <button
          type="button"
          class="alimentacion-view__submit alimentacion-view__submit--sm"
          :disabled="savingRecurrente || !recurrenteForm.destino || !recurrenteForm.insumoId || !recurrenteForm.cantidad"
          @click="guardarRecurrente"
        >
          {{ savingRecurrente ? 'Guardando…' : 'Guardar regla' }}
        </button>
      </div>

      <div v-if="!loading && recurrentesActivas.length === 0" class="alimentacion-view__muted">
        Todavía no hay reglas de suministro recurrente activas.
      </div>
      <div v-for="r in recurrentesActivas" :key="r.id" class="alimentacion-view__insumo-row">
        <div>
          <span class="alimentacion-view__bold">{{ destinoRecurrenteLabel(r) }}</span>
          <span class="alimentacion-view__muted">
            · {{ r.insumo.nombre }} · {{ r.cantidad }}{{ r.insumo.unidadMedida }} · {{ FRECUENCIA_LABELS[r.frecuencia] }}
          </span>
        </div>
        <button type="button" class="alimentacion-view__link-btn" @click="cancelarRecurrente(r)">Cancelar</button>
      </div>
    </SectionCard>

    <SectionCard title="Planes de alimentación">
      <template #actions>
        <button type="button" class="alimentacion-view__link-btn" @click="showPlanForm = !showPlanForm">
          {{ showPlanForm ? 'Cancelar' : '+ Nuevo plan' }}
        </button>
      </template>

      <div v-if="showPlanForm" class="alimentacion-view__sub-form">
        <div v-if="planError" class="alimentacion-view__error">{{ planError }}</div>
        <div class="alimentacion-view__form-grid" :class="{ 'alimentacion-view__form-grid--mobile': isMobile }">
          <div class="alimentacion-view__field">
            <label>Nombre</label>
            <input v-model="planForm.nombre" placeholder="Dieta lactancia" />
          </div>
          <div class="alimentacion-view__field">
            <label>Tipo</label>
            <select v-model="planForm.tipo">
              <option v-for="(label, valor) in TIPO_PLAN_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
        </div>

        <div class="alimentacion-view__items-label">Ítems del plan</div>
        <div v-for="(item, idx) in planForm.items" :key="idx" class="alimentacion-view__item-row">
          <select v-model="item.insumoId">
            <option value="" disabled>Insumo</option>
            <option v-for="i in insumosActivos" :key="i.id" :value="i.id">{{ i.nombre }}</option>
          </select>
          <input v-model="item.cantidad" type="number" min="0" step="0.1" placeholder="Cantidad" />
          <select v-model="item.unidadTiempo">
            <option v-for="(label, valor) in UNIDAD_TIEMPO_LABELS" :key="valor" :value="valor">{{ label }}</option>
          </select>
          <select v-model="item.por">
            <option v-for="(label, valor) in POR_LABELS" :key="valor" :value="valor">{{ label }}</option>
          </select>
          <button
            type="button"
            class="alimentacion-view__item-remove"
            :disabled="planForm.items.length === 1"
            @click="quitarItem(idx)"
          >
            ×
          </button>
        </div>
        <button type="button" class="alimentacion-view__link-btn" @click="agregarItem">+ Agregar ítem</button>

        <button
          type="button"
          class="alimentacion-view__submit alimentacion-view__submit--sm"
          :disabled="savingPlan || !planForm.nombre || planForm.items.some((i) => !i.insumoId || !i.cantidad)"
          @click="guardarPlan"
        >
          {{ savingPlan ? 'Guardando…' : 'Guardar plan' }}
        </button>
      </div>

      <div v-if="!loading && planes.length === 0" class="alimentacion-view__muted">Todavía no hay planes de alimentación.</div>
      <div v-for="plan in planes" :key="plan.id" class="alimentacion-view__plan-card">
        <div class="alimentacion-view__plan-head">
          <div>
            <span class="alimentacion-view__bold">{{ plan.nombre }}</span>
            <span class="alimentacion-view__muted"> · {{ TIPO_PLAN_LABELS[plan.tipo] }}</span>
          </div>
          <button type="button" class="alimentacion-view__link-btn" @click="abrirAsignacion(plan.id)">
            {{ asignandoPlanId === plan.id ? 'Cancelar' : 'Asignar' }}
          </button>
        </div>
        <div class="alimentacion-view__muted">
          {{ plan.items.map((i) => `${i.insumo.nombre} (${i.cantidad}${i.insumo.unidadMedida} ${UNIDAD_TIEMPO_LABELS[i.unidadTiempo]})`).join(', ') }}
        </div>

        <div v-if="asignandoPlanId === plan.id" class="alimentacion-view__sub-form">
          <div v-if="asignacionError" class="alimentacion-view__error">{{ asignacionError }}</div>
          <div class="alimentacion-view__destino-tabs">
            <button
              type="button"
              :class="{ 'alimentacion-view__tab--active': asignacionForm.destinoTipo === 'potrero' }"
              class="alimentacion-view__tab"
              @click="asignacionForm.destinoTipo = 'potrero'"
            >
              Potrero
            </button>
            <button
              type="button"
              :class="{ 'alimentacion-view__tab--active': asignacionForm.destinoTipo === 'lote' }"
              class="alimentacion-view__tab"
              @click="asignacionForm.destinoTipo = 'lote'"
            >
              Lote de animales
            </button>
          </div>

          <div v-if="asignacionForm.destinoTipo === 'potrero'" class="alimentacion-view__field">
            <select v-model="asignacionForm.potreroId">
              <option value="" disabled>Seleccioná un potrero</option>
              <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
          <div v-else class="alimentacion-view__lote-checks">
            <label v-for="a in animalesActivos" :key="a.id" class="alimentacion-view__lote-check">
              <input
                type="checkbox"
                :checked="asignacionForm.animalIds.includes(a.id)"
                @change="toggleAnimalAsignacion(a.id)"
              />
              {{ a.identificador }}
            </label>
          </div>

          <div class="alimentacion-view__form-grid" :class="{ 'alimentacion-view__form-grid--mobile': isMobile }">
            <div class="alimentacion-view__field">
              <label>Fecha inicio</label>
              <input v-model="asignacionForm.fechaInicio" type="date" />
            </div>
            <div class="alimentacion-view__field">
              <label>Fecha fin (opcional)</label>
              <input v-model="asignacionForm.fechaFin" type="date" />
            </div>
          </div>
          <button
            type="button"
            class="alimentacion-view__submit alimentacion-view__submit--sm"
            :disabled="
              savingAsignacion ||
              (asignacionForm.destinoTipo === 'potrero' ? !asignacionForm.potreroId : asignacionForm.animalIds.length === 0)
            "
            @click="guardarAsignacion(plan.id)"
          >
            {{ savingAsignacion ? 'Guardando…' : 'Confirmar asignación' }}
          </button>
        </div>
      </div>
      <div v-if="asignacionOk" class="alimentacion-view__ok">{{ asignacionOk }}</div>
    </SectionCard>

    <SectionCard v-if="!isMobile" title="Consumo diario">
      <div v-if="!loading && suministros.length === 0" class="alimentacion-view__muted">Todavía no hay suministros registrados.</div>
      <template v-else>
        <div class="alimentacion-view__table-head">
          <span>Fecha</span><span>Destino</span><span>Alimento</span
          ><span class="text-end">Cantidad</span><span class="text-end">Costo</span>
        </div>
        <div v-for="s in suministros" :key="s.id" class="alimentacion-view__table-row">
          <span class="alimentacion-view__muted">{{ formatFecha(s.fecha) }}</span>
          <span class="alimentacion-view__bold">{{ destinoLabel(s) }}</span>
          <span>{{ s.insumo.nombre }}</span>
          <span class="text-end">{{ s.cantidad }} {{ s.insumo.unidadMedida }}</span>
          <span class="alimentacion-view__cost-cell">{{ costoSuministro(s) }}</span>
        </div>
      </template>
    </SectionCard>

    <div v-else class="alimentacion-view__section">
      <div class="alimentacion-view__heading">Consumo diario</div>
      <div v-if="!loading && suministros.length === 0" class="alimentacion-view__muted">Todavía no hay suministros registrados.</div>
      <div v-for="s in suministros" :key="s.id" class="alimentacion-view__daily-card">
        <div>
          <div class="alimentacion-view__bold">{{ destinoLabel(s) }}</div>
          <div class="alimentacion-view__muted">{{ s.insumo.nombre }} · {{ s.cantidad }} {{ s.insumo.unidadMedida }}</div>
        </div>
        <span class="alimentacion-view__cost-cell">{{ costoSuministro(s) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.alimentacion-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.1rem;

    &--mobile {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
    }
  }

  &__kpi {
    border-radius: 1.25rem;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    box-shadow: var(--shadow-card-strong);

    .alimentacion-view__kpis--mobile & {
      flex: none;
      width: 150px;
    }
  }

  &__kpi-label {
    font-size: 0.72rem;
    opacity: 0.75;
  }

  &__kpi-value {
    font-weight: 800;
    font-size: 1.5rem;
    line-height: 1.2;

    .alimentacion-view__kpis--mobile & {
      font-size: 1.15rem;
    }
  }

  &__kpi-hint {
    font-size: 0.72rem;
    opacity: 0.7;
  }

  &__top {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 1.25rem;
    align-items: start;

    &--mobile {
      grid-template-columns: 1fr;
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

  &__ok {
    background: var(--color-neutral-bg);
    color: var(--color-primary);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    margin-top: 0.6rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 0.6rem;

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

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;

    &--mobile {
      grid-template-columns: 1fr;
      gap: 0.6rem;
    }
  }

  &__costos-filtros {
    display: flex;
    gap: 0.6rem;
    margin-bottom: 0.6rem;

    .alimentacion-view__field {
      flex: 1;
      margin-bottom: 0;
    }
  }

  &__submit {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.8rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;

    &--sm {
      padding: 0.6rem 1rem;
      align-self: flex-start;
      margin-top: 0.4rem;
    }

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
    padding: 0.25rem 0.7rem;
    font-family: inherit;
    white-space: nowrap;
  }

  &__sub-form {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
    margin-bottom: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__cost-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__cost-label {
    width: 140px;
    flex: none;
    font-size: 0.82rem;
    font-weight: 700;

    @media (max-width: 900px) {
      width: 100px;
      font-size: 0.72rem;
    }
  }

  &__cost-track {
    flex: 1;
    background: var(--color-bg);
    border-radius: 999px;
    height: 14px;
  }

  &__cost-fill {
    height: 100%;
    border-radius: 999px;
  }

  &__cost-value {
    width: 80px;
    flex: none;
    text-align: right;
    font-size: 0.82rem;
    font-weight: 700;

    @media (max-width: 900px) {
      width: 66px;
      font-size: 0.72rem;
    }
  }

  &__insumo-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.2rem;
    border-top: 1px solid #f2efdd;
    font-size: 0.82rem;

    &:first-of-type {
      border-top: none;
    }
  }

  &__items-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.6);
    margin-top: 0.3rem;
  }

  &__item-row {
    display: grid;
    grid-template-columns: 1.4fr 0.8fr 0.9fr 0.9fr auto;
    gap: 0.4rem;

    select,
    input {
      border: 1.5px solid #efead1;
      border-radius: 10px;
      padding: 0.5rem 0.6rem;
      font-size: 0.78rem;
      background: var(--color-bg);
      font-family: inherit;
    }
  }

  &__item-remove {
    background: none;
    border: none;
    color: var(--color-warn);
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  &__plan-card {
    padding: 0.75rem 0.2rem;
    border-top: 1px solid #f2efdd;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    &:first-of-type {
      border-top: none;
    }
  }

  &__plan-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__destino-tabs {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }

  &__tab {
    flex: 1;
    background: var(--color-white);
    border: 1.5px solid #efead1;
    border-radius: 999px;
    padding: 0.4rem 0.6rem;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;

    &--active {
      background: var(--color-primary);
      color: var(--color-bg);
      border-color: var(--color-primary);
    }
  }

  &__lote-checks {
    max-height: 140px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    background: var(--color-white);
    border-radius: 10px;
    padding: 0.5rem;
    margin-bottom: 0.4rem;
  }

  &__lote-check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
  }

  &__table-head {
    display: grid;
    grid-template-columns: 70px 1fr 1.4fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 70px 1fr 1.4fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0.7rem 0.4rem;
    border-top: 1px solid #f2efdd;
    align-items: center;
    font-size: 0.82rem;
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__bold {
    font-weight: 700;
  }

  &__cost-cell {
    text-align: right;
    font-weight: 800;
    font-size: 0.82rem;
    color: var(--color-primary);
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

  &__daily-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem;
    background: var(--color-white);
    border-radius: 1rem;
    box-shadow: var(--shadow-card);
  }
}
</style>
