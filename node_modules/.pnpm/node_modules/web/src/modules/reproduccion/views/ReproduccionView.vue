<script setup lang="ts">
import { ref } from 'vue';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import SegmentedTabs from '../../../shared/components/SegmentedTabs.vue';
import DayBadge from '../../../shared/components/DayBadge.vue';
import Pill from '../../../shared/components/Pill.vue';
import { births, pregnant, cowOptions, resultOptions } from '../mock/reproduccion.mock';

const { isMobile } = useBreakpoint();
const eventType = ref('Inseminación');
const mobileTabs = ['Insem.', 'Natural', 'Palpación'];
const desktopTabs = ['Inseminación', 'Servicio natural', 'Palpación'];
</script>

<template>
  <div class="reproduccion-view">
    <div class="reproduccion-view__top" :class="{ 'reproduccion-view__top--mobile': isMobile }">
      <SectionCard title="Registrar evento reproductivo">
        <SegmentedTabs
          v-model="eventType"
          :options="isMobile ? mobileTabs : desktopTabs"
          :fluid="isMobile"
        />
        <div class="reproduccion-view__form-grid" :class="{ 'reproduccion-view__form-grid--mobile': isMobile }">
          <div class="reproduccion-view__field">
            <label v-if="!isMobile">Bovino</label>
            <select>
              <option v-for="c in cowOptions" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="reproduccion-view__field">
            <label v-if="!isMobile">Fecha</label>
            <input type="date" />
          </div>
          <template v-if="!isMobile">
            <div class="reproduccion-view__field">
              <label>Toro / Semen</label>
              <input placeholder="Toro Cacique" />
            </div>
            <div class="reproduccion-view__field">
              <label>Resultado (palpación)</label>
              <select>
                <option v-for="r in resultOptions" :key="r">{{ r }}</option>
              </select>
            </div>
          </template>
        </div>
        <div v-if="!isMobile" class="reproduccion-view__field">
          <label>Observaciones</label>
          <textarea rows="2" placeholder="Notas del veterinario" />
        </div>
        <button type="button" class="reproduccion-view__submit">
          {{ isMobile ? 'Guardar registro' : 'Guardar registro reproductivo' }}
        </button>
      </SectionCard>

      <SectionCard v-if="!isMobile" title="Partos próximos">
        <div v-for="b in births" :key="b.cow + b.day" class="reproduccion-view__row">
          <DayBadge :day="b.day" :month="b.month" />
          <div class="reproduccion-view__row-info">
            <div class="reproduccion-view__row-title">{{ b.cow }}</div>
            <div class="reproduccion-view__row-detail">{{ b.detail }}</div>
          </div>
          <Pill :bg="b.pillBg" :color="b.pillColor">{{ b.tag }}</Pill>
        </div>
      </SectionCard>
    </div>

    <div v-if="isMobile" class="reproduccion-view__section">
      <div class="reproduccion-view__heading">Partos próximos</div>
      <div v-for="b in births" :key="b.cow + b.day" class="reproduccion-view__card">
        <DayBadge :day="b.day" :month="b.month" size="sm" bg="var(--color-bg)" />
        <div class="reproduccion-view__row-info">
          <div class="reproduccion-view__row-title">{{ b.cow }}</div>
          <div class="reproduccion-view__row-detail">{{ b.detail }}</div>
        </div>
        <Pill :bg="b.pillBg" :color="b.pillColor">{{ b.tag }}</Pill>
      </div>
    </div>

    <SectionCard v-if="!isMobile" title="Vacas preñadas">
      <div class="reproduccion-view__table-head">
        <span>Bovino</span><span>Tipo de servicio</span><span>F. servicio</span
        ><span>F. probable parto</span><span>Estado</span>
      </div>
      <div v-for="(p, i) in pregnant" :key="i" class="reproduccion-view__table-row">
        <span class="reproduccion-view__bold">{{ p.cow }}</span>
        <span>{{ p.service }}</span>
        <span class="reproduccion-view__muted">{{ p.serviceDate }}</span>
        <span>{{ p.dueDate }}</span>
        <Pill :bg="p.pillBg" :color="p.pillColor">{{ p.status }}</Pill>
      </div>
    </SectionCard>

    <div v-else class="reproduccion-view__section">
      <div class="reproduccion-view__heading">Vacas preñadas</div>
      <div v-for="(p, i) in pregnant" :key="i" class="reproduccion-view__pregnant-card">
        <div class="reproduccion-view__row-top">
          <span class="reproduccion-view__bold">{{ p.cow }}</span>
          <Pill :bg="p.pillBg" :color="p.pillColor">{{ p.status }}</Pill>
        </div>
        <div class="reproduccion-view__muted">{{ p.service }} · Parto: {{ p.dueDate }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.reproduccion-view {
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

  &__row,
  &__card {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.75rem;
    border-radius: 14px;
  }

  &__row {
    background: var(--color-bg);
  }

  &__card {
    background: var(--color-white);
    box-shadow: var(--shadow-card);
  }

  &__row-info {
    flex: 1;
    min-width: 0;
  }

  &__row-title {
    font-size: 0.82rem;
    font-weight: 700;
  }

  &__row-detail {
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
    grid-template-columns: 1fr 1.4fr 1fr 1fr 1fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__table-row {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1fr 1fr 1fr;
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
    font-size: 0.78rem;
  }

  &__pregnant-card {
    background: var(--color-white);
    border-radius: 1rem;
    padding: 0.85rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  &__row-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
