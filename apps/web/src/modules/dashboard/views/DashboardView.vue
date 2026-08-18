<script setup lang="ts">
import { computed } from 'vue';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import KpiCard from '../../../shared/components/KpiCard.vue';
import AlertItem from '../../../shared/components/AlertItem.vue';
import SectionCard from '../../../shared/components/SectionCard.vue';
import AppIcon from '../../../shared/components/AppIcon.vue';
import {
  kpis,
  ranking,
  weekBars,
  alerts,
  shortcutsDesktop,
  shortcutsMobile,
} from '../mock/dashboard.mock';

const { isMobile } = useBreakpoint();
const mobileRanking = computed(() => ranking.slice(0, 3));
const mobileAlerts = computed(() => alerts.slice(0, 3));
</script>

<template>
  <!-- Mobile: MobileHome.dc.html -->
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
        <div v-for="sc in shortcutsMobile" :key="sc.label" class="dashboard-mobile__quick-item">
          <div class="dashboard-mobile__quick-icon">
            <AppIcon :name="sc.icon" :size="20" />
          </div>
          <div class="dashboard-mobile__quick-label">{{ sc.label }}</div>
        </div>
      </div>
    </div>

    <SectionCard>
      <template #actions>
        <span class="dashboard-mobile__tag">7 días</span>
      </template>
      <div class="dashboard-mobile__ranking-title">Más productivas</div>
      <div v-for="r in mobileRanking" :key="r.pos" class="dashboard-mobile__ranking-row">
        <span class="dashboard-mobile__ranking-pos">{{ r.pos }}</span>
        <div class="dashboard-mobile__ranking-info">
          <div class="dashboard-mobile__ranking-name">{{ r.name }}</div>
          <div class="dashboard-mobile__ranking-meta">{{ r.breed }} · {{ r.paddock }}</div>
        </div>
        <span class="dashboard-mobile__ranking-liters">{{ r.liters }}</span>
      </div>
    </SectionCard>

    <div class="dashboard-mobile__section">
      <div class="dashboard-mobile__heading">Alertas y pendientes</div>
      <AlertItem
        v-for="(a, i) in mobileAlerts"
        :key="i"
        :tag="a.tag"
        :title="a.title"
        :detail="a.detail"
        :pill-bg="a.pillBg"
        :pill-color="a.pillColor"
      />
    </div>
  </div>

  <!-- Desktop: ScreenHome.dc.html -->
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
          <div class="dashboard-desktop__ranking-head">
            <span>#</span><span>Bovino</span><span>Raza</span><span>Potrero</span
            ><span class="text-end">Litros/día</span>
          </div>
          <div v-for="r in ranking" :key="r.pos" class="dashboard-desktop__ranking-row">
            <span class="dashboard-desktop__ranking-pos">{{ r.pos }}</span>
            <span class="dashboard-desktop__ranking-name">{{ r.name }}</span>
            <span class="dashboard-desktop__ranking-meta">{{ r.breed }}</span>
            <span class="dashboard-desktop__ranking-meta">{{ r.paddock }}</span>
            <span class="dashboard-desktop__ranking-liters">{{ r.liters }}</span>
          </div>
        </SectionCard>

        <SectionCard title="Producción de la semana">
          <div class="dashboard-desktop__chart">
            <div v-for="b in weekBars" :key="b.day" class="dashboard-desktop__bar-col">
              <div class="dashboard-desktop__bar" :style="{ height: b.h, background: b.color }" />
              <div class="dashboard-desktop__bar-label">{{ b.day }}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      <div class="dashboard-desktop__col">
        <SectionCard title="Alertas y pendientes">
          <AlertItem
            v-for="(a, i) in alerts"
            :key="i"
            :tag="a.tag"
            :title="a.title"
            :detail="a.detail"
            :pill-bg="a.pillBg"
            :pill-color="a.pillColor"
          />
        </SectionCard>

        <SectionCard title="Accesos directos" dark>
          <div class="dashboard-desktop__shortcuts">
            <div v-for="sc in shortcutsDesktop" :key="sc.label" class="dashboard-desktop__shortcut">
              <AppIcon :name="sc.icon" :size="16" style="color: var(--color-accent)" />
              <div>{{ sc.label }}</div>
            </div>
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
  }
}
</style>
