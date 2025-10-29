
import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
// FIX: Correct service name and path to DataService and data.service.ts
import { DataService } from '../../services/data.service';
import { CuponCobranza, Socio } from '../../models/models';

@Component({
  selector: 'app-cobranzas',
  // FIX: Make component standalone as it's loaded via routing.
  standalone: true,
  templateUrl: './cobranzas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class CobranzasComponent {
  // FIX: Inject DataService instead of DatosService
  private dataService = inject(DataService);

  cupones = this.dataService.cupones;
  socios = this.dataService.socios;
  
  cuponesEnriquecidos = computed(() => {
      const allCupones = this.cupones();
      const allSocios = this.socios();
      return allCupones.map(cupon => {
          const socio = allSocios.find(s => s.id === cupon.idSocio);
          return {
              ...cupon,
              nombreSocio: socio ? `${socio.apellido}, ${socio.nombre}` : 'Socio no encontrado'
          };
      }).sort((a,b) => b.anio - a.anio || b.mes - a.mes || a.idSocio - b.idSocio);
  });
  
  generarCupones() {
      if(confirm('Esto generará los cupones para el mes actual para todos los socios. ¿Desea continuar?')) {
          alert('Funcionalidad de generación de cupones no implementada en esta demo.');
          // TODO: Implement logic to iterate through socios, calculate totals and create new CuponCobranza objects.
      }
  }

  reemitirConRecargo(cupon: ReturnType<typeof this.cuponesEnriquecidos>[number]) {
      if(confirm(`Re-emitir el cupón de ${cupon.nombreSocio} con un 5% de recargo?`)) {
          alert('Funcionalidad de re-emisión no implementada en esta demo.');
          // TODO: Update cupon with 5% surcharge
      }
  }
}
