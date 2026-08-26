<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { formatFechaCorta } from '../../../shared/utils/fecha';
import SectionCard from '../../../shared/components/SectionCard.vue';
import Pill from '../../../shared/components/Pill.vue';
import { ganadoApi, type Animal } from '../../ganado/services/ganado.api';
import { potrerosApi, type Potrero } from '../../potreros/services/potreros.api';
import {
  produccionApi,
  type CrearRegistroLecheLotePayload,
  type IndicadoresProduccion,
  type RegistroLeche,
  type RegistroLecheTotal,
  type RegistroPeso,
  type TurnoOrdenio,
} from '../services/produccion.api';

const { isMobile } = useBreakpoint();

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const TURNO_LABELS: Record<TurnoOrdenio, string> = { MANANA: 'Mañana', TARDE: 'Tarde', UNICO: 'Único' };

function mesLabel(clave: string): string {
  const mesIndex = Number(clave.split('-')[1]) - 1;
  return MESES[mesIndex] ?? clave;
}

function formatLitros(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(1);
}

function formatFecha(iso: string): string {
  return formatFechaCorta(iso);
}

const loading = ref(true);
const animales = ref<Animal[]>([]);
const potreros = ref<Potrero[]>([]);
const indicadores = ref<IndicadoresProduccion | null>(null);
const registros = ref<RegistroLeche[]>([]);
const totales = ref<RegistroLecheTotal[]>([]);
const pesos = ref<RegistroPeso[]>([]);

async function cargar() {
  loading.value = true;
  try {
    const [animalesResp, indicadoresResp, registrosResp, totalesResp, potrerosResp, pesosResp] = await Promise.all([
      ganadoApi.listar({ limit: 100 }),
      produccionApi.indicadores(),
      produccionApi.listar(),
      produccionApi.listarTotales(),
      potrerosApi.listar(),
      produccionApi.listarPesos(),
    ]);
    animales.value = animalesResp.data;
    indicadores.value = indicadoresResp;
    registros.value = registrosResp;
    totales.value = totalesResp;
    potreros.value = potrerosResp;
    pesos.value = pesosResp;
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

const animalesActivos = computed(() => animales.value.filter((a) => a.estado === 'ACTIVO'));

const kpis = computed(() => {
  const ind = indicadores.value;
  if (!ind) return [];
  const variacion =
    ind.variacionMensualPct === null
      ? '—'
      : `${ind.variacionMensualPct >= 0 ? '+' : ''}${ind.variacionMensualPct.toFixed(1)}%`;
  return [
    {
      label: 'Producción de hoy',
      value: `${formatLitros(ind.totalHoy)} L`,
      hint: `${ind.animalesHoy} animal(es) en ordeño`,
      bg: 'var(--color-dark)',
      color: 'var(--color-bg)',
    },
    {
      label: 'Promedio por vaca',
      value: `${ind.promedioHoy.toFixed(1)} L`,
      hint: `${ind.animalesHoy} animales en ordeño`,
      bg: 'var(--color-primary)',
      color: 'var(--color-bg)',
    },
    {
      label: 'Variación mensual',
      value: variacion,
      hint: 'Vs. mes anterior',
      bg: 'var(--color-white)',
      color: 'var(--color-dark)',
    },
  ];
});

const monthly = computed(() => {
  const meses = indicadores.value?.meses ?? [];
  const max = Math.max(1, ...meses.map((m) => m.total));
  return meses.map((m) => ({
    month: mesLabel(m.mes),
    value: formatLitros(m.total),
    h: `${Math.max(4, Math.round((m.total / max) * 100))}%`,
    color: 'var(--color-primary)',
  }));
});

const form = ref({
  animalId: '',
  turno: 'MANANA' as TurnoOrdenio,
  fecha: new Date().toISOString().slice(0, 10),
  litros: '',
});
const saving = ref(false);
const errorMsg = ref('');

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await produccionApi.registrarLeche({
      animalId: form.value.animalId,
      turno: form.value.turno,
      fecha: form.value.fecha,
      litros: Number(form.value.litros),
    });
    form.value.litros = '';
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el registro.')
      : 'No se pudo guardar el registro.';
  } finally {
    saving.value = false;
  }
}

const showLoteLeche = ref(false);
const loteLecheFecha = ref(new Date().toISOString().slice(0, 10));
const loteLecheTurno = ref<TurnoOrdenio>('MANANA');
const loteLecheValores = ref<Record<string, string>>({});
const savingLoteLeche = ref(false);
const loteLecheError = ref('');

async function guardarLoteLeche() {
  loteLecheError.value = '';
  const registrosLote: CrearRegistroLecheLotePayload['registros'] = Object.entries(loteLecheValores.value)
    .filter(([, valor]) => valor !== '')
    .map(([animalId, valor]) => ({ animalId, litros: Number(valor) }));

  if (registrosLote.length === 0) {
    loteLecheError.value = 'Cargá al menos un valor de litros para guardar el lote.';
    return;
  }

  savingLoteLeche.value = true;
  try {
    await produccionApi.registrarLecheLote({
      fecha: loteLecheFecha.value,
      turno: loteLecheTurno.value,
      registros: registrosLote,
    });
    loteLecheValores.value = {};
    showLoteLeche.value = false;
    await cargar();
  } catch (error) {
    loteLecheError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el lote de leche.')
      : 'No se pudo guardar el lote de leche.';
  } finally {
    savingLoteLeche.value = false;
  }
}

const showTotalForm = ref(false);
const totalForm = ref({
  fecha: new Date().toISOString().slice(0, 10),
  turno: 'MANANA' as TurnoOrdenio,
  litrosTotal: '',
});
const savingTotal = ref(false);
const totalError = ref('');

async function guardarTotal() {
  totalError.value = '';
  savingTotal.value = true;
  try {
    await produccionApi.registrarTotal({
      fecha: totalForm.value.fecha,
      turno: totalForm.value.turno,
      litrosTotal: Number(totalForm.value.litrosTotal),
    });
    totalForm.value.litrosTotal = '';
    showTotalForm.value = false;
    await cargar();
  } catch (error) {
    totalError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el total.')
      : 'No se pudo guardar el total. (Solo administradores y mayordomos pueden cargar el total por turno.)';
  } finally {
    savingTotal.value = false;
  }
}

// --- Registro de peso (US-3) ----------------------------------------------

const pesoForm = ref({ animalId: '', fecha: new Date().toISOString().slice(0, 10), pesoKg: '' });
const savingPeso = ref(false);
const pesoError = ref('');

async function guardarPeso() {
  pesoError.value = '';
  savingPeso.value = true;
  try {
    await produccionApi.registrarPeso({
      animalId: pesoForm.value.animalId,
      fecha: pesoForm.value.fecha,
      pesoKg: Number(pesoForm.value.pesoKg),
    });
    pesoForm.value.pesoKg = '';
    await cargar();
  } catch (error) {
    pesoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el pesaje.')
      : 'No se pudo guardar el pesaje.';
  } finally {
    savingPeso.value = false;
  }
}

const showLotePeso = ref(false);
const lotePesoFecha = ref(new Date().toISOString().slice(0, 10));
const lotePesoPotreroId = ref('');
const lotePesoValores = ref<Record<string, string>>({});
const savingLotePeso = ref(false);
const lotePesoError = ref('');

const animalesLote = computed(() => {
  const activos = animales.value.filter((a) => a.estado === 'ACTIVO');
  if (!lotePesoPotreroId.value) return activos;
  return activos.filter((a) => a.potreroActualId === lotePesoPotreroId.value);
});

async function guardarLotePeso() {
  lotePesoError.value = '';
  const registrosLote = Object.entries(lotePesoValores.value)
    .filter(([, valor]) => valor !== '')
    .map(([animalId, valor]) => ({ animalId, pesoKg: Number(valor) }));

  if (registrosLote.length === 0) {
    lotePesoError.value = 'Cargá al menos un peso para guardar el lote.';
    return;
  }

  savingLotePeso.value = true;
  try {
    await produccionApi.registrarPesoLote({ fecha: lotePesoFecha.value, registros: registrosLote });
    lotePesoValores.value = {};
    showLotePeso.value = false;
    await cargar();
  } catch (error) {
    lotePesoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el lote de pesajes.')
      : 'No se pudo guardar el lote de pesajes.';
  } finally {
    savingLotePeso.value = false;
  }
}
</script>

<template>
  <div class="produccion-view">
    <div class="produccion-view__kpis" :class="{ 'produccion-view__kpis--mobile': isMobile }">
      <div
        v-for="k in kpis"
        :key="k.label"
        class="produccion-view__kpi"
        :style="{ background: k.bg, color: k.color }"
      >
        <div class="produccion-view__kpi-label">{{ k.label }}</div>
        <div class="produccion-view__kpi-value">{{ k.value }}</div>
        <div v-if="!isMobile" class="produccion-view__kpi-hint">{{ k.hint }}</div>
      </div>
    </div>

    <div class="produccion-view__top" :class="{ 'produccion-view__top--mobile': isMobile }">
      <SectionCard :title="isMobile ? 'Registrar producción' : 'Registrar producción de leche'">
        <template #actions>
          <button type="button" class="produccion-view__link-btn" @click="showLoteLeche = !showLoteLeche">
            {{ showLoteLeche ? 'Cancelar' : 'Cargar leche por lote' }}
          </button>
          <button type="button" class="produccion-view__link-btn" @click="showTotalForm = !showTotalForm">
            {{ showTotalForm ? 'Cancelar' : 'Cargar total por turno' }}
          </button>
        </template>
        <div v-if="errorMsg" class="produccion-view__error">{{ errorMsg }}</div>
        <div class="produccion-view__field">
          <label v-if="!isMobile">Bovino</label>
          <select v-model="form.animalId">
            <option value="" disabled>Seleccioná un animal</option>
            <option v-for="a in animalesActivos" :key="a.id" :value="a.id">{{ a.identificador }}</option>
          </select>
        </div>
        <div class="produccion-view__form-grid" :class="{ 'produccion-view__form-grid--mobile': isMobile }">
          <div class="produccion-view__field">
            <label v-if="!isMobile">Turno</label>
            <select v-model="form.turno">
              <option v-for="(label, valor) in TURNO_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="produccion-view__field">
            <label v-if="!isMobile">Fecha</label>
            <input v-model="form.fecha" type="date" />
          </div>
        </div>
        <div class="produccion-view__field">
          <label>Litros</label>
          <input v-model="form.litros" type="number" min="0" step="0.1" placeholder="15.2" />
        </div>
        <button
          type="button"
          class="produccion-view__submit"
          :disabled="saving || !form.animalId || !form.litros"
          @click="guardar"
        >
          {{ saving ? 'Guardando…' : 'Guardar producción' }}
        </button>

        <div v-if="showLoteLeche" class="produccion-view__total-form">
          <div class="produccion-view__total-form-title">Registrar leche por lote</div>
          <div v-if="loteLecheError" class="produccion-view__error">{{ loteLecheError }}</div>
          <div class="produccion-view__form-grid" :class="{ 'produccion-view__form-grid--mobile': isMobile }">
            <div class="produccion-view__field">
              <label>Turno</label>
              <select v-model="loteLecheTurno">
                <option v-for="(label, valor) in TURNO_LABELS" :key="valor" :value="valor">{{ label }}</option>
              </select>
            </div>
            <div class="produccion-view__field">
              <label>Fecha</label>
              <input v-model="loteLecheFecha" type="date" />
            </div>
          </div>
          <div v-if="animalesActivos.length === 0" class="produccion-view__muted">
            No hay animales activos para registrar.
          </div>
          <div v-else class="produccion-view__lote-grid">
            <div v-for="a in animalesActivos" :key="a.id" class="produccion-view__lote-row">
              <span class="produccion-view__bold">{{ a.identificador }}</span>
              <input v-model="loteLecheValores[a.id]" type="number" min="0" step="0.1" placeholder="L" />
            </div>
          </div>
          <button
            type="button"
            class="produccion-view__submit produccion-view__submit--sm"
            :disabled="savingLoteLeche"
            @click="guardarLoteLeche"
          >
            {{ savingLoteLeche ? 'Guardando…' : 'Guardar leche del lote' }}
          </button>
        </div>

        <div v-if="showTotalForm" class="produccion-view__total-form">
          <div class="produccion-view__total-form-title">
            Total del turno (sin desglosar por animal)
          </div>
          <div v-if="totalError" class="produccion-view__error">{{ totalError }}</div>
          <div class="produccion-view__form-grid" :class="{ 'produccion-view__form-grid--mobile': isMobile }">
            <div class="produccion-view__field">
              <label>Turno</label>
              <select v-model="totalForm.turno">
                <option v-for="(label, valor) in TURNO_LABELS" :key="valor" :value="valor">{{ label }}</option>
              </select>
            </div>
            <div class="produccion-view__field">
              <label>Fecha</label>
              <input v-model="totalForm.fecha" type="date" />
            </div>
          </div>
          <div class="produccion-view__field">
            <label>Litros totales</label>
            <input v-model="totalForm.litrosTotal" type="number" min="0" step="0.1" placeholder="1840" />
          </div>
          <button
            type="button"
            class="produccion-view__submit produccion-view__submit--sm"
            :disabled="savingTotal || !totalForm.litrosTotal"
            @click="guardarTotal"
          >
            {{ savingTotal ? 'Guardando…' : 'Guardar total del turno' }}
          </button>
        </div>
      </SectionCard>

      <SectionCard v-if="!isMobile" title="Producción mensual (litros)">
        <template #actions>
          <span class="produccion-view__tag">Últimos 6 meses</span>
        </template>
        <div class="produccion-view__chart">
          <div v-for="m in monthly" :key="m.month" class="produccion-view__bar-col">
            <div class="produccion-view__bar-value">{{ m.value }}</div>
            <div class="produccion-view__bar" :style="{ height: m.h, background: m.color }" />
            <div class="produccion-view__bar-label">{{ m.month }}</div>
          </div>
        </div>
      </SectionCard>
    </div>

    <SectionCard :title="isMobile ? 'Registrar peso' : 'Registrar peso / GDP'">
      <template #actions>
        <button type="button" class="produccion-view__link-btn" @click="showLotePeso = !showLotePeso">
          {{ showLotePeso ? 'Cancelar' : 'Cargar pesajes por lote' }}
        </button>
      </template>
      <div v-if="pesoError" class="produccion-view__error">{{ pesoError }}</div>
      <div class="produccion-view__field">
        <label v-if="!isMobile">Bovino</label>
        <select v-model="pesoForm.animalId">
          <option value="" disabled>Seleccioná un animal</option>
          <option v-for="a in animalesActivos" :key="a.id" :value="a.id">{{ a.identificador }}</option>
        </select>
      </div>
      <div class="produccion-view__form-grid" :class="{ 'produccion-view__form-grid--mobile': isMobile }">
        <div class="produccion-view__field">
          <label v-if="!isMobile">Fecha</label>
          <input v-model="pesoForm.fecha" type="date" />
        </div>
        <div class="produccion-view__field">
          <label v-if="!isMobile">Peso (kg)</label>
          <input v-model="pesoForm.pesoKg" type="number" min="0" step="0.1" placeholder="320" />
        </div>
      </div>
      <button
        type="button"
        class="produccion-view__submit"
        :disabled="savingPeso || !pesoForm.animalId || !pesoForm.pesoKg"
        @click="guardarPeso"
      >
        {{ savingPeso ? 'Guardando…' : 'Guardar pesaje' }}
      </button>

      <div v-if="showLotePeso" class="produccion-view__total-form">
        <div class="produccion-view__total-form-title">Pesajes por lote</div>
        <div v-if="lotePesoError" class="produccion-view__error">{{ lotePesoError }}</div>
        <div class="produccion-view__form-grid" :class="{ 'produccion-view__form-grid--mobile': isMobile }">
          <div class="produccion-view__field">
            <label>Fecha</label>
            <input v-model="lotePesoFecha" type="date" />
          </div>
          <div class="produccion-view__field">
            <label>Potrero</label>
            <select v-model="lotePesoPotreroId">
              <option value="">Todos los animales activos</option>
              <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
        </div>
        <div v-if="animalesLote.length === 0" class="produccion-view__muted">
          No hay animales activos para este filtro.
        </div>
        <div v-else class="produccion-view__lote-grid">
          <div v-for="a in animalesLote" :key="a.id" class="produccion-view__lote-row">
            <span class="produccion-view__bold">{{ a.identificador }}</span>
            <input v-model="lotePesoValores[a.id]" type="number" min="0" step="0.1" placeholder="kg" />
          </div>
        </div>
        <button
          type="button"
          class="produccion-view__submit produccion-view__submit--sm"
          :disabled="savingLotePeso"
          @click="guardarLotePeso"
        >
          {{ savingLotePeso ? 'Guardando…' : 'Guardar pesajes del lote' }}
        </button>
      </div>
    </SectionCard>

    <SectionCard v-if="isMobile" title="Producción mensual">
      <div class="produccion-view__chart produccion-view__chart--mobile">
        <div v-for="m in monthly" :key="m.month" class="produccion-view__bar-col produccion-view__bar-col--mobile">
          <div class="produccion-view__bar produccion-view__bar--mobile" :style="{ height: m.h, background: m.color }" />
          <div class="produccion-view__bar-label">{{ m.month }}</div>
        </div>
      </div>
    </SectionCard>

    <div v-if="loading" class="produccion-view__muted">Cargando…</div>

    <SectionCard v-else-if="!isMobile" title="Producción diaria por turno">
      <div v-if="registros.length === 0" class="produccion-view__muted">Todavía no hay registros.</div>
      <template v-else>
        <div class="produccion-view__table-head">
          <span>Fecha</span><span>Bovino</span><span>Turno</span><span class="text-end">Litros</span>
        </div>
        <div v-for="r in registros" :key="r.id" class="produccion-view__table-row">
          <span class="produccion-view__muted">{{ formatFecha(r.fecha) }}</span>
          <span class="produccion-view__bold">{{ r.animal.identificador }}</span>
          <Pill>{{ TURNO_LABELS[r.turno] }}</Pill>
          <span class="produccion-view__liters">{{ r.litros }} L</span>
        </div>
      </template>
    </SectionCard>

    <div v-else class="produccion-view__section">
      <div class="produccion-view__heading">Producción diaria</div>
      <div v-if="registros.length === 0" class="produccion-view__muted">Todavía no hay registros.</div>
      <div v-for="r in registros" :key="r.id" class="produccion-view__daily-card">
        <div>
          <div class="produccion-view__bold">{{ r.animal.identificador }}</div>
          <div class="produccion-view__muted">{{ formatFecha(r.fecha) }} · {{ TURNO_LABELS[r.turno] }}</div>
        </div>
        <span class="produccion-view__liters">{{ r.litros }} L</span>
      </div>
    </div>

    <div v-if="!loading && totales.length > 0" class="produccion-view__section">
      <div class="produccion-view__heading">Totales cargados por turno</div>
      <div v-for="t in totales" :key="t.id" class="produccion-view__daily-card">
        <div>
          <div class="produccion-view__bold">{{ TURNO_LABELS[t.turno] }}</div>
          <div class="produccion-view__muted">{{ formatFecha(t.fecha) }}</div>
        </div>
        <span class="produccion-view__liters">{{ t.litrosTotal }} L</span>
      </div>
    </div>

    <div v-if="!loading" class="produccion-view__section">
      <div class="produccion-view__heading">Pesajes recientes</div>
      <div v-if="pesos.length === 0" class="produccion-view__muted">Todavía no hay pesajes registrados.</div>
      <div v-for="p in pesos" :key="p.id" class="produccion-view__daily-card">
        <div>
          <div class="produccion-view__bold">{{ p.animal.identificador }}</div>
          <div class="produccion-view__muted">{{ formatFecha(p.fecha) }}</div>
        </div>
        <span class="produccion-view__liters">{{ p.pesoKg }} kg</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.produccion-view {
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

    .produccion-view__kpis--mobile & {
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

    .produccion-view__kpis--mobile & {
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

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;

    &--mobile {
      gap: 0.6rem;
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

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }

    &--sm {
      padding: 0.6rem 1rem;
      align-self: flex-start;
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

  &__total-form {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
    margin-top: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__total-form-title {
    font-weight: 700;
    font-size: 0.8rem;
  }

  &__lote-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 260px;
    overflow-y: auto;
  }

  &__lote-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;

    input {
      max-width: 110px;
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.5rem 0.7rem;
      font-size: 0.8rem;
      background: var(--color-white);
      font-family: inherit;
    }
  }

  &__tag {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-primary);
  }

  &__chart {
    display: flex;
    align-items: flex-end;
    gap: 1.1rem;
    height: 160px;
    padding: 0.5rem 0 0 0.6rem;
    border-left: 2px solid rgba(40, 54, 24, 0.15);
    border-bottom: 2px solid rgba(40, 54, 24, 0.15);

    &--mobile {
      height: 130px;
      gap: 0.6rem;
      overflow-x: auto;
    }
  }

  &__bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    height: 100%;
    justify-content: flex-end;

    &--mobile {
      flex: none;
      width: 34px;
    }
  }

  &__bar-value {
    font-size: 0.68rem;
    font-weight: 700;
  }

  &__bar {
    width: 100%;
    max-width: 40px;
    border-radius: 10px 10px 4px 4px;

    &--mobile {
      border-radius: 8px 8px 3px 3px;
    }
  }

  &__bar-label {
    font-size: 0.72rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 600;
  }

  &__table-head {
    display: grid;
    grid-template-columns: 100px 1.2fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 100px 1.2fr 1fr 1fr;
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

  &__liters {
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
