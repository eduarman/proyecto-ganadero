import { http } from '../../../shared/api/http';

export type TipoProductoSanitario = 'VACUNA' | 'ANTIPARASITARIO' | 'MEDICAMENTO' | 'OTRO';
export type EstadoProtocoloSanitario = 'ACTIVO' | 'INACTIVO';
export type Especie = 'BOVINO' | 'BUFALINO';
export type SexoAnimal = 'MACHO' | 'HEMBRA';
export type GravedadDiagnostico = 'LEVE' | 'MODERADA' | 'GRAVE';

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

export type TipoAlertaSanitaria = 'REFUERZO' | 'PROTOCOLO';

export interface AlertaSanitaria {
  id: string;
  tipo: TipoAlertaSanitaria;
  producto: { id: string; nombre: string };
  animal: { id: string; identificador: string };
  proximaFechaEsperada: string | null;
  vencido: boolean;
}

export interface ProtocoloSanitario {
  id: string;
  tenantId: string;
  nombre: string;
  productoId: string;
  edadInicioDias: number | null;
  frecuenciaDias: number | null;
  especie: Especie | null;
  sexo: SexoAnimal | null;
  categoria: string | null;
  estado: EstadoProtocoloSanitario;
  producto: ProductoSanitario;
}

export interface DiagnosticoSanitario {
  id: string;
  tenantId: string;
  animalId: string;
  fecha: string;
  condicion: string;
  gravedad: GravedadDiagnostico;
  tratamientoAplicacionId: string | null;
  createdAt: string;
  tratamiento: (AplicacionSanitaria & { producto: ProductoSanitario }) | null;
}

export interface Cuarentena {
  id: string;
  tenantId: string;
  animalId: string;
  fechaInicio: string;
  fechaFinEstimada: string | null;
  fechaFinReal: string | null;
  motivo: string;
  activa: boolean;
  animal: { id: string; identificador: string };
}

export interface ListaAplicaciones {
  data: (AplicacionSanitaria & { animal: { id: string; identificador: string } })[];
  total: number;
  page: number;
  limit: number;
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

export interface CrearAplicacionLotePayload {
  productoId: string;
  fecha: string;
  animalIds: string[];
  dosisAplicada?: string;
  observaciones?: string;
}

export interface CrearProtocoloPayload {
  nombre: string;
  productoId: string;
  edadInicioDias?: number;
  frecuenciaDias?: number;
  especie?: Especie;
  sexo?: SexoAnimal;
  categoria?: string;
}

export interface CrearDiagnosticoPayload {
  animalId: string;
  fecha: string;
  condicion: string;
  gravedad: GravedadDiagnostico;
  tratamientoAplicacionId?: string;
}

export interface CrearCuarentenaPayload {
  animalId: string;
  fechaInicio: string;
  fechaFinEstimada?: string;
  motivo: string;
}

export const sanidadApi = {
  listarProductos() {
    return http.get<ProductoSanitario[]>('/sanidad/productos').then((r) => r.data);
  },
  crearProducto(payload: CrearProductoPayload) {
    return http.post<ProductoSanitario>('/sanidad/productos', payload).then((r) => r.data);
  },
  listarProtocolos() {
    return http.get<ProtocoloSanitario[]>('/sanidad/protocolos').then((r) => r.data);
  },
  crearProtocolo(payload: CrearProtocoloPayload) {
    return http.post<ProtocoloSanitario>('/sanidad/protocolos', payload).then((r) => r.data);
  },
  actualizarProtocolo(id: string, payload: Partial<CrearProtocoloPayload> & { estado?: EstadoProtocoloSanitario }) {
    return http.patch<ProtocoloSanitario>(`/sanidad/protocolos/${id}`, payload).then((r) => r.data);
  },
  crearAplicacion(payload: CrearAplicacionPayload) {
    return http.post<AplicacionSanitaria>('/sanidad/aplicaciones', payload).then((r) => r.data);
  },
  crearAplicacionLote(payload: CrearAplicacionLotePayload) {
    return http.post<AplicacionSanitaria[]>('/sanidad/aplicaciones/lote', payload).then((r) => r.data);
  },
  listar(params: { page?: number; limit?: number } = {}) {
    return http.get<ListaAplicaciones>('/sanidad/aplicaciones', { params }).then((r) => r.data);
  },
  historialAnimal(animalId: string) {
    return http
      .get<AplicacionSanitaria[]>(`/sanidad/aplicaciones/animal/${animalId}`)
      .then((r) => r.data);
  },
  crearDiagnostico(payload: CrearDiagnosticoPayload) {
    return http.post<DiagnosticoSanitario>('/sanidad/diagnosticos', payload).then((r) => r.data);
  },
  historialDiagnosticos(animalId: string) {
    return http.get<DiagnosticoSanitario[]>(`/sanidad/diagnosticos/animal/${animalId}`).then((r) => r.data);
  },
  iniciarCuarentena(payload: CrearCuarentenaPayload) {
    return http.post<Cuarentena>('/sanidad/cuarentenas', payload).then((r) => r.data);
  },
  finalizarCuarentena(id: string, fecha?: string) {
    return http.patch<Cuarentena>(`/sanidad/cuarentenas/${id}/finalizar`, { fecha }).then((r) => r.data);
  },
  listarCuarentenas(params: { activas?: boolean; animalId?: string } = {}) {
    return http.get<Cuarentena[]>('/sanidad/cuarentenas', { params }).then((r) => r.data);
  },
  alertas() {
    return http.get<AlertaSanitaria[]>('/sanidad/alertas').then((r) => r.data);
  },
};
