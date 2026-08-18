<script setup lang="ts">
import { ref } from 'vue';
import AppIcon from '../../../shared/components/AppIcon.vue';

defineProps<{ modelValue: string; placeholder?: string; error?: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();

const visible = ref(false);
</script>

<template>
  <div class="password-input">
    <input
      :type="visible ? 'text' : 'password'"
      class="password-input__field"
      :class="{ 'password-input__field--error': error }"
      :placeholder="placeholder ?? '••••••••'"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      class="password-input__toggle"
      :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      @click="visible = !visible"
    >
      <AppIcon :name="visible ? 'eye-off' : 'eye'" :size="16" />
    </button>
    <div v-if="error" class="password-input__error">{{ error }}</div>
  </div>
</template>

<style scoped lang="scss">
.password-input {
  position: relative;

  &__field {
    width: 100%;
    border: 1.5px solid var(--color-border);
    border-radius: 12px;
    padding: 0.75rem 2.6rem 0.75rem 0.9rem;
    font-size: 0.85rem;
    background: var(--color-bg);
    font-family: inherit;
    box-sizing: border-box;

    &--error {
      border-color: var(--color-warn);
    }
  }

  &__toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 0;
    display: flex;
    color: rgba(40, 54, 24, 0.5);
    cursor: pointer;
  }

  &__error {
    margin-top: 0.35rem;
    font-size: 0.7rem;
    color: var(--color-warn);
  }
}
</style>
