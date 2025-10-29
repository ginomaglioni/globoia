// Defines the data models used throughout the application.

export type Rol = 'Administrador' | 'Socio' | 'Cobrador';

export interface Usuario {
  id: number;
  nombreUsuario: string;
  contrasena: string; // In a real app, this would be a hash
  nombreCompleto: string;
  rol: Rol;
  idSocio?: number; // Link to a Socio if the role is 'Socio'
}

export interface Categoria {
  id: number;
  nombre: string;
  cuotaMensual: number;
}

export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  genero: 'Masculino' | 'Femenino' | 'Otro';
  antiguedad: number; // in years
  telefono: string;
  email: string;
  idCategoria: number;
  idZonaCobranza: number;
  moroso: boolean;
}

export interface Actividad {
  id: number;
  nombre: string;
  costo: number;
  horario: 'Matutino' | 'Vespertino' | 'Nocturno';
}

export interface Casillero {
  id: number;
  costoAlquiler: number;
  estado: 'Disponible' | 'Ocupado' | 'Mantenimiento';
  idSocio?: number;
}

export interface ZonaCobranza {
  id: number;
  nombre: string;
  cobradorAsignado: string;
}

export interface CuponDetalle {
    cuotaSocial: number;
    actividades: {id: number, costo: number}[];
    alquilerCasillero: number;
}

export interface CuponCobranza {
  id: number;
  idSocio: number;
  mes: number;
  anio: number;
  fechaVencimiento: string;
  importeTotal: number;
  estado: 'Pagado' | 'Impago' | 'Vencido';
  recargo: number;
  detalle: CuponDetalle;
}

export interface Pago {
  id: number;
  idCupon: number;
  fechaPago: string;
  importePagado: number;
  comisionCobrador: number;
  cobrador: string;
}
