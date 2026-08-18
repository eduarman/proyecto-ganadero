<script setup lang="ts">
import { ref } from 'vue';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import SegmentedTabs from '../../../shared/components/SegmentedTabs.vue';
import DayBadge from '../../../shared/components/DayBadge.vue';
import Pill from '../../../shared/components/Pill.vue';
import { calendar, history, cowOptions, conditionOptions } from '../mock/sanidad.mock';

const { isMobile } = useBreakpoint();
const registerType = ref('Vacunación');
</script>

<template>
  <div class="sanidad-view">
    <div class="sanidad-view__top" :class="{ 'sanidad-view__top--mobile': isMobile }">
      <SectionCard :title="isMobile ? 'Registrar vacunación' : 'Registrar vacunación / tratamiento'">
        <SegmentedTabs
          v-if="!isMobile"
          v-model="registerType"
          :options="['Vacunación', 'Tratamiento']"
        />
        <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
          <div class="sanidad-view__field">
            <label v-if="!isMobile">Bovino</label>
            <select>
              <option v-for="c in cowOptions" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="sanidad-view__field">
            <label v-if="!isMobile">Fecha</label>
            <input type="date" />
          </div>
          <div class="sanidad-view__field">
            <label v-if="!isMobile">Vacuna / Enfermedad</label>
            <select>
              <option v-for="c in conditionOptions" :key="c">{{ c }}</option>
            </select>
          </div>
          <div v-if="!isMobile" class="sanidad-view__field">
            <label>Medicamento / Dosis</label>
            <input placeholder="2 ml IM" />
          </div>
        </div>
        <div v-if="!isMobile" class="sanidad-view__field">
          <label>Observaciones</label>
          <textarea rows="2" placeholder="Notas del veterinario" />
        </div>
        <button type="button" class="sanidad-view__submit">
          {{ isMobile ? 'Guardar registro' : 'Guardar registro sanitario' }}
        </button>
      </SectionCard>

      <SectionCard v-if="!isMobile" title="Calendario de vacunación">
        <div v-for="c in calendar" :key="c.title" class="sanidad-view__cal-row">
          <DayBadge :day="c.day" :month="c.month" bg="var(--color-white)" />
          <div class="sanidad-view__cal-info">
            <div class="sanidad-view__cal-title">{{ c.title }}</div>
            <div class="sanidad-view__cal-detail">{{ c.detail }}</div>
          </div>
          <Pill :bg="c.pillBg" :color="c.pillColor">{{ c.tag }}</Pill>
        </div>
      </SectionCard>
    </div>

    <div v-if="isMobile" class="sanidad-view__section">
      <div class="sanidad-view__heading">Calendario de vacunación</div>
      <div v-for="c in calendar" :key="c.title" class="sanidad-view__cal-card">
        <DayBadge :day="c.day" :month="c.month" size="sm" bg="var(--color-bg)" />
        <div class="sanidad-view__cal-info">
          <div class="sanidad-view__cal-title">{{ c.title }}</div>
          <div class="sanidad-view__cal-detail">{{ c.detail }}</div>
        </div>
        <Pill :bg="c.pillBg" :color="c.pillColor">{{ c.tag }}</Pill>
      </div>
    </div>

    <!-- Desktop: tabla -->
    <SectionCard v-if="!isMobile" title="Historial sanitario">
      <div class="sanidad-view__table-head">
        <span>Fecha</span><span>Bovino</span><span>Tipo</span><span>Detalle</span><span>Responsable</span>
      </div>
      <div v-for="(h, i) in history" :key="i" class="sanidad-view__table-row">
        <span class="sanidad-view__muted">{{ h.date }}</span>
        <span class="sanidad-view__bold">{{ h.cow }}</span>
        <Pill :bg="h.pillBg" :color="h.pillColor">{{ h.type }}</Pill>
        <span class="sanidad-view__detail">{{ h.detail }}</span>
        <span>{{ h.vet }}</span>
      </div>
    </SectionCard>

    <!-- Mobile: cards -->
    <div v-else class="sanidad-view__section">
      <div class="sanidad-view__heading">Historial sanitario</div>
      <div v-for="(h, i) in history" :key="i" class="sanidad-view__history-card">
        <div class="sanidad-view__history-top">
          <span class="sanidad-view__bold">{{ h.cow }}</span>
          <Pill :bg="h.pillBg" :color="h.pillColor">{{ h.type }}</Pill>
        </div>
        <div class="sanidad-view__detail">{{ h.detail }}</div>
        <div class="sanidad-view__muted">{{ h.date }} · {{ h.vet }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sanidad-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__top {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    align-items: start;

    &--mobile {
      grid-template-columns: 1fr;
    }
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
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
    select,
    textarea {
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
    padding: 0.8rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  &__cal-row,
  &__cal-card {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem;
    border-radius: 14px;
  }

  &__cal-row {
    background: var(--color-bg);
  }

  &__cal-card {
    background: var(--color-white);
    box-shadow: var(--shadow-card);
  }

  &__cal-info {
    flex: 1;
    min-width: 0;
  }

  &__cal-title {
    font-size: 0.82rem;
    font-weight: 700;
  }

  &__cal-detail {
    font-size: 0.72rem;
    color: rgba(40, 54, 24, 0.6);
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

  &__table-head {
    display: grid;
    grid-template-columns: 90px 1fr 130px 2fr 1fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 90px 1fr 130px 2fr 1fr;
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

  &__detail {
    color: rgba(40, 54, 24, 0.7);
  }

  &__history-card {
    background: var(--color-white);
    border-radius: 1rem;
    padding: 0.85rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__history-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
