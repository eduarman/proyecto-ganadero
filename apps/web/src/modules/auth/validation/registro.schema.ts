import * as yup from 'yup';

// Misma regla que apps/api/.../dto/registro.dto.ts (US-4.2): mínimo 8
// caracteres, al menos una mayúscula y un número.
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

export const registroSchema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  email: yup.string().required('El correo es obligatorio').email('Ingresa un correo válido'),
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(PASSWORD_REGEX, 'La contraseña debe incluir al menos una mayúscula y un número'),
});
