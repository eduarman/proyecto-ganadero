<script setup lang="ts">
import { computed } from 'vue';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import {
  reportTagsDesktop,
  reportTagsMobile,
  production,
  costs,
  byLot,
  buildPieSegments,
  buildMortalityDots,
} from '../mock/reportes.mock';

const { isMobile } = useBreakpoint();
const pieSegments = computed(() => buildPieSegments());
const mortalityDots = computed(() => buildMortalityDots());
const mortalityPoints = computed(() => mortalityDots.value.map((d) => `${d.x},${d.y}`).join(' '));
</script>

<template>
  <div class="reportes-view">
    <div class="reportes-view__tags" :class="{ 'reportes-view__tags--mobile': isMobile }">
      <span
        v-for="t in isMobile ? reportTagsMobile : reportTagsDesktop"
        :key="t.label"
        class="reportes-view__tag"
        :style="{ background: t.bg, color: t.color }"
      >
        {{ t.label }}
      </span>
    </div>

    <div class="reportes-view__row" :class="{ 'reportes-view__row--mobile': isMobile }">
      <SectionCard title="Producción mensual (litros)">
        <div class="reportes-view__chart" :class="{ 'reportes-view__chart--mobile': isMobile }">
          <div v-for="m in production" :key="m.month" class="reportes-view__bar-col">
            <div class="reportes-view__bar" :style="{ height: m.h, background: m.color }" />
            <div class="reportes-view__bar-label">{{ m.month }}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Costos por categoría" dark>
        <div class="reportes-view__pie-row">
          <svg viewBox="0 0 42 42" class="reportes-view__pie" :class="{ 'reportes-view__pie--mobile': isMobile }">
            <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(247,247,247,0.12)" stroke-width="6" />
            <circle
              v-for="(seg, i) in pieSegments"
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
            <div v-for="c in costs" :key="c.label" class="reportes-view__legend-item">
              <span class="reportes-view__legend-dot" :style="{ background: c.color }" />
              <span class="reportes-view__legend-label">{{ c.label }}</span>
              <span class="reportes-view__legend-value">{{ c.value }}</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>

    <div v-if="!isMobile" class="reportes-view__row">
      <SectionCard title="Mortalidad anual (casos)">
        <svg viewBox="0 0 320 150" class="reportes-view__line-chart">
          <line x1="12" y1="12" x2="12" y2="138" stroke="rgba(40,54,24,0.15)" stroke-width="2" />
          <line x1="12" y1="138" x2="308" y2="138" stroke="rgba(40,54,24,0.15)" stroke-width="2" />
          <polyline
            :points="mortalityPoints"
            fill="none"
            stroke="var(--color-warn)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle v-for="(d, i) in mortalityDots" :key="i" :cx="d.x" :cy="d.y" r="4.5" fill="var(--color-warn)" />
        </svg>
        <div class="reportes-view__axis">
          <span v-for="m in production" :key="m.month">{{ m.month }}</span>
        </div>
      </SectionCard>

      <SectionCard title="Producción por lote">
        <div class="reportes-view__table-head">
          <span>Lote</span><span>Animales</span><span class="text-end">Litros/mes</span>
        </div>
        <div v-for="l in byLot" :key="l.lot" class="reportes-view__table-row">
          <span class="reportes-view__bold">{{ l.lot }}</span>
          <span>{{ l.animals }}</span>
          <span class="reportes-view__liters">{{ l.liters }}</span>
        </div>
      </SectionCard>
    </div>

    <SectionCard v-else title="Producción por lote">
      <div v-for="l in byLot" :key="l.lot" class="reportes-view__lot-row">
        <span class="reportes-view__bold">{{ l.lot }}</span>
        <span class="reportes-view__muted">{{ l.animals }} animales</span>
        <span class="reportes-view__liters">{{ l.liters }}</span>
      </div>
    </SectionCard>
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
  }

  &__row {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 1.25rem;
    align-items: start;

    &--mobile {
      grid-template-columns: 1fr;
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

  &__line-chart {
    width: 100%;
    height: 150px;
  }

  &__axis {
    display: flex;
    justify-content: space-between;
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 600;
  }

  &__table-head {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0.7rem 0.4rem;
    border-top: 1px solid #f2efdd;
    align-items: center;
    font-size: 0.82rem;
  }

  &__bold {
    font-weight: 700;
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.75rem;
  }

  &__liters {
    text-align: right;
    font-weight: 800;
    color: var(--color-primary);
  }

  &__lot-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-top: 1px solid #f0f0f0;

    &:first-child {
      border-top: none;
    }
  }
}
</style>
