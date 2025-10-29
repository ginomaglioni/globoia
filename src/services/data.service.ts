import { Injectable, signal, computed } from '@angular/core';
import { 
  Usuario, 
  Socio, 
  Actividad, 
  Casillero, 
  CuponCobranza, 
  Pago, 
  Categoria, 
  ZonaCobranza
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private _usuarios = signal<Usuario[]>([]);
  private _categorias = signal<Categoria[]>([]);
  private _socios = signal<Socio[]>([]);
  private _actividades = signal<Actividad[]>([]);
  private _casilleros = signal<Casillero[]>([]);
  private _zonasCobranza = signal<ZonaCobranza[]>([]);
  private _cupones = signal<CuponCobranza[]>([]);
  private _pagos = signal<Pago[]>([]);

  // Public readonly signals
  public readonly usuarios = this._usuarios.asReadonly();
  public readonly categorias = this._categorias.asReadonly();
  public readonly socios = this._socios.asReadonly();
  public readonly actividades = this._actividades.asReadonly();
  public readonly casilleros = this._casilleros.asReadonly();
  public readonly zonasCobranza = this._zonasCobranza.asReadonly();
  public readonly cupones = this._cupones.asReadonly();
  public readonly pagos = this._pagos.asReadonly();

  constructor() {
    this.cargarDatosIniciales();
  }

  // --- Computed signals for enriched data ---
  public sociosEnriquecidos = computed(() => {
    const socios = this.socios();
    const categorias = this.categorias();
    const categoriaMap = new Map(categorias.map(c => [c.id, c.nombre]));
    return socios.map(socio => ({
      ...socio,
      nombreCategoria: categoriaMap.get(socio.idCategoria) || 'Sin Categoría'
    }));
  });

  public casillerosEnriquecidos = computed(() => {
    const casilleros = this.casilleros();
    const socios = this.socios();
    const socioMap = new Map(socios.map(s => [s.id, `${s.apellido}, ${s.nombre}`]));
    return casilleros.map(casillero => ({
      ...casillero,
      nombreSocio: casillero.idSocio ? socioMap.get(casillero.idSocio) || 'Socio no encontrado' : ''
    }));
  });

  // --- Methods to modify data ---
  public addSocio(socio: Omit<Socio, 'id'>): void {
    this._socios.update(socios => {
        const newId = socios.length > 0 ? Math.max(...socios.map(s => s.id)) + 1 : 1;
        return [...socios, { ...socio, id: newId }];
    });
  }

  public updateSocio(socioActualizado: Socio): void {
      this._socios.update(socios => socios.map(s => s.id === socioActualizado.id ? socioActualizado : s));
  }

  public deleteSocio(id: number): void {
      this._socios.update(socios => socios.filter(s => s.id !== id));
  }

  public addActividad(actividad: Omit<Actividad, 'id'>): void {
    this._actividades.update(actividades => {
      const newId = actividades.length > 0 ? Math.max(...actividades.map(a => a.id)) + 1 : 1;
      return [...actividades, { ...actividad, id: newId }];
    });
  }

  public updateActividad(actividadActualizada: Actividad): void {
    this._actividades.update(actividades => 
      actividades.map(a => a.id === actividadActualizada.id ? actividadActualizada : a)
    );
  }
  
  public deleteActividad(id: number): void {
    this._actividades.update(actividades => actividades.filter(a => a.id !== id));
  }
  
  public addCasillero(casillero: { costoAlquiler: number }): void {
    this._casilleros.update(casilleros => {
      const newId = casilleros.length > 0 ? Math.max(...casilleros.map(c => c.id)) + 1 : 101;
      const nuevoCasillero: Casillero = {
        id: newId,
        costoAlquiler: casillero.costoAlquiler,
        estado: 'Disponible',
      };
      return [...casilleros, nuevoCasillero];
    });
  }

  public updateCasillero(casilleroActualizado: Pick<Casillero, 'id' | 'costoAlquiler' | 'estado'>): void {
    this._casilleros.update(casilleros => casilleros.map(c => 
      c.id === casilleroActualizado.id 
        ? { ...c, costoAlquiler: casilleroActualizado.costoAlquiler, estado: casilleroActualizado.estado } 
        : c
    ));
  }
  
  public deleteCasillero(id: number): void {
    const casillero = this._casilleros().find(c => c.id === id);
    if (casillero && casillero.estado === 'Ocupado') {
        console.error("No se puede eliminar un casillero ocupado.");
        return;
    }
    this._casilleros.update(casilleros => casilleros.filter(c => c.id !== id));
  }

  public asignarCasillero(idCasillero: number, idSocio: number): void {
    this._casilleros.update(casilleros => casilleros.map(c => 
      c.id === idCasillero ? { ...c, idSocio, estado: 'Ocupado' } : c
    ));
  }

  public liberarCasillero(idCasillero: number): void {
    this._casilleros.update(casilleros => casilleros.map(c => 
      c.id === idCasillero ? { ...c, idSocio: undefined, estado: 'Disponible' } : c
    ));
  }

  public alquilarCasillero(idSocio: number, idCasillero: number): void {
    const socio = this.socios().find(s => s.id === idSocio);
    const casillero = this.casilleros().find(c => c.id === idCasillero && c.estado === 'Disponible');
    if (!socio || !casillero) return;

    this.asignarCasillero(idCasillero, idSocio);

    const cuponesSocio = this._cupones()
      .filter(c => c.idSocio === idSocio)
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
    const ultimoCupon = cuponesSocio.length > 0 ? cuponesSocio[0] : null;

    if (ultimoCupon && ultimoCupon.estado === 'Impago') {
      this._cupones.update(cupones =>
        cupones.map(c => {
          if (c.id === ultimoCupon.id) {
            return {
              ...c,
              importeTotal: c.importeTotal + casillero.costoAlquiler,
              detalle: { ...c.detalle, alquilerCasillero: casillero.costoAlquiler }
            };
          }
          return c;
        })
      );
    } else {
      const { mes: proximoMes, anio: proximoAnio } = this.obtenerSiguientePeriodo(
        ultimoCupon?.mes || new Date().getMonth(),
        ultimoCupon?.anio || new Date().getFullYear()
      );

      const cuponSiguienteExistente = cuponesSocio.find(c => c.mes === proximoMes && c.anio === proximoAnio);
      if (cuponSiguienteExistente) {
        this._cupones.update(cupones =>
          cupones.map(c => {
            if (c.id === cuponSiguienteExistente.id) {
              return {
                ...c,
                importeTotal: c.importeTotal + casillero.costoAlquiler,
                detalle: { ...c.detalle, alquilerCasillero: casillero.costoAlquiler }
              };
            }
            return c;
          })
        );
        return;
      }
      
      const categoriaSocio = this.categorias().find(cat => cat.id === socio.idCategoria);
      const cuotaSocial = categoriaSocio?.cuotaMensual || 0;
      const actividades = ultimoCupon?.detalle.actividades || [];
      const costoActividades = actividades.reduce((sum, act) => sum + act.costo, 0);

      const nuevoCupon: CuponCobranza = {
        id: this._cupones().length > 0 ? Math.max(...this._cupones().map(c => c.id)) + 1 : 1,
        idSocio,
        mes: proximoMes,
        anio: proximoAnio,
        fechaVencimiento: `${proximoAnio}-${String(proximoMes).padStart(2, '0')}-10`,
        estado: 'Impago',
        recargo: 0,
        detalle: { cuotaSocial, alquilerCasillero: casillero.costoAlquiler, actividades },
        importeTotal: cuotaSocial + casillero.costoAlquiler + costoActividades
      };
      this._cupones.update(cupones => [...cupones, nuevoCupon]);
    }
  }
  
  public registrarPago(idCupon: number, nombreCobrador: string): void {
    const cupon = this.cupones().find(c => c.id === idCupon);
    if (!cupon) {
        console.error(`Cupón con ID ${idCupon} no encontrado.`);
        return;
    }

    this._cupones.update(cupones => cupones.map(c => 
      c.id === idCupon ? { ...c, estado: 'Pagado' } : c
    ));
    
    this._pagos.update(pagos => {
        const newId = pagos.length > 0 ? Math.max(...pagos.map(p => p.id)) + 1 : 1;
        const comision = cupon.importeTotal * 0.05; // 5% commission
        const nuevoPago: Pago = {
            id: newId,
            idCupon,
            fechaPago: new Date().toISOString().split('T')[0],
            importePagado: cupon.importeTotal,
            comisionCobrador: comision,
            cobrador: nombreCobrador
        };
        return [...pagos, nuevoPago];
    });
  }

  private obtenerSiguientePeriodo(mes: number, anio: number): { mes: number, anio: number } {
    if (mes === 12) {
      return { mes: 1, anio: anio + 1 };
    }
    return { mes: mes + 1, anio: anio };
  }

  public inscribirSocioEnActividad(idSocio: number, idActividad: number): void {
    const socio = this.socios().find(s => s.id === idSocio);
    const actividad = this.actividades().find(a => a.id === idActividad);
    if (!socio || !actividad) return;

    const cuponesSocio = this._cupones()
      .filter(c => c.idSocio === idSocio)
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
    const ultimoCupon = cuponesSocio.length > 0 ? cuponesSocio[0] : null;

    if (ultimoCupon && ultimoCupon.estado === 'Impago') {
      const yaInscrito = ultimoCupon.detalle.actividades.some(a => a.id === idActividad);
      if (yaInscrito) return;

      this._cupones.update(cupones =>
        cupones.map(c => {
          if (c.id === ultimoCupon.id) {
            return {
              ...c,
              importeTotal: c.importeTotal + actividad.costo,
              detalle: { ...c.detalle, actividades: [...c.detalle.actividades, { id: actividad.id, costo: actividad.costo }] }
            };
          }
          return c;
        })
      );
    } else {
      const { mes: proximoMes, anio: proximoAnio } = this.obtenerSiguientePeriodo(
        ultimoCupon?.mes || new Date().getMonth(),
        ultimoCupon?.anio || new Date().getFullYear()
      );

      const yaExisteCuponSiguiente = cuponesSocio.some(c => c.mes === proximoMes && c.anio === proximoAnio);
      if (yaExisteCuponSiguiente) {
        alert('Ya existe un cupón generado para el próximo período. La gestión se habilitará cuando se pague el actual.');
        return;
      }

      const categoriaSocio = this.categorias().find(cat => cat.id === socio.idCategoria);
      const casilleroSocio = this.casilleros().find(cas => cas.idSocio === idSocio);
      const cuotaSocial = categoriaSocio?.cuotaMensual || 0;
      const alquilerCasillero = casilleroSocio?.costoAlquiler || 0;
      const actividadesBase = ultimoCupon?.detalle.actividades.filter(a => a.id !== idActividad) || [];
      const nuevasActividades = [...actividadesBase, { id: actividad.id, costo: actividad.costo }];
      const costoActividades = nuevasActividades.reduce((sum, act) => sum + act.costo, 0);

      const nuevoCupon: CuponCobranza = {
        id: this._cupones().length > 0 ? Math.max(...this._cupones().map(c => c.id)) + 1 : 1,
        idSocio,
        mes: proximoMes,
        anio: proximoAnio,
        fechaVencimiento: `${proximoAnio}-${String(proximoMes).padStart(2, '0')}-10`,
        estado: 'Impago',
        recargo: 0,
        detalle: { cuotaSocial, alquilerCasillero, actividades: nuevasActividades },
        importeTotal: cuotaSocial + alquilerCasillero + costoActividades
      };
      this._cupones.update(cupones => [...cupones, nuevoCupon]);
    }
  }

  public darDeBajaSocioDeActividad(idSocio: number, idActividad: number): void {
    const socio = this.socios().find(s => s.id === idSocio);
    const actividad = this.actividades().find(a => a.id === idActividad);
    if (!socio || !actividad) return;

    const cuponesSocio = this._cupones()
      .filter(c => c.idSocio === idSocio)
      .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
    const ultimoCupon = cuponesSocio.length > 0 ? cuponesSocio[0] : null;

    if (!ultimoCupon) return;

    if (ultimoCupon.estado === 'Impago') {
      const estaInscrito = ultimoCupon.detalle.actividades.some(a => a.id === idActividad);
      if (!estaInscrito) return;

      this._cupones.update(cupones =>
        cupones.map(c => {
          if (c.id === ultimoCupon.id) {
            return {
              ...c,
              importeTotal: c.importeTotal - actividad.costo,
              detalle: { ...c.detalle, actividades: c.detalle.actividades.filter(a => a.id !== idActividad) }
            };
          }
          return c;
        })
      );
    } else {
       const { mes: proximoMes, anio: proximoAnio } = this.obtenerSiguientePeriodo(
        ultimoCupon.mes,
        ultimoCupon.anio
      );

      const yaExisteCuponSiguiente = cuponesSocio.some(c => c.mes === proximoMes && c.anio === proximoAnio);
      if (yaExisteCuponSiguiente) {
        alert('Ya existe un cupón generado para el próximo período. La gestión se habilitará cuando se pague el actual.');
        return;
      }

      const categoriaSocio = this.categorias().find(cat => cat.id === socio.idCategoria);
      const casilleroSocio = this.casilleros().find(cas => cas.idSocio === idSocio);
      const cuotaSocial = categoriaSocio?.cuotaMensual || 0;
      const alquilerCasillero = casilleroSocio?.costoAlquiler || 0;
      const nuevasActividades = ultimoCupon.detalle.actividades.filter(a => a.id !== idActividad);
      const costoActividades = nuevasActividades.reduce((sum, act) => sum + act.costo, 0);

      const nuevoCupon: CuponCobranza = {
        id: this._cupones().length > 0 ? Math.max(...this._cupones().map(c => c.id)) + 1 : 1,
        idSocio,
        mes: proximoMes,
        anio: proximoAnio,
        fechaVencimiento: `${proximoAnio}-${String(proximoMes).padStart(2, '0')}-10`,
        estado: 'Impago',
        recargo: 0,
        detalle: { cuotaSocial, alquilerCasillero, actividades: nuevasActividades },
        importeTotal: cuotaSocial + alquilerCasillero + costoActividades
      };
      this._cupones.update(cupones => [...cupones, nuevoCupon]);
    }
  }

  private cargarDatosIniciales(): void {
    const categorias: Categoria[] = [
      { id: 1, nombre: 'Cadete', cuotaMensual: 2500 },
      { id: 2, nombre: 'Activo', cuotaMensual: 4000 },
      { id: 3, nombre: 'Jubilado', cuotaMensual: 2000 },
    ];
    this._categorias.set(categorias);

    const zonas: ZonaCobranza[] = [
      { id: 1, nombre: 'Zona Centro', cobradorAsignado: 'Carlos Rodriguez' },
      { id: 2, nombre: 'Zona Norte', cobradorAsignado: 'Carlos Rodriguez' },
      { id: 3, nombre: 'Zona Sur', cobradorAsignado: 'Laura Fernandez' },
    ];
    this._zonasCobranza.set(zonas);
    
    const socios: Socio[] = [
      { id: 1, nombre: 'Juan', apellido: 'Perez', fechaNacimiento: '1985-05-20', genero: 'Masculino', antiguedad: 10, telefono: '123456789', email: 'juan.perez@email.com', idCategoria: 2, idZonaCobranza: 1, moroso: false },
      { id: 2, nombre: 'Maria', apellido: 'Gomez', fechaNacimiento: '1992-08-15', genero: 'Femenino', antiguedad: 5, telefono: '987654321', email: 'maria.gomez@email.com', idCategoria: 2, idZonaCobranza: 2, moroso: true },
      { id: 3, nombre: 'Pedro', apellido: 'Martinez', fechaNacimiento: '2005-01-30', genero: 'Masculino', antiguedad: 2, telefono: '555111222', email: 'pedro.martinez@email.com', idCategoria: 1, idZonaCobranza: 1, moroso: false },
      { id: 4, nombre: 'Ana', apellido: 'Lopez', fechaNacimiento: '1950-11-10', genero: 'Femenino', antiguedad: 25, telefono: '333444555', email: 'ana.lopez@email.com', idCategoria: 3, idZonaCobranza: 3, moroso: false },
    ];
    this._socios.set(socios);

    const usuarios: Usuario[] = [
      { id: 1, nombreUsuario: 'admin', contrasena: 'admin', nombreCompleto: 'Administrador General', rol: 'Administrador' },
      { id: 2, nombreUsuario: 'jperez', contrasena: '1234', nombreCompleto: 'Juan Perez', rol: 'Socio', idSocio: 1 },
      { id: 3, nombreUsuario: 'mgomez', contrasena: '1234', nombreCompleto: 'Maria Gomez', rol: 'Socio', idSocio: 2 },
      { id: 4, nombreUsuario: 'crodriguez', contrasena: 'cobranza', nombreCompleto: 'Carlos Rodriguez', rol: 'Cobrador' },
      { id: 5, nombreUsuario: 'lfernandez', contrasena: 'cobranza', nombreCompleto: 'Laura Fernandez', rol: 'Cobrador' },
    ];
    this._usuarios.set(usuarios);

    const actividades: Actividad[] = [
        { id: 1, nombre: 'Natación', costo: 1500, horario: 'Matutino' },
        { id: 2, nombre: 'Fútbol', costo: 1200, horario: 'Vespertino' },
        { id: 3, nombre: 'Tenis', costo: 1800, horario: 'Matutino' },
        { id: 4, nombre: 'Gimnasio', costo: 2000, horario: 'Nocturno' },
        { id: 5, nombre: 'Yoga', costo: 1300, horario: 'Vespertino' },
    ];
    this._actividades.set(actividades);

    const casilleros: Casillero[] = [
        { id: 101, costoAlquiler: 500, estado: 'Ocupado', idSocio: 1 },
        { id: 102, costoAlquiler: 500, estado: 'Disponible' },
        { id: 103, costoAlquiler: 500, estado: 'Mantenimiento' },
        { id: 201, costoAlquiler: 750, estado: 'Disponible' },
        { id: 202, costoAlquiler: 750, estado: 'Ocupado', idSocio: 4 },
    ];
    this._casilleros.set(casilleros);
    
    const cupones: CuponCobranza[] = [
      { id: 1, idSocio: 1, mes: 6, anio: 2024, fechaVencimiento: '2024-07-10', importeTotal: 8000, estado: 'Pagado', recargo: 0, detalle: { cuotaSocial: 4000, actividades: [{id: 1, costo: 1500}, {id:4, costo: 2000}], alquilerCasillero: 500 }},
      { id: 2, idSocio: 2, mes: 6, anio: 2024, fechaVencimiento: '2024-07-10', importeTotal: 5200, estado: 'Vencido', recargo: 0, detalle: { cuotaSocial: 4000, actividades: [{id: 2, costo: 1200}], alquilerCasillero: 0 }},
      { id: 3, idSocio: 3, mes: 6, anio: 2024, fechaVencimiento: '2024-07-10', importeTotal: 2500, estado: 'Impago', recargo: 0, detalle: { cuotaSocial: 2500, actividades: [], alquilerCasillero: 0 }},
      { id: 4, idSocio: 4, mes: 6, anio: 2024, fechaVencimiento: '2024-07-10', importeTotal: 3050, estado: 'Pagado', recargo: 0, detalle: { cuotaSocial: 2000, actividades: [], alquilerCasillero: 750 }},
      { id: 5, idSocio: 1, mes: 5, anio: 2024, fechaVencimiento: '2024-06-10', importeTotal: 8000, estado: 'Pagado', recargo: 0, detalle: { cuotaSocial: 4000, actividades: [{id: 1, costo: 1500}, {id:4, costo: 2000}], alquilerCasillero: 500 }},
    ];
    this._cupones.set(cupones);
    
    const pagos: Pago[] = [
      { id: 1, idCupon: 1, fechaPago: '2024-07-05', importePagado: 8000, comisionCobrador: 400, cobrador: 'Carlos Rodriguez' },
      { id: 2, idCupon: 4, fechaPago: '2024-07-08', importePagado: 3050, comisionCobrador: 152.5, cobrador: 'Laura Fernandez' },
      { id: 3, idCupon: 5, fechaPago: '2024-06-02', importePagado: 8000, comisionCobrador: 400, cobrador: 'Carlos Rodriguez' },
    ];
    this._pagos.set(pagos);
  }
}