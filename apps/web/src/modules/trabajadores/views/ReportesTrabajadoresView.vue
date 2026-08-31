<script setup lang="ts">
import { ref } from 'vue';
import { isAxiosError } from 'axios';
import { useRouter } from 'vue-router';
import SectionCard from '../../../shared/components/SectionCard.vue';
import {
  trabajadoresApi,
  type DatosReporteTrabajador,
  type FormatoReporteTrabajador,
  type TipoReporteTrabajador,
} from '../services/trabajadores.api';

const router = useRouter();

const TIPOS: { key: TipoReporteTrabajador; label: string }[] = [
  { key: 'trabajadores', label: 'Trabajadores' },
  { key: 'asistencia', label: 'Asistencia' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'costo-laboral', label: 'Costo laboral' },
];

const FORMATOS: { key: FormatoReporteTrabajador; label: string }[] = [
  { key: 'xlsx', label: 'Excel' },
  { key: 'pdf', label: 'PDF' },
  { key: 'csv', label: 'CSV' },
];

const tipoSeleccionado = ref<TipoReporteTrabajador>('trabajadores');
const filtros = ref({ desde: '', hasta: '' });
const datos = ref<DatosReporteTrabajador | null>(null);
const generando = ref(false);
const generarError = ref('');
const exportandoFormato = ref<FormatoReporteTrabajador | null>(null);
const exportarError = ref('');

function filtrosPayload() {
  return { desde: filtros.value.desde || undefined, hasta: filtros.value.hasta || undefined };
}

async function generar() {
  generarError.value = '';
  generando.value = true;
  try {
    datos.value = await trabajadoresApi.obtenerReporte(tipoSeleccionado.value, filtrosPayload());
  } catch (error) {
    generarError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo generar el reporte.')
      : 'No se pudo generar el reporte.';
  } finally {
    generando.value = false;
  }
}

async function exportar(formato: FormatoReporteTrabajador) {
  exportarError.value = '';
  exportandoFormato.value = formato;
  try {
    const blob = await trabajadoresApi.exportarReporte(tipoSeleccionado.value, formato, filtrosPayload());
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${tipoSeleccionado.value}.${formato}`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    exportarError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo exportar el reporte.')
      : 'No se pudo exportar el reporte.';
  } finally {
    exportandoFormato.value = null;
  }
}
</script>

<template>
  <div class="reportes-trabajadores-view">
    <SectionCard title="Reportes de trabajadores">
      <template #actions>
        <button type="button" class="reportes-trabajadores-view__link-btn" @click="router.push('/trabajadores')">
          ← Volver a Trabajadores
        </button>
      </template>

      <div class="reportes-trabajadores-view__tabs">
        <button
          v-for="t in TIPOS"
          :key="t.key"
          type="button"
          class="reportes-trabajadores-view__tab"
          :class="{ 'reportes-trabajadores-view__tab--active': tipoSeleccionado === t.key }"
          @click="tipoSeleccionado = t.key; datos = null"
        >
          {{ t.label }}
        </button>
      </div>

      <div v-if="tipoSeleccionado !== 'trabajadores'" class="reportes-trabajadores-view__form-grid">
        <div class="reportes-trabajadores-view__field">
          <label>Desde</label>
          <input v-model="filtros.desde" type="date" />
        </div>
        <div class="reportes-trabajadores-view__field">
          <label>Hasta</label>
          <input v-model="filtros.hasta" type="date" />
        </div>
      </div>

      <div v-if="generarError" class="reportes-trabajadores-view__error">{{ generarError }}</div>

      <button type="button" class="reportes-trabajadores-view__submit" :disabled="generando" @click="generar">
        {{ generando ? 'Generando…' : 'Generar' }}
      </button>
    </SectionCard>

    <SectionCard v-if="datos" title="Resultado">
      <template #actions>
        <div class="reportes-trabajadores-view__export-actions">
          <button
            v-for="f in FORMATOS"
            :key="f.key"
            type="button"
            class="reportes-trabajadores-view__link-btn"
            :disabled="exportandoFormato !== null"
            @click="exportar(f.key)"
          >
            {{ exportandoFormato === f.key ? 'Exportando…' : `Exportar ${f.label}` }}
          </button>
        </div>
      </template>

      <div v-if="exportarError" class="reportes-trabajadores-view__error">{{ exportarError }}</div>

      <div class="reportes-trabajadores-view__resumen">
        <div v-for="(valor, clave) in datos.resumen" :key="clave" class="reportes-trabajadores-view__stat">
          <div class="reportes-trabajadores-view__stat-label">{{ clave }}</div>
          <div class="reportes-trabajadores-view__stat-value">{{ valor }}</div>
        </div>
      </div>

      <div v-for="tabla in datos.tablas" :key="tabla.titulo" class="reportes-trabajadores-view__tabla-wrap">
        <div class="reportes-trabajadores-view__tabla-titulo">{{ tabla.titulo }}</div>
        <div class="reportes-trabajadores-view__tabla-scroll">
          <table class="reportes-trabajadores-view__tabla">
            <thead>
              <tr>
                <th v-for="col in tabla.columnas" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fila, i) in tabla.filas" :key="i">
                <td v-for="(celda, j) in fila" :key="j">{{ celda }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<style scoped lang="scss">
.reportes-trabajadores-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__link-btn {
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;

    &:disabled {
      opacity: 0.5;
      cursor: progress;
    }
  }

  &__export-actions {
    display: flex;
    gap: 0.9rem;
    flex-wrap: wrap;
  }

  &__tabs {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    margin-bottom: 0.9rem;
  }

  &__tab {
    background: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.55rem 1.1rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.6);
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;

    &--active {
      background: var(--color-primary);
      color: var(--color-bg);
    }
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
    max-width: 460px;
    margin-bottom: 0.9rem;
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
      background: var(--color-white);
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

    &:disabled {
      opacity: 0.6;
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

  &__resumen {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    margin-bottom: 1.2rem;
  }

  &__stat-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.5);
    text-transform: uppercase;
  }

  &__stat-value {
    font-size: 0.95rem;
    font-weight: 700;
    margin-top: 0.2rem;
  }

  &__tabla-wrap {
    margin-bottom: 1.2rem;
  }

  &__tabla-titulo {
    font-weight: 800;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  &__tabla-scroll {
    overflow-x: auto;
  }

  &__tabla {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;

    th,
    td {
      text-align: left;
      padding: 0.5rem 0.7rem;
      border-top: 1px solid #f2efdd;
      white-space: nowrap;
    }

    th {
      font-size: 0.68rem;
      font-weight: 700;
      color: rgba(40, 54, 24, 0.5);
      text-transform: uppercase;
      border-top: none;
    }
  }
}
</style>
