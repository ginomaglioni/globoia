import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Casillero } from '../../models/models';

// Defines the enriched locker type used in this component
type CasilleroEnriquecido = Casillero & { nombreSocio: string };

@Component({
  selector: 'app-casilleros',
  standalone: true,
  templateUrl: './casilleros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CasillerosComponent {
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);

  casilleros = this.dataService.casillerosEnriquecidos;
  
  // Only show members who do not currently have a locker assigned
  sociosDisponibles = computed(() => {
    const sociosConCasillero = new Set(
        this.dataService.casilleros()
            .filter(c => c.idSocio != null)
            .map(c => c.idSocio)
    );
    return this.dataService.socios().filter(s => !sociosConCasillero.has(s.id));
  });
  
  // --- Asignar/Liberar Modal State ---
  modalGestionAbierto = signal(false);
  casilleroSeleccionado = signal<CasilleroEnriquecido | null>(null);
  idSocioParaAsignar = signal<number | null>(null);
  modoModalGestion = signal<'asignar' | 'ver_ocupado' | null>(null);
  confirmandoLiberacion = signal(false);

  // --- CRUD Modal State ---
  modalCRUDAbierto = signal(false);
  casilleroEditando = signal<CasilleroEnriquecido | null>(null);

  // --- Delete Modal State ---
  modalEliminarAbierto = signal(false);
  casilleroParaEliminar = signal<CasilleroEnriquecido | null>(null);

  // --- Form Definition ---
  formularioCasillero = this.fb.group({
    costoAlquiler: [0, [Validators.required, Validators.min(0)]],
    estado: ['Disponible' as 'Disponible' | 'Ocupado' | 'Mantenimiento', Validators.required]
  });

  /**
   * Opens the management modal for assigning or viewing an occupied locker.
   * @param casillero The locker to manage.
   */
  gestionarCasillero(casillero: CasilleroEnriquecido) {
    if (casillero.estado === 'Mantenimiento') return;

    this.casilleroSeleccionado.set(casillero);
    if (casillero.estado === 'Disponible') {
      this.idSocioParaAsignar.set(null); // Reset selection
      this.modoModalGestion.set('asignar');
    } else { // 'Ocupado' state
      this.modoModalGestion.set('ver_ocupado');
    }
    this.modalGestionAbierto.set(true);
  }

  cerrarModalGestion() {
    this.modalGestionAbierto.set(false);
    this.casilleroSeleccionado.set(null);
    this.modoModalGestion.set(null);
    this.confirmandoLiberacion.set(false);
  }

  asignarCasillero() {
    const idCasillero = this.casilleroSeleccionado()?.id;
    const idSocio = this.idSocioParaAsignar();
    if (idCasillero && idSocio) {
      this.dataService.asignarCasillero(idCasillero, idSocio);
      this.cerrarModalGestion();
    }
  }

  iniciarLiberacion() {
    this.confirmandoLiberacion.set(true);
  }

  cancelarLiberacion() {
    this.confirmandoLiberacion.set(false);
  }

  confirmarLiberacion() {
    const casillero = this.casilleroSeleccionado();
    if (!casillero) return;
    
    this.dataService.liberarCasillero(casillero.id);
    this.cerrarModalGestion();
  }

  // --- CRUD Methods ---
  abrirModalCRUD(casillero: CasilleroEnriquecido | null) {
    this.casilleroEditando.set(casillero);
    if (casillero) {
      this.formularioCasillero.patchValue({
        costoAlquiler: casillero.costoAlquiler,
        estado: casillero.estado,
      });
      if (casillero.estado === 'Ocupado') {
        this.formularioCasillero.get('estado')?.disable();
      } else {
        this.formularioCasillero.get('estado')?.enable();
      }
    } else {
      this.formularioCasillero.reset({
        costoAlquiler: 500,
        estado: 'Disponible'
      });
      this.formularioCasillero.get('estado')?.enable();
    }
    this.modalCRUDAbierto.set(true);
  }

  cerrarModalCRUD() {
    this.modalCRUDAbierto.set(false);
    this.casilleroEditando.set(null);
  }

  guardarCasillero() {
    if (this.formularioCasillero.invalid) return;

    const valorFormulario = this.formularioCasillero.getRawValue();
    const editando = this.casilleroEditando();

    if (editando) {
      const casilleroActualizado = {
        id: editando.id,
        costoAlquiler: valorFormulario.costoAlquiler!,
        estado: valorFormulario.estado!,
      };
      this.dataService.updateCasillero(casilleroActualizado);
    } else {
      this.dataService.addCasillero({
        costoAlquiler: valorFormulario.costoAlquiler!,
      });
    }
    this.cerrarModalCRUD();
  }

  iniciarEliminacion(casillero: CasilleroEnriquecido) {
    if (casillero.estado === 'Ocupado') return;
    this.casilleroParaEliminar.set(casillero);
    this.modalEliminarAbierto.set(true);
  }

  cancelarEliminacion() {
    this.modalEliminarAbierto.set(false);
    this.casilleroParaEliminar.set(null);
  }

  confirmarEliminacion() {
    const casillero = this.casilleroParaEliminar();
    if (casillero) {
      this.dataService.deleteCasillero(casillero.id);
      this.cancelarEliminacion();
    }
  }
}