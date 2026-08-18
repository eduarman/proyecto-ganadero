<script setup lang="ts">
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import { kpis, costs, consumption, cowOptions, feedOptions } from '../mock/alimentacion.mock';

const { isMobile } = useBreakpoint();
</script>

<template>
  <div class="alimentacion-view">
    <div class="alimentacion-view__kpis" :class="{ 'alimentacion-view__kpis--mobile': isMobile }">
      <div
        v-for="k in kpis"
        :key="k.label"
        class="alimentacion-view__kpi"
        :style="{ background: k.bg, color: k.color }"
      >
        <div class="alimentacion-view__kpi-label">{{ k.label }}</div>
        <div class="alimentacion-view__kpi-value">{{ k.value }}</div>
        <div v-if="!isMobile" class="alimentacion-view__kpi-hint">{{ k.hint }}</div>
      </div>
    </div>

    <div class="alimentacion-view__top" :class="{ 'alimentacion-view__top--mobile': isMobile }">
      <SectionCard :title="isMobile ? 'Registrar alimentación' : 'Registrar alimentación / suplemento'">
        <div class="alimentacion-view__field">
          <label v-if="!isMobile">Bovino</label>
          <select>
            <option v-for="c in cowOptions" :key="c">{{ c }}</option>
          </select>
        </div>
        <div class="alimentacion-view__form-grid">
          <div class="alimentacion-view__field">
            <label v-if="!isMobile">Alimento</label>
            <select>
              <option v-for="f in feedOptions" :key="f">{{ f }}</option>
            </select>
          </div>
          <div class="alimentacion-view__field">
            <label v-if="!isMobile">Kilos</label>
            <input placeholder="Kilos" />
          </div>
        </div>
        <div v-if="!isMobile" class="alimentacion-view__field">
          <label>Fecha</label>
          <input type="date" />
        </div>
        <button type="button" class="alimentacion-view__submit">Guardar alimentación</button>
      </SectionCard>

      <SectionCard :title="isMobile ? 'Costo por tipo' : 'Costo de alimentación por tipo'">
        <div v-for="c in costs" :key="c.label" class="alimentacion-view__cost-row">
          <div class="alimentacion-view__cost-label">{{ c.label }}</div>
          <div class="alimentacion-view__cost-track">
            <div class="alimentacion-view__cost-fill" :style="{ width: c.pct, background: c.color }" />
          </div>
          <div class="alimentacion-view__cost-value">{{ c.value }}</div>
        </div>
      </SectionCard>
    </div>

    <SectionCard v-if="!isMobile" title="Consumo diario por animal">
      <div class="alimentacion-view__table-head">
        <span>Fecha</span><span>Bovino</span><span>Alimento</span
        ><span class="text-end">Kilos</span><span class="text-end">Costo</span>
      </div>
      <div v-for="(c, i) in consumption" :key="i" class="alimentacion-view__table-row">
        <span class="alimentacion-view__muted">{{ c.date }}</span>
        <span class="alimentacion-view__bold">{{ c.cow }}</span>
        <span>{{ c.feed }}</span>
        <span class="text-end">{{ c.kg }}</span>
        <span class="alimentacion-view__cost-cell">{{ c.cost }}</span>
      </div>
    </SectionCard>

    <div v-else class="alimentacion-view__section">
      <div class="alimentacion-view__heading">Consumo diario</div>
      <div v-for="(c, i) in consumption" :key="i" class="alimentacion-view__daily-card">
        <div>
          <div class="alimentacion-view__bold">{{ c.cow }}</div>
          <div class="alimentacion-view__muted">{{ c.feed }}</div>
        </div>
        <span class="alimentacion-view__cost-cell">{{ c.cost }}</span>
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
    width: 70px;
    flex: none;
    text-align: right;
    font-size: 0.82rem;
    font-weight: 700;

    @media (max-width: 900px) {
      width: 56px;
      font-size: 0.72rem;
    }
  }

  &__table-head {
    display: grid;
    grid-template-columns: 90px 1fr 1.4fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 90px 1fr 1.4fr 1fr 1fr;
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
