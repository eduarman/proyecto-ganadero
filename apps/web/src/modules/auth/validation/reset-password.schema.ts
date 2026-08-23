import * as yup from 'yup';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;

export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(PASSWORD_REGEX, 'La contraseña debe incluir al menos una mayúscula y un número'),
  confirmarPassword: yup
    .string()
    .required('Confirmá la contraseña')
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
});
