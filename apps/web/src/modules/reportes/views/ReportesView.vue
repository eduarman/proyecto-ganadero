<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import { potrerosApi, type Potrero } from '../../potreros/services/potreros.api';
import {
  reportesApi,
  type ConsolidadoReporte,
  type DatosReporte,
  type FormatoReporte,
  type ReporteGenerado,
  type TipoReporte,
  type TipoReporteInfo,
} from '../services/reportes.api';

const { isMobile } = useBreakpoint();

const PIE_COLORS = ['#dda15e', '#606c38', '#f7f7f7', '#bc6c25', '#283618', '#a3b18a'];
const BAR_COLORS = ['var(--color-accent)', 'var(--color-primary)', 'var(--color-dark)'];
const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  GENERANDO: 'Generando…',
  LISTO: 'Listo',
  ERROR: 'Error',
};

function formatFechaHora(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function buildPieSegments(values: number[]): { color: string; dash: string; offset: string }[] {
  const total = values.reduce((s, v) => s + v, 0);
  const circumference = 2 * Math.PI * 15.9;
  let acc = 0;
  return values.map((value, i) => {
    const frac = total > 0 ? value / total : 0;
    const dash = `${(frac * circumference).toFixed(2)} ${circumference.toFixed(2)}`;
    const offset = (-acc * circumference).toFixed(2);
    acc += frac;
    return { color: PIE_COLORS[i % PIE_COLORS.length], dash, offset };
  });
}

const loading = ref(true);
const catalogo = ref<TipoReporteInfo[]>([]);
const consolidadoDisponible = ref(false);
const potreros = ref<Potrero[]>([]);
const historial = ref<ReporteGenerado[]>([]);

const tipoSeleccionado = ref<TipoReporte>('PRODUCCION');
const filtros = ref({ desde: '', hasta: '', potreroId: '' });
const formato = ref<FormatoReporte>('XLSX');
const verConsolidado = ref(false);

const datos = ref<DatosReporte | null>(null);
const consolidado = ref<ConsolidadoReporte | null>(null);
const generando = ref(false);
const errorMsg = ref('');
const ultimoArchivoUrl = ref<string | null>(null);

async function cargar() {
  loading.value = true;
  try {
    const [cat, potrerosResp, historialResp] = await Promise.all([
      reportesApi.tipos(),
      potrerosApi.listar(),
      reportesApi.listarGenerados(),
    ]);
    catalogo.value = cat.tipos;
    consolidadoDisponible.value = cat.consolidadoDisponible;
    potreros.value = potrerosResp;
    historial.value = historialResp;
    if (cat.tipos.length > 0 && !cat.tipos.some((t) => t.tipo === tipoSeleccionado.value)) {
      tipoSeleccionado.value = cat.tipos[0].tipo;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

function filtrosPayload() {
  return {
    desde: filtros.value.desde || undefined,
    hasta: filtros.value.hasta || undefined,
    potreroId: filtros.value.potreroId || undefined,
  };
}

async function verVistaPrevia() {
  errorMsg.value = '';
  datos.value = null;
  consolidado.value = null;
  generando.value = true;
  try {
    if (verConsolidado.value) {
      consolidado.value = await reportesApi.consolidado(tipoSeleccionado.value, filtrosPayload());
    } else {
      const resultado = await reportesApi.generar(tipoSeleccionado.value, formato.value, filtrosPayload());
      ultimoArchivoUrl.value = resultado.archivoUrl ?? null;
      historial.value = [resultado, ...historial.value].slice(0, 50);
      const detalle = await reportesApi.obtenerGenerado(resultado.id);
      ultimoArchivoUrl.value = detalle.archivoUrl ?? null;
    }
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo generar el reporte.')
      : 'No se pudo generar el reporte.';
  } finally {
    generando.value = false;
  }
}

const produccionBars = computed(() => {
  if (datos.value?.tipo !== 'PRODUCCION') return [];
  const tabla = datos.value.tablas[0];
  const valores = tabla.filas.map((f) => Number(f[1]));
  const max = Math.max(1, ...valores);
  return tabla.filas.map((f, i) => ({
    mes: String(f[0]),
    litros: Number(f[1]),
    h: `${Math.round((valores[i] / max) * 100)}%`,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));
});

const costosPie = computed(() => {
  if (datos.value?.tipo !== 'COSTOS_ALIMENTACION') return null;
  const tabla = datos.value.tablas[0];
  const conCosto = tabla.filas.filter((f) => typeof f[2] === 'number');
  const valores = conCosto.map((f) => Number(f[2]));
  return { filas: conCosto, segments: buildPieSegments(valores) };
});
</script>

<template>
  <div class="reportes-view">
    <div v-if="!loading && catalogo.length === 0" class="reportes-view__muted">
      Tu rol no tiene acceso a reportes.
    </div>

    <template v-else>
      <div class="reportes-view__tags" :class="{ 'reportes-view__tags--mobile': isMobile }">
        <button
          v-for="t in catalogo"
          :key="t.tipo"
          type="button"
          class="reportes-view__tag"
          :class="{ 'reportes-view__tag--active': tipoSeleccionado === t.tipo }"
          @click="tipoSeleccionado = t.tipo; datos = null; consolidado = null"
        >
          {{ t.nombre }}
        </button>
      </div>

      <SectionCard title="Filtros y generación">
        <div v-if="errorMsg" class="reportes-view__error">{{ errorMsg }}</div>
        <div class="reportes-view__filtros-grid" :class="{ 'reportes-view__filtros-grid--mobile': isMobile }">
          <div class="reportes-view__field">
            <label>Desde</label>
            <input v-model="filtros.desde" type="date" />
          </div>
          <div class="reportes-view__field">
            <label>Hasta</label>
            <input v-model="filtros.hasta" type="date" />
          </div>
          <div class="reportes-view__field">
            <label>Potrero (opcional)</label>
            <select v-model="filtros.potreroId">
              <option value="">Todos</option>
              <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
          <div v-if="!verConsolidado" class="reportes-view__field">
            <label>Formato</label>
            <select v-model="formato">
              <option value="XLSX">Excel</option>
              <option value="PDF">PDF</option>
            </select>
          </div>
        </div>

        <label v-if="consolidadoDisponible" class="reportes-view__checkbox">
          <input v-model="verConsolidado" type="checkbox" />
          Ver consolidado de todos mis negocios
        </label>

        <button type="button" class="reportes-view__submit" :disabled="generando" @click="verVistaPrevia">
          {{ generando ? 'Generando…' : verConsolidado ? 'Ver consolidado' : 'Generar reporte' }}
        </button>

        <div v-if="ultimoArchivoUrl && !verConsolidado" class="reportes-view__descarga">
          <a :href="ultimoArchivoUrl" target="_blank" rel="noopener">Descargar {{ formato }}</a>
        </div>
      </SectionCard>

      <!-- Vista previa: producción (barras) -->
      <SectionCard v-if="datos?.tipo === 'PRODUCCION'" title="Producción mensual (litros)">
        <div class="reportes-view__chart" :class="{ 'reportes-view__chart--mobile': isMobile }">
          <div v-for="b in produccionBars" :key="b.mes" class="reportes-view__bar-col">
            <div class="reportes-view__bar" :style="{ height: b.h, background: b.color }" />
            <div class="reportes-view__bar-label">{{ b.mes }}</div>
          </div>
        </div>
      </SectionCard>

      <!-- Vista previa: costos de alimentación (donut) -->
      <SectionCard v-else-if="datos?.tipo === 'COSTOS_ALIMENTACION' && costosPie" title="Costo de alimentación por insumo" dark>
        <div class="reportes-view__pie-row">
          <svg viewBox="0 0 42 42" class="reportes-view__pie" :class="{ 'reportes-view__pie--mobile': isMobile }">
            <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(247,247,247,0.12)" stroke-width="6" />
            <circle
              v-for="(seg, i) in costosPie.segments"
              :key="i"
              cx="21"
              cy="21"
              r="15.9"
              fill="transparent"
              :stroke="seg.color"
              stroke-width="6"
              :stroke-dasharray="seg.dash"
              :stroke-dashoffset="seg.offset"
            />
          </svg>
          <div class="reportes-view__legend">
            <div v-for="(f, i) in costosPie.filas" :key="i" class="reportes-view__legend-item">
              <span class="reportes-view__legend-dot" :style="{ background: PIE_COLORS[i % PIE_COLORS.length] }" />
              <span class="reportes-view__legend-label">{{ f[0] }}</span>
              <span class="reportes-view__legend-value">${{ f[2] }}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <!-- Vista previa genérica: resumen + tablas -->
      <SectionCard v-else-if="datos" :title="catalogo.find((t) => t.tipo === datos!.tipo)?.nombre ?? 'Reporte'">
        <div class="reportes-view__resumen">
          <div v-for="(v, k) in datos.resumen" :key="k" class="reportes-view__resumen-item">
            <span class="reportes-view__muted">{{ k }}</span>
            <span class="reportes-view__bold">{{ v }}</span>
          </div>
        </div>
        <div v-for="tabla in datos.tablas" :key="tabla.titulo" class="reportes-view__tabla">
          <div class="reportes-view__tabla-titulo">{{ tabla.titulo }}</div>
          <div class="reportes-view__table-head" :style="{ gridTemplateColumns: `repeat(${tabla.columnas.length}, 1fr)` }">
            <span v-for="c in tabla.columnas" :key="c">{{ c }}</span>
          </div>
          <div
            v-for="(fila, i) in tabla.filas"
            :key="i"
            class="reportes-view__table-row"
            :style="{ gridTemplateColumns: `repeat(${tabla.columnas.length}, 1fr)` }"
          >
            <span v-for="(celda, j) in fila" :key="j">{{ celda }}</span>
          </div>
        </div>
      </SectionCard>

      <!-- Consolidado -->
      <SectionCard v-if="consolidado" title="Reporte consolidado por negocio">
        <div v-for="n in consolidado.negocios" :key="n.negocioId" class="reportes-view__tabla">
          <div class="reportes-view__tabla-titulo">{{ n.negocioNombre }}</div>
          <div class="reportes-view__resumen">
            <div v-for="(v, k) in n.datos.resumen" :key="k" class="reportes-view__resumen-item">
              <span class="reportes-view__muted">{{ k }}</span>
              <span class="reportes-view__bold">{{ v }}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Historial de reportes generados">
        <div v-if="!loading && historial.length === 0" class="reportes-view__muted">Todavía no generaste reportes.</div>
        <div v-for="r in historial" :key="r.id" class="reportes-view__historial-row">
          <div>
            <span class="reportes-view__bold">{{ catalogo.find((t) => t.tipo === r.tipo)?.nombre ?? r.tipo }}</span>
            <span class="reportes-view__muted"> · {{ r.formato }} · {{ formatFechaHora(r.createdAt) }}</span>
          </div>
          <span
            class="reportes-view__estado"
            :class="`reportes-view__estado--${r.estado.toLowerCase()}`"
          >
            {{ ESTADO_LABELS[r.estado] }}
          </span>
        </div>
      </SectionCard>
    </template>
  </div>
</template>

<style scoped lang="scss">
.reportes-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__tags {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;

    &--mobile {
      flex-wrap: nowrap;
      overflow-x: auto;
    }
  }

  &__tag {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    flex: none;
    border: 1.5px solid var(--color-neutral-bg);
    background: var(--color-neutral-bg);
    color: var(--color-primary);
    cursor: pointer;
    font-family: inherit;

    &--active {
      background: var(--color-dark);
      color: var(--color-bg);
      border-color: var(--color-dark);
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

  &__filtros-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.85rem;
    margin-bottom: 0.6rem;

    &--mobile {
      grid-template-columns: 1fr 1fr;
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
      padding: 0.6rem 0.75rem;
      font-size: 0.8rem;
      background: var(--color-bg);
      font-family: inherit;
    }
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.6rem;
  }

  &__submit {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.75rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
    width: 100%;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__descarga {
    margin-top: 0.6rem;
    text-align: center;

    a {
      color: var(--color-primary);
      font-weight: 700;
      font-size: 0.82rem;
    }
  }

  &__chart {
    display: flex;
    align-items: flex-end;
    gap: 0.85rem;
    height: 160px;
    padding: 0.5rem 0 0 0.6rem;
    border-left: 2px solid rgba(40, 54, 24, 0.15);
    border-bottom: 2px solid rgba(40, 54, 24, 0.15);

    &--mobile {
      height: 130px;
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
  }

  &__bar {
    width: 100%;
    max-width: 38px;
    border-radius: 10px 10px 4px 4px;
  }

  &__bar-label {
    font-size: 0.72rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 600;
  }

  &__pie-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  &__pie {
    width: 130px;
    height: 130px;
    flex: none;
    transform: rotate(-90deg);

    &--mobile {
      width: 96px;
      height: 96px;
    }
  }

  &__legend {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.78rem;
  }

  &__legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex: none;
  }

  &__legend-label {
    flex: 1;
  }

  &__legend-value {
    font-weight: 700;
  }

  &__resumen {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.6rem;
    margin-bottom: 0.85rem;
  }

  &__resumen-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    background: var(--color-bg);
    border-radius: 12px;
    padding: 0.6rem 0.75rem;
    font-size: 0.78rem;
  }

  &__tabla {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__tabla-titulo {
    font-weight: 800;
    font-size: 0.85rem;
    margin-bottom: 0.4rem;
  }

  &__table-head {
    display: grid;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    gap: 0.6rem;
    padding: 0.6rem 0.4rem;
    border-top: 1px solid #f2efdd;
    align-items: center;
    font-size: 0.82rem;
  }

  &__historial-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.2rem;
    border-top: 1px solid #f2efdd;
    font-size: 0.82rem;
    gap: 0.5rem;

    &:first-of-type {
      border-top: none;
    }
  }

  &__estado {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: var(--color-neutral-bg);
    color: var(--color-primary);
    flex: none;

    &--error {
      background: var(--color-warn-bg);
      color: var(--color-warn);
    }
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
