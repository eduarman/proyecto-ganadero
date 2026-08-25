import * as yup from 'yup';

// Misma regla que apps/api/.../dto/aceptar-invitacion.dto.ts.
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

export const aceptarInvitacionSchema = yup.object({
  nombre: yup.string().required('El nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(PASSWORD_REGEX, 'La contraseña debe incluir al menos una mayúscula y un número'),
});
