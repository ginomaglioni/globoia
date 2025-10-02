export type CategoriaSocio = 'CADETE' | 'ACTIVO MASCULINO' | 'ACTIVO FEMENINO' | 'VITALICIO' | 'GRUPO FAMILIAR';
export type ZonaCobranza = 0 | 1 | 2 | 3;
export type EstadoPago = 'Al día' | 'Adeuda 1 mes' | 'Moroso';
export type TurnoActividad = 'Mañana' | 'Tarde' | 'Noche';

// VistaAdmin is for the internal dashboard views
export type VistaAdmin = 'dashboard' | 'socios' | 'actividades' | 'cobranzas' | 'casilleros' | 'mi-perfil';
export type Rol = 'administrador' | 'cobrador' | 'socio';

export interface Usuario {
  id: number;
  email: string;
  rol: Rol;
  // Optional fields depending on role
  socioId?: number; 
  zonaCobranza?: ZonaCobranza;
}

export interface Actividad {
  id: number;
  nombre: string;
  costo: number;
  turno: TurnoActividad;
  instructor: string;
}

export interface Casillero {
  id: number;
  socioId: number | null;
}

export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  fechaIngreso: Date;
  categoria: CategoriaSocio;
  zonaCobranza: ZonaCobranza;
  actividades: number[]; // Array of activity IDs
  casilleroId: number | null;
  estadoPago: EstadoPago;
  email: string;
  telefono: string;
  avatarUrl: string;
}