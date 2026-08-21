<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { useAuthStore } from '../../../stores/auth.store';
import KpiCard from '../../../shared/components/KpiCard.vue';
import AlertItem from '../../../shared/components/AlertItem.vue';
import SectionCard from '../../../shared/components/SectionCard.vue';
import AppIcon from '../../../shared/components/AppIcon.vue';
import { dashboardApi, type Alerta, type ResumenDashboard } from '../services/dashboard.api';

const { isMobile } = useBreakpoint();
const authStore = useAuthStore();

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface Shortcut {
  label: string;
  icon: string;
  to: string;
}

const shortcutsDesktop: Shortcut[] = [
  { label: 'Registrar vacunación', icon: 'activity', to: '/sanidad' },
  { label: 'Registrar inseminación', icon: 'heart', to: '/reproduccion' },
  { label: 'Registrar producción', icon: 'droplet', to: '/produccion' },
  { label: 'Registrar alimentación', icon: 'wheat', to: '/alimentacion' },
  { label: 'Rotación de potreros', icon: 'map', to: '/potreros' },
  { label: 'Ver reportes', icon: 'bars', to: '/reportes' },
];

const shortcutsMobile: Shortcut[] = [
  { label: 'Vacunar', icon: 'activity', to: '/sanidad' },
  { label: 'Inseminar', icon: 'heart', to: '/reproduccion' },
  { label: 'Producción', icon: 'droplet', to: '/produccion' },
  { label: 'Potreros', icon: 'map', to: '/potreros' },
];

const loading = ref(true);
const resumen = ref<ResumenDashboard | null>(null);

async function cargar() {
  loading.value = true;
  try {
    resumen.value = await dashboardApi.resumen();
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);
watch(() => authStore.negocioActivo?.id, cargar);

const kpis = computed(() => {
  const r = resumen.value;
  const alertasActivas = r?.kpis.alertasSanitariasActivas ?? 0;
  return [
    {
      label: 'Total de cabezas',
      value: String(r?.kpis.totalAnimales ?? 0),
      trend: 'Activos',
      icon: 'cow',
      bg: 'var(--color-dark)',
      color: 'var(--color-bg)',
      iconBg: 'rgba(247,247,247,0.12)',
      pillBg: 'var(--color-primary)',
      pillColor: 'var(--color-bg)',
    },
    {
      label: 'Producción de hoy',
      value: `${(r?.kpis.produccionHoy ?? 0).toFixed(1)} L`,
      trend: 'Hoy',
      icon: 'droplet',
      bg: 'var(--color-primary)',
      color: 'var(--color-bg)',
      iconBg: 'rgba(247,247,247,0.14)',
      pillBg: 'var(--color-dark)',
      pillColor: 'var(--color-bg)',
    },
    {
      label: 'Vacas preñadas',
      value: String(r?.kpis.vacasPrenadas ?? 0),
      trend: 'Confirmadas',
      icon: 'heart',
      bg: 'var(--color-white)',
      color: 'var(--color-dark)',
      iconBg: 'var(--color-bg)',
      pillBg: 'var(--color-bg)',
      pillColor: 'var(--color-warn)',
    },
    {
      label: 'Alertas sanitarias',
      value: String(alertasActivas),
      trend: alertasActivas > 0 ? 'Atención' : 'Al día',
      icon: 'activity',
      bg: 'var(--color-white)',
      color: 'var(--color-dark)',
      iconBg: 'var(--color-bg)',
      pillBg: alertasActivas > 0 ? 'var(--color-warn-bg)' : 'var(--color-neutral-bg)',
      pillColor: alertasActivas > 0 ? 'var(--color-warn)' : 'var(--color-primary)',
    },
  ];
});

const ranking = computed(() => resumen.value?.ranking ?? []);
const mobileRanking = computed(() => ranking.value.slice(0, 3));

const weekBars = computed(() => {
  const dias = resumen.value?.produccionSemana ?? [];
  const max = Math.max(1, ...dias.map((d) => d.litros));
  return dias.map((d) => ({
    day: DIAS[new Date(d.fecha).getUTCDay()],
    h: `${Math.round((d.litros / max) * 100)}%`,
    color: 'var(--color-primary)',
  }));
});

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function alertaDetail(a: Alerta): string {
  if (a.tag === 'Sanidad') return a.vencido ? `Vencido el ${formatFecha(a.fecha)}` : `Vence el ${formatFecha(a.fecha)}`;
  return `Estimado ${formatFecha(a.fecha)}`;
}

function alertaTag(a: Alerta) {
  return a.urgencia === 'alta'
    ? { pillBg: 'var(--color-warn-bg)', pillColor: 'var(--color-warn)' }
    : { pillBg: 'var(--color-neutral-bg)', pillColor: 'var(--color-primary)' };
}
const alerts = computed(() => resumen.value?.alertas ?? []);
const mobileAlerts = computed(() => alerts.value.slice(0, 3));
</script>

<template>
  <!-- Mobile -->
  <div v-if="isMobile" class="dashboard-mobile">
    <div class="dashboard-mobile__kpis no-scrollbar">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="dashboard-mobile__kpi"
        :style="{ background: kpi.bg, color: kpi.color }"
      >
        <div class="dashboard-mobile__kpi-icon" :style="{ background: kpi.iconBg }">
          <AppIcon :name="kpi.icon" :size="15" />
        </div>
        <div class="dashboard-mobile__kpi-label">{{ kpi.label }}</div>
        <div class="dashboard-mobile__kpi-value">{{ kpi.value }}</div>
      </div>
    </div>

    <div class="dashboard-mobile__section">
      <div class="dashboard-mobile__heading">Accesos rápidos</div>
      <div class="dashboard-mobile__quick-grid">
        <RouterLink v-for="sc in shortcutsMobile" :key="sc.label" :to="sc.to" class="dashboard-mobile__quick-item">
          <div class="dashboard-mobile__quick-icon">
            <AppIcon :name="sc.icon" :size="20" />
          </div>
          <div class="dashboard-mobile__quick-label">{{ sc.label }}</div>
        </RouterLink>
      </div>
    </div>

    <SectionCard>
      <template #actions>
        <span class="dashboard-mobile__tag">7 días</span>
      </template>
      <div class="dashboard-mobile__ranking-title">Más productivas</div>
      <div v-if="!loading && mobileRanking.length === 0" class="dashboard-mobile__muted">Sin registros de producción esta semana.</div>
      <div v-for="r in mobileRanking" :key="r.pos" class="dashboard-mobile__ranking-row">
        <span class="dashboard-mobile__ranking-pos">{{ r.pos }}</span>
        <div class="dashboard-mobile__ranking-info">
          <div class="dashboard-mobile__ranking-name">{{ r.identificador }}</div>
          <div class="dashboard-mobile__ranking-meta">{{ r.raza ?? 'Raza s/d' }} · {{ r.potrero ?? 'Sin potrero' }}</div>
        </div>
        <span class="dashboard-mobile__ranking-liters">{{ r.litros.toFixed(1) }} L</span>
      </div>
    </SectionCard>

    <div class="dashboard-mobile__section">
      <div class="dashboard-mobile__heading">Alertas y pendientes</div>
      <div v-if="!loading && mobileAlerts.length === 0" class="dashboard-mobile__muted">Sin alertas activas.</div>
      <RouterLink v-for="(a, i) in mobileAlerts" :key="i" :to="a.linkTo" class="dashboard-mobile__alert-link">
        <AlertItem :tag="a.tag" :title="a.title" :detail="alertaDetail(a)" v-bind="alertaTag(a)" />
      </RouterLink>
    </div>
  </div>

  <!-- Desktop -->
  <div v-else class="dashboard-desktop">
    <div class="dashboard-desktop__kpis">
      <KpiCard
        v-for="kpi in kpis"
        :key="kpi.label"
        :label="kpi.label"
        :value="kpi.value"
        :trend="kpi.trend"
        :icon="kpi.icon"
        :bg="kpi.bg"
        :color="kpi.color"
        :icon-bg="kpi.iconBg"
        :pill-bg="kpi.pillBg"
        :pill-color="kpi.pillColor"
      />
    </div>

    <div class="dashboard-desktop__columns">
      <div class="dashboard-desktop__col">
        <SectionCard title="Ranking de vacas más productivas">
          <template #actions>
            <span class="dashboard-desktop__tag">Últimos 7 días</span>
          </template>
          <div v-if="!loading && ranking.length === 0" class="dashboard-desktop__muted">Sin registros de producción esta semana.</div>
          <template v-else>
            <div class="dashboard-desktop__ranking-head">
              <span>#</span><span>Bovino</span><span>Raza</span><span>Potrero</span
              ><span class="text-end">Litros/semana</span>
            </div>
            <div v-for="r in ranking" :key="r.pos" class="dashboard-desktop__ranking-row">
              <span class="dashboard-desktop__ranking-pos">{{ r.pos }}</span>
              <span class="dashboard-desktop__ranking-name">{{ r.identificador }}</span>
              <span class="dashboard-desktop__ranking-meta">{{ r.raza ?? 'S/D' }}</span>
              <span class="dashboard-desktop__ranking-meta">{{ r.potrero ?? 'Sin potrero' }}</span>
              <span class="dashboard-desktop__ranking-liters">{{ r.litros.toFixed(1) }} L</span>
            </div>
          </template>
        </SectionCard>

        <SectionCard title="Producción de la semana">
          <div class="dashboard-desktop__chart">
            <div v-for="(b, i) in weekBars" :key="i" class="dashboard-desktop__bar-col">
              <div class="dashboard-desktop__bar" :style="{ height: b.h, background: b.color }" />
              <div class="dashboard-desktop__bar-label">{{ b.day }}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div class="dashboard-desktop__col">
        <SectionCard title="Alertas y pendientes">
          <div v-if="!loading && alerts.length === 0" class="dashboard-desktop__muted">Sin alertas activas.</div>
          <RouterLink v-for="(a, i) in alerts" :key="i" :to="a.linkTo" class="dashboard-desktop__alert-link">
            <AlertItem :tag="a.tag" :title="a.title" :detail="alertaDetail(a)" v-bind="alertaTag(a)" />
          </RouterLink>
        </SectionCard>

        <SectionCard title="Accesos directos" dark>
          <div class="dashboard-desktop__shortcuts">
            <RouterLink v-for="sc in shortcutsDesktop" :key="sc.label" :to="sc.to" class="dashboard-desktop__shortcut">
              <AppIcon :name="sc.icon" :size="16" style="color: var(--color-accent)" />
              <div>{{ sc.label }}</div>
            </RouterLink>
          </div>
        </SectionCard>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Mobile
.dashboard-mobile {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__kpis {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.1rem;
  }

  &__kpi {
    flex: none;
    width: 150px;
    border-radius: 18px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    box-shadow: var(--shadow-card);
  }

  &__kpi-icon {
    width: 30px;
    height: 30px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__kpi-label {
    font-size: 0.68rem;
    opacity: 0.75;
  }

  &__kpi-value {
    font-weight: 800;
    font-size: 1.15rem;
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

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__quick-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.6rem;
  }

  &__quick-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    text-decoration: none;
    color: inherit;
  }

  &__quick-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: var(--color-white);
    box-shadow: var(--shadow-card);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
  }

  &__quick-label {
    font-size: 0.62rem;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
  }

  &__tag {
    font-size: 0.62rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-primary);
  }

  &__ranking-title {
    font-weight: 800;
    font-size: 0.85rem;
    margin-top: -0.4rem;
  }

  &__ranking-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0;
    border-top: 1px solid #f0f0f0;
  }

  &__ranking-pos {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-primary);
    font-size: 0.65rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
  }

  &__ranking-info {
    flex: 1;
    min-width: 0;
  }

  &__ranking-name {
    font-size: 0.8rem;
    font-weight: 700;
  }

  &__ranking-meta {
    font-size: 0.65rem;
    color: rgba(40, 54, 24, 0.55);
  }

  &__ranking-liters {
    font-weight: 800;
    font-size: 0.8rem;
    color: var(--color-primary);
  }

  &__alert-link {
    display: block;
    text-decoration: none;
    color: inherit;
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// Desktop
.dashboard-desktop {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  &__kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.1rem;
  }

  &__columns {
    display: grid;
    grid-template-columns: 1.7fr 1fr;
    gap: 1.25rem;
    align-items: start;
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  &__tag {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-primary);
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__ranking-head {
    display: grid;
    grid-template-columns: 32px 1.4fr 1fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__ranking-row {
    display: grid;
    grid-template-columns: 32px 1.4fr 1fr 1fr 1fr;
    gap: 0.5rem;
    padding: 0.7rem 0.4rem;
    border-top: 1px solid #f2efdd;
    align-items: center;
  }

  &__ranking-pos {
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-primary);
    font-size: 0.65rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__ranking-name {
    font-weight: 700;
    font-size: 0.82rem;
  }

  &__ranking-meta {
    font-size: 0.78rem;
    color: rgba(40, 54, 24, 0.65);
  }

  &__ranking-liters {
    text-align: right;
    font-weight: 800;
    font-size: 0.82rem;
    color: var(--color-primary);
  }

  &__chart {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    height: 150px;
    padding: 0.5rem 0 0 0.6rem;
    border-left: 2px solid rgba(40, 54, 24, 0.15);
    border-bottom: 2px solid rgba(40, 54, 24, 0.15);
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
    max-width: 36px;
    border-radius: 10px 10px 4px 4px;
  }

  &__bar-label {
    font-size: 0.72rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 600;
  }

  &__alert-link {
    display: block;
    text-decoration: none;
    color: inherit;
    margin-bottom: 0.6rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__shortcuts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }

  &__shortcut {
    background: rgba(247, 247, 247, 0.08);
    border-radius: 14px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1.3;
    text-decoration: none;
    color: inherit;
  }
}
</style>
