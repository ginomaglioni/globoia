import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DataService } from './services/data.service';
import { Socio, VistaAdmin, Actividad, Casillero, Rol } from './models';

type ClaveOrden = 'nombre' | 'id' | 'zona' | 'categoria' | 'antiguedad';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private dataService = inject(DataService);

  // --- Authentication State ---
  usuarioActual = this.dataService.usuarioActual;
  mostrandoLogin = signal(false);
  cargandoLogin = signal(false);
  email = signal('');
  contrasena = signal('');
  errorLogin = signal('');

  // --- Application State ---
  vistaActual = signal<VistaAdmin>('dashboard');
  socios = this.dataService.obtenerSocios;
  actividades = this.dataService.obtenerActividades;
  casilleros = this.dataService.obtenerCasilleros;
  socioSeleccionado = signal<Socio | null>(null);
  
  // --- Sorting and Filtering for Members ---
  terminoFiltro = signal<string>('');
  claveOrden = signal<ClaveOrden>('nombre');
  direccionOrden = signal<'asc' | 'desc'>('asc');

  // --- Computed values ---
  totalSocios = computed(() => this.socios().length);
  sociosMorosos = computed(() => this.socios().filter(s => s.estadoPago === 'Adeuda 1 mes' || s.estadoPago === 'Moroso').length);
  casillerosOcupados = computed(() => this.casilleros().filter(l => l.socioId !== null).length);

  socioLogueado = computed(() => {
    const usuario = this.usuarioActual();
    if (usuario?.rol === 'socio' && usuario.socioId) {
      return this.socios().find(s => s.id === usuario.socioId);
    }
    return null;
  });

  sociosFiltradosYOrdenados = computed(() => {
    const termino = this.terminoFiltro().toLowerCase();
    const clave = this.claveOrden();
    const direccion = this.direccionOrden();
    const usuario = this.usuarioActual();

    let sociosFiltrados = this.socios();

    // Filter by collector's zone if user is a collector
    if (usuario?.rol === 'cobrador') {
        sociosFiltrados = sociosFiltrados.filter(s => s.zonaCobranza === usuario.zonaCobranza);
    }
    
    // Filter by search term
    if (termino) {
        sociosFiltrados = sociosFiltrados.filter(socio =>
            `${socio.nombre} ${socio.apellido}`.toLowerCase().includes(termino) ||
            socio.id.toString().includes(termino) ||
            socio.email.toLowerCase().includes(termino)
        );
    }

    // Sort
    return sociosFiltrados.sort((a, b) => {
      let valA: string | number | Date;
      let valB: string | number | Date;

      switch (clave) {
        case 'nombre':
          valA = `${a.nombre} ${a.apellido}`;
          valB = `${b.nombre} ${b.apellido}`;
          break;
        case 'id':
          valA = a.id;
          valB = b.id;
          break;
        case 'zona':
          valA = a.zonaCobranza;
          valB = b.zonaCobranza;
          break;
        case 'categoria':
          valA = a.categoria;
          valB = b.categoria;
          break;
        case 'antiguedad':
          valA = a.fechaIngreso;
          valB = b.fechaIngreso;
          break;
      }
      
      if (valA < valB) return direccion === 'asc' ? -1 : 1;
      if (valA > valB) return direccion === 'asc' ? 1 : -1;
      return 0;
    });
  });
  
  // --- Methods ---
  async intentarLogin(): Promise<void> {
    if (!this.email() || !this.contrasena()) {
      this.errorLogin.set('Por favor, ingrese usuario y contraseña.');
      return;
    }
    this.cargandoLogin.set(true);
    this.errorLogin.set('');
    const usuario = await this.dataService.login(this.email(), this.contrasena());
    if (usuario) {
      this.mostrandoLogin.set(false);
      // Set initial view based on role
      switch(usuario.rol) {
        case 'socio': this.vistaActual.set('mi-perfil'); break;
        case 'cobrador': this.vistaActual.set('socios'); break;
        default: this.vistaActual.set('dashboard'); break;
      }
    } else {
      this.errorLogin.set('Usuario o contraseña incorrectos.');
    }
    this.cargandoLogin.set(false);
  }

  cerrarSesion(): void {
    this.dataService.logout();
    this.email.set('');
    this.contrasena.set('');
    this.errorLogin.set('');
  }
  
  cambiarVista(vista: VistaAdmin): void {
    this.vistaActual.set(vista);
  }

  manejarCambioFiltro(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.terminoFiltro.set(input.value);
  }

  ordenarPor(clave: ClaveOrden): void {
    if (this.claveOrden() === clave) {
      this.direccionOrden.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.claveOrden.set(clave);
      this.direccionOrden.set('asc');
    }
  }

  verDetallesSocio(socio: Socio): void {
    this.socioSeleccionado.set(socio);
  }

  cerrarModal(): void {
    this.socioSeleccionado.set(null);
  }
  
  obtenerActividadesDeSocio(socio: Socio): Actividad[] {
    return this.actividades().filter(act => socio.actividades.includes(act.id));
  }

  obtenerCasilleroDeSocio(socio: Socio): Casillero | undefined {
    return this.casilleros().find(l => l.id === socio.casilleroId);
  }

  obtenerCobradorPorZona(zona: number): string {
    switch(zona) {
        case 0: return 'Pago en club';
        case 1: return 'Sr. Pérez';
        case 2: return 'Sr. García';
        case 3: return 'Sr. Rodríguez';
        default: return 'N/A';
    }
  }
}
