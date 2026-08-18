<script setup lang="ts">
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import Pill from '../../../shared/components/Pill.vue';
import { kpis, monthly, daily, cowOptions, shiftOptions } from '../mock/produccion.mock';

const { isMobile } = useBreakpoint();
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
        <div class="produccion-view__field">
          <label v-if="!isMobile">Bovino</label>
          <select>
            <option v-for="c in cowOptions" :key="c">{{ c }}</option>
          </select>
        </div>
        <div class="produccion-view__form-grid" :class="{ 'produccion-view__form-grid--mobile': isMobile }">
          <div class="produccion-view__field">
            <label v-if="!isMobile">Turno</label>
            <select>
              <option v-for="s in shiftOptions" :key="s">{{ s }}</option>
            </select>
          </div>
          <div class="produccion-view__field">
            <label v-if="!isMobile">Fecha</label>
            <input v-if="!isMobile" type="date" />
            <input v-else placeholder="Litros" />
          </div>
        </div>
        <div v-if="!isMobile" class="produccion-view__field">
          <label>Litros</label>
          <input placeholder="15.2" />
        </div>
        <button type="button" class="produccion-view__submit">Guardar producción</button>
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

    <SectionCard v-if="isMobile" title="Producción mensual">
      <div class="produccion-view__chart produccion-view__chart--mobile">
        <div v-for="m in monthly" :key="m.month" class="produccion-view__bar-col produccion-view__bar-col--mobile">
          <div class="produccion-view__bar produccion-view__bar--mobile" :style="{ height: m.h, background: m.color }" />
          <div class="produccion-view__bar-label">{{ m.month }}</div>
        </div>
      </div>
    </SectionCard>

    <SectionCard v-if="!isMobile" title="Producción diaria por turno">
      <div class="produccion-view__table-head">
        <span>Fecha</span><span>Bovino</span><span>Turno</span><span class="text-end">Litros</span>
      </div>
      <div v-for="(d, i) in daily" :key="i" class="produccion-view__table-row">
        <span class="produccion-view__muted">{{ d.date }}</span>
        <span class="produccion-view__bold">{{ d.cow }}</span>
        <Pill>{{ d.shift }}</Pill>
        <span class="produccion-view__liters">{{ d.liters }}</span>
      </div>
    </SectionCard>

    <div v-else class="produccion-view__section">
      <div class="produccion-view__heading">Producción diaria</div>
      <div v-for="(d, i) in daily" :key="i" class="produccion-view__daily-card">
        <div>
          <div class="produccion-view__bold">{{ d.cow }}</div>
          <div class="produccion-view__muted">{{ d.date }} · {{ d.shift }}</div>
        </div>
        <span class="produccion-view__liters">{{ d.liters }}</span>
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
