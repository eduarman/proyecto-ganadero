import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().required('El correo es obligatorio').email('Ingresa un correo válido'),
  password: yup.string().required('La contraseña es obligatoria'),
});
