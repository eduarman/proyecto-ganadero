<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import { useBreakpoint } from '../../../shared/composables/useBreakpoint';
import SectionCard from '../../../shared/components/SectionCard.vue';
import SegmentedTabs from '../../../shared/components/SegmentedTabs.vue';
import DayBadge from '../../../shared/components/DayBadge.vue';
import Pill from '../../../shared/components/Pill.vue';
import { ganadoApi, type Animal } from '../../ganado/services/ganado.api';
import {
  reproduccionApi,
  type MetodoDiagnostico,
  type Servicio,
  type TipoServicio,
} from '../services/reproduccion.api';

const { isMobile } = useBreakpoint();
const eventType = ref('Inseminación');
const mobileTabs = ['Insem.', 'Natural', 'Palpación'];
const desktopTabs = ['Inseminación', 'Servicio natural', 'Palpación'];

const TAB_A_TIPO: Record<string, TipoServicio> = {
  Inseminación: 'IA',
  'Servicio natural': 'MONTA_NATURAL',
};
const RESULTADO_OPCIONES = ['Pendiente', 'Positiva', 'Negativa'] as const;
const RESULTADO_A_ENUM: Record<(typeof RESULTADO_OPCIONES)[number], 'DUDOSO' | 'PRENADA' | 'VACIA'> = {
  Pendiente: 'DUDOSO',
  Positiva: 'PRENADA',
  Negativa: 'VACIA',
};
const METODO_LABELS: Record<MetodoDiagnostico, string> = {
  PALPACION: 'Palpación',
  ECOGRAFIA: 'Ecografía',
  OTRO: 'Otro',
};

const isPalpacion = computed(() => eventType.value === 'Palpación');

const TIPO_SERVICIO_LABELS: Record<TipoServicio, string> = {
  IA: 'Inseminación artificial',
  MONTA_NATURAL: 'Servicio natural',
  TE: 'Transferencia embrionaria',
};
const ESTADO_SERVICIO_LABELS: Record<string, string> = {
  PENDIENTE_DIAGNOSTICO: 'Pendiente de diagnóstico',
  CONFIRMADO_PRENADA: 'Confirmada preñada',
  VACIO: 'Vacía',
};
function estiloEstadoServicio(estado: string): { bg: string; color: string } {
  return estado === 'CONFIRMADO_PRENADA'
    ? { bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' }
    : { bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' };
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function diaMes(iso: string) {
  const fecha = new Date(iso);
  return { day: String(fecha.getDate()).padStart(2, '0'), month: MESES[fecha.getMonth()] };
}
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

const loading = ref(true);
const hembras = ref<Animal[]>([]);
const pendientes = ref<Servicio[]>([]);
const calendario = ref<Servicio[]>([]);
const historial = ref<Servicio[]>([]);

async function cargar() {
  loading.value = true;
  try {
    const [animalesResp, pendientesResp, calendarioResp, historialResp] = await Promise.all([
      ganadoApi.listar({ limit: 100 }),
      reproduccionApi.pendientesDiagnostico(),
      reproduccionApi.calendario(),
      reproduccionApi.listarServicios(),
    ]);
    hembras.value = animalesResp.data.filter((a) => a.sexo === 'HEMBRA');
    pendientes.value = pendientesResp;
    calendario.value = calendarioResp;
    historial.value = historialResp;
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);

function diasHasta(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function tagParto(iso: string): { label: string; bg: string; color: string } {
  const dias = diasHasta(iso);
  if (dias <= 7) return { label: 'Esta semana', bg: 'var(--color-warn-bg)', color: 'var(--color-warn)' };
  if (dias <= 30) return { label: 'Próximo', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' };
  return { label: 'Programado', bg: 'var(--color-neutral-bg)', color: 'var(--color-primary)' };
}

const form = ref({
  animalId: '',
  servicioId: '',
  fecha: new Date().toISOString().slice(0, 10),
  semenReferencia: '',
  resultado: 'Positiva' as (typeof RESULTADO_OPCIONES)[number],
  metodo: 'PALPACION' as MetodoDiagnostico,
});
const saving = ref(false);
const errorMsg = ref('');
const mostrarConfirmarDuplicado = ref(false);

function resetForm() {
  form.value = {
    animalId: '',
    servicioId: '',
    fecha: new Date().toISOString().slice(0, 10),
    semenReferencia: '',
    resultado: 'Positiva',
    metodo: 'PALPACION',
  };
  mostrarConfirmarDuplicado.value = false;
}

async function guardar(confirmarDuplicado = false) {
  errorMsg.value = '';
  saving.value = true;
  try {
    if (isPalpacion.value) {
      await reproduccionApi.crearDiagnostico({
        servicioId: form.value.servicioId,
        resultado: RESULTADO_A_ENUM[form.value.resultado],
        metodo: form.value.metodo,
        fecha: form.value.fecha,
      });
    } else {
      await reproduccionApi.crearServicio({
        animalId: form.value.animalId,
        tipo: TAB_A_TIPO[eventType.value],
        fecha: form.value.fecha,
        semenReferencia: form.value.semenReferencia || undefined,
        confirmarDuplicado,
      });
    }
    resetForm();
    await cargar();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      const data = error.response.data as { code?: string; message?: string };
      errorMsg.value = data.message ?? 'Ya existe un servicio activo para este animal.';
      mostrarConfirmarDuplicado.value = data.code === 'SERVICIO_ACTIVO_EXISTENTE';
    } else {
      errorMsg.value = isAxiosError(error)
        ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar el registro.')
        : 'No se pudo guardar el registro.';
    }
  } finally {
    saving.value = false;
  }
}
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
        <div v-if="errorMsg" class="reproduccion-view__error">
          {{ errorMsg }}
          <button
            v-if="mostrarConfirmarDuplicado"
            type="button"
            class="reproduccion-view__confirm-btn"
            :disabled="saving"
            @click="guardar(true)"
          >
            Confirmar de todas formas
          </button>
        </div>
        <div class="reproduccion-view__form-grid" :class="{ 'reproduccion-view__form-grid--mobile': isMobile }">
          <div class="reproduccion-view__field">
            <label v-if="!isMobile">Bovino</label>
            <select v-if="!isPalpacion" v-model="form.animalId">
              <option value="" disabled>Seleccioná una hembra</option>
              <option v-for="a in hembras" :key="a.id" :value="a.id">{{ a.identificador }}</option>
            </select>
            <select v-else v-model="form.servicioId">
              <option value="" disabled>Seleccioná una hembra con servicio pendiente</option>
              <option v-for="s in pendientes" :key="s.id" :value="s.id">{{ s.animal.identificador }}</option>
            </select>
          </div>
          <div class="reproduccion-view__field">
            <label v-if="!isMobile">Fecha</label>
            <input v-model="form.fecha" type="date" />
          </div>
          <template v-if="!isMobile">
            <div v-if="!isPalpacion" class="reproduccion-view__field">
              <label>Toro / Semen</label>
              <input v-model="form.semenReferencia" placeholder="Toro Cacique" />
            </div>
            <template v-else>
              <div class="reproduccion-view__field">
                <label>Resultado (palpación)</label>
                <select v-model="form.resultado">
                  <option v-for="r in RESULTADO_OPCIONES" :key="r">{{ r }}</option>
                </select>
              </div>
              <div class="reproduccion-view__field">
                <label>Método</label>
                <select v-model="form.metodo">
                  <option v-for="(label, valor) in METODO_LABELS" :key="valor" :value="valor">{{ label }}</option>
                </select>
              </div>
            </template>
          </template>
        </div>
        <button
          type="button"
          class="reproduccion-view__submit"
          :disabled="saving || (isPalpacion ? !form.servicioId : !form.animalId)"
          @click="guardar(false)"
        >
          {{ saving ? 'Guardando…' : isMobile ? 'Guardar registro' : 'Guardar registro reproductivo' }}
        </button>
      </SectionCard>

      <SectionCard v-if="!isMobile" title="Partos próximos">
        <div v-if="!loading && calendario.length === 0" class="reproduccion-view__muted">
          No hay preñeces confirmadas con parto próximo.
        </div>
        <div v-for="s in calendario" :key="s.id" class="reproduccion-view__row">
          <DayBadge :day="diaMes(s.fechaProbableParto).day" :month="diaMes(s.fechaProbableParto).month" />
          <div class="reproduccion-view__row-info">
            <div class="reproduccion-view__row-title">{{ s.animal.identificador }}</div>
            <div class="reproduccion-view__row-detail">
              Servicio: {{ s.tipo === 'IA' ? 'Insem. artificial' : s.tipo === 'TE' ? 'Transferencia embrionaria' : 'Natural' }}
            </div>
          </div>
          <Pill :bg="tagParto(s.fechaProbableParto).bg" :color="tagParto(s.fechaProbableParto).color">
            {{ tagParto(s.fechaProbableParto).label }}
          </Pill>
        </div>
      </SectionCard>
    </div>

    <div v-if="isMobile" class="reproduccion-view__section">
      <div class="reproduccion-view__heading">Partos próximos</div>
      <div v-if="!loading && calendario.length === 0" class="reproduccion-view__muted">
        No hay preñeces confirmadas con parto próximo.
      </div>
      <div v-for="s in calendario" :key="s.id" class="reproduccion-view__card">
        <DayBadge :day="diaMes(s.fechaProbableParto).day" :month="diaMes(s.fechaProbableParto).month" size="sm" bg="var(--color-bg)" />
        <div class="reproduccion-view__row-info">
          <div class="reproduccion-view__row-title">{{ s.animal.identificador }}</div>
        </div>
        <Pill :bg="tagParto(s.fechaProbableParto).bg" :color="tagParto(s.fechaProbableParto).color">
          {{ tagParto(s.fechaProbableParto).label }}
        </Pill>
      </div>
    </div>

    <SectionCard v-if="!isMobile" title="Vacas preñadas">
      <div v-if="!loading && calendario.length === 0" class="reproduccion-view__muted">
        Todavía no hay preñeces confirmadas.
      </div>
      <template v-else>
        <div class="reproduccion-view__table-head">
          <span>Bovino</span><span>Tipo de servicio</span><span>F. servicio</span
          ><span>F. probable parto</span><span>Estado</span>
        </div>
        <div v-for="s in calendario" :key="s.id" class="reproduccion-view__table-row">
          <span class="reproduccion-view__bold">{{ s.animal.identificador }}</span>
          <span>{{ s.tipo === 'IA' ? 'Inseminación artificial' : s.tipo === 'TE' ? 'Transferencia embrionaria' : 'Servicio natural' }}</span>
          <span class="reproduccion-view__muted">{{ formatFecha(s.fecha) }}</span>
          <span>{{ formatFecha(s.fechaProbableParto) }}</span>
          <Pill bg="var(--color-warn-bg)" color="var(--color-warn)">Confirmada</Pill>
        </div>
      </template>
    </SectionCard>

    <div v-else class="reproduccion-view__section">
      <div class="reproduccion-view__heading">Vacas preñadas</div>
      <div v-if="!loading && calendario.length === 0" class="reproduccion-view__muted">
        Todavía no hay preñeces confirmadas.
      </div>
      <div v-for="s in calendario" :key="s.id" class="reproduccion-view__pregnant-card">
        <div class="reproduccion-view__row-top">
          <span class="reproduccion-view__bold">{{ s.animal.identificador }}</span>
          <Pill bg="var(--color-warn-bg)" color="var(--color-warn)">Confirmada</Pill>
        </div>
        <div class="reproduccion-view__muted">
          {{ s.tipo === 'IA' ? 'Inseminación artificial' : s.tipo === 'TE' ? 'Transferencia embrionaria' : 'Servicio natural' }}
          · Parto: {{ formatFecha(s.fechaProbableParto) }}
        </div>
      </div>
    </div>

    <SectionCard v-if="!isMobile" title="Historial de servicios registrados">
      <div v-if="!loading && historial.length === 0" class="reproduccion-view__muted">
        Todavía no hay servicios registrados.
      </div>
      <template v-else>
        <div class="reproduccion-view__hist-head">
          <span>Fecha</span><span>Bovino</span><span>Tipo</span><span>Estado</span>
        </div>
        <div v-for="s in historial" :key="s.id" class="reproduccion-view__hist-row">
          <span class="reproduccion-view__muted">{{ formatFecha(s.fecha) }}</span>
          <span class="reproduccion-view__bold">{{ s.animal.identificador }}</span>
          <span>{{ TIPO_SERVICIO_LABELS[s.tipo] }}</span>
          <Pill :bg="estiloEstadoServicio(s.estado).bg" :color="estiloEstadoServicio(s.estado).color">
            {{ ESTADO_SERVICIO_LABELS[s.estado] }}
          </Pill>
        </div>
      </template>
    </SectionCard>

    <div v-else class="reproduccion-view__section">
      <div class="reproduccion-view__heading">Historial de servicios registrados</div>
      <div v-if="!loading && historial.length === 0" class="reproduccion-view__muted">
        Todavía no hay servicios registrados.
      </div>
      <div v-for="s in historial" :key="s.id" class="reproduccion-view__pregnant-card">
        <div class="reproduccion-view__row-top">
          <span class="reproduccion-view__bold">{{ s.animal.identificador }}</span>
          <Pill :bg="estiloEstadoServicio(s.estado).bg" :color="estiloEstadoServicio(s.estado).color">
            {{ ESTADO_SERVICIO_LABELS[s.estado] }}
          </Pill>
        </div>
        <div class="reproduccion-view__muted">
          {{ TIPO_SERVICIO_LABELS[s.tipo] }} · {{ formatFecha(s.fecha) }}
        </div>
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

  &__error {
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

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
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

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
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

  &__hist-head,
  &__hist-row {
    display: grid;
    grid-template-columns: 100px 1.2fr 1.3fr 1fr;
    gap: 0.6rem;
    padding: 0.7rem 0.4rem;
    align-items: center;
  }

  &__hist-head {
    font-size: 0.68rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
    padding-top: 0;
    padding-bottom: 0.5rem;
  }

  &__hist-row {
    border-top: 1px solid #f2efdd;
    font-size: 0.82rem;
  }

  &__bold {
    font-weight: 700;
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
