import { Injectable, signal } from '@angular/core';
import { Socio, Actividad, Casillero, CategoriaSocio, EstadoPago, ZonaCobranza, TurnoActividad, Usuario, Rol } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // --- AUTHENTICATION ---
  private usuarios: Usuario[] = [
    { id: 1, email: 'admin', rol: 'administrador' },
    { id: 2, email: 'perez@elglobo.com', rol: 'cobrador', zonaCobranza: 1 },
    { id: 3, email: 'socio@elglobo.com', rol: 'socio', socioId: 1001 },
  ];
  usuarioActual = signal<Usuario | null>(null);

  login(email: string, contrasena: string): Promise<Usuario | null> {
    // Mock login - in a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const usuarioEncontrado = this.usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        let passwordValida = false;
        if (usuarioEncontrado) {
          if (usuarioEncontrado.rol === 'administrador') {
            passwordValida = contrasena === 'admin';
          } else {
            passwordValida = contrasena === '1234';
          }
        }

        if (usuarioEncontrado && passwordValida) {
          this.usuarioActual.set(usuarioEncontrado);
          resolve(usuarioEncontrado);
        } else {
          resolve(null);
        }
      }, 500);
    });
  }

  logout(): void {
    this.usuarioActual.set(null);
  }

  // --- CLUB DATA ---
  private actividades: Actividad[] = [
    { id: 1, nombre: 'Fútbol', costo: 3000, turno: 'Tarde', instructor: 'Carlos Tevez' },
    { id: 2, nombre: 'Tenis', costo: 4500, turno: 'Mañana', instructor: 'Juan M. del Potro' },
    { id: 3, nombre: 'Natación', costo: 4000, turno: 'Noche', instructor: 'José Meolans' },
    { id: 4, nombre: 'Gimnasio', costo: 3500, turno: 'Mañana', instructor: 'Maria Garcia' },
    { id: 5, nombre: 'Yoga', costo: 2500, turno: 'Tarde', instructor: 'Elena Suarez' },
    { id: 6, nombre: 'Básquet', costo: 3200, turno: 'Noche', instructor: 'Manu Ginobili' },
  ];

  private socios: Socio[] = this.generarSocios(50);
  private casilleros: Casillero[] = Array.from({ length: 100 }, (_, i) => ({ id: i + 1, socioId: null }));

  constructor() {
    // Assign some lockers to members
    this.socios.forEach((socio, index) => {
        if(index < 20) {
            socio.casilleroId = this.casilleros[index].id;
            this.casilleros[index].socioId = socio.id;
        }
    });
  }

  obtenerActividades = signal<Actividad[]>(this.actividades);
  obtenerSocios = signal<Socio[]>(this.socios);
  obtenerCasilleros = signal<Casillero[]>(this.casilleros);

  private generarSocios(count: number): Socio[] {
    const nombres = ['Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofia', 'Diego', 'Lucia'];
    const apellidos = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres'];
    const socios: Socio[] = [];

    for (let i = 0; i < count; i++) {
        const nombre = nombres[Math.floor(Math.random() * nombres.length)];
        const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
        const anioNacimiento = 1950 + Math.floor(Math.random() * 55);
        const anioIngreso = 1990 + Math.floor(Math.random() * 34);
        const fechaNacimiento = new Date(anioNacimiento, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const fechaIngreso = new Date(anioIngreso, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        
        const edad = new Date().getFullYear() - fechaNacimiento.getFullYear();
        const antiguedad = new Date().getFullYear() - fechaIngreso.getFullYear();

        let categoria: CategoriaSocio;
        if (edad > 60 && antiguedad > 30) {
            categoria = 'VITALICIO';
        } else if (edad < 18) {
            categoria = 'CADETE';
        } else {
            categoria = Math.random() > 0.5 ? 'ACTIVO MASCULINO' : 'ACTIVO FEMENINO';
        }

        if (i % 10 === 0) {
             categoria = 'GRUPO FAMILIAR';
        }

        const opcionesEstadoPago: EstadoPago[] = ['Al día', 'Adeuda 1 mes', 'Moroso'];
        const estadoPago = opcionesEstadoPago[Math.floor(Math.random() * opcionesEstadoPago.length)];

        socios.push({
            id: 1001 + i,
            nombre,
            apellido,
            fechaNacimiento,
            fechaIngreso,
            categoria,
            zonaCobranza: (i % 4) as ZonaCobranza,
            actividades: this.obtenerActividadesAleatorias(),
            casilleroId: null,
            estadoPago,
            email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}@example.com`,
            telefono: `341-${Math.floor(1000000 + Math.random() * 9000000)}`,
            avatarUrl: `https://i.pravatar.cc/150?u=${1001 + i}`
        });
    }
    return socios;
  }
  
  private obtenerActividadesAleatorias(): number[] {
    const actividadesSeleccionadas: number[] = [];
    const numActividades = Math.floor(Math.random() * 3) + 1;
    const mezcladas = [...this.actividades].sort(() => 0.5 - Math.random());
    for(let i = 0; i < numActividades; i++) {
      actividadesSeleccionadas.push(mezcladas[i].id);
    }
    return actividadesSeleccionadas;
  }
}
