import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutenticacionService } from '../../services/autenticacion.service';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-cobrador-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cobrador-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CobradorDashboardComponent {
  private autenticacionService = inject(AutenticacionService);
  private dataService = inject(DataService);

  cobrador = this.autenticacionService.usuarioActual;

  // Central computed signal for all view data
  private vistaCobrador = computed(() => {
    const cobradorActual = this.cobrador();
    if (!cobradorActual) {
      return {
        estadisticas: { totalRecaudado: 0, comisionGanada: 0, cobranzasPendientes: 0 },
        listaSocios: [],
        pagosRecientes: []
      };
    }
    
    // 1. Find zones and members for the current collector
    const zonasDelCobradorIds = this.dataService.zonasCobranza()
      .filter(z => z.cobradorAsignado === cobradorActual.nombreCompleto)
      .map(z => z.id);
    
    const sociosEnZonas = this.dataService.socios()
      .filter(s => zonasDelCobradorIds.includes(s.idZonaCobranza));

    const todosLosCupones = this.dataService.cupones();

    // 2. Create the main list of members with their latest coupon status
    const listaSocios = sociosEnZonas.map(socio => {
        const cuponesSocio = todosLosCupones
            .filter(c => c.idSocio === socio.id)
            .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
        
        const ultimoCupon = cuponesSocio.length > 0 ? cuponesSocio[0] : null;

        return {
            idSocio: socio.id,
            nombreSocio: `${socio.apellido}, ${socio.nombre}`,
            ultimoCupon: ultimoCupon
        };
    }).sort((a,b) => {
        const statusOrder: { [key: string]: number } = { 'Vencido': 1, 'Impago': 2, 'Pagado': 3 };
        const getStatusPriority = (item: { ultimoCupon: { estado: string } | null }) => {
            if (!item.ultimoCupon) return 4; // Lowest priority if no coupon
            return statusOrder[item.ultimoCupon.estado as keyof typeof statusOrder] ?? 4;
        };
        
        const priorityA = getStatusPriority(a);
        const priorityB = getStatusPriority(b);
        
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return a.nombreSocio.localeCompare(b.nombreSocio);
    });

    // 3. Calculate statistics
    const pagos = this.dataService.pagos()
        .filter(p => p.cobrador === cobradorActual.nombreCompleto)
        .sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

    const totalRecaudado = pagos.reduce((acc, p) => acc + p.importePagado, 0);
    const comisionGanada = pagos.reduce((acc, p) => acc + p.comisionCobrador, 0);
    const cobranzasPendientes = listaSocios.filter(s => s.ultimoCupon && (s.ultimoCupon.estado === 'Impago' || s.ultimoCupon.estado === 'Vencido')).length;

    const estadisticas = { totalRecaudado, comisionGanada, cobranzasPendientes };
    const pagosRecientes = pagos.slice(0, 10);

    return { estadisticas, listaSocios, pagosRecientes };
  });

  // Data exposed to the template
  estadisticas = computed(() => this.vistaCobrador().estadisticas);
  listaSociosCobranza = computed(() => this.vistaCobrador().listaSocios);
  pagosRecientes = computed(() => this.vistaCobrador().pagosRecientes);

  registrarPago(idCupon: number) {
    const cobradorActual = this.cobrador();
    if (cobradorActual) {
      this.dataService.registrarPago(idCupon, cobradorActual.nombreCompleto);
    } else {
        console.error("No hay un cobrador logueado para registrar el pago.");
    }
  }
}
