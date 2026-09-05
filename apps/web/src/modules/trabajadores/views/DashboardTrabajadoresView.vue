<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import KpiCard from '../../../shared/components/KpiCard.vue';
import SectionCard from '../../../shared/components/SectionCard.vue';
import { trabajadoresApi, type DashboardTrabajadores } from '../services/trabajadores.api';

const router = useRouter();

const loading = ref(true);
const dashboard = ref<DashboardTrabajadores | null>(null);

async function cargar() {
  loading.value = true;
  try {
    dashboard.value = await trabajadoresApi.obtenerDashboard();
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

const kpis = computed(() => {
  const k = dashboard.value?.kpis;
  return [
    { label: 'Total de trabajadores', value: String(k?.totalTrabajadores ?? 0), icon: 'briefcase' },
    { label: 'Activos', value: String(k?.activos ?? 0), icon: 'users' },
    { label: 'Presentes hoy', value: String(k?.presentesHoy ?? 0), icon: 'account' },
    { label: 'Jornadas del período', value: String(k?.jornadasPeriodo ?? 0), icon: 'calendar' },
    { label: 'Horas trabajadas', value: String(k?.horasTrabajadas ?? 0), icon: 'activity' },
    { label: 'Total pagado (USD equiv.)', value: (k?.totalPagado ?? 0).toFixed(2), icon: 'bars' },
    { label: 'Adelantos pendientes (USD equiv.)', value: (k?.adelantosPendientes ?? 0).toFixed(2), icon: 'scale' },
    { label: 'Préstamos pendientes (USD equiv.)', value: (k?.prestamosPendientes ?? 0).toFixed(2), icon: 'scale' },
  ];
});

const cargoBars = computed(() => {
  const filas = dashboard.value?.trabajadoresPorCargo.filas ?? [];
  const max = Math.max(1, ...filas.map((f) => Number(f[3])));
  return filas.map((f) => ({
    cargo: String(f[0]),
    total: Number(f[3]),
    w: `${Math.round((Number(f[3]) / max) * 100)}%`,
  }));
});

const costoBars = computed(() => {
  const filas = dashboard.value?.costoLaboralPorMes.filas ?? [];
  const max = Math.max(1, ...filas.map((f) => Number(f[1])));
  return filas.map((f) => ({
    mes: String(f[0]),
    costo: Number(f[1]),
    h: `${Math.round((Number(f[1]) / max) * 100)}%`,
  }));
});
</script>

<template>
  <div class="dashboard-trabajadores-view">
    <SectionCard title="Dashboard de trabajadores">
      <template #actions>
        <button type="button" class="dashboard-trabajadores-view__link-btn" @click="router.push('/trabajadores')">
          ← Volver a Trabajadores
        </button>
      </template>

      <div v-if="loading" class="dashboard-trabajadores-view__muted">Cargando…</div>
      <div v-else class="dashboard-trabajadores-view__kpis">
        <KpiCard v-for="k in kpis" :key="k.label" :label="k.label" :value="k.value" :icon="k.icon" />
      </div>
    </SectionCard>

    <template v-if="dashboard">
      <SectionCard title="Trabajadores por cargo">
        <div v-if="cargoBars.length === 0" class="dashboard-trabajadores-view__muted">Sin datos.</div>
        <div v-else class="dashboard-trabajadores-view__hbars">
          <div v-for="c in cargoBars" :key="c.cargo" class="dashboard-trabajadores-view__hbar-row">
            <div class="dashboard-trabajadores-view__hbar-label">{{ c.cargo }}</div>
            <div class="dashboard-trabajadores-view__hbar-track">
              <div class="dashboard-trabajadores-view__hbar-fill" :style="{ width: c.w }" />
            </div>
            <div class="dashboard-trabajadores-view__hbar-value">{{ c.total }}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Costo laboral por mes">
        <div v-if="costoBars.length === 0" class="dashboard-trabajadores-view__muted">Sin datos.</div>
        <div v-else class="dashboard-trabajadores-view__chart">
          <div v-for="(b, i) in costoBars" :key="i" class="dashboard-trabajadores-view__bar-col">
            <div class="dashboard-trabajadores-view__bar" :style="{ height: b.h }" :title="b.costo.toFixed(2)" />
            <div class="dashboard-trabajadores-view__bar-label">{{ b.mes }}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Asistencia reciente (últimos 30 días)">
        <div v-if="dashboard.asistenciaReciente.filas.length === 0" class="dashboard-trabajadores-view__muted">
          Sin registros de asistencia.
        </div>
        <div v-else class="dashboard-trabajadores-view__tabla-scroll">
          <table class="dashboard-trabajadores-view__tabla">
            <thead>
              <tr>
                <th v-for="col in dashboard.asistenciaReciente.columnas" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(fila, i) in dashboard.asistenciaReciente.filas" :key="i">
                <td v-for="(celda, j) in fila" :key="j">{{ celda }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </template>
  </div>
</template>

<style scoped lang="scss">
.dashboard-trabajadores-view {
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
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__kpis {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  &__hbars {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  &__hbar-row {
    display: grid;
    grid-template-columns: 140px 1fr 40px;
    align-items: center;
    gap: 0.7rem;
  }

  &__hbar-label {
    font-size: 0.8rem;
    font-weight: 600;
  }

  &__hbar-track {
    background: var(--color-bg);
    border-radius: 999px;
    height: 10px;
    overflow: hidden;
  }

  &__hbar-fill {
    background: var(--color-primary);
    height: 100%;
    border-radius: 999px;
  }

  &__hbar-value {
    text-align: right;
    font-weight: 700;
    font-size: 0.82rem;
  }

  &__chart {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    height: 150px;
    padding: 0.5rem 0 0 0.6rem;
    border-left: 2px solid rgba(40, 54, 24, 0.15);
    border-bottom: 2px solid rgba(40, 54, 24, 0.15);
    overflow-x: auto;
  }

  &__bar-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    height: 100%;
    justify-content: flex-end;
    min-width: 32px;
  }

  &__bar {
    width: 100%;
    max-width: 36px;
    border-radius: 10px 10px 4px 4px;
    background: var(--color-primary);
  }

  &__bar-label {
    font-size: 0.72rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 600;
    white-space: nowrap;
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
