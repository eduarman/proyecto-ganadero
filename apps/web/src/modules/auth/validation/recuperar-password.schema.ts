import * as yup from 'yup';

export const recuperarPasswordSchema = yup.object({
  email: yup.string().required('El correo es obligatorio').email('Ingresa un correo válido'),
});
