export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tipo: string;
  username: string;
  nombreCompleto: string;
  rol: string;
  userId: number;
}

export interface UsuarioResponse {
  id: number;
  nombreCompleto: string;
  username: string;
  rol: string;
  activo: boolean;
  createdAt: string;
  ultimoAcceso: string;
}

export interface HabitacionResponse {
  id: number;
  piso: number;
  numero: string;
  tipo: string;
  precioNoche: number;
  estado: string;
  activo: boolean;
}

export interface ClienteResponse {
  id: number;
  nombreCompleto: string;
  telefono: string;
  documento: string;
  email: string;
  createdAt: string;
  estado: string;
  totalEstancias: number;
  ultimaEstancia: string;
  lealtad: string;
}

export interface ReservaResponse {
  id: number;
  clienteId: number;
  clienteNombre: string;
  clienteTelefono: string;
  habitacionId: number;
  habitacionNumero: string;
  habitacionTipo: string;
  habitacionPrecio: number;
  usuarioId: number;
  usuarioNombre: string;
  fechaEntrada: string;
  fechaSalida: string;
  fechaReserva: string;
  estado: string;
  montoTotal: number;
  montoAdelanto: number;
  metodoAdelanto: string;
  referenciaPago: string;
  observacion: string;
}

export interface HospedajeResponse {
  id: number;
  clienteId: number;
  clienteNombre: string;
  clienteTelefono: string;
  habitacionId: number;
  habitacionNumero: string;
  habitacionTipo: string;
  habitacionPiso: number;
  habitacionPrecio: number;
  reservaId: number;
  usuarioId: number;
  usuarioNombre: string;
  fechaIngreso: string;
  fechaSalidaProgramada: string;
  fechaSalidaReal: string;
  estado: string;
  totalPagado: number;
  deudaPendiente: number;
}

export interface PagoResponse {
  id: number;
  reservaId: number;
  hospedajeId: number;
  usuarioId: number;
  usuarioNombre: string;
  monto: number;
  metodo: string;
  referencia: string;
  tipo: string;
  fechaPago: string;
  observacion: string;
}

export interface IncidenciaResponse {
  id: number;
  habitacionId: number;
  habitacionNumero: string;
  habitacionPiso: number;
  usuarioId: number;
  usuarioNombre: string;
  tipo: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export interface GenericResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface ResponseAuth {
  type: string;
  listMessage: string[];
  loginResponse?: any;
}

export interface ResponseCliente {
  type: string;
  listMessage: string[];
  listCliente: any[];
}

export interface ResponseHabitacion {
  type: string;
  listMessage: string[];
  listHabitacion: any[];
}

export interface ResponseReserva {
  type: string;
  listMessage: string[];
  listReserva: any[];
}

export interface ResponseHospedaje {
  type: string;
  listMessage: string[];
  listHospedaje: any[];
}

export interface ResponseConsumo {
  type: string;
  listMessage: string[];
  listConsumo: any[];
}

export interface ResponsePago {
  type: string;
  listMessage: string[];
  listPago: any[];
}

export interface ResponseIncidencia {
  type: string;
  listMessage: string[];
  listIncidencia: any[];
}

export interface ResponseUsuario {
  type: string;
  listMessage: string[];
  listUsuario: any[];
}

export interface ParametroResponse {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  modulo: string;
  editable: boolean;
}

export interface ResponseParametro {
  type: string;
  listMessage: string[];
  listParametro: any[];
}

export interface ResponseReporte {
  type: string;
  listMessage: string[];
  reporte?: any;
  listReporte?: any[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  type: string;
  message: string;
}

export function toGenericResponse<T>(raw: any, dataField: string | ((raw: any) => T)): GenericResponse<T> {
  const data = typeof dataField === 'function' ? dataField(raw) : raw?.[dataField] ?? null;
  return {
    success: raw?.type === 'success',
    message: raw?.listMessage?.join(', ') || '',
    data,
    errors: []
  };
}
