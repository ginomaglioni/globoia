import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
// FIX: Correct model import path.
import { Usuario, Rol } from '../models/models';
// FIX: Correct service name and path to DataService and data.service.ts
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  // FIX: Inject DataService instead of DatosService
  private dataService = inject(DataService);
  private router = inject(Router);

  usuarioActual = signal<Usuario | null>(null);

  constructor() {
    // FIX: Check for a logged-in user in local storage on service initialization to persist session.
    const usuarioGuardado = localStorage.getItem('usuarioActual');
    if (usuarioGuardado) {
      this.usuarioActual.set(JSON.parse(usuarioGuardado));
    }
  }

  login(nombreUsuario: string, contrasena: string): boolean {
    const usuarios = this.dataService.usuarios();
    const usuario = usuarios.find(u => u.nombreUsuario === nombreUsuario && u.contrasena === contrasena);
    
    if (usuario) {
      this.usuarioActual.set(usuario);
      localStorage.setItem('usuarioActual', JSON.stringify(usuario));
      return true;
    }
    
    return false;
  }

  logout(): void {
    this.usuarioActual.set(null);
    localStorage.removeItem('usuarioActual');
    this.router.navigate(['/invitado']);
  }

  estaAutenticado(): boolean {
    return this.usuarioActual() !== null;
  }

  tieneRol(rolRequerido: Rol): boolean {
    return this.usuarioActual()?.rol === rolRequerido;
  }
}
