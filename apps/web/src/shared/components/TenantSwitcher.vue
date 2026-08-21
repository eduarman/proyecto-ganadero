<script setup lang="ts">
import { useAuthStore } from '../../stores/auth.store';

const auth = useAuthStore();

async function onChange(event: Event) {
  const negocioId = (event.target as HTMLSelectElement).value;
  if (negocioId && negocioId !== auth.negocioActivo?.id) {
    await auth.switchTenant(negocioId);
  }
}
</script>

<template>
  <select
    v-if="auth.negocios.length > 1"
    class="tenant-switcher"
    :value="auth.negocioActivo?.id"
    @change="onChange"
  >
    <option v-for="n in auth.negocios" :key="n.id" :value="n.id">{{ n.nombre }}</option>
  </select>
</template>

<style scoped lang="scss">
.tenant-switcher {
  border: 1.5px solid #efead1;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 700;
  background: var(--color-white);
  color: var(--color-dark);
  font-family: inherit;
  cursor: pointer;
  max-width: 160px;
}
</style>
