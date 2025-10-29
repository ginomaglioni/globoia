import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutenticacionService } from '../../services/autenticacion.service';
import { DataService } from '../../services/data.service';
import { Casillero } from '../../models/models';

@Component({
  selector: 'app-socio-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './socio-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocioDashboardComponent {
  private autenticacionService = inject(AutenticacionService);
  private dataService = inject(DataService);

  usuario = this.autenticacionService.usuarioActual;

  // Modal state
  actividadParaBaja = signal<{id: number, nombre: string} | null>(null);
  modalConfirmacionAbierto = signal(false);
  casilleroParaAlquilar = signal<Casillero | null>(null);
  modalAlquilerAbierto = signal(false);
  modalCasillerosDisponiblesAbierto = signal(false);

  // Enriched data for the socio's view
  datosSocio = computed(() => {
    const usuarioActual = this.usuario();
    if (!usuarioActual || !usuarioActual.idSocio) {
      return {
        socio: null,
        categoria: null,
        casillero: null,
        cupones: [],
        actividadesInscritoIds: new Set<number>(),
      };
    }

    const socio = this.dataService.socios().find(s => s.id === usuarioActual.idSocio);
    if (!socio) {
      return {
        socio: null,
        categoria: null,
        casillero: null,
        cupones: [],
        actividadesInscritoIds: new Set<number>(),
      };
    }

    const categoria = this.dataService.categorias().find(c => c.id === socio.idCategoria);
    const casillero = this.dataService.casilleros().find(c => c.idSocio === socio.id);
    
    const cupones = this.dataService.cupones()
      .filter(c => c.idSocio === socio.id)
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes);

    const ultimoCupon = cupones.length > 0 ? cupones[0] : null;
    const actividadesInscritoIds = new Set(ultimoCupon?.detalle.actividades.map(a => a.id) || []);

    return {
      socio,
      categoria,
      casillero,
      cupones,
      actividadesInscritoIds
    };
  });

  // Data exposed to the template
  socio = computed(() => this.datosSocio().socio);
  categoria = computed(() => this.datosSocio().categoria);
  casillero = computed(() => this.datosSocio().casillero);
  cupones = computed(() => this.datosSocio().cupones);
  
  actividadesDisponibles = computed(() => {
      const actividadesInscritoIds = this.datosSocio().actividadesInscritoIds;
      return this.dataService.actividades().map(actividad => ({
          ...actividad,
          inscrito: actividadesInscritoIds.has(actividad.id)
      }));
  });
  
  casillerosDisponibles = computed(() => {
    return this.dataService.casilleros().filter(c => c.estado === 'Disponible');
  });

  tieneFacturaImpaga = computed(() => {
    const cuponesSocio = this.cupones();
    if (cuponesSocio.length === 0) return false;
    const ultimoCupon = cuponesSocio[0];
    return ultimoCupon.estado === 'Impago' || ultimoCupon.estado === 'Vencido';
  });
  
  inscribir(idActividad: number): void {
      const socio = this.socio();
      if (socio && !socio.moroso) {
          this.dataService.inscribirSocioEnActividad(socio.id, idActividad);
      }
  }

  iniciarBaja(actividad: {id: number, nombre: string}): void {
      this.actividadParaBaja.set(actividad);
      this.modalConfirmacionAbierto.set(true);
  }

  cancelarBaja(): void {
      this.actividadParaBaja.set(null);
      this.modalConfirmacionAbierto.set(false);
  }

  confirmarBaja(): void {
      const socioId = this.socio()?.id;
      const actividad = this.actividadParaBaja();
      if (socioId && actividad) {
          this.dataService.darDeBajaSocioDeActividad(socioId, actividad.id);
      }
      this.cancelarBaja();
  }

  abrirModalCasillerosDisponibles(): void {
    this.modalCasillerosDisponiblesAbierto.set(true);
  }

  cerrarModalCasillerosDisponibles(): void {
    this.modalCasillerosDisponiblesAbierto.set(false);
  }

  iniciarAlquiler(casillero: Casillero): void {
    this.casilleroParaAlquilar.set(casillero);
    this.modalAlquilerAbierto.set(true);
  }

  cancelarAlquiler(): void {
    this.casilleroParaAlquilar.set(null);
    this.modalAlquilerAbierto.set(false);
  }

  confirmarAlquiler(): void {
    const socioId = this.socio()?.id;
    const casillero = this.casilleroParaAlquilar();
    if (socioId && casillero) {
        this.dataService.alquilarCasillero(socioId, casillero.id);
    }
    this.cancelarAlquiler();
    this.cerrarModalCasillerosDisponibles();
  }
}
