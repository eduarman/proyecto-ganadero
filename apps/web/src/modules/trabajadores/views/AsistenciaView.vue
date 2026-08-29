<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import { useRouter } from 'vue-router';
import SectionCard from '../../../shared/components/SectionCard.vue';
import { trabajadoresApi, type EstadoAsistencia } from '../services/trabajadores.api';

const router = useRouter();

const ESTADO_LABELS: Record<EstadoAsistencia, string> = {
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
  PERMISO: 'Permiso',
  VACACIONES: 'Vacaciones',
  FALTA_JUSTIFICADA: 'Falta justificada',
  FALTA_INJUSTIFICADA: 'Falta injustificada',
};

interface Fila {
  trabajadorId: string;
  nombre: string;
  cargo: string;
  estado: EstadoAsistencia;
  horaEntrada: string;
  horaSalida: string;
  jornalRealizado: string;
  observaciones: string;
  saving: boolean;
  error: string;
  guardado: boolean;
}

const fecha = ref(new Date().toISOString().slice(0, 10));
const loading = ref(true);
const filas = ref<Fila[]>([]);

async function cargar() {
  loading.value = true;
  try {
    const dia = await trabajadoresApi.listarAsistenciaDelDia(fecha.value);
    filas.value = dia.map((d) => ({
      trabajadorId: d.trabajador.id,
      nombre: `${d.trabajador.nombres} ${d.trabajador.apellidos}`,
      cargo: d.trabajador.cargo.nombre,
      estado: d.asistencia?.estado ?? 'PRESENTE',
      horaEntrada: d.asistencia?.horaEntrada ?? '',
      horaSalida: d.asistencia?.horaSalida ?? '',
      jornalRealizado: d.asistencia?.jornalRealizado ?? '',
      observaciones: d.asistencia?.observaciones ?? '',
      saving: false,
      error: '',
      guardado: false,
    }));
  } finally {
    loading.value = false;
  }
}

onMounted(cargar);
watch(fecha, cargar);

async function guardarFila(fila: Fila) {
  fila.error = '';
  fila.guardado = false;
  fila.saving = true;
  try {
    await trabajadoresApi.crearAsistencia(fila.trabajadorId, {
      fecha: fecha.value,
      estado: fila.estado,
      horaEntrada: fila.horaEntrada || undefined,
      horaSalida: fila.horaSalida || undefined,
      jornalRealizado: fila.jornalRealizado ? Number(fila.jornalRealizado) : undefined,
      observaciones: fila.observaciones || undefined,
      confirmar: true,
    });
    fila.guardado = true;
  } catch (error) {
    fila.error = isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar.')
      : 'No se pudo guardar.';
  } finally {
    fila.saving = false;
  }
}
</script>

<template>
  <div class="asistencia-view">
    <SectionCard title="Asistencia del día">
      <template #actions>
        <button type="button" class="asistencia-view__link-btn" @click="router.push('/trabajadores')">
          ← Volver a Trabajadores
        </button>
      </template>

      <div class="asistencia-view__field">
        <label>Fecha</label>
        <input v-model="fecha" type="date" />
      </div>

      <div v-if="loading" class="asistencia-view__muted">Cargando…</div>
      <div v-else-if="filas.length === 0" class="asistencia-view__muted">No hay trabajadores activos.</div>
      <template v-else>
        <div class="asistencia-view__table-head">
          <span>Trabajador</span><span>Estado</span><span>Entrada</span><span>Salida</span><span>Jornal</span><span></span>
        </div>
        <div v-for="fila in filas" :key="fila.trabajadorId" class="asistencia-view__row">
          <div class="asistencia-view__cell-nombre">
            <div class="asistencia-view__bold">{{ fila.nombre }}</div>
            <div class="asistencia-view__muted">{{ fila.cargo }}</div>
          </div>
          <select v-model="fila.estado">
            <option v-for="(label, valor) in ESTADO_LABELS" :key="valor" :value="valor">{{ label }}</option>
          </select>
          <input v-model="fila.horaEntrada" type="time" />
          <input v-model="fila.horaSalida" type="time" />
          <input v-model="fila.jornalRealizado" type="number" min="0" step="0.5" placeholder="—" />
          <button type="button" class="asistencia-view__save-btn" :disabled="fila.saving" @click="guardarFila(fila)">
            {{ fila.saving ? '…' : fila.guardado ? '✓' : 'Guardar' }}
          </button>
          <div v-if="fila.error" class="asistencia-view__row-error">{{ fila.error }}</div>
        </div>
      </template>
    </SectionCard>
  </div>
</template>

<style scoped lang="scss">
.asistencia-view {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;

  &__link-btn {
    background: transparent;
    border: none;
    color: var(--color-primary);
    font-weight: 700;
    font-size: 0.78rem;
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-width: 220px;

    label {
      font-size: 0.7rem;
      font-weight: 700;
      color: rgba(40, 54, 24, 0.6);
    }

    input {
      border: 1.5px solid #efead1;
      border-radius: 12px;
      padding: 0.6rem 0.85rem;
      font-size: 0.82rem;
      background: var(--color-white);
      font-family: inherit;
    }
  }

  &__table-head {
    display: grid;
    grid-template-columns: 1.6fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr;
    gap: 0.6rem;
    padding: 0 0.4rem 0.5rem;
    font-size: 0.66rem;
    font-weight: 700;
    color: rgba(40, 54, 24, 0.45);
    text-transform: uppercase;
  }

  &__row {
    display: grid;
    grid-template-columns: 1.6fr 1.2fr 0.8fr 0.8fr 0.7fr 0.7fr;
    gap: 0.6rem;
    padding: 0.6rem 0.4rem;
    border-top: 1px solid #f2efdd;
    align-items: center;
    position: relative;

    select,
    input {
      border: 1.5px solid #efead1;
      border-radius: 10px;
      padding: 0.45rem 0.6rem;
      font-size: 0.78rem;
      background: var(--color-white);
      font-family: inherit;
      width: 100%;
    }
  }

  &__cell-nombre {
    min-width: 0;
  }

  &__save-btn {
    background: var(--color-primary);
    color: var(--color-bg);
    border: none;
    border-radius: 999px;
    padding: 0.5rem 0.7rem;
    font-weight: 700;
    font-size: 0.75rem;
    cursor: pointer;
    font-family: inherit;

    &:disabled {
      opacity: 0.6;
      cursor: progress;
    }
  }

  &__row-error {
    grid-column: 1 / -1;
    color: var(--color-warn);
    font-size: 0.72rem;
    font-weight: 600;
  }

  &__muted {
    color: rgba(40, 54, 24, 0.55);
    font-size: 0.78rem;
  }

  &__bold {
    font-weight: 700;
    font-size: 0.85rem;
  }
}
</style>
