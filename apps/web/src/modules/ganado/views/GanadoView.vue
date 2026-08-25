<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import { useAuthStore } from '../../../stores/auth.store';
import AppIcon from '../../../shared/components/AppIcon.vue';
import Pill from '../../../shared/components/Pill.vue';
import {
  ganadoApi,
  type Animal,
  type AnimalMovimiento,
  type EstadoAnimal,
  type MotivoBaja,
  type ResultadoImportacion,
  type SexoAnimal,
} from '../services/ganado.api';
import { potrerosApi, type Potrero } from '../../potreros/services/potreros.api';
import { reproduccionApi, type Servicio } from '../../reproduccion/services/reproduccion.api';
import { produccionApi, type RegistroGdp, type RegistroLeche } from '../../produccion/services/produccion.api';
import {
  sanidadApi,
  type AplicacionSanitaria,
  type Cuarentena,
  type DiagnosticoSanitario,
} from '../../sanidad/services/sanidad.api';

const { isMobile } = useBreakpoint();
const auth = useAuthStore();
const esVeterinario = computed(() => auth.rolActivo === 'VETERINARIO_EXTERNO');

const search = ref('');
const activeId = ref<string | null>(null);
const showForm = ref(false);
const editandoId = ref<string | null>(null);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref('');
const animales = ref<Animal[]>([]);
const potreros = ref<Potrero[]>([]);
// Catálogo liviano de todo el hato (no paginado) para los selectores de
// madre/padre — `animales` solo trae la página actual.
const catalogoAnimales = ref<Animal[]>([]);
const hembrasDisponibles = computed(() =>
  catalogoAnimales.value.filter((a) => a.sexo === 'HEMBRA' && a.id !== editandoId.value),
);
const machosDisponibles = computed(() =>
  catalogoAnimales.value.filter((a) => a.sexo === 'MACHO' && a.id !== editandoId.value),
);

const ESTADO_OPCIONES: EstadoAnimal[] = ['ACTIVO', 'VENDIDO', 'MUERTO', 'EN_TRANSITO', 'INACTIVO'];
const showFiltros = ref(false);
const filtros = ref({
  estado: '' as EstadoAnimal | '',
  sexo: '' as SexoAnimal | '',
  potreroActualId: '',
  edadMinAnios: '',
  edadMaxAnios: '',
});
const page = ref(1);
const limit = 20;
const total = ref(0);
const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / limit)));

function nombrePotrero(id: string | null): string {
  if (!id) return 'Sin asignar';
  return potreros.value.find((p) => p.id === id)?.nombre ?? 'Sin asignar';
}

function nombreProgenitor(id: string | null, refExterna: string | null): string {
  if (id) return catalogoAnimales.value.find((a) => a.id === id)?.identificador ?? '—';
  return refExterna ?? '—';
}

function formatEnum(valor: string): string {
  const texto = valor.replaceAll('_', ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const FICHA_TABS: { key: FichaTab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'reproduccion', label: 'Reproducción' },
  { key: 'produccion', label: 'Producción' },
  { key: 'sanidad', label: 'Sanidad' },
  { key: 'movimientos', label: 'Movimientos' },
];

const MOTIVO_BAJA_LABELS: Record<MotivoBaja, string> = {
  VENTA: 'Venta',
  MUERTE: 'Muerte',
  TRASLADO: 'Traslado',
  OTRO: 'Otro',
};

const ESTADO_LABELS: Record<string, string> = {
  ACTIVO: 'Activo',
  VENDIDO: 'Vendido',
  MUERTO: 'Muerto',
  EN_TRANSITO: 'En tránsito',
  INACTIVO: 'Inactivo',
};
const ESTADO_ATENCION = new Set(['EN_TRANSITO', 'INACTIVO']);

function estiloEstado(estado: string) {
  return ESTADO_ATENCION.has(estado)
    ? { pillBg: 'var(--color-warn-bg)', pillColor: 'var(--color-warn)' }
    : { pillBg: 'var(--color-neutral-bg)', pillColor: 'var(--color-primary)' };
}

function formatFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES');
}

const animalesEnCuarentena = ref<Set<string>>(new Set());

async function cargar() {
  loading.value = true;
  try {
    const [resp, potrerosResp, cuarentenasResp] = await Promise.all([
      ganadoApi.listar({
        page: page.value,
        limit,
        search: search.value || undefined,
        estado: filtros.value.estado || undefined,
        sexo: filtros.value.sexo || undefined,
        potreroActualId: filtros.value.potreroActualId || undefined,
        edadMinMeses: filtros.value.edadMinAnios ? Number(filtros.value.edadMinAnios) * 12 : undefined,
        edadMaxMeses: filtros.value.edadMaxAnios ? Number(filtros.value.edadMaxAnios) * 12 : undefined,
      }),
      potrerosApi.listar(),
      sanidadApi.listarCuarentenas({ activas: true }),
    ]);
    animales.value = resp.data;
    total.value = resp.total;
    potreros.value = potrerosResp.filter((p) => p.estado === 'ACTIVO');
    animalesEnCuarentena.value = new Set(cuarentenasResp.map((c) => c.animalId));
    if (!animales.value.some((a) => a.id === activeId.value)) {
      activeId.value = animales.value[0]?.id ?? null;
    }
  } finally {
    loading.value = false;
  }
}

async function cargarCatalogo() {
  const resp = await ganadoApi.listar({ limit: 200 });
  catalogoAnimales.value = resp.data;
}

onMounted(() => {
  cargar();
  cargarCatalogo();
});

let debounceHandle: ReturnType<typeof setTimeout> | undefined;
watch(search, () => {
  clearTimeout(debounceHandle);
  debounceHandle = setTimeout(() => {
    page.value = 1;
    cargar();
  }, 400);
});
onUnmounted(() => clearTimeout(debounceHandle));

watch(
  () => [filtros.value.estado, filtros.value.sexo, filtros.value.potreroActualId, filtros.value.edadMinAnios, filtros.value.edadMaxAnios],
  () => {
    page.value = 1;
    cargar();
  },
);

function irAPagina(nueva: number) {
  if (nueva < 1 || nueva > totalPaginas.value) return;
  page.value = nueva;
  cargar();
}

function limpiarFiltros() {
  filtros.value = { estado: '', sexo: '', potreroActualId: '', edadMinAnios: '', edadMaxAnios: '' };
}

const selected = computed(
  () => animales.value.find((a) => a.id === activeId.value) ?? animales.value[0],
);

function selectCow(id: string) {
  activeId.value = id;
}

function toggleAccordion(id: string) {
  activeId.value = activeId.value === id ? null : id;
}

const form = ref({
  identificador: '',
  sexo: 'HEMBRA' as SexoAnimal,
  raza: '',
  fechaNacimiento: '',
  madreId: '',
  padreId: '',
  padreRefExterna: '',
  madreRefExterna: '',
  potreroActualId: '',
});

function resetForm() {
  form.value = {
    identificador: '',
    sexo: 'HEMBRA',
    raza: '',
    fechaNacimiento: '',
    madreId: '',
    padreId: '',
    padreRefExterna: '',
    madreRefExterna: '',
    potreroActualId: '',
  };
}

function cancelarForm() {
  showForm.value = false;
  editandoId.value = null;
  errorMsg.value = '';
  resetForm();
}

function abrirEdicion(animal: Animal) {
  editandoId.value = animal.id;
  form.value = {
    identificador: animal.identificador,
    sexo: animal.sexo,
    raza: animal.raza ?? '',
    fechaNacimiento: animal.fechaNacimiento ? animal.fechaNacimiento.slice(0, 10) : '',
    madreId: animal.madreId ?? '',
    padreId: animal.padreId ?? '',
    padreRefExterna: animal.padreRefExterna ?? '',
    madreRefExterna: animal.madreRefExterna ?? '',
    potreroActualId: animal.potreroActualId ?? '',
  };
  errorMsg.value = '';
  showForm.value = true;
  mostrarBaja.value = false;
}

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    const payload = {
      identificador: form.value.identificador,
      especie: 'BOVINO' as const,
      sexo: form.value.sexo,
      raza: form.value.raza || undefined,
      fechaNacimiento: form.value.fechaNacimiento || undefined,
      madreId: form.value.madreId || undefined,
      padreId: form.value.padreId || undefined,
      padreRefExterna: form.value.padreId ? undefined : form.value.padreRefExterna || undefined,
      madreRefExterna: form.value.madreId ? undefined : form.value.madreRefExterna || undefined,
      potreroActualId: form.value.potreroActualId || undefined,
    };
    const guardado = editandoId.value
      ? await ganadoApi.actualizar(editandoId.value, payload)
      : await ganadoApi.crear(payload);
    showForm.value = false;
    editandoId.value = null;
    resetForm();
    await Promise.all([cargar(), cargarCatalogo()]);
    activeId.value = guardado.id;
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el animal.')
      : 'No se pudo guardar el animal.';
  } finally {
    saving.value = false;
  }
}

const mostrarBaja = ref(false);
const dandoBaja = ref(false);
const bajaError = ref('');
const mostrarConfirmarEventosPendientes = ref(false);
const bajaForm = ref({
  motivo: 'VENTA' as MotivoBaja,
  fecha: new Date().toISOString().slice(0, 10),
  observaciones: '',
});

function abrirBaja() {
  showForm.value = false;
  bajaForm.value = { motivo: 'VENTA', fecha: new Date().toISOString().slice(0, 10), observaciones: '' };
  bajaError.value = '';
  mostrarConfirmarEventosPendientes.value = false;
  mostrarBaja.value = true;
}

async function confirmarBaja(confirmarConEventosPendientes = false) {
  if (!selected.value) return;
  bajaError.value = '';
  dandoBaja.value = true;
  try {
    await ganadoApi.darBaja(selected.value.id, {
      motivo: bajaForm.value.motivo,
      fecha: bajaForm.value.fecha,
      observaciones: bajaForm.value.observaciones || undefined,
      confirmarConEventosPendientes,
    });
    mostrarBaja.value = false;
    await cargar();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      const data = error.response.data as { code?: string; message?: string };
      bajaError.value = data.message ?? 'Este animal tiene un evento reproductivo sin cerrar.';
      mostrarConfirmarEventosPendientes.value = data.code === 'EVENTOS_REPRODUCTIVOS_PENDIENTES';
    } else {
      bajaError.value = isAxiosError(error)
        ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo dar de baja al animal.')
        : 'No se pudo dar de baja al animal.';
    }
  } finally {
    dandoBaja.value = false;
  }
}

// --- Ficha consolidada: tabs de historial (US-3) ------------------------

type FichaTab = 'general' | 'reproduccion' | 'produccion' | 'sanidad' | 'movimientos';
const fichaTab = ref<FichaTab>('general');
const cargandoTab = ref(false);
const historialServicios = ref<Servicio[]>([]);
const historialLeche = ref<RegistroLeche[]>([]);
const historialPeso = ref<RegistroGdp[]>([]);
const historialSanidad = ref<AplicacionSanitaria[]>([]);
const historialDiagnosticos = ref<DiagnosticoSanitario[]>([]);
const historialCuarentenas = ref<Cuarentena[]>([]);
const historialMovimientos = ref<AnimalMovimiento[]>([]);
const tabsCargados = ref(new Set<string>());

watch(activeId, () => {
  fichaTab.value = 'general';
  tabsCargados.value = new Set();
});

async function abrirTab(tab: FichaTab) {
  fichaTab.value = tab;
  if (tab === 'general' || !selected.value) return;
  const clave = `${selected.value.id}:${tab}`;
  if (tabsCargados.value.has(clave)) return;

  cargandoTab.value = true;
  try {
    const animalId = selected.value.id;
    if (tab === 'reproduccion') historialServicios.value = await reproduccionApi.listarServicios(animalId);
    else if (tab === 'produccion') {
      const [leche, peso] = await Promise.all([
        produccionApi.listar(animalId),
        produccionApi.gdp(animalId),
      ]);
      historialLeche.value = leche;
      historialPeso.value = peso;
    } else if (tab === 'sanidad') {
      const [aplicaciones, diagnosticos, cuarentenas] = await Promise.all([
        sanidadApi.historialAnimal(animalId),
        sanidadApi.historialDiagnosticos(animalId),
        sanidadApi.listarCuarentenas({ animalId }),
      ]);
      historialSanidad.value = aplicaciones;
      historialDiagnosticos.value = diagnosticos;
      historialCuarentenas.value = cuarentenas;
    } else if (tab === 'movimientos') historialMovimientos.value = await ganadoApi.movimientosDeAnimal(animalId);
    tabsCargados.value.add(clave);
  } finally {
    cargandoTab.value = false;
  }
}

function irAFicha(animalId: string) {
  activeId.value = animalId;
}

// --- Mover animales entre potreros (US-5) --------------------------------

const modoSeleccion = ref(false);
const seleccionados = ref(new Set<string>());
const mostrarMover = ref(false);
const animalesAMover = ref<string[]>([]);
const moverForm = ref({ potreroDestinoId: '', fecha: new Date().toISOString().slice(0, 10) });
const moviendoAnimales = ref(false);
const moverError = ref('');
const mostrarConfirmarSobrecapacidad = ref(false);

function toggleSeleccion(id: string) {
  if (seleccionados.value.has(id)) seleccionados.value.delete(id);
  else seleccionados.value.add(id);
  // Forzar reactividad: Set mutado in-place no dispara refs automáticamente.
  seleccionados.value = new Set(seleccionados.value);
}

function abrirMover(ids: string[]) {
  if (ids.length === 0) return;
  animalesAMover.value = ids;
  moverForm.value = { potreroDestinoId: '', fecha: new Date().toISOString().slice(0, 10) };
  moverError.value = '';
  mostrarConfirmarSobrecapacidad.value = false;
  mostrarMover.value = true;
}

async function confirmarMover(confirmarSobrecapacidad = false) {
  moverError.value = '';
  moviendoAnimales.value = true;
  try {
    await ganadoApi.moverAnimales({
      animalIds: animalesAMover.value,
      potreroDestinoId: moverForm.value.potreroDestinoId,
      fecha: moverForm.value.fecha,
      confirmarSobrecapacidad,
    });
    mostrarMover.value = false;
    modoSeleccion.value = false;
    seleccionados.value = new Set();
    tabsCargados.value = new Set();
    await cargar();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      const data = error.response.data as { code?: string; message?: string };
      moverError.value = data.message ?? 'El potrero destino no tiene capacidad suficiente.';
      mostrarConfirmarSobrecapacidad.value = data.code === 'POTRERO_SOBRECARGADO';
    } else {
      moverError.value = isAxiosError(error)
        ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo mover el/los animal(es).')
        : 'No se pudo mover el/los animal(es).';
    }
  } finally {
    moviendoAnimales.value = false;
  }
}

// --- Importación masiva CSV (US-6) ---------------------------------------

const mostrarImportar = ref(false);
const archivoImportar = ref<File | null>(null);
const importando = ref(false);
const importarError = ref('');
const resultadoImportacion = ref<ResultadoImportacion | null>(null);

function onArchivoSeleccionado(event: Event) {
  const input = event.target as HTMLInputElement;
  archivoImportar.value = input.files?.[0] ?? null;
}

async function descargarPlantilla() {
  const blob = await ganadoApi.descargarPlantillaImportacion();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-ganado.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function subirImportacion() {
  if (!archivoImportar.value) return;
  importarError.value = '';
  importando.value = true;
  resultadoImportacion.value = null;
  try {
    resultadoImportacion.value = await ganadoApi.importar(archivoImportar.value);
    archivoImportar.value = null;
    await Promise.all([cargar(), cargarCatalogo()]);
  } catch (error) {
    importarError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo importar el archivo.')
      : 'No se pudo importar el archivo.';
  } finally {
    importando.value = false;
  }
}
</script>

<template>
  <div class="ganado-view">
    <div class="ganado-view__toolbar">
      <div v-if="isMobile" class="ganado-view__search-row">
        <input v-model="search" class="ganado-view__search" placeholder="Buscar por identificador…" />
        <button type="button" class="ganado-view__add-btn" @click="showFiltros = !showFiltros">
          <AppIcon name="filter" :size="16" />
        </button>
        <button
          v-if="!esVeterinario"
          type="button"
          class="ganado-view__add-btn"
          @click="showForm ? cancelarForm() : (showForm = true)"
        >
          <AppIcon name="plus" :size="18" />
        </button>
      </div>
      <template v-else>
        <button type="button" class="ganado-view__btn-ghost" @click="showFiltros = !showFiltros">
          {{ showFiltros ? 'Ocultar filtros' : 'Filtros' }}
        </button>
        <template v-if="!esVeterinario">
          <button
            type="button"
            class="ganado-view__btn-ghost"
            @click="modoSeleccion = !modoSeleccion; seleccionados = new Set()"
          >
            {{ modoSeleccion ? 'Cancelar selección' : 'Seleccionar varios' }}
          </button>
          <button type="button" class="ganado-view__btn-ghost" @click="mostrarImportar = !mostrarImportar">
            {{ mostrarImportar ? 'Cerrar importación' : 'Importar CSV' }}
          </button>
          <button
            type="button"
            class="ganado-view__new-btn"
            @click="showForm ? cancelarForm() : (showForm = true)"
          >
            {{ showForm ? 'Cerrar formulario' : 'Registrar nuevo bovino' }}
          </button>
        </template>
      </template>
    </div>

    <div v-if="modoSeleccion && seleccionados.size > 0" class="ganado-view__selection-bar">
      <span>{{ seleccionados.size }} animal(es) seleccionado(s)</span>
      <button type="button" class="ganado-view__btn-primary" @click="abrirMover(Array.from(seleccionados))">
        Mover a potrero
      </button>
    </div>

    <div v-if="mostrarImportar" class="ganado-view__form">
      <div class="ganado-view__form-title">Importar animales desde CSV</div>
      <div v-if="importarError" class="ganado-view__form-error">{{ importarError }}</div>
      <div v-if="resultadoImportacion" class="ganado-view__import-result">
        <strong>{{ resultadoImportacion.creados }}</strong> animal(es) creado(s).
        <template v-if="resultadoImportacion.errores.length > 0">
          {{ resultadoImportacion.errores.length }} fila(s) rechazada(s):
          <ul>
            <li v-for="(e, i) in resultadoImportacion.errores" :key="i">Fila {{ e.fila }}: {{ e.motivo }}</li>
          </ul>
        </template>
      </div>
      <button type="button" class="ganado-view__link-btn" @click="descargarPlantilla">
        Descargar plantilla CSV
      </button>
      <input type="file" accept=".csv" @change="onArchivoSeleccionado" />
      <div class="ganado-view__form-actions">
        <button
          type="button"
          class="ganado-view__btn-primary"
          :disabled="importando || !archivoImportar"
          @click="subirImportacion"
        >
          {{ importando ? 'Importando…' : 'Importar' }}
        </button>
      </div>
    </div>

    <div v-if="mostrarMover" class="ganado-view__form">
      <div class="ganado-view__form-title">
        Mover {{ animalesAMover.length > 1 ? `${animalesAMover.length} animales` : 'animal' }} a otro potrero
      </div>
      <div v-if="moverError" class="ganado-view__form-error">
        {{ moverError }}
        <button
          v-if="mostrarConfirmarSobrecapacidad"
          type="button"
          class="ganado-view__confirm-btn"
          :disabled="moviendoAnimales"
          @click="confirmarMover(true)"
        >
          Confirmar de todas formas
        </button>
      </div>
      <div class="ganado-view__form-grid">
        <div class="ganado-view__field">
          <label>Potrero destino</label>
          <select v-model="moverForm.potreroDestinoId">
            <option value="" disabled>Seleccioná un potrero</option>
            <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Fecha</label>
          <input v-model="moverForm.fecha" type="date" />
        </div>
      </div>
      <div class="ganado-view__form-actions">
        <button type="button" class="ganado-view__btn-ghost" @click="mostrarMover = false">Cancelar</button>
        <button
          type="button"
          class="ganado-view__btn-primary"
          :disabled="moviendoAnimales || !moverForm.potreroDestinoId"
          @click="confirmarMover()"
        >
          {{ moviendoAnimales ? 'Moviendo…' : 'Confirmar movimiento' }}
        </button>
      </div>
    </div>

    <div v-if="showFiltros" class="ganado-view__form">
      <div class="ganado-view__form-grid">
        <div class="ganado-view__field">
          <label>Estado</label>
          <select v-model="filtros.estado">
            <option value="">Todos</option>
            <option v-for="e in ESTADO_OPCIONES" :key="e" :value="e">{{ ESTADO_LABELS[e] }}</option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Sexo</label>
          <select v-model="filtros.sexo">
            <option value="">Todos</option>
            <option value="HEMBRA">Hembra</option>
            <option value="MACHO">Macho</option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Potrero</label>
          <select v-model="filtros.potreroActualId">
            <option value="">Todos</option>
            <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Edad mínima (años)</label>
          <input v-model="filtros.edadMinAnios" type="number" min="0" step="0.5" placeholder="0" />
        </div>
        <div class="ganado-view__field">
          <label>Edad máxima (años)</label>
          <input v-model="filtros.edadMaxAnios" type="number" min="0" step="0.5" placeholder="10" />
        </div>
      </div>
      <div class="ganado-view__form-actions">
        <button type="button" class="ganado-view__btn-ghost" @click="limpiarFiltros">Limpiar filtros</button>
      </div>
    </div>

    <div v-if="showForm" class="ganado-view__form">
      <div class="ganado-view__form-title">
        {{ editandoId ? 'Editar bovino' : 'Registrar nuevo bovino' }}
      </div>
      <div v-if="errorMsg" class="ganado-view__form-error">{{ errorMsg }}</div>
      <div class="ganado-view__form-grid">
        <div class="ganado-view__field">
          <label>Identificador (arete/RFID)</label>
          <input v-model="form.identificador" placeholder="004829" />
        </div>
        <div class="ganado-view__field">
          <label>Sexo</label>
          <select v-model="form.sexo">
            <option value="HEMBRA">Hembra</option>
            <option value="MACHO">Macho</option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Raza</label>
          <input v-model="form.raza" placeholder="Holstein" />
        </div>
        <div class="ganado-view__field">
          <label>Fecha de nacimiento</label>
          <input v-model="form.fechaNacimiento" type="date" />
        </div>
        <div class="ganado-view__field">
          <label>Padre (si está en el sistema)</label>
          <select v-model="form.padreId">
            <option value="">No está en el sistema</option>
            <option v-for="m in machosDisponibles" :key="m.id" :value="m.id">{{ m.identificador }}</option>
          </select>
          <input v-if="!form.padreId" v-model="form.padreRefExterna" placeholder="Toro Max (referencia externa)" />
        </div>
        <div class="ganado-view__field">
          <label>Madre (si está en el sistema)</label>
          <select v-model="form.madreId">
            <option value="">No está en el sistema</option>
            <option v-for="h in hembrasDisponibles" :key="h.id" :value="h.id">{{ h.identificador }}</option>
          </select>
          <input v-if="!form.madreId" v-model="form.madreRefExterna" placeholder="Bonita (referencia externa)" />
        </div>
        <div class="ganado-view__field">
          <label>Potrero actual</label>
          <select v-model="form.potreroActualId">
            <option value="">Sin asignar</option>
            <option v-for="p in potreros" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </div>
      </div>
      <div class="ganado-view__form-actions">
        <button type="button" class="ganado-view__btn-ghost" @click="cancelarForm">Cancelar</button>
        <button
          type="button"
          class="ganado-view__btn-primary"
          :disabled="saving || !form.identificador"
          @click="guardar"
        >
          {{ saving ? 'Guardando…' : editandoId ? 'Guardar cambios' : 'Guardar bovino' }}
        </button>
      </div>
    </div>

    <div v-if="mostrarBaja && selected" class="ganado-view__form">
      <div class="ganado-view__form-title">Dar de baja a {{ selected.identificador }}</div>
      <div v-if="bajaError" class="ganado-view__form-error">
        {{ bajaError }}
        <button
          v-if="mostrarConfirmarEventosPendientes"
          type="button"
          class="ganado-view__confirm-btn"
          :disabled="dandoBaja"
          @click="confirmarBaja(true)"
        >
          Confirmar de todas formas
        </button>
      </div>
      <div class="ganado-view__form-grid">
        <div class="ganado-view__field">
          <label>Motivo</label>
          <select v-model="bajaForm.motivo">
            <option v-for="(label, valor) in MOTIVO_BAJA_LABELS" :key="valor" :value="valor">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="ganado-view__field">
          <label>Fecha</label>
          <input v-model="bajaForm.fecha" type="date" />
        </div>
        <div class="ganado-view__field">
          <label>Observaciones</label>
          <input v-model="bajaForm.observaciones" placeholder="Opcional" />
        </div>
      </div>
      <div class="ganado-view__form-actions">
        <button type="button" class="ganado-view__btn-ghost" @click="mostrarBaja = false">
          Cancelar
        </button>
        <button
          type="button"
          class="ganado-view__btn-primary"
          :disabled="dandoBaja"
          @click="confirmarBaja()"
        >
          {{ dandoBaja ? 'Guardando…' : 'Confirmar baja' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="ganado-view__empty">Cargando…</div>
    <div v-else-if="animales.length === 0" class="ganado-view__empty">
      Todavía no hay animales registrados en este negocio.
    </div>

    <!-- Mobile: acordeón -->
    <div v-else-if="isMobile" class="ganado-view__accordion">
      <div v-for="c in animales" :key="c.id" class="ganado-view__acc-item">
        <button type="button" class="ganado-view__acc-head" @click="toggleAccordion(c.id)">
          <div>
            <div class="ganado-view__acc-name">
              {{ c.identificador }}
              <Pill v-if="animalesEnCuarentena.has(c.id)" bg="var(--color-warn-bg)" color="var(--color-warn)">
                En cuarentena
              </Pill>
            </div>
            <div class="ganado-view__acc-meta">{{ c.raza ?? 'Raza sin registrar' }}</div>
          </div>
          <span
            class="ganado-view__status"
            :style="estiloEstado(c.estado)"
          >
            {{ ESTADO_LABELS[c.estado] }}
          </span>
        </button>
        <div v-if="activeId === c.id" class="ganado-view__acc-body">
          <div class="ganado-view__acc-photo-row">
            <div class="ganado-view__photo ganado-view__photo--sm">
              <AppIcon name="cow" :size="22" />
            </div>
            <div>
              <div class="ganado-view__acc-birth">
                Nacida {{ formatFecha(c.fechaNacimiento) }} · {{ nombrePotrero(c.potreroActualId) }}
              </div>
              <div class="ganado-view__acc-avg">{{ c.categoria ?? 'Categoría sin calcular' }}</div>
            </div>
          </div>
          <div class="ganado-view__acc-stats">
            <div class="ganado-view__stat">
              <div class="ganado-view__stat-label">Padre</div>
              <div class="ganado-view__stat-value">{{ nombreProgenitor(c.padreId, c.padreRefExterna) }}</div>
            </div>
            <div class="ganado-view__stat">
              <div class="ganado-view__stat-label">Madre</div>
              <div class="ganado-view__stat-value">{{ nombreProgenitor(c.madreId, c.madreRefExterna) }}</div>
            </div>
          </div>
          <div v-if="!esVeterinario" class="ganado-view__detail-actions">
            <button type="button" class="ganado-view__btn-ghost" @click="abrirEdicion(c)">
              Editar
            </button>
            <button
              v-if="c.estado === 'ACTIVO'"
              type="button"
              class="ganado-view__btn-ghost"
              @click="abrirMover([c.id])"
            >
              Mover
            </button>
            <button
              v-if="c.estado === 'ACTIVO'"
              type="button"
              class="ganado-view__btn-ghost"
              @click="activeId = c.id; abrirBaja()"
            >
              Dar de baja
            </button>
          </div>
        </div>
      </div>
      <div v-if="totalPaginas > 1" class="ganado-view__pagination">
        <button type="button" class="ganado-view__btn-ghost" :disabled="page === 1" @click="irAPagina(page - 1)">
          Anterior
        </button>
        <span class="ganado-view__muted">Página {{ page }} de {{ totalPaginas }}</span>
        <button
          type="button"
          class="ganado-view__btn-ghost"
          :disabled="page === totalPaginas"
          @click="irAPagina(page + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>

    <!-- Desktop: lista + detalle -->
    <div v-else class="ganado-view__columns">
      <div class="ganado-view__list">
        <input v-model="search" class="ganado-view__search" placeholder="Buscar por identificador…" />
        <div class="ganado-view__list-items">
          <button
            v-for="c in animales"
            :key="c.id"
            type="button"
            class="ganado-view__list-item"
            :class="{ 'ganado-view__list-item--active': c.id === activeId }"
            @click="modoSeleccion && c.estado === 'ACTIVO' ? toggleSeleccion(c.id) : selectCow(c.id)"
          >
            <input
              v-if="modoSeleccion"
              type="checkbox"
              :checked="seleccionados.has(c.id)"
              :disabled="c.estado !== 'ACTIVO'"
              @click.stop="c.estado === 'ACTIVO' && toggleSeleccion(c.id)"
            />
            <div>
              <div class="ganado-view__acc-name">
                {{ c.identificador }}
                <Pill v-if="animalesEnCuarentena.has(c.id)" bg="var(--color-warn-bg)" color="var(--color-warn)">
                  En cuarentena
                </Pill>
              </div>
              <div class="ganado-view__acc-meta">{{ c.raza ?? 'Raza sin registrar' }}</div>
            </div>
            <span class="ganado-view__status" :style="estiloEstado(c.estado)">
              {{ ESTADO_LABELS[c.estado] }}
            </span>
          </button>
        </div>
        <div v-if="totalPaginas > 1" class="ganado-view__pagination">
          <button type="button" class="ganado-view__btn-ghost" :disabled="page === 1" @click="irAPagina(page - 1)">
            Anterior
          </button>
          <span class="ganado-view__muted">{{ page }}/{{ totalPaginas }}</span>
          <button
            type="button"
            class="ganado-view__btn-ghost"
            :disabled="page === totalPaginas"
            @click="irAPagina(page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div v-if="selected" class="ganado-view__detail">
        <div class="ganado-view__detail-head">
          <div class="ganado-view__photo">
            <AppIcon name="cow" :size="36" />
          </div>
          <div class="ganado-view__detail-info">
            <div class="ganado-view__detail-title-row">
              <h2>{{ selected.identificador }}</h2>
              <span class="ganado-view__status" :style="estiloEstado(selected.estado)">
                {{ ESTADO_LABELS[selected.estado] }}
              </span>
              <Pill v-if="animalesEnCuarentena.has(selected.id)" bg="var(--color-warn-bg)" color="var(--color-warn)">
                En cuarentena
              </Pill>
            </div>
            <div class="ganado-view__detail-line">
              {{ selected.raza ?? 'Raza sin registrar' }} · Nacida {{ formatFecha(selected.fechaNacimiento) }}
            </div>
            <div class="ganado-view__detail-line">
              Potrero actual: {{ nombrePotrero(selected.potreroActualId) }}
            </div>
            <div v-if="!esVeterinario" class="ganado-view__detail-actions">
              <button type="button" class="ganado-view__btn-ghost" @click="abrirEdicion(selected)">
                Editar
              </button>
              <button
                v-if="selected.estado === 'ACTIVO'"
                type="button"
                class="ganado-view__btn-ghost"
                @click="abrirMover([selected.id])"
              >
                Mover de potrero
              </button>
              <button
                v-if="selected.estado === 'ACTIVO'"
                type="button"
                class="ganado-view__btn-ghost"
                @click="abrirBaja"
              >
                Dar de baja
              </button>
            </div>
          </div>
        </div>

        <div class="ganado-view__stats-grid">
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Categoría</div>
            <div class="ganado-view__stat-value ganado-view__stat-value--lg">
              {{ selected.categoria ?? '—' }}
            </div>
          </div>
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Padre</div>
            <button
              v-if="selected.padreId"
              type="button"
              class="ganado-view__stat-link"
              @click="irAFicha(selected.padreId)"
            >
              {{ nombreProgenitor(selected.padreId, selected.padreRefExterna) }}
            </button>
            <div v-else class="ganado-view__stat-value">{{ selected.padreRefExterna ?? '—' }}</div>
          </div>
          <div class="ganado-view__stat">
            <div class="ganado-view__stat-label">Madre</div>
            <button
              v-if="selected.madreId"
              type="button"
              class="ganado-view__stat-link"
              @click="irAFicha(selected.madreId)"
            >
              {{ nombreProgenitor(selected.madreId, selected.madreRefExterna) }}
            </button>
            <div v-else class="ganado-view__stat-value">{{ selected.madreRefExterna ?? '—' }}</div>
          </div>
        </div>

        <div>
          <div class="ganado-view__ficha-tabs">
            <button
              v-for="t in FICHA_TABS"
              :key="t.key"
              type="button"
              class="ganado-view__ficha-tab"
              :class="{ 'ganado-view__ficha-tab--active': fichaTab === t.key }"
              @click="abrirTab(t.key)"
            >
              {{ t.label }}
            </button>
          </div>

          <div v-if="fichaTab === 'general'" class="ganado-view__history-empty">
            Elegí una pestaña para ver el historial reproductivo, de producción, sanitario o de movimientos de
            {{ selected.identificador }}.
          </div>

          <div v-else-if="cargandoTab" class="ganado-view__muted">Cargando…</div>

          <template v-else>
            <div v-if="fichaTab === 'reproduccion'">
              <div v-if="historialServicios.length === 0" class="ganado-view__history-empty">
                Sin eventos reproductivos registrados.
              </div>
              <div v-for="s in historialServicios" :key="s.id" class="ganado-view__hist-row">
                <span class="ganado-view__muted">{{ formatFecha(s.fecha) }}</span>
                <span>{{ formatEnum(s.tipo) }}</span>
                <span>{{ formatEnum(s.estado) }}</span>
              </div>
            </div>

            <div v-else-if="fichaTab === 'produccion'">
              <div v-if="historialLeche.length === 0" class="ganado-view__history-empty">
                Sin registros de producción de leche.
              </div>
              <div v-for="r in historialLeche" :key="r.id" class="ganado-view__hist-row">
                <span class="ganado-view__muted">{{ formatFecha(r.fecha) }}</span>
                <span>{{ formatEnum(r.turno) }}</span>
                <span>{{ r.litros }} L</span>
              </div>

              <div class="ganado-view__hist-subheading">Pesajes</div>
              <div v-if="historialPeso.length === 0" class="ganado-view__history-empty">
                Sin pesajes registrados.
              </div>
              <div v-for="p in historialPeso" :key="p.id" class="ganado-view__hist-row">
                <span class="ganado-view__muted">{{ formatFecha(p.fecha) }}</span>
                <span>{{ p.pesoKg }} kg</span>
                <span>{{ p.gdpKgDia === null ? '—' : `${p.gdpKgDia.toFixed(1)} kg/día` }}</span>
              </div>
            </div>

            <div v-else-if="fichaTab === 'sanidad'">
              <div v-if="historialSanidad.length === 0" class="ganado-view__history-empty">
                Sin registros sanitarios.
              </div>
              <div v-for="a in historialSanidad" :key="a.id" class="ganado-view__hist-row">
                <span class="ganado-view__muted">{{ formatFecha(a.fecha) }}</span>
                <span>{{ a.producto.nombre }}</span>
                <span>{{ a.dosisAplicada ?? '—' }}</span>
              </div>

              <div class="ganado-view__hist-subheading">Diagnósticos</div>
              <div v-if="historialDiagnosticos.length === 0" class="ganado-view__history-empty">
                Sin diagnósticos registrados.
              </div>
              <div v-for="d in historialDiagnosticos" :key="d.id" class="ganado-view__hist-row">
                <span class="ganado-view__muted">{{ formatFecha(d.fecha) }}</span>
                <span>{{ d.condicion }}</span>
                <span>{{ formatEnum(d.gravedad) }}</span>
              </div>

              <div class="ganado-view__hist-subheading">Cuarentenas</div>
              <div v-if="historialCuarentenas.length === 0" class="ganado-view__history-empty">
                Sin cuarentenas registradas.
              </div>
              <div v-for="c in historialCuarentenas" :key="c.id" class="ganado-view__hist-row">
                <span class="ganado-view__muted">{{ formatFecha(c.fechaInicio) }}</span>
                <span>{{ c.motivo }}</span>
                <span>{{ c.activa ? 'Activa' : 'Finalizada' }}</span>
              </div>
            </div>

            <div v-else-if="fichaTab === 'movimientos'">
              <div v-if="historialMovimientos.length === 0" class="ganado-view__history-empty">
                Sin movimientos entre potreros registrados.
              </div>
              <div v-for="m in historialMovimientos" :key="m.id" class="ganado-view__hist-row">
                <span class="ganado-view__muted">{{ formatFecha(m.fecha) }}</span>
                <span>{{ m.potreroOrigen?.nombre ?? 'Sin potrero' }}</span>
                <span>→ {{ m.potreroDestino.nombre }}</span>
              </div>
            </div>
          </template>
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

  &__form-error {
    background: var(--color-warn-bg);
    color: var(--color-warn);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  &__confirm-btn {
    background: var(--color-warn);
    color: var(--color-white);
    border: none;
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    font-weight: 700;
    font-size: 0.72rem;
    cursor: pointer;
    font-family: inherit;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.85rem;
    padding-top: 0.4rem;

    .ganado-view__btn-ghost {
      padding: 0.45rem 0.9rem;
      font-size: 0.72rem;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  &__muted {
    font-size: 0.75rem;
    color: rgba(40, 54, 24, 0.55);
    font-weight: 600;
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

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__empty {
    background: var(--color-white);
    border-radius: 1.25rem;
    padding: 2rem;
    box-shadow: var(--shadow-card);
    text-align: center;
    color: rgba(40, 54, 24, 0.6);
    font-size: 0.85rem;
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

  &__detail-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.6rem;

    .ganado-view__btn-ghost {
      padding: 0.5rem 0.9rem;
      font-size: 0.75rem;
    }
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

  &__history-empty {
    font-size: 0.8rem;
    color: rgba(40, 54, 24, 0.55);
    padding: 0.6rem 0;
    border-top: 1px solid #f2efdd;
  }

  &__hist-subheading {
    font-weight: 700;
    font-size: 0.78rem;
    margin-top: 0.85rem;
    padding-top: 0.6rem;
    border-top: 1px solid #f2efdd;
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

  &__selection-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: var(--color-white);
    border-radius: 1rem;
    padding: 0.75rem 1rem;
    box-shadow: var(--shadow-card);
    font-size: 0.82rem;
    font-weight: 700;
  }

  &__import-result {
    background: var(--color-neutral-bg);
    color: var(--color-primary);
    border-radius: 12px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;

    ul {
      margin: 0.4rem 0 0;
      padding-left: 1.2rem;
    }
  }

  &__link-btn {
    background: var(--color-neutral-bg);
    border: 1.5px solid var(--color-primary);
    border-radius: 999px;
    color: var(--color-primary);
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.4rem 0.9rem;
    font-family: inherit;
    align-self: flex-start;
  }

  &__stat-link {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-primary);
    font-size: 0.85rem;
    font-weight: 700;
    margin-top: 0.25rem;
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
    text-align: left;
  }

  &__ficha-tabs {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }

  &__ficha-tab {
    background: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.4rem 0.85rem;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    color: rgba(40, 54, 24, 0.65);

    &--active {
      background: var(--color-primary);
      color: var(--color-bg);
    }
  }

  &__hist-row {
    display: grid;
    grid-template-columns: 90px 1fr 1fr;
    gap: 0.6rem;
    padding: 0.6rem 0.2rem;
    border-top: 1px solid #f2efdd;
    font-size: 0.8rem;
    align-items: center;

    &:first-of-type {
      border-top: none;
    }
  }
}
</style>
