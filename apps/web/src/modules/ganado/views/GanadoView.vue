<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import AppIcon from '../../../shared/components/AppIcon.vue';
import { cows, breeds } from '../mock/ganado.mock';

const { isMobile } = useBreakpoint();

const search = ref('');
const activeId = ref(1);
const showForm = ref(false);

const filteredCows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return cows;
  return cows.filter(
    (c) => c.name.toLowerCase().includes(q) || c.rfid.toLowerCase().includes(q),
  );
});

const selected = computed(() => cows.find((c) => c.id === activeId.value) ?? cows[0]);

function selectCow(id: number) {
  activeId.value = id;
}

function toggleAccordion(id: number) {
  activeId.value = activeId.value === id ? -1 : id;
}
</script>

<template>
  <div class="ganado-view">
    <div class="ganado-view__toolbar">
      <div v-if="isMobile" class="ganado-view__search-row">
        <input v-model="search" class="ganado-view__search" placeholder="Buscar por nombre o RFID…" />
        <button type="button" class="ganado-view__add-btn" @click="showForm = !showForm">
          <AppIcon name="plus" :size="18" />
        </button>
      </div>
      <button v-else type="button" class="ganado-view__new-btn" @click="showForm = !showForm">
        {{ showForm ? 'Cerrar formulario' : 'Registrar nuevo bovino' }}
      </button>
    </div>

    <div v-if="showForm" class="ganado-view__form">
      <div class="ganado-view__form-title">Registrar nuevo bovino</div>
      <div class="ganado-view__form-grid">
        <div class="ganado-view__field">
          <label>RFID</label>
          <input placeholder="004829" />
        </div>
        <div class="ganado-view__field">
          <label>Nombre</label>
          <input placeholder="Nombre del animal" />
        </div>
        <div class="ganado-view__field">
          <label>Raza</label>
          <select>
            <option v-for="b in breeds" :key="b">{{ b }}</option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Fecha de nacimiento</label>
          <input type="date" />
        </div>
        <div class="ganado-view__field">
          <label>Padre</label>
          <input placeholder="Toro Max" />
        </div>
        <div class="ganado-view__field">
          <label>Madre</label>
          <input placeholder="Bonita" />
        </div>
      </div>
      <div class="ganado-view__form-actions">
        <button type="button" class="ganado-view__btn-ghost" @click="showForm = false">Cancelar</button>
        <button type="button" class="ganado-view__btn-primary" @click="showForm = false">
          Guardar bovino
        </button>
      </div>
    </div>

    <!-- Mobile: acordeón -->
    <div v-if="isMobile" class="ganado-view__accordion">
      <div v-for="c in filteredCows" :key="c.id" class="ganado-view__acc-item">
        <button type="button" class="ganado-view__acc-head" @click="toggleAccordion(c.id)">
          <div>
            <div class="ganado-view__acc-name">{{ c.name }}</div>
            <div class="ganado-view__acc-meta">RFID {{ c.rfid }} · {{ c.breed }}</div>
          </div>
          <span class="ganado-view__status" :style="{ background: c.pillBg, color: c.pillColor }">
            {{ c.status }}
          </span>
        </button>
        <div v-if="activeId === c.id" class="ganado-view__acc-body">
          <div class="ganado-view__acc-photo-row">
            <div class="ganado-view__photo ganado-view__photo--sm">
              <AppIcon name="cow" :size="22" />
            </div>
            <div>
              <div class="ganado-view__acc-birth">Nacida {{ c.birth }} · {{ c.paddock }}</div>
              <div class="ganado-view__acc-avg">Prom. {{ c.avgLiters }}</div>
            </div>
          </div>
          <div class="ganado-view__acc-stats">
            <div class="ganado-view__stat">
              <div class="ganado-view__stat-label">Padre</div>
              <div class="ganado-view__stat-value">{{ c.father }}</div>
            </div>
            <div class="ganado-view__stat">
              <div class="ganado-view__stat-label">Madre</div>
              <div class="ganado-view__stat-value">{{ c.mother }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Desktop: lista + detalle -->
    <div v-else class="ganado-view__columns">
      <div class="ganado-view__list">
        <input v-model="search" class="ganado-view__search" placeholder="Buscar por nombre o RFID…" />
        <div class="ganado-view__list-items">
          <button
            v-for="c in filteredCows"
            :key="c.id"
            type="button"
            class="ganado-view__list-item"
            :class="{ 'ganado-view__list-item--active': c.id === activeId }"
            @click="selectCow(c.id)"
          >
            <div>
              <div class="ganado-view__acc-name">{{ c.name }}</div>
              <div class="ganado-view__acc-meta">RFID {{ c.rfid }} · {{ c.breed }}</div>
            </div>
            <span class="ganado-view__status" :style="{ background: c.pillBg, color: c.pillColor }">
              {{ c.status }}
            </span>
          </button>
        </div>
      </div>

      <div class="ganado-view__detail">
        <div class="ganado-view__detail-head">
          <div class="ganado-view__photo">
            <AppIcon name="cow" :size="36" />
          </div>
          <div class="ganado-view__detail-info">
            <div class="ganado-view__detail-title-row">
              <h2>{{ selected.name }}</h2>
              <span
                class="ganado-view__status"
                :style="{ background: selected.pillBg, color: selected.pillColor }"
              >
                {{ selected.status }}
              </span>
            </div>
            <div class="ganado-view__detail-line">
              RFID {{ selected.rfid }} · {{ selected.breed }} · Nacida {{ selected.birth }}
            </div>
            <div class="ganado-view__detail-line">Potrero actual: {{ selected.paddock }}</div>
          </div>
        </div>

        <div class="ganado-view__stats-grid">
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Producción prom.</div>
            <div class="ganado-view__stat-value ganado-view__stat-value--lg">
              {{ selected.avgLiters }}
            </div>
          </div>
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Padre</div>
            <div class="ganado-view__stat-value">{{ selected.father }}</div>
          </div>
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Madre</div>
            <div class="ganado-view__stat-value">{{ selected.mother }}</div>
          </div>
        </div>

        <div>
          <div class="ganado-view__history-title">Historial reciente</div>
          <div v-for="(h, i) in selected.history" :key="i" class="ganado-view__history-row">
            <span class="ganado-view__history-date">{{ h.date }}</span>
            <span class="ganado-view__history-event">{{ h.event }}</span>
            <span class="ganado-view__history-detail">{{ h.detail }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ganado-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__toolbar {
    display: flex;
    justify-content: flex-end;
  }

  &__search-row {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  &__search {
    flex: 1;
    border: 1.5px solid var(--color-border);
    border-radius: 999px;
    padding: 0.65rem 1rem;
    font-size: 0.8rem;
    background: var(--color-white);
    font-family: inherit;
  }

  &__add-btn {
    width: 40px;
    height: 40px;
    flex: none;
    border: none;
    border-radius: 999px;
    background: var(--color-primary);
    color: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  &__new-btn {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.3rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  &__form {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1.35rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__form-title {
    font-weight: 800;
    font-size: 1rem;
  }

  &__form-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;

    @media (max-width: 900px) {
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

  &__form-actions {
    display: flex;
    gap: 0.6rem;
    justify-content: flex-end;
  }

  &__btn-ghost {
    background: transparent;
    border: 1.5px solid #efead1;
    color: var(--color-dark);
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  &__btn-primary {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    font-family: inherit;
  }

  &__columns {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 1.25rem;
    align-items: start;
  }

  &__list {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__list-items {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-top: 0.3rem;
  }

  &__list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.75rem;
    background: transparent;
    border: none;
    border-radius: 14px;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    color: inherit;

    &--active {
      background: var(--color-bg);
    }
  }

  &__acc-name {
    font-size: 0.85rem;
    font-weight: 700;
  }

  &__acc-meta {
    font-size: 0.7rem;
    color: rgba(40, 54, 24, 0.55);
  }

  &__status {
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    white-space: nowrap;
  }

  &__detail {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 1.35rem;
    box-shadow: var(--shadow-card);
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  &__detail-head {
    display: flex;
    gap: 1rem;
  }

  &__photo {
    width: 96px;
    height: 96px;
    flex: none;
    background: var(--color-bg);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);

    &--sm {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: var(--color-white);
    }
  }

  &__detail-info {
    flex: 1;
    min-width: 0;
  }

  &__detail-title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 800;
    }
  }

  &__detail-line {
    font-size: 0.82rem;
    color: rgba(40, 54, 24, 0.6);
    margin-top: 0.2rem;
  }

  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem;
  }

  &__stat {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
  }

  &__stat-label {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 700;
  }

  &__stat-value {
    font-size: 0.85rem;
    font-weight: 700;
    margin-top: 0.25rem;

    &--lg {
      font-size: 1.1rem;
      font-weight: 800;
    }
  }

  &__history-title {
    font-weight: 800;
    font-size: 0.92rem;
    margin-bottom: 0.5rem;
  }

  &__history-row {
    display: grid;
    grid-template-columns: 70px 110px 1fr;
    gap: 0.6rem;
    padding: 0.6rem 0;
    border-top: 1px solid #f2efdd;
    align-items: center;
  }

  &__history-date {
    font-size: 0.75rem;
    color: rgba(40, 54, 24, 0.55);
  }

  &__history-event {
    font-size: 0.8rem;
    font-weight: 700;
  }

  &__history-detail {
    font-size: 0.8rem;
    color: rgba(40, 54, 24, 0.7);
  }

  &__accordion {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__acc-item {
    display: flex;
    flex-direction: column;
  }

  &__acc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.75rem 0.85rem;
    background: var(--color-white);
    border: none;
    border-radius: 1rem;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    color: inherit;
    box-shadow: var(--shadow-card);
  }

  &__acc-body {
    background: var(--color-bg);
    border-radius: 1rem;
    padding: 0.85rem;
    margin-top: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  &__acc-photo-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  &__acc-birth {
    font-size: 0.68rem;
    color: rgba(40, 54, 24, 0.55);
  }

  &__acc-avg {
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 0.15rem;
  }

  &__acc-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;

    .ganado-view__stat {
      background: var(--color-white);
      padding: 0.6rem;
      border-radius: 12px;
    }
  }

  @media (max-width: 900px) {
    &__columns {
      grid-template-columns: 1fr;
    }
  }
}
</style>
