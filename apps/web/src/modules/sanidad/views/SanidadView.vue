<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { diaMesCorto, formatFecha as formatFechaUtc } from '../../../shared/utils/fecha';
import SectionCard from '../../../shared/components/SectionCard.vue';
import DayBadge from '../../../shared/components/DayBadge.vue';
import Pill from '../../../shared/components/Pill.vue';
import { ganadoApi, type Animal } from '../../ganado/services/ganado.api';
import { potrerosApi, type Potrero } from '../../potreros/services/potreros.api';
import {
  sanidadApi,
  type AlertaSanitaria,
  type AplicacionSanitaria,
  type Cuarentena,
  type Especie,
  type GravedadDiagnostico,
  type ProductoSanitario,
  type ProtocoloSanitario,
  type SexoAnimal,
  type TipoProductoSanitario,
} from '../services/sanidad.api';

const { isMobile } = useBreakpoint();

function diaMes(iso: string) {
  return diaMesCorto(iso);
}
function formatFecha(iso: string) {
  return formatFechaUtc(iso);
}

const TIPO_LABELS: Record<TipoProductoSanitario, string> = {
  VACUNA: 'Vacuna',
  ANTIPARASITARIO: 'Antiparasitario',
  MEDICAMENTO: 'Medicamento',
  OTRO: 'Otro',
};

const GRAVEDAD_LABELS: Record<GravedadDiagnostico, string> = {
  LEVE: 'Leve',
  MODERADA: 'Moderada',
  GRAVE: 'Grave',
};

const ESPECIE_LABELS: Record<Especie, string> = { BOVINO: 'Bovino', BUFALINO: 'Bufalino' };
const SEXO_LABELS: Record<SexoAnimal, string> = { MACHO: 'Macho', HEMBRA: 'Hembra' };

const loading = ref(true);
const animales = ref<Animal[]>([]);
const potreros = ref<Potrero[]>([]);
const productos = ref<ProductoSanitario[]>([]);
const protocolos = ref<ProtocoloSanitario[]>([]);
const cuarentenasActivas = ref<Cuarentena[]>([]);
const alertas = ref<AlertaSanitaria[]>([]);
const historial = ref<(AplicacionSanitaria & { animal: { id: string; identificador: string } })[]>(
  [],
);
const page = ref(1);
const limit = 20;
const total = ref(0);
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / limit)));

async function cargar() {
  loading.value = true;
  try {
    const [animalesResp, potrerosResp, productosResp, protocolosResp, cuarentenasResp, alertasResp, historialResp] =
      await Promise.all([
        ganadoApi.listar({ limit: 100 }),
        potrerosApi.listar(),
        sanidadApi.listarProductos(),
        sanidadApi.listarProtocolos(),
        sanidadApi.listarCuarentenas({ activas: true }),
        sanidadApi.alertas(),
        sanidadApi.listar({ page: page.value, limit }),
      ]);
    animales.value = animalesResp.data;
    potreros.value = potrerosResp;
    productos.value = productosResp;
    protocolos.value = protocolosResp;
    cuarentenasActivas.value = cuarentenasResp;
    alertas.value = alertasResp;
    historial.value = historialResp.data;
    total.value = historialResp.total;
  } finally {
    loading.value = false;
  }
}

function irAPagina(p: number) {
  if (p < 1 || p > totalPaginas.value) return;
  page.value = p;
  cargar();
}

onMounted(cargar);

const animalesActivos = computed(() => animales.value.filter((a) => a.estado === 'ACTIVO'));

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

// --- Aplicación masiva por lote (US-2.2) -----------------------------------

const showLoteAplicacion = ref(false);
const loteForm = ref({
  productoId: '',
  fecha: new Date().toISOString().slice(0, 10),
  potreroFiltro: '',
  dosisAplicada: '',
  observaciones: '',
});
const loteSeleccionados = ref(new Set<string>());
const savingLote = ref(false);
const loteError = ref('');

const animalesLote = computed(() => {
  const activos = animales.value.filter((a) => a.estado === 'ACTIVO');
  if (!loteForm.value.potreroFiltro) return activos;
  return activos.filter((a) => a.potreroActualId === loteForm.value.potreroFiltro);
});

function toggleLoteSeleccion(id: string) {
  if (loteSeleccionados.value.has(id)) loteSeleccionados.value.delete(id);
  else loteSeleccionados.value.add(id);
  loteSeleccionados.value = new Set(loteSeleccionados.value);
}

async function guardarLoteAplicacion() {
  loteError.value = '';
  if (loteSeleccionados.value.size === 0) {
    loteError.value = 'Seleccioná al menos un animal para el lote.';
    return;
  }
  savingLote.value = true;
  try {
    await sanidadApi.crearAplicacionLote({
      productoId: loteForm.value.productoId,
      fecha: loteForm.value.fecha,
      animalIds: Array.from(loteSeleccionados.value),
      dosisAplicada: loteForm.value.dosisAplicada || undefined,
      observaciones: loteForm.value.observaciones || undefined,
    });
    loteSeleccionados.value = new Set();
    showLoteAplicacion.value = false;
    await cargar();
  } catch (error) {
    loteError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el lote.')
      : 'No se pudo guardar el lote.';
  } finally {
    savingLote.value = false;
  }
}

// --- Protocolos automáticos (US-1.2) ---------------------------------------

const showProtocoloForm = ref(false);
const protocoloForm = ref({
  nombre: '',
  productoId: '',
  edadInicioDias: '',
  frecuenciaDias: '',
  especie: '' as Especie | '',
  sexo: '' as SexoAnimal | '',
  categoria: '',
});
const savingProtocolo = ref(false);
const protocoloError = ref('');

async function guardarProtocolo() {
  protocoloError.value = '';
  savingProtocolo.value = true;
  try {
    const creado = await sanidadApi.crearProtocolo({
      nombre: protocoloForm.value.nombre,
      productoId: protocoloForm.value.productoId,
      edadInicioDias: protocoloForm.value.edadInicioDias ? Number(protocoloForm.value.edadInicioDias) : undefined,
      frecuenciaDias: protocoloForm.value.frecuenciaDias ? Number(protocoloForm.value.frecuenciaDias) : undefined,
      especie: protocoloForm.value.especie || undefined,
      sexo: protocoloForm.value.sexo || undefined,
      categoria: protocoloForm.value.categoria || undefined,
    });
    protocolos.value = [...protocolos.value, creado];
    showProtocoloForm.value = false;
    protocoloForm.value = {
      nombre: '',
      productoId: '',
      edadInicioDias: '',
      frecuenciaDias: '',
      especie: '',
      sexo: '',
      categoria: '',
    };
  } catch (error) {
    protocoloError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el protocolo.')
      : 'No se pudo guardar el protocolo.';
  } finally {
    savingProtocolo.value = false;
  }
}

async function toggleProtocoloEstado(protocolo: ProtocoloSanitario) {
  const nuevoEstado = protocolo.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  const actualizado = await sanidadApi.actualizarProtocolo(protocolo.id, { estado: nuevoEstado });
  protocolos.value = protocolos.value.map((p) => (p.id === protocolo.id ? actualizado : p));
}

// --- Diagnóstico (US-3.1) --------------------------------------------------

const diagnosticoForm = ref({
  animalId: '',
  fecha: new Date().toISOString().slice(0, 10),
  condicion: '',
  gravedad: 'LEVE' as GravedadDiagnostico,
  tratamientoAplicacionId: '',
});
const tratamientosDisponibles = ref<AplicacionSanitaria[]>([]);
const savingDiagnostico = ref(false);
const diagnosticoError = ref('');

watch(
  () => diagnosticoForm.value.animalId,
  async (animalId) => {
    diagnosticoForm.value.tratamientoAplicacionId = '';
    tratamientosDisponibles.value = animalId ? await sanidadApi.historialAnimal(animalId) : [];
  },
);

async function guardarDiagnostico() {
  diagnosticoError.value = '';
  savingDiagnostico.value = true;
  try {
    await sanidadApi.crearDiagnostico({
      animalId: diagnosticoForm.value.animalId,
      fecha: diagnosticoForm.value.fecha,
      condicion: diagnosticoForm.value.condicion,
      gravedad: diagnosticoForm.value.gravedad,
      tratamientoAplicacionId: diagnosticoForm.value.tratamientoAplicacionId || undefined,
    });
    diagnosticoForm.value = {
      animalId: '',
      fecha: new Date().toISOString().slice(0, 10),
      condicion: '',
      gravedad: 'LEVE',
      tratamientoAplicacionId: '',
    };
  } catch (error) {
    diagnosticoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el diagnóstico.')
      : 'No se pudo guardar el diagnóstico.';
  } finally {
    savingDiagnostico.value = false;
  }
}

// --- Cuarentena (US-3.2) ----------------------------------------------------

const cuarentenaForm = ref({
  animalId: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFinEstimada: '',
  motivo: '',
});
const savingCuarentena = ref(false);
const cuarentenaError = ref('');
const finalizandoId = ref<string | null>(null);

async function guardarCuarentena() {
  cuarentenaError.value = '';
  savingCuarentena.value = true;
  try {
    await sanidadApi.iniciarCuarentena({
      animalId: cuarentenaForm.value.animalId,
      fechaInicio: cuarentenaForm.value.fechaInicio,
      fechaFinEstimada: cuarentenaForm.value.fechaFinEstimada || undefined,
      motivo: cuarentenaForm.value.motivo,
    });
    cuarentenaForm.value = {
      animalId: '',
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaFinEstimada: '',
      motivo: '',
    };
    await cargar();
  } catch (error) {
    cuarentenaError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo iniciar la cuarentena.')
      : 'No se pudo iniciar la cuarentena.';
  } finally {
    savingCuarentena.value = false;
  }
}

async function finalizarCuarentena(cuarentena: Cuarentena) {
  finalizandoId.value = cuarentena.id;
  try {
    await sanidadApi.finalizarCuarentena(cuarentena.id);
    await cargar();
  } finally {
    finalizandoId.value = null;
  }
}
</script>

<template>
  <div class="sanidad-view">
    <div class="sanidad-view__top" :class="{ 'sanidad-view__top--mobile': isMobile }">
      <SectionCard :title="isMobile ? 'Registrar vacunación' : 'Registrar vacunación / tratamiento'">
        <template #actions>
          <button type="button" class="sanidad-view__link-btn" @click="showLoteAplicacion = !showLoteAplicacion">
            {{ showLoteAplicacion ? 'Cancelar' : 'Aplicar a un lote' }}
          </button>
        </template>
        <div v-if="errorMsg" class="sanidad-view__error">{{ errorMsg }}</div>
        <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
          <div class="sanidad-view__field">
            <label>Bovino</label>
            <select v-model="form.animalId">
              <option value="" disabled>Seleccioná un animal</option>
              <option v-for="a in animalesActivos" :key="a.id" :value="a.id">{{ a.identificador }}</option>
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
          :disabled="saving || !form.animalId || !form.productoId || !form.dosisAplicada"
          @click="guardar"
        >
          {{ saving ? 'Guardando…' : 'Guardar registro sanitario' }}
        </button>

        <div v-if="showLoteAplicacion" class="sanidad-view__producto-form">
          <div class="sanidad-view__total-form-title">Aplicación a un lote</div>
          <div v-if="loteError" class="sanidad-view__error">{{ loteError }}</div>
          <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
            <div class="sanidad-view__field">
              <label>Producto</label>
              <select v-model="loteForm.productoId">
                <option value="" disabled>Seleccioná un producto</option>
                <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
              </select>
            </div>
            <div class="sanidad-view__field">
              <label>Fecha</label>
              <input v-model="loteForm.fecha" type="date" />
            </div>
            <div class="sanidad-view__field">
              <label>Potrero</label>
              <select v-model="loteForm.potreroFiltro">
                <option value="">Todos los animales activos</option>
                <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
              </select>
            </div>
            <div class="sanidad-view__field">
              <label>Dosis aplicada</label>
              <input v-model="loteForm.dosisAplicada" placeholder="2 ml IM" />
            </div>
          </div>
          <div v-if="animalesLote.length === 0" class="sanidad-view__muted">
            No hay animales activos para este filtro.
          </div>
          <div v-else class="sanidad-view__lote-grid">
            <label v-for="a in animalesLote" :key="a.id" class="sanidad-view__lote-row">
              <input
                type="checkbox"
                :checked="loteSeleccionados.has(a.id)"
                @change="toggleLoteSeleccion(a.id)"
              />
              <span>{{ a.identificador }}</span>
            </label>
          </div>
          <button
            type="button"
            class="sanidad-view__submit sanidad-view__submit--sm"
            :disabled="savingLote || !loteForm.productoId || !loteForm.dosisAplicada"
            @click="guardarLoteAplicacion"
          >
            {{ savingLote ? 'Guardando…' : `Aplicar a ${loteSeleccionados.size} animal(es)` }}
          </button>
        </div>
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
            <div class="sanidad-view__cal-detail">
              {{ a.tipo === 'PROTOCOLO' ? 'Protocolo pendiente' : 'Refuerzo esperado' }}
            </div>
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
          <div class="sanidad-view__cal-detail">{{ a.tipo === 'PROTOCOLO' ? 'Protocolo' : 'Refuerzo' }}</div>
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
      <div v-if="totalPaginas > 1" class="sanidad-view__pagination">
        <button type="button" class="sanidad-view__link-btn" :disabled="page === 1" @click="irAPagina(page - 1)">
          Anterior
        </button>
        <span class="sanidad-view__muted">Página {{ page }} de {{ totalPaginas }}</span>
        <button
          type="button"
          class="sanidad-view__link-btn"
          :disabled="page === totalPaginas"
          @click="irAPagina(page + 1)"
        >
          Siguiente
        </button>
      </div>
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
      <div v-if="totalPaginas > 1" class="sanidad-view__pagination">
        <button type="button" class="sanidad-view__link-btn" :disabled="page === 1" @click="irAPagina(page - 1)">
          Anterior
        </button>
        <span class="sanidad-view__muted">{{ page }}/{{ totalPaginas }}</span>
        <button
          type="button"
          class="sanidad-view__link-btn"
          :disabled="page === totalPaginas"
          @click="irAPagina(page + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>

    <SectionCard title="Protocolos automáticos">
      <template #actions>
        <button type="button" class="sanidad-view__link-btn" @click="showProtocoloForm = !showProtocoloForm">
          {{ showProtocoloForm ? 'Cancelar' : '+ Nuevo protocolo' }}
        </button>
      </template>
      <div v-if="showProtocoloForm" class="sanidad-view__producto-form">
        <div v-if="protocoloError" class="sanidad-view__error">{{ protocoloError }}</div>
        <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
          <div class="sanidad-view__field">
            <label>Nombre</label>
            <input v-model="protocoloForm.nombre" placeholder="Refuerzo aftosa" />
          </div>
          <div class="sanidad-view__field">
            <label>Producto</label>
            <select v-model="protocoloForm.productoId">
              <option value="" disabled>Seleccioná un producto</option>
              <option v-for="p in productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
          </div>
          <div class="sanidad-view__field">
            <label>Edad de inicio (días)</label>
            <input v-model="protocoloForm.edadInicioDias" type="number" min="0" placeholder="90" />
          </div>
          <div class="sanidad-view__field">
            <label>Frecuencia (días)</label>
            <input v-model="protocoloForm.frecuenciaDias" type="number" min="1" placeholder="180" />
          </div>
          <div class="sanidad-view__field">
            <label>Especie (opcional)</label>
            <select v-model="protocoloForm.especie">
              <option value="">Cualquiera</option>
              <option v-for="(label, valor) in ESPECIE_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="sanidad-view__field">
            <label>Sexo (opcional)</label>
            <select v-model="protocoloForm.sexo">
              <option value="">Cualquiera</option>
              <option v-for="(label, valor) in SEXO_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="sanidad-view__field">
            <label>Categoría (opcional)</label>
            <input v-model="protocoloForm.categoria" placeholder="Ternera" />
          </div>
        </div>
        <button
          type="button"
          class="sanidad-view__submit sanidad-view__submit--sm"
          :disabled="savingProtocolo || !protocoloForm.nombre || !protocoloForm.productoId"
          @click="guardarProtocolo"
        >
          {{ savingProtocolo ? 'Guardando…' : 'Guardar protocolo' }}
        </button>
      </div>

      <div v-if="protocolos.length === 0" class="sanidad-view__muted">Todavía no hay protocolos definidos.</div>
      <div v-for="p in protocolos" :key="p.id" class="sanidad-view__history-card">
        <div class="sanidad-view__history-top">
          <span class="sanidad-view__bold">{{ p.nombre }}</span>
          <Pill
            :bg="p.estado === 'ACTIVO' ? 'var(--color-neutral-bg)' : 'var(--color-warn-bg)'"
            :color="p.estado === 'ACTIVO' ? 'var(--color-primary)' : 'var(--color-warn)'"
          >
            {{ p.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
          </Pill>
        </div>
        <div class="sanidad-view__detail">
          {{ p.producto.nombre }}
          <span v-if="p.edadInicioDias"> · desde los {{ p.edadInicioDias }} días</span>
          <span v-if="p.frecuenciaDias"> · cada {{ p.frecuenciaDias }} días</span>
        </div>
        <button type="button" class="sanidad-view__link-btn" @click="toggleProtocoloEstado(p)">
          {{ p.estado === 'ACTIVO' ? 'Inactivar' : 'Reactivar' }}
        </button>
      </div>
    </SectionCard>

    <div class="sanidad-view__top" :class="{ 'sanidad-view__top--mobile': isMobile }">
      <SectionCard title="Registrar diagnóstico">
        <div v-if="diagnosticoError" class="sanidad-view__error">{{ diagnosticoError }}</div>
        <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
          <div class="sanidad-view__field">
            <label>Bovino</label>
            <select v-model="diagnosticoForm.animalId">
              <option value="" disabled>Seleccioná un animal</option>
              <option v-for="a in animalesActivos" :key="a.id" :value="a.id">{{ a.identificador }}</option>
            </select>
          </div>
          <div class="sanidad-view__field">
            <label>Fecha</label>
            <input v-model="diagnosticoForm.fecha" type="date" />
          </div>
          <div class="sanidad-view__field">
            <label>Gravedad</label>
            <select v-model="diagnosticoForm.gravedad">
              <option v-for="(label, valor) in GRAVEDAD_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="sanidad-view__field" v-if="tratamientosDisponibles.length > 0">
            <label>Tratamiento aplicado (opcional)</label>
            <select v-model="diagnosticoForm.tratamientoAplicacionId">
              <option value="">Sin vincular</option>
              <option v-for="t in tratamientosDisponibles" :key="t.id" :value="t.id">
                {{ t.producto.nombre }} ({{ formatFecha(t.fecha) }})
              </option>
            </select>
          </div>
        </div>
        <div class="sanidad-view__field">
          <label>Condición</label>
          <input v-model="diagnosticoForm.condicion" placeholder="Mastitis" />
        </div>
        <button
          type="button"
          class="sanidad-view__submit"
          :disabled="savingDiagnostico || !diagnosticoForm.animalId || !diagnosticoForm.condicion"
          @click="guardarDiagnostico"
        >
          {{ savingDiagnostico ? 'Guardando…' : 'Guardar diagnóstico' }}
        </button>
      </SectionCard>

      <SectionCard title="Cuarentena">
        <div v-if="cuarentenaError" class="sanidad-view__error">{{ cuarentenaError }}</div>
        <div class="sanidad-view__form-grid" :class="{ 'sanidad-view__form-grid--mobile': isMobile }">
          <div class="sanidad-view__field">
            <label>Bovino</label>
            <select v-model="cuarentenaForm.animalId">
              <option value="" disabled>Seleccioná un animal</option>
              <option v-for="a in animalesActivos" :key="a.id" :value="a.id">{{ a.identificador }}</option>
            </select>
          </div>
          <div class="sanidad-view__field">
            <label>Fecha de inicio</label>
            <input v-model="cuarentenaForm.fechaInicio" type="date" />
          </div>
          <div class="sanidad-view__field">
            <label>Fin estimado (opcional)</label>
            <input v-model="cuarentenaForm.fechaFinEstimada" type="date" />
          </div>
        </div>
        <div class="sanidad-view__field">
          <label>Motivo</label>
          <input v-model="cuarentenaForm.motivo" placeholder="Sospecha de enfermedad respiratoria" />
        </div>
        <button
          type="button"
          class="sanidad-view__submit"
          :disabled="savingCuarentena || !cuarentenaForm.animalId || !cuarentenaForm.motivo"
          @click="guardarCuarentena"
        >
          {{ savingCuarentena ? 'Guardando…' : 'Iniciar cuarentena' }}
        </button>

        <div v-if="cuarentenasActivas.length > 0" class="sanidad-view__section">
          <div class="sanidad-view__heading">Cuarentenas activas</div>
          <div v-for="c in cuarentenasActivas" :key="c.id" class="sanidad-view__history-card">
            <div class="sanidad-view__history-top">
              <span class="sanidad-view__bold">{{ c.animal.identificador }}</span>
              <button
                type="button"
                class="sanidad-view__link-btn"
                :disabled="finalizandoId === c.id"
                @click="finalizarCuarentena(c)"
              >
                {{ finalizandoId === c.id ? 'Finalizando…' : 'Finalizar' }}
              </button>
            </div>
            <div class="sanidad-view__detail">{{ c.motivo }}</div>
            <div class="sanidad-view__muted">Desde {{ formatFecha(c.fechaInicio) }}</div>
          </div>
        </div>
      </SectionCard>
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

    &:disabled {
      opacity: 0.5;
      cursor: progress;
    }
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

  &__total-form-title {
    font-weight: 700;
    font-size: 0.8rem;
  }

  &__lote-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 220px;
    overflow-y: auto;
  }

  &__lote-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.8rem;
    cursor: pointer;
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
    padding-top: 0.85rem;
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
