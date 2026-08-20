import { http } from '../../../shared/api/http';

export type TipoProductoSanitario = 'VACUNA' | 'ANTIPARASITARIO' | 'MEDICAMENTO' | 'OTRO';

export interface ProductoSanitario {
  id: string;
  tenantId: string;
  nombre: string;
  tipo: TipoProductoSanitario;
  dosisRecomendada: string | null;
  intervaloRefuerzoDias: number | null;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface AplicacionSanitaria {
  id: string;
  tenantId: string;
  animalId: string;
  productoId: string;
  fecha: string;
  dosisAplicada: string | null;
  responsableId: string;
  proximaFechaEsperada: string | null;
  observaciones: string | null;
  createdAt: string;
  producto: ProductoSanitario;
  responsable: { id: string; nombre: string };
}

export interface AlertaSanitaria extends AplicacionSanitaria {
  animal: { id: string; identificador: string };
  vencido: boolean;
}

export interface CrearProductoPayload {
  nombre: string;
  tipo: TipoProductoSanitario;
  dosisRecomendada?: string;
  intervaloRefuerzoDias?: number;
}

export interface CrearAplicacionPayload {
  animalId: string;
  productoId: string;
  fecha: string;
  dosisAplicada?: string;
  observaciones?: string;
}

export const sanidadApi = {
  listarProductos() {
    return http.get<ProductoSanitario[]>('/sanidad/productos').then((r) => r.data);
  },
  crearProducto(payload: CrearProductoPayload) {
    return http.post<ProductoSanitario>('/sanidad/productos', payload).then((r) => r.data);
  },
  crearAplicacion(payload: CrearAplicacionPayload) {
    return http.post<AplicacionSanitaria>('/sanidad/aplicaciones', payload).then((r) => r.data);
  },
  listar() {
    return http
      .get<(AplicacionSanitaria & { animal: { id: string; identificador: string } })[]>(
        '/sanidad/aplicaciones',
      )
      .then((r) => r.data);
  },
  historialAnimal(animalId: string) {
    return http
      .get<AplicacionSanitaria[]>(`/sanidad/aplicaciones/animal/${animalId}`)
      .then((r) => r.data);
  },
  alertas() {
    return http.get<AlertaSanitaria[]>('/sanidad/alertas').then((r) => r.data);
  },
};
