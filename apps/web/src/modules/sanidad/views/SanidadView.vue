<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import DayBadge from '../../../shared/components/DayBadge.vue';
import Pill from '../../../shared/components/Pill.vue';
import { ganadoApi, type Animal } from '../../ganado/services/ganado.api';
import {
  sanidadApi,
  type AlertaSanitaria,
  type AplicacionSanitaria,
  type ProductoSanitario,
  type TipoProductoSanitario,
} from '../services/sanidad.api';

const { isMobile } = useBreakpoint();

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function diaMes(iso: string) {
  const fecha = new Date(iso);
  return { day: String(fecha.getDate()).padStart(2, '0'), month: MESES[fecha.getMonth()] };
}
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES');
}

const TIPO_LABELS: Record<TipoProductoSanitario, string> = {
  VACUNA: 'Vacuna',
  ANTIPARASITARIO: 'Antiparasitario',
  MEDICAMENTO: 'Medicamento',
  OTRO: 'Otro',
};

const loading = ref(true);
const animales = ref<Animal[]>([]);
const productos = ref<ProductoSanitario[]>([]);
const alertas = ref<AlertaSanitaria[]>([]);
const historial = ref<(AplicacionSanitaria & { animal: { id: string; identificador: string } })[]>(
  [],
);

async function cargar() {
  loading.value = true;
  try {
    const [animalesResp, productosResp, alertasResp, historialResp] = await Promise.all([
      ganadoApi.listar({ limit: 100 }),
      sanidadApi.listarProductos(),
      sanidadApi.alertas(),
      sanidadApi.listar(),
    ]);
    animales.value = animalesResp.data;
    productos.value = productosResp;
    alertas.value = alertasResp;
    historial.value = historialResp;
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

const form = ref({
  animalId: '',
  productoId: '',
  fecha: new Date().toISOString().slice(0, 10),
  dosisAplicada: '',
  observaciones: '',
});
const saving = ref(false);
const errorMsg = ref('');

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await sanidadApi.crearAplicacion({
      animalId: form.value.animalId,
      productoId: form.value.productoId,
      fecha: form.value.fecha,
      dosisAplicada: form.value.dosisAplicada || undefined,
      observaciones: form.value.observaciones || undefined,
    });
    form.value = {
      animalId: '',
      productoId: '',
      fecha: new Date().toISOString().slice(0, 10),
      dosisAplicada: '',
      observaciones: '',
    };
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el registro.')
      : 'No se pudo guardar el registro.';
  } finally {
    saving.value = false;
  }
}

const showProductoForm = ref(false);
const productoForm = ref({
  nombre: '',
  tipo: 'VACUNA' as TipoProductoSanitario,
  dosisRecomendada: '',
  intervaloRefuerzoDias: '',
});
const savingProducto = ref(false);
const productoError = ref('');

async function guardarProducto() {
  productoError.value = '';
  savingProducto.value = true;
  try {
    const creado = await sanidadApi.crearProducto({
      nombre: productoForm.value.nombre,
      tipo: productoForm.value.tipo,
      dosisRecomendada: productoForm.value.dosisRecomendada || undefined,
      intervaloRefuerzoDias: productoForm.value.intervaloRefuerzoDias
        ? Number(productoForm.value.intervaloRefuerzoDias)
        : undefined,
    });
    productos.value = [...productos.value, creado].sort((a, b) => a.nombre.localeCompare(b.nombre));
    form.value.productoId = creado.id;
    showProductoForm.value = false;
    productoForm.value = { nombre: '', tipo: 'VACUNA', dosisRecomendada: '', intervaloRefuerzoDias: '' };
  } catch (error) {
    productoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el producto.')
      : 'No se pudo guardar el producto.';
  } finally {
    savingProducto.value = false;
  }
}

const alertaTag = computed(() => (a: AlertaSanitaria) =>
  a.vencido
    ? { label: 'Vencido', bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' }
    : { label: 'Próximo', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' },
);
</script>

<template>
  <div class="sanidad-view">
    <div class="sanidad-view__top" :class="{ 'sanidad-view__top--mobile': isMobile }">
      <SectionCard :title="isMobile ? 'Registrar vacunación' : 'Registrar vacunación / tratamiento'">
        <div v-if="errorMsg" class="sanidad-view__error">{{ errorMsg }}</div>
        <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
          <div class="sanidad-view__field">
            <label>Bovino</label>
            <select v-model="form.animalId">
              <option value="" disabled>Seleccioná un animal</option>
              <option v-for="a in animales" :key="a.id" :value="a.id">{{ a.identificador }}</option>
            </select>
          </div>
          <div class="sanidad-view__field">
            <label>Fecha</label>
            <input v-model="form.fecha" type="date" />
          </div>
          <div class="sanidad-view__field">
            <div class="sanidad-view__field-label-row">
              <label>Producto</label>
              <button type="button" class="sanidad-view__link-btn" @click="showProductoForm = !showProductoForm">
                {{ showProductoForm ? 'Cancelar' : '+ Nuevo producto' }}
              </button>
            </div>
            <select v-model="form.productoId">
              <option value="" disabled>Seleccioná un producto</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">
                {{ p.nombre }} ({{ TIPO_LABELS[p.tipo] }})
              </option>
            </select>
            <div v-if="productos.length === 0" class="sanidad-view__hint">
              Todavía no hay productos — creá uno con "+ Nuevo producto".
            </div>
          </div>
          <div class="sanidad-view__field">
            <label>Dosis aplicada</label>
            <input v-model="form.dosisAplicada" placeholder="2 ml IM" />
          </div>
        </div>

        <div v-if="showProductoForm" class="sanidad-view__producto-form">
          <div v-if="productoError" class="sanidad-view__error">{{ productoError }}</div>
          <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
            <div class="sanidad-view__field">
              <label>Nombre</label>
              <input v-model="productoForm.nombre" placeholder="Aftosa" />
            </div>
            <div class="sanidad-view__field">
              <label>Tipo</label>
              <select v-model="productoForm.tipo">
                <option v-for="(label, valor) in TIPO_LABELS" :key="valor" :value="valor">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="sanidad-view__field">
              <label>Dosis recomendada</label>
              <input v-model="productoForm.dosisRecomendada" placeholder="2 ml" />
            </div>
            <div class="sanidad-view__field">
              <label>Refuerzo cada (días)</label>
              <input v-model="productoForm.intervaloRefuerzoDias" type="number" min="1" placeholder="180" />
            </div>
          </div>
          <button
            type="button"
            class="sanidad-view__submit sanidad-view__submit--sm"
            :disabled="savingProducto || !productoForm.nombre"
            @click="guardarProducto"
          >
            {{ savingProducto ? 'Guardando…' : 'Guardar producto' }}
          </button>
        </div>

        <div class="sanidad-view__field">
          <label>Observaciones</label>
          <textarea v-model="form.observaciones" rows="2" placeholder="Notas del veterinario" />
        </div>
        <button
          type="button"
          class="sanidad-view__submit"
          :disabled="saving || !form.animalId || !form.productoId"
          @click="guardar"
        >
          {{ saving ? 'Guardando…' : 'Guardar registro sanitario' }}
        </button>
      </SectionCard>

      <SectionCard v-if="!isMobile" title="Alertas de refuerzo">
        <div v-if="!loading && alertas.length === 0" class="sanidad-view__muted">
          Sin refuerzos vencidos ni próximos en los siguientes 7 días.
        </div>
        <div v-for="a in alertas" :key="a.id" class="sanidad-view__cal-row">
          <DayBadge
            v-if="a.proximaFechaEsperada"
            :day="diaMes(a.proximaFechaEsperada).day"
            :month="diaMes(a.proximaFechaEsperada).month"
            bg="var(--color-white)"
          />
          <div class="sanidad-view__cal-info">
            <div class="sanidad-view__cal-title">{{ a.producto.nombre }} — {{ a.animal.identificador }}</div>
            <div class="sanidad-view__cal-detail">Refuerzo esperado</div>
          </div>
          <Pill :bg="alertaTag(a).bg" :color="alertaTag(a).color">{{ alertaTag(a).label }}</Pill>
        </div>
      </SectionCard>
    </div>

    <div v-if="isMobile" class="sanidad-view__section">
      <div class="sanidad-view__heading">Alertas de refuerzo</div>
      <div v-if="!loading && alertas.length === 0" class="sanidad-view__muted">
        Sin refuerzos vencidos ni próximos en los siguientes 7 días.
      </div>
      <div v-for="a in alertas" :key="a.id" class="sanidad-view__cal-card">
        <DayBadge
          v-if="a.proximaFechaEsperada"
          :day="diaMes(a.proximaFechaEsperada).day"
          :month="diaMes(a.proximaFechaEsperada).month"
          size="sm"
          bg="var(--color-bg)"
        />
        <div class="sanidad-view__cal-info">
          <div class="sanidad-view__cal-title">{{ a.producto.nombre }} — {{ a.animal.identificador }}</div>
        </div>
        <Pill :bg="alertaTag(a).bg" :color="alertaTag(a).color">{{ alertaTag(a).label }}</Pill>
      </div>
    </div>

    <div v-if="loading" class="sanidad-view__muted">Cargando…</div>

    <!-- Desktop: tabla -->
    <SectionCard v-else-if="!isMobile" title="Historial sanitario">
      <div v-if="historial.length === 0" class="sanidad-view__muted">Todavía no hay registros.</div>
      <template v-else>
        <div class="sanidad-view__table-head">
          <span>Fecha</span><span>Bovino</span><span>Producto</span><span>Detalle</span><span>Responsable</span>
        </div>
        <div v-for="h in historial" :key="h.id" class="sanidad-view__table-row">
          <span class="sanidad-view__muted">{{ formatFecha(h.fecha) }}</span>
          <span class="sanidad-view__bold">{{ h.animal.identificador }}</span>
          <Pill bg="var(--color-neutral-bg)" color="var(--color-primary)">{{ h.producto.nombre }}</Pill>
          <span class="sanidad-view__detail">{{ h.dosisAplicada ?? h.observaciones ?? '—' }}</span>
          <span>{{ h.responsable.nombre }}</span>
        </div>
      </template>
    </SectionCard>

    <!-- Mobile: cards -->
    <div v-else class="sanidad-view__section">
      <div class="sanidad-view__heading">Historial sanitario</div>
      <div v-if="historial.length === 0" class="sanidad-view__muted">Todavía no hay registros.</div>
      <div v-for="h in historial" :key="h.id" class="sanidad-view__history-card">
        <div class="sanidad-view__history-top">
          <span class="sanidad-view__bold">{{ h.animal.identificador }}</span>
          <Pill bg="var(--color-neutral-bg)" color="var(--color-primary)">{{ h.producto.nombre }}</Pill>
        </div>
        <div class="sanidad-view__detail">{{ h.dosisAplicada ?? h.observaciones ?? '—' }}</div>
        <div class="sanidad-view__muted">{{ formatFecha(h.fecha) }} · {{ h.responsable.nombre }}</div>
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

  &__error {
    background: var(--color-warn-bg);
    color: var(--color-warn);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 0.6rem;
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

  &__field-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__hint {
    font-size: 0.7rem;
    color: var(--color-warn);
    font-weight: 600;
  }

  &__link-btn {
    background: var(--color-neutral-bg);
    border: 1.5px solid var(--color-primary);
    border-radius: 999px;
    color: var(--color-primary);
    font-size: 0.68rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.25rem 0.7rem;
    font-family: inherit;
    white-space: nowrap;
  }

  &__producto-form {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
    margin-top: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
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
    margin-top: 0.85rem;

    &--sm {
      padding: 0.6rem 1rem;
      align-self: flex-start;
      margin-top: 0;
    }

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
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
