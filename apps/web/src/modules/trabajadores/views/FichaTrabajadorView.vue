<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useRoute, useRouter } from 'vue-router';
import { formatFecha } from '../../../shared/utils/fecha';
import SectionCard from '../../../shared/components/SectionCard.vue';
import Pill from '../../../shared/components/Pill.vue';
import { useAuthStore } from '../../../stores/auth.store';
import { potrerosApi, type Potrero } from '../../potreros/services/potreros.api';
import {
  trabajadoresApi,
  type ActualizarTrabajadorPayload,
  type Adelanto,
  type Asignacion,
  type Asistencia,
  type Cargo,
  type ConfirmarPagoPayload,
  type CrearAbonoPrestamoPayload,
  type CrearAsignacionPayload,
  type CrearAsistenciaPayload,
  type EstadoAsistencia,
  type ModalidadPago,
  type MonedaTrabajador,
  type Pago,
  type Prestamo,
  type PrevisualizacionPago,
  type TipoContratacion,
  type TipoPago,
  type TrabajadorConAntiguedad,
} from '../services/trabajadores.api';

type FichaTab = 'general' | 'asignaciones' | 'asistencia' | 'adelantos' | 'prestamos' | 'pagos';
const FICHA_TABS: { key: FichaTab; label: string }[] = [
  { key: 'general', label: 'Información general' },
  { key: 'asignaciones', label: 'Asignaciones' },
  { key: 'asistencia', label: 'Asistencia' },
  { key: 'adelantos', label: 'Adelantos' },
  { key: 'prestamos', label: 'Préstamos' },
  { key: 'pagos', label: 'Pagos' },
];

const TIPO_PAGO_LABELS: Record<TipoPago, string> = {
  SALARIO: 'Salario',
  JORNAL: 'Jornal',
  POR_ACTIVIDAD: 'Por actividad',
  BONO: 'Bono',
  COMISION: 'Comisión',
  OTRO: 'Otro',
};

const MONEDA_LABELS: Record<MonedaTrabajador, string> = { USD: 'USD', VES: 'VES' };

const ESTADO_ASISTENCIA_LABELS: Record<EstadoAsistencia, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  PERMISO: 'Permiso',
  VACACIONES: 'Vacaciones',
  FALTA_JUSTIFICADA: 'Falta justificada',
  FALTA_INJUSTIFICADA: 'Falta injustificada',
};

const TIPO_CONTRATACION_LABELS: Record<TipoContratacion, string> = {
  MENSUAL: 'Mensual',
  JORNAL: 'Jornal',
  POR_ACTIVIDAD: 'Por actividad',
  TEMPORAL: 'Temporal',
  OTRO: 'Otro',
};

const MODALIDAD_PAGO_LABELS: Record<ModalidadPago, string> = {
  MENSUAL: 'Mensual',
  SEMANAL: 'Semanal',
  QUINCENAL: 'Quincenal',
  DIARIO: 'Diario',
  POR_ACTIVIDAD: 'Por actividad',
};

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const id = String(route.params.id);

const esAdmin = computed(() => auth.rolActivo === 'ADMIN_NEGOCIO');

const loading = ref(true);
const trabajador = ref<TrabajadorConAntiguedad | null>(null);
const cargos = ref<Cargo[]>([]);
const potrerosActivos = ref<Potrero[]>([]);
const asignaciones = ref<Asignacion[]>([]);
const asistencias = ref<Asistencia[]>([]);
const adelantos = ref<Adelanto[]>([]);
const prestamos = ref<Prestamo[]>([]);
const pagos = ref<Pago[]>([]);

const editando = ref(false);
const form = ref<ActualizarTrabajadorPayload>({});
const saving = ref(false);
const errorMsg = ref('');
const cambiandoEstado = ref(false);

const fichaTab = ref<FichaTab>('general');

async function cargar() {
  loading.value = true;
  try {
    const [
      trabajadorResp,
      cargosResp,
      potrerosResp,
      asignacionesResp,
      asistenciasResp,
      adelantosResp,
      prestamosResp,
      pagosResp,
    ] = await Promise.all([
      trabajadoresApi.obtener(id),
      trabajadoresApi.listarCargos(),
      potrerosApi.listar(),
      trabajadoresApi.listarAsignaciones(id),
      trabajadoresApi.listarAsistencias(id),
      trabajadoresApi.listarAdelantos(id),
      trabajadoresApi.listarPrestamos(id),
      trabajadoresApi.listarPagos(id),
    ]);
    trabajador.value = trabajadorResp;
    cargos.value = cargosResp;
    potrerosActivos.value = potrerosResp.filter((p) => p.estado === 'ACTIVO');
    asignaciones.value = asignacionesResp;
    asistencias.value = asistenciasResp;
    adelantos.value = adelantosResp;
    prestamos.value = prestamosResp;
    pagos.value = pagosResp;
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

const asignacionVigente = computed(() => asignaciones.value.find((a) => a.estado === 'VIGENTE') ?? null);
const asignacionesHistorial = computed(() => asignaciones.value.filter((a) => a.estado === 'FINALIZADA'));

function abrirEdicion() {
  if (!trabajador.value) return;
  const t = trabajador.value;
  form.value = {
    nombres: t.nombres,
    apellidos: t.apellidos,
    documento: t.documento,
    cargoId: t.cargoId,
    fechaIngreso: t.fechaIngreso.slice(0, 10),
    tipoContratacion: t.tipoContratacion,
    modalidadPago: t.modalidadPago,
    salarioOJornal: Number(t.salarioOJornal),
    fechaNacimiento: t.fechaNacimiento?.slice(0, 10) ?? '',
    telefono: t.telefono ?? '',
    email: t.email ?? '',
    direccion: t.direccion ?? '',
    contactoEmergenciaNombre: t.contactoEmergenciaNombre ?? '',
    contactoEmergenciaTelefono: t.contactoEmergenciaTelefono ?? '',
  };
  errorMsg.value = '';
  editando.value = true;
}

async function guardar() {
  errorMsg.value = '';
  saving.value = true;
  try {
    await trabajadoresApi.actualizar(id, {
      ...form.value,
      salarioOJornal: form.value.salarioOJornal !== undefined ? Number(form.value.salarioOJornal) : undefined,
      fechaNacimiento: form.value.fechaNacimiento || undefined,
      telefono: form.value.telefono || undefined,
      email: form.value.email || undefined,
      direccion: form.value.direccion || undefined,
      contactoEmergenciaNombre: form.value.contactoEmergenciaNombre || undefined,
      contactoEmergenciaTelefono: form.value.contactoEmergenciaTelefono || undefined,
    });
    editando.value = false;
    await cargar();
  } catch (error) {
    errorMsg.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el trabajador.')
      : 'No se pudo guardar el trabajador.';
  } finally {
    saving.value = false;
  }
}

async function toggleEstado() {
  if (!trabajador.value) return;
  cambiandoEstado.value = true;
  try {
    if (trabajador.value.estado === 'ACTIVO') {
      await trabajadoresApi.inactivar(id);
    } else {
      await trabajadoresApi.activar(id);
    }
    await cargar();
  } finally {
    cambiandoEstado.value = false;
  }
}

function formatAntiguedad(a: { anios: number; meses: number }): string {
  const partes: string[] = [];
  if (a.anios > 0) partes.push(`${a.anios} año${a.anios === 1 ? '' : 's'}`);
  partes.push(`${a.meses} mes${a.meses === 1 ? '' : 'es'}`);
  return partes.join(', ');
}

// --- Asignaciones ----------------------------------------------------------

const showAsignacionForm = ref(false);
const asignacionForm = ref<CrearAsignacionPayload>({
  cargoId: '',
  potreroId: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: '',
  observaciones: '',
});
const savingAsignacion = ref(false);
const asignacionError = ref('');
const finalizandoId = ref<string | null>(null);

function resetAsignacionForm() {
  asignacionForm.value = {
    cargoId: '',
    potreroId: '',
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: '',
    observaciones: '',
  };
}

async function guardarAsignacion() {
  asignacionError.value = '';
  savingAsignacion.value = true;
  try {
    await trabajadoresApi.crearAsignacion(id, {
      cargoId: asignacionForm.value.cargoId || undefined,
      potreroId: asignacionForm.value.potreroId || undefined,
      fechaInicio: asignacionForm.value.fechaInicio,
      fechaFin: asignacionForm.value.fechaFin || undefined,
      observaciones: asignacionForm.value.observaciones || undefined,
    });
    resetAsignacionForm();
    showAsignacionForm.value = false;
    await cargar();
  } catch (error) {
    asignacionError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar la asignación.')
      : 'No se pudo guardar la asignación.';
  } finally {
    savingAsignacion.value = false;
  }
}

async function finalizarAsignacion(asignacionId: string) {
  finalizandoId.value = asignacionId;
  try {
    await trabajadoresApi.finalizarAsignacion(asignacionId);
    await cargar();
  } finally {
    finalizandoId.value = null;
  }
}

// --- Asistencia --------------------------------------------------------

const showAsistenciaForm = ref(false);
const asistenciaForm = ref({
  fecha: new Date().toISOString().slice(0, 10),
  estado: 'PRESENTE' as EstadoAsistencia,
  horaEntrada: '',
  horaSalida: '',
  jornalRealizado: '',
  observaciones: '',
});
const savingAsistencia = ref(false);
const asistenciaError = ref('');
const asistenciaDuplicada = ref(false);

function resetAsistenciaForm() {
  asistenciaForm.value = {
    fecha: new Date().toISOString().slice(0, 10),
    estado: 'PRESENTE',
    horaEntrada: '',
    horaSalida: '',
    jornalRealizado: '',
    observaciones: '',
  };
}

async function guardarAsistencia(confirmar = false) {
  asistenciaError.value = '';
  savingAsistencia.value = true;
  const payload: CrearAsistenciaPayload = {
    fecha: asistenciaForm.value.fecha,
    estado: asistenciaForm.value.estado,
    horaEntrada: asistenciaForm.value.horaEntrada || undefined,
    horaSalida: asistenciaForm.value.horaSalida || undefined,
    jornalRealizado: asistenciaForm.value.jornalRealizado ? Number(asistenciaForm.value.jornalRealizado) : undefined,
    observaciones: asistenciaForm.value.observaciones || undefined,
    confirmar,
  };
  try {
    await trabajadoresApi.crearAsistencia(id, payload);
    resetAsistenciaForm();
    asistenciaDuplicada.value = false;
    showAsistenciaForm.value = false;
    await cargar();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      asistenciaDuplicada.value = true;
    }
    asistenciaError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar la asistencia.')
      : 'No se pudo guardar la asistencia.';
  } finally {
    savingAsistencia.value = false;
  }
}

// --- Adelantos -----------------------------------------------------------

const showAdelantoForm = ref(false);
const adelantoForm = ref({
  fecha: new Date().toISOString().slice(0, 10),
  monto: '',
  moneda: 'USD' as MonedaTrabajador,
  tasaCambio: '',
  motivo: '',
  metodoEntrega: '',
  observaciones: '',
});
const savingAdelanto = ref(false);
const adelantoError = ref('');

function resetAdelantoForm() {
  adelantoForm.value = {
    fecha: new Date().toISOString().slice(0, 10),
    monto: '',
    moneda: 'USD',
    tasaCambio: '',
    motivo: '',
    metodoEntrega: '',
    observaciones: '',
  };
}

async function guardarAdelanto() {
  adelantoError.value = '';
  savingAdelanto.value = true;
  try {
    await trabajadoresApi.crearAdelanto(id, {
      fecha: adelantoForm.value.fecha,
      monto: Number(adelantoForm.value.monto),
      moneda: adelantoForm.value.moneda,
      tasaCambio: adelantoForm.value.tasaCambio ? Number(adelantoForm.value.tasaCambio) : undefined,
      motivo: adelantoForm.value.motivo,
      metodoEntrega: adelantoForm.value.metodoEntrega || undefined,
      observaciones: adelantoForm.value.observaciones || undefined,
    });
    resetAdelantoForm();
    showAdelantoForm.value = false;
    await cargar();
  } catch (error) {
    adelantoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el adelanto.')
      : 'No se pudo guardar el adelanto.';
  } finally {
    savingAdelanto.value = false;
  }
}

// --- Préstamos -------------------------------------------------------------

const showPrestamoForm = ref(false);
const prestamoForm = ref({
  fecha: new Date().toISOString().slice(0, 10),
  montoOriginal: '',
  moneda: 'USD' as MonedaTrabajador,
  tasaCambio: '',
  numeroCuotas: '',
  valorCuota: '',
  fechaInicio: new Date().toISOString().slice(0, 10),
  observaciones: '',
});
const savingPrestamo = ref(false);
const prestamoError = ref('');

function resetPrestamoForm() {
  prestamoForm.value = {
    fecha: new Date().toISOString().slice(0, 10),
    montoOriginal: '',
    moneda: 'USD',
    tasaCambio: '',
    numeroCuotas: '',
    valorCuota: '',
    fechaInicio: new Date().toISOString().slice(0, 10),
    observaciones: '',
  };
}

async function guardarPrestamo() {
  prestamoError.value = '';
  savingPrestamo.value = true;
  try {
    await trabajadoresApi.crearPrestamo(id, {
      fecha: prestamoForm.value.fecha,
      montoOriginal: Number(prestamoForm.value.montoOriginal),
      moneda: prestamoForm.value.moneda,
      tasaCambio: prestamoForm.value.tasaCambio ? Number(prestamoForm.value.tasaCambio) : undefined,
      numeroCuotas: Number(prestamoForm.value.numeroCuotas),
      valorCuota: Number(prestamoForm.value.valorCuota),
      fechaInicio: prestamoForm.value.fechaInicio,
      observaciones: prestamoForm.value.observaciones || undefined,
    });
    resetPrestamoForm();
    showPrestamoForm.value = false;
    await cargar();
  } catch (error) {
    prestamoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el préstamo.')
      : 'No se pudo guardar el préstamo.';
  } finally {
    savingPrestamo.value = false;
  }
}

const abonoMontoPorPrestamo = ref<Record<string, string>>({});
const abonandoId = ref<string | null>(null);
const abonoError = ref('');

async function abonarPrestamo(prestamoId: string) {
  abonoError.value = '';
  const monto = Number(abonoMontoPorPrestamo.value[prestamoId]);
  if (!monto) return;
  abonandoId.value = prestamoId;
  try {
    const payload: CrearAbonoPrestamoPayload = { fecha: new Date().toISOString().slice(0, 10), monto };
    await trabajadoresApi.crearAbonoPrestamo(prestamoId, payload);
    abonoMontoPorPrestamo.value[prestamoId] = '';
    await cargar();
  } catch (error) {
    abonoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo registrar el abono.')
      : 'No se pudo registrar el abono.';
  } finally {
    abonandoId.value = null;
  }
}

// --- Pagos -------------------------------------------------------------

const pagoPreviewForm = ref({
  tipo: 'JORNAL' as TipoPago,
  periodoDesde: new Date().toISOString().slice(0, 10),
  periodoHasta: new Date().toISOString().slice(0, 10),
});
const previsualizando = ref(false);
const previsualizacionError = ref('');
const previsualizacion = ref<PrevisualizacionPago | null>(null);

const pagoConfirmForm = ref({
  montoBase: '',
  bonificaciones: '',
  otrosDescuentos: '',
  moneda: 'USD' as MonedaTrabajador,
  tasaCambio: '',
  fecha: new Date().toISOString().slice(0, 10),
  observaciones: '',
});
const adelantosSeleccionados = ref<Record<string, { activo: boolean; monto: string }>>({});
const prestamosSeleccionados = ref<Record<string, { activo: boolean; monto: string }>>({});
const savingPago = ref(false);
const pagoError = ref('');
const pagoInactivo = ref(false);

async function previsualizarPago() {
  previsualizacionError.value = '';
  previsualizando.value = true;
  previsualizacion.value = null;
  pagoInactivo.value = false;
  pagoError.value = '';
  try {
    const resultado = await trabajadoresApi.previsualizarPago(id, { ...pagoPreviewForm.value });
    previsualizacion.value = resultado;
    pagoConfirmForm.value = {
      montoBase: String(resultado.montoBaseSugerido),
      bonificaciones: '',
      otrosDescuentos: '',
      moneda: 'USD',
      tasaCambio: '',
      fecha: new Date().toISOString().slice(0, 10),
      observaciones: '',
    };
    adelantosSeleccionados.value = Object.fromEntries(
      resultado.adelantosPendientes.map((a) => [a.id, { activo: false, monto: a.saldoPendiente.toFixed(2) }]),
    );
    prestamosSeleccionados.value = Object.fromEntries(
      resultado.prestamosPendientes.map((p) => [p.id, { activo: false, monto: p.saldoPendiente.toFixed(2) }]),
    );
  } catch (error) {
    previsualizacionError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo previsualizar el pago.')
      : 'No se pudo previsualizar el pago.';
  } finally {
    previsualizando.value = false;
  }
}

const totalAdelantosDescontados = computed(() =>
  Object.values(adelantosSeleccionados.value)
    .filter((a) => a.activo)
    .reduce((acc, a) => acc + (Number(a.monto) || 0), 0),
);
const totalPrestamosDescontados = computed(() =>
  Object.values(prestamosSeleccionados.value)
    .filter((p) => p.activo)
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0),
);
const montoTotalPago = computed(() => {
  const base = Number(pagoConfirmForm.value.montoBase) || 0;
  const bonif = Number(pagoConfirmForm.value.bonificaciones) || 0;
  const otros = Number(pagoConfirmForm.value.otrosDescuentos) || 0;
  return base + bonif - totalAdelantosDescontados.value - totalPrestamosDescontados.value - otros;
});

async function confirmarPago(confirmar = false) {
  pagoError.value = '';
  savingPago.value = true;
  try {
    const payload: ConfirmarPagoPayload = {
      tipo: pagoPreviewForm.value.tipo,
      periodoDesde: pagoPreviewForm.value.periodoDesde,
      periodoHasta: pagoPreviewForm.value.periodoHasta,
      montoBase: Number(pagoConfirmForm.value.montoBase) || 0,
      bonificaciones: pagoConfirmForm.value.bonificaciones ? Number(pagoConfirmForm.value.bonificaciones) : undefined,
      otrosDescuentos: pagoConfirmForm.value.otrosDescuentos
        ? Number(pagoConfirmForm.value.otrosDescuentos)
        : undefined,
      moneda: pagoConfirmForm.value.moneda,
      tasaCambio: pagoConfirmForm.value.tasaCambio ? Number(pagoConfirmForm.value.tasaCambio) : undefined,
      adelantos: Object.entries(adelantosSeleccionados.value)
        .filter(([, v]) => v.activo && Number(v.monto) > 0)
        .map(([adelantoId, v]) => ({ adelantoId, monto: Number(v.monto) })),
      prestamos: Object.entries(prestamosSeleccionados.value)
        .filter(([, v]) => v.activo && Number(v.monto) > 0)
        .map(([prestamoId, v]) => ({ prestamoId, monto: Number(v.monto) })),
      fecha: pagoConfirmForm.value.fecha,
      observaciones: pagoConfirmForm.value.observaciones || undefined,
      confirmar,
    };
    await trabajadoresApi.confirmarPago(id, payload);
    pagoInactivo.value = false;
    previsualizacion.value = null;
    await cargar();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      pagoInactivo.value = true;
    }
    pagoError.value = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo confirmar el pago.')
      : 'No se pudo confirmar el pago.';
  } finally {
    savingPago.value = false;
  }
}
</script>

<template>
  <div class="ficha-trabajador-view">
    <button type="button" class="ficha-trabajador-view__back" @click="router.push('/trabajadores')">
      ← Volver a Trabajadores
    </button>

    <div v-if="loading" class="ficha-trabajador-view__muted">Cargando…</div>

    <template v-else-if="trabajador">
      <SectionCard>
        <div class="ficha-trabajador-view__head">
          <div>
            <div class="ficha-trabajador-view__name-row">
              <h2>{{ trabajador.nombres }} {{ trabajador.apellidos }}</h2>
              <Pill
                :bg="trabajador.estado === 'ACTIVO' ? 'var(--color-neutral-bg)' : 'var(--color-warn-bg)'"
                :color="trabajador.estado === 'ACTIVO' ? 'var(--color-primary)' : 'var(--color-warn)'"
              >
                {{ trabajador.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
              </Pill>
            </div>
            <div class="ficha-trabajador-view__muted">
              {{ trabajador.cargo.nombre }} · Ingresó el {{ formatFecha(trabajador.fechaIngreso) }} · Antigüedad:
              {{ formatAntiguedad(trabajador.antiguedad) }}
            </div>
          </div>
          <div class="ficha-trabajador-view__head-actions">
            <button type="button" class="ficha-trabajador-view__btn-ghost" @click="abrirEdicion">Editar</button>
            <button
              type="button"
              class="ficha-trabajador-view__btn-ghost"
              :disabled="cambiandoEstado"
              @click="toggleEstado"
            >
              {{ trabajador.estado === 'ACTIVO' ? 'Inactivar' : 'Activar' }}
            </button>
          </div>
        </div>
      </SectionCard>

      <div class="ficha-trabajador-view__tabs">
        <button
          v-for="t in FICHA_TABS"
          :key="t.key"
          type="button"
          class="ficha-trabajador-view__tab"
          :class="{ 'ficha-trabajador-view__tab--active': fichaTab === t.key }"
          @click="fichaTab = t.key"
        >
          {{ t.label }}
        </button>
      </div>

      <SectionCard v-if="fichaTab === 'general' && !editando" title="Información general">
        <div class="ficha-trabajador-view__grid">
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Documento</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.documento }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Tipo de contratación</div>
            <div class="ficha-trabajador-view__stat-value">{{ TIPO_CONTRATACION_LABELS[trabajador.tipoContratacion] }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Modalidad de pago</div>
            <div class="ficha-trabajador-view__stat-value">{{ MODALIDAD_PAGO_LABELS[trabajador.modalidadPago] }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Salario / valor del jornal</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.salarioOJornal }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Fecha de nacimiento</div>
            <div class="ficha-trabajador-view__stat-value">
              {{ trabajador.fechaNacimiento ? formatFecha(trabajador.fechaNacimiento) : '—' }}
            </div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Teléfono</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.telefono ?? '—' }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Email</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.email ?? '—' }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Dirección</div>
            <div class="ficha-trabajador-view__stat-value">{{ trabajador.direccion ?? '—' }}</div>
          </div>
          <div class="ficha-trabajador-view__stat">
            <div class="ficha-trabajador-view__stat-label">Contacto de emergencia</div>
            <div class="ficha-trabajador-view__stat-value">
              {{ trabajador.contactoEmergenciaNombre ?? '—' }}
              <span v-if="trabajador.contactoEmergenciaTelefono"> · {{ trabajador.contactoEmergenciaTelefono }}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-else-if="fichaTab === 'general'" title="Editar información general">
        <div v-if="errorMsg" class="ficha-trabajador-view__error">{{ errorMsg }}</div>
        <div class="ficha-trabajador-view__form-grid">
          <div class="ficha-trabajador-view__field">
            <label>Nombres</label>
            <input v-model="form.nombres" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Apellidos</label>
            <input v-model="form.apellidos" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Documento</label>
            <input v-model="form.documento" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Cargo</label>
            <select v-model="form.cargoId">
              <option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Fecha de ingreso</label>
            <input v-model="form.fechaIngreso" type="date" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Tipo de contratación</label>
            <select v-model="form.tipoContratacion">
              <option v-for="(label, valor) in TIPO_CONTRATACION_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Modalidad de pago</label>
            <select v-model="form.modalidadPago">
              <option v-for="(label, valor) in MODALIDAD_PAGO_LABELS" :key="valor" :value="valor">{{ label }}</option>
            </select>
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Salario / valor del jornal</label>
            <input v-model="form.salarioOJornal" type="number" min="0" step="0.01" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Fecha de nacimiento</label>
            <input v-model="form.fechaNacimiento" type="date" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Teléfono</label>
            <input v-model="form.telefono" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Email</label>
            <input v-model="form.email" type="email" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Dirección</label>
            <input v-model="form.direccion" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Contacto de emergencia — nombre</label>
            <input v-model="form.contactoEmergenciaNombre" />
          </div>
          <div class="ficha-trabajador-view__field">
            <label>Contacto de emergencia — teléfono</label>
            <input v-model="form.contactoEmergenciaTelefono" />
          </div>
        </div>
        <div class="ficha-trabajador-view__form-actions">
          <button type="button" class="ficha-trabajador-view__btn-ghost" @click="editando = false">Cancelar</button>
          <button type="button" class="ficha-trabajador-view__submit" :disabled="saving" @click="guardar">
            {{ saving ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </SectionCard>

      <SectionCard v-else-if="fichaTab === 'asignaciones'" title="Asignaciones">
        <template #actions>
          <button type="button" class="ficha-trabajador-view__btn-ghost" @click="showAsignacionForm = !showAsignacionForm">
            {{ showAsignacionForm ? 'Cancelar' : '+ Nueva asignación' }}
          </button>
        </template>

        <div v-if="showAsignacionForm" class="ficha-trabajador-view__sub-form">
          <div v-if="asignacionError" class="ficha-trabajador-view__error">{{ asignacionError }}</div>
          <div class="ficha-trabajador-view__muted">Indicá un cargo, un potrero, o ambos.</div>
          <div class="ficha-trabajador-view__form-grid">
            <div class="ficha-trabajador-view__field">
              <label>Cargo</label>
              <select v-model="asignacionForm.cargoId">
                <option value="">Sin cambio de cargo</option>
                <option v-for="c in cargos" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Potrero</label>
              <select v-model="asignacionForm.potreroId">
                <option value="">Sin potrero</option>
                <option v-for="p in potrerosActivos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
              </select>
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Fecha de inicio</label>
              <input v-model="asignacionForm.fechaInicio" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Fecha de fin (opcional)</label>
              <input v-model="asignacionForm.fechaFin" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Observaciones</label>
              <input v-model="asignacionForm.observaciones" />
            </div>
          </div>
          <button
            type="button"
            class="ficha-trabajador-view__submit"
            :disabled="savingAsignacion || (!asignacionForm.cargoId && !asignacionForm.potreroId)"
            @click="guardarAsignacion"
          >
            {{ savingAsignacion ? 'Guardando…' : 'Guardar asignación' }}
          </button>
        </div>

        <div v-if="asignacionVigente" class="ficha-trabajador-view__vigente">
          <div class="ficha-trabajador-view__vigente-title">Asignación vigente</div>
          <div class="ficha-trabajador-view__vigente-row">
            <div>
              <span v-if="asignacionVigente.cargo">Cargo: {{ asignacionVigente.cargo.nombre }}</span>
              <span v-if="asignacionVigente.cargo && asignacionVigente.potrero"> · </span>
              <span v-if="asignacionVigente.potrero">Potrero: {{ asignacionVigente.potrero.nombre }}</span>
              <div class="ficha-trabajador-view__muted">Desde el {{ formatFecha(asignacionVigente.fechaInicio) }}</div>
            </div>
            <button
              type="button"
              class="ficha-trabajador-view__btn-ghost"
              :disabled="finalizandoId === asignacionVigente.id"
              @click="finalizarAsignacion(asignacionVigente.id)"
            >
              Finalizar
            </button>
          </div>
        </div>
        <div v-else class="ficha-trabajador-view__muted">Sin asignación vigente.</div>

        <div v-if="asignacionesHistorial.length > 0" class="ficha-trabajador-view__historial">
          <div class="ficha-trabajador-view__vigente-title">Historial</div>
          <div v-for="a in asignacionesHistorial" :key="a.id" class="ficha-trabajador-view__historial-row">
            <span v-if="a.cargo">{{ a.cargo.nombre }}</span>
            <span v-if="a.potrero">{{ a.potrero.nombre }}</span>
            <span class="ficha-trabajador-view__muted">
              {{ formatFecha(a.fechaInicio) }} — {{ a.fechaFin ? formatFecha(a.fechaFin) : '' }}
            </span>
            <span v-if="a.observaciones" class="ficha-trabajador-view__muted">{{ a.observaciones }}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-else-if="fichaTab === 'asistencia'" title="Asistencia">
        <template #actions>
          <button
            type="button"
            class="ficha-trabajador-view__btn-ghost"
            @click="showAsistenciaForm = !showAsistenciaForm"
          >
            {{ showAsistenciaForm ? 'Cancelar' : '+ Registrar asistencia' }}
          </button>
        </template>

        <div v-if="showAsistenciaForm" class="ficha-trabajador-view__sub-form">
          <div v-if="asistenciaError" class="ficha-trabajador-view__error">
            {{ asistenciaError }}
            <button
              v-if="asistenciaDuplicada"
              type="button"
              class="ficha-trabajador-view__btn-ghost"
              :disabled="savingAsistencia"
              @click="guardarAsistencia(true)"
            >
              Confirmar y reemplazar
            </button>
          </div>
          <div class="ficha-trabajador-view__form-grid">
            <div class="ficha-trabajador-view__field">
              <label>Fecha</label>
              <input v-model="asistenciaForm.fecha" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Estado</label>
              <select v-model="asistenciaForm.estado">
                <option v-for="(label, valor) in ESTADO_ASISTENCIA_LABELS" :key="valor" :value="valor">
                  {{ label }}
                </option>
              </select>
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Hora de entrada (opcional)</label>
              <input v-model="asistenciaForm.horaEntrada" type="time" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Hora de salida (opcional)</label>
              <input v-model="asistenciaForm.horaSalida" type="time" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Jornal realizado (opcional)</label>
              <input v-model="asistenciaForm.jornalRealizado" type="number" min="0" step="0.5" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Observaciones</label>
              <input v-model="asistenciaForm.observaciones" />
            </div>
          </div>
          <button
            type="button"
            class="ficha-trabajador-view__submit"
            :disabled="savingAsistencia"
            @click="guardarAsistencia(false)"
          >
            {{ savingAsistencia ? 'Guardando…' : 'Guardar asistencia' }}
          </button>
        </div>

        <div v-if="asistencias.length === 0" class="ficha-trabajador-view__muted">Sin registros de asistencia.</div>
        <div v-else class="ficha-trabajador-view__historial">
          <div v-for="a in asistencias" :key="a.id" class="ficha-trabajador-view__historial-row">
            <span class="ficha-trabajador-view__bold">{{ formatFecha(a.fecha) }}</span>
            <span>{{ ESTADO_ASISTENCIA_LABELS[a.estado] }}</span>
            <span v-if="a.horasTrabajadas !== null" class="ficha-trabajador-view__muted">
              {{ a.horasTrabajadas }} h ({{ a.horaEntrada }}–{{ a.horaSalida }})
            </span>
            <span v-if="a.jornalRealizado" class="ficha-trabajador-view__muted">Jornal: {{ a.jornalRealizado }}</span>
            <span v-if="a.observaciones" class="ficha-trabajador-view__muted">{{ a.observaciones }}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-else-if="fichaTab === 'adelantos'" title="Adelantos">
        <template #actions>
          <button
            v-if="esAdmin"
            type="button"
            class="ficha-trabajador-view__btn-ghost"
            @click="showAdelantoForm = !showAdelantoForm"
          >
            {{ showAdelantoForm ? 'Cancelar' : '+ Nuevo adelanto' }}
          </button>
        </template>

        <div v-if="showAdelantoForm" class="ficha-trabajador-view__sub-form">
          <div v-if="adelantoError" class="ficha-trabajador-view__error">{{ adelantoError }}</div>
          <div class="ficha-trabajador-view__form-grid">
            <div class="ficha-trabajador-view__field">
              <label>Fecha</label>
              <input v-model="adelantoForm.fecha" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Monto</label>
              <input v-model="adelantoForm.monto" type="number" min="0" step="0.01" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Moneda</label>
              <select v-model="adelantoForm.moneda">
                <option v-for="(label, valor) in MONEDA_LABELS" :key="valor" :value="valor">{{ label }}</option>
              </select>
            </div>
            <div v-if="adelantoForm.moneda === 'VES'" class="ficha-trabajador-view__field">
              <label>Tasa de cambio (VES por USD)</label>
              <input v-model="adelantoForm.tasaCambio" type="number" min="0" step="0.0001" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Motivo</label>
              <input v-model="adelantoForm.motivo" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Método de entrega (opcional)</label>
              <input v-model="adelantoForm.metodoEntrega" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Observaciones</label>
              <input v-model="adelantoForm.observaciones" />
            </div>
          </div>
          <button
            type="button"
            class="ficha-trabajador-view__submit"
            :disabled="savingAdelanto || !adelantoForm.monto || !adelantoForm.motivo"
            @click="guardarAdelanto"
          >
            {{ savingAdelanto ? 'Guardando…' : 'Guardar adelanto' }}
          </button>
        </div>

        <div v-if="adelantos.length === 0" class="ficha-trabajador-view__muted">Sin adelantos registrados.</div>
        <div v-else class="ficha-trabajador-view__historial">
          <div v-for="a in adelantos" :key="a.id" class="ficha-trabajador-view__historial-row">
            <span class="ficha-trabajador-view__bold">{{ formatFecha(a.fecha) }}</span>
            <span>{{ a.monto }} {{ a.moneda }}</span>
            <span class="ficha-trabajador-view__muted">{{ a.motivo }}</span>
            <span class="ficha-trabajador-view__muted">Saldo pendiente: {{ a.saldoPendiente.toFixed(2) }}</span>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-else-if="fichaTab === 'prestamos'" title="Préstamos">
        <template #actions>
          <button
            v-if="esAdmin"
            type="button"
            class="ficha-trabajador-view__btn-ghost"
            @click="showPrestamoForm = !showPrestamoForm"
          >
            {{ showPrestamoForm ? 'Cancelar' : '+ Nuevo préstamo' }}
          </button>
        </template>

        <div v-if="showPrestamoForm" class="ficha-trabajador-view__sub-form">
          <div v-if="prestamoError" class="ficha-trabajador-view__error">{{ prestamoError }}</div>
          <div class="ficha-trabajador-view__form-grid">
            <div class="ficha-trabajador-view__field">
              <label>Fecha</label>
              <input v-model="prestamoForm.fecha" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Monto original</label>
              <input v-model="prestamoForm.montoOriginal" type="number" min="0" step="0.01" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Moneda</label>
              <select v-model="prestamoForm.moneda">
                <option v-for="(label, valor) in MONEDA_LABELS" :key="valor" :value="valor">{{ label }}</option>
              </select>
            </div>
            <div v-if="prestamoForm.moneda === 'VES'" class="ficha-trabajador-view__field">
              <label>Tasa de cambio (VES por USD)</label>
              <input v-model="prestamoForm.tasaCambio" type="number" min="0" step="0.0001" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Número de cuotas</label>
              <input v-model="prestamoForm.numeroCuotas" type="number" min="1" step="1" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Valor de cuota</label>
              <input v-model="prestamoForm.valorCuota" type="number" min="0" step="0.01" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Fecha de inicio</label>
              <input v-model="prestamoForm.fechaInicio" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Observaciones</label>
              <input v-model="prestamoForm.observaciones" />
            </div>
          </div>
          <button
            type="button"
            class="ficha-trabajador-view__submit"
            :disabled="savingPrestamo || !prestamoForm.montoOriginal || !prestamoForm.numeroCuotas || !prestamoForm.valorCuota"
            @click="guardarPrestamo"
          >
            {{ savingPrestamo ? 'Guardando…' : 'Guardar préstamo' }}
          </button>
        </div>

        <div v-if="abonoError" class="ficha-trabajador-view__error">{{ abonoError }}</div>
        <div v-if="prestamos.length === 0" class="ficha-trabajador-view__muted">Sin préstamos registrados.</div>
        <div v-else class="ficha-trabajador-view__historial">
          <div v-for="p in prestamos" :key="p.id" class="ficha-trabajador-view__historial-row">
            <div class="ficha-trabajador-view__bold">
              {{ p.montoOriginal }} {{ p.moneda }} — {{ formatFecha(p.fecha) }}
            </div>
            <div class="ficha-trabajador-view__muted">
              Saldo pendiente: {{ p.saldoPendiente.toFixed(2) }} · Cuotas pagadas: {{ p.cuotasPagadas }}/{{ p.numeroCuotas }}
              · Valor de cuota: {{ p.valorCuota }}
            </div>
            <div v-if="esAdmin && p.saldoPendiente > 0" class="ficha-trabajador-view__cargo-add">
              <input v-model="abonoMontoPorPrestamo[p.id]" type="number" min="0" step="0.01" placeholder="Monto a abonar" />
              <button
                type="button"
                class="ficha-trabajador-view__submit"
                :disabled="abonandoId === p.id"
                @click="abonarPrestamo(p.id)"
              >
                Abonar
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard v-else-if="fichaTab === 'pagos'" title="Pagos">
        <div class="ficha-trabajador-view__sub-form">
          <div v-if="previsualizacionError" class="ficha-trabajador-view__error">{{ previsualizacionError }}</div>
          <div class="ficha-trabajador-view__form-grid">
            <div class="ficha-trabajador-view__field">
              <label>Tipo de pago</label>
              <select v-model="pagoPreviewForm.tipo">
                <option v-for="(label, valor) in TIPO_PAGO_LABELS" :key="valor" :value="valor">{{ label }}</option>
              </select>
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Período desde</label>
              <input v-model="pagoPreviewForm.periodoDesde" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Período hasta</label>
              <input v-model="pagoPreviewForm.periodoHasta" type="date" />
            </div>
          </div>
          <button
            type="button"
            class="ficha-trabajador-view__submit"
            :disabled="previsualizando"
            @click="previsualizarPago"
          >
            {{ previsualizando ? 'Calculando…' : 'Calcular' }}
          </button>
        </div>

        <div v-if="previsualizacion" class="ficha-trabajador-view__sub-form">
          <div v-if="pagoError" class="ficha-trabajador-view__error">
            {{ pagoError }}
            <button
              v-if="pagoInactivo && esAdmin"
              type="button"
              class="ficha-trabajador-view__btn-ghost"
              :disabled="savingPago"
              @click="confirmarPago(true)"
            >
              Confirmar y registrar igual
            </button>
          </div>

          <div class="ficha-trabajador-view__muted">
            Jornadas: {{ previsualizacion.jornadas }} · Horas: {{ previsualizacion.horasTrabajadas }} · Jornales:
            {{ previsualizacion.jornalesRealizados }}
          </div>

          <div class="ficha-trabajador-view__form-grid">
            <div class="ficha-trabajador-view__field">
              <label>Monto base</label>
              <input v-model="pagoConfirmForm.montoBase" type="number" min="0" step="0.01" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Bonificaciones</label>
              <input v-model="pagoConfirmForm.bonificaciones" type="number" min="0" step="0.01" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Otros descuentos</label>
              <input v-model="pagoConfirmForm.otrosDescuentos" type="number" min="0" step="0.01" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Moneda de pago</label>
              <select v-model="pagoConfirmForm.moneda">
                <option v-for="(label, valor) in MONEDA_LABELS" :key="valor" :value="valor">{{ label }}</option>
              </select>
            </div>
            <div v-if="pagoConfirmForm.moneda === 'VES'" class="ficha-trabajador-view__field">
              <label>Tasa de cambio (VES por USD)</label>
              <input v-model="pagoConfirmForm.tasaCambio" type="number" min="0" step="0.0001" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Fecha de pago</label>
              <input v-model="pagoConfirmForm.fecha" type="date" />
            </div>
            <div class="ficha-trabajador-view__field">
              <label>Observaciones</label>
              <input v-model="pagoConfirmForm.observaciones" />
            </div>
          </div>

          <template v-if="previsualizacion.adelantosPendientes.length > 0">
            <div class="ficha-trabajador-view__vigente-title">Descontar adelantos</div>
            <div
              v-for="a in previsualizacion.adelantosPendientes"
              :key="a.id"
              class="ficha-trabajador-view__pago-descuento-row"
            >
              <input type="checkbox" v-model="adelantosSeleccionados[a.id].activo" />
              <span>{{ formatFecha(a.fecha) }} — {{ a.motivo }} (saldo {{ a.saldoPendiente.toFixed(2) }})</span>
              <input
                v-model="adelantosSeleccionados[a.id].monto"
                type="number"
                min="0"
                :max="a.saldoPendiente"
                step="0.01"
                :disabled="!adelantosSeleccionados[a.id].activo"
              />
            </div>
          </template>

          <template v-if="previsualizacion.prestamosPendientes.length > 0">
            <div class="ficha-trabajador-view__vigente-title">Descontar préstamos</div>
            <div
              v-for="p in previsualizacion.prestamosPendientes"
              :key="p.id"
              class="ficha-trabajador-view__pago-descuento-row"
            >
              <input type="checkbox" v-model="prestamosSeleccionados[p.id].activo" />
              <span>{{ formatFecha(p.fecha) }} — {{ p.montoOriginal }} {{ p.moneda }} (saldo {{ p.saldoPendiente.toFixed(2) }})</span>
              <input
                v-model="prestamosSeleccionados[p.id].monto"
                type="number"
                min="0"
                :max="p.saldoPendiente"
                step="0.01"
                :disabled="!prestamosSeleccionados[p.id].activo"
              />
            </div>
          </template>

          <div class="ficha-trabajador-view__pago-total">
            <span>Monto total</span>
            <span>{{ montoTotalPago.toFixed(2) }} {{ pagoConfirmForm.moneda }}</span>
          </div>

          <button
            v-if="esAdmin"
            type="button"
            class="ficha-trabajador-view__submit"
            :disabled="savingPago"
            @click="confirmarPago(false)"
          >
            {{ savingPago ? 'Confirmando…' : 'Confirmar pago' }}
          </button>
        </div>

        <div v-if="pagos.length === 0" class="ficha-trabajador-view__muted">Sin pagos registrados.</div>
        <div v-else class="ficha-trabajador-view__historial">
          <div v-for="p in pagos" :key="p.id" class="ficha-trabajador-view__historial-row">
            <span class="ficha-trabajador-view__bold">{{ formatFecha(p.fecha) }}</span>
            <span>{{ TIPO_PAGO_LABELS[p.tipo] }}</span>
            <span class="ficha-trabajador-view__muted">Total: {{ p.montoTotal }} {{ p.moneda }}</span>
            <span v-if="p.observaciones" class="ficha-trabajador-view__muted">{{ p.observaciones }}</span>
          </div>
        </div>
      </SectionCard>
    </template>
  </div>
</template>

<style scoped lang="scss">
.ficha-trabajador-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__back {
    align-self: flex-start;
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    h2 {
      margin: 0;
    }
  }

  &__head-actions {
    display: flex;
    gap: 0.5rem;
    flex: none;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }

  &__stat-label {
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.5);
    text-transform: uppercase;
  }

  &__stat-value {
    font-size: 0.88rem;
    font-weight: 600;
    margin-top: 0.2rem;
  }

  &__form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
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
      background: var(--color-white);
      font-family: inherit;
    }
  }

  &__form-actions {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.85rem;
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

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__btn-ghost {
    background: transparent;
    border: 1.5px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-dark);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    padding: 0.6rem 1.1rem;
    font-family: inherit;

    &:disabled {
      opacity: 0.5;
      cursor: progress;
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

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__tabs {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
  }

  &__tab {
    background: var(--color-white);
    border: none;
    border-radius: 999px;
    padding: 0.55rem 1.1rem;
    font-size: 0.78rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.6);
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;

    &--active {
      background: var(--color-primary);
      color: var(--color-bg);
    }
  }

  &__sub-form {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 0.85rem;
  }

  &__cargo-add {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.4rem;

    input {
      flex: 1;
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.5rem 0.7rem;
      font-size: 0.8rem;
      background: var(--color-white);
      font-family: inherit;
    }
  }

  &__pago-descuento-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 0;
    font-size: 0.82rem;

    span {
      flex: 1;
    }

    input[type='number'] {
      width: 110px;
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.4rem 0.6rem;
      font-size: 0.8rem;
      font-family: inherit;
      background: var(--color-white);
    }
  }

  &__pago-total {
    display: flex;
    justify-content: space-between;
    font-weight: 800;
    font-size: 0.95rem;
    padding-top: 0.6rem;
    border-top: 1px solid #f2efdd;
    margin-top: 0.4rem;
  }

  &__vigente {
    background: var(--color-bg);
    border-radius: 14px;
    padding: 0.85rem;
    margin-bottom: 0.85rem;
  }

  &__vigente-title {
    font-weight: 800;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  &__vigente-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.85rem;
  }

  &__historial {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__historial-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.6rem 0;
    border-top: 1px solid #f2efdd;
    font-size: 0.82rem;
  }
}
</style>
