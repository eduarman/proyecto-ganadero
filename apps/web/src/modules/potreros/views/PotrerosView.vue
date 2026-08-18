<script setup lang="ts">
import { ref } from 'vue';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import SegmentedTabs from '../../../shared/components/SegmentedTabs.vue';
import Pill from '../../../shared/components/Pill.vue';
import { paddocks, history, subjectOptions, paddockOptions } from '../mock/potreros.mock';

const { isMobile } = useBreakpoint();
const movementType = ref('Ingreso');
</script>

<template>
  <div class="potreros-view">
    <SectionCard title="Registrar rotación">
      <SegmentedTabs v-if="!isMobile" v-model="movementType" :options="['Ingreso', 'Salida']" />
      <div class="potreros-view__form-grid" :class="{ 'potreros-view__form-grid--mobile': isMobile }">
        <div class="potreros-view__field">
          <label v-if="!isMobile">Bovino / Lote</label>
          <select>
            <option v-for="s in subjectOptions" :key="s">{{ s }}</option>
          </select>
        </div>
        <div class="potreros-view__field">
          <label v-if="!isMobile">Potrero</label>
          <select>
            <option v-for="p in paddockOptions" :key="p">{{ p }}</option>
          </select>
        </div>
        <div v-if="!isMobile" class="potreros-view__field">
          <label>Fecha</label>
          <input type="date" />
        </div>
      </div>
      <button type="button" class="potreros-view__submit">Guardar movimiento</button>
    </SectionCard>

    <div class="potreros-view__grid" :class="{ 'potreros-view__grid--mobile': isMobile }">
      <div v-for="p in paddocks" :key="p.name" class="potreros-view__card">
        <div class="potreros-view__card-head">
          <div class="potreros-view__card-name">{{ p.name }}</div>
          <Pill :bg="p.pillBg" :color="p.pillColor">{{ p.tag }}</Pill>
        </div>
        <div class="potreros-view__card-meta">
          {{ p.animals }} animales<span v-if="!isMobile"> · cap. {{ p.capacity }}</span>
        </div>
        <div class="potreros-view__track">
          <div class="potreros-view__fill" :style="{ width: p.pct }" />
        </div>
        <div v-if="!isMobile" class="potreros-view__card-meta">Permanencia prom. {{ p.avgDays }}</div>
      </div>
    </div>

    <SectionCard v-if="!isMobile" title="Historial de rotación">
      <div class="potreros-view__table-head">
        <span>Fecha</span><span>Bovino / Lote</span><span>Movimiento</span><span>Potrero</span>
      </div>
      <div v-for="(h, i) in history" :key="i" class="potreros-view__table-row">
        <span class="potreros-view__muted">{{ h.date }}</span>
        <span class="potreros-view__bold">{{ h.who }}</span>
        <Pill :bg="h.pillBg" :color="h.pillColor">{{ h.move }}</Pill>
        <span>{{ h.paddock }}</span>
      </div>
    </SectionCard>

    <div v-else class="potreros-view__section">
      <div class="potreros-view__heading">Historial de rotación</div>
      <div v-for="(h, i) in history" :key="i" class="potreros-view__history-card">
        <div>
          <div class="potreros-view__bold">{{ h.who }}</div>
          <div class="potreros-view__muted">{{ h.date }} · {{ h.paddock }}</div>
        </div>
        <Pill :bg="h.pillBg" :color="h.pillColor">{{ h.move }}</Pill>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.potreros-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem;

    &--mobile {
      grid-template-columns: 1fr;
      gap: 0.6rem;
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
    align-self: flex-start;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;

    &--mobile {
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
  }

  &__card {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1.1rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;

    .potreros-view__grid--mobile & {
      border-radius: 1rem;
      padding: 0.85rem;
      gap: 0.5rem;
    }
  }

  &__card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__card-name {
    font-weight: 800;
    font-size: 0.92rem;

    .potreros-view__grid--mobile & {
      font-size: 0.8rem;
    }
  }

  &__card-meta {
    font-size: 0.75rem;
    color: rgba(40, 54, 24, 0.6);
  }

  &__track {
    background: var(--color-bg);
    border-radius: 999px;
    height: 12px;
  }

  &__fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 999px;
  }

  &__table-head {
    display: grid;
    grid-template-columns: 100px 1fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 100px 1fr 1fr 1fr;
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

  &__section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__heading {
    font-weight: 800;
    font-size: 0.9rem;
  }

  &__history-card {
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
