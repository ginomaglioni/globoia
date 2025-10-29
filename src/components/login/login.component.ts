import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionService } from '../../services/autenticacion.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  // FIX: Explicitly type the injected FormBuilder to resolve a TypeScript error where the compiler could not infer its type.
  private fb: FormBuilder = inject(FormBuilder);
  private router = inject(Router);
  private autenticacionService = inject(AutenticacionService);

  errorLogin = signal<string | null>(null);

  formularioLogin = this.fb.group({
    nombreUsuario: ['', Validators.required],
    contrasena: ['', Validators.required],
  });

  iniciarSesion() {
    this.errorLogin.set(null);
    if (this.formularioLogin.invalid) {
      return;
    }

    const { nombreUsuario, contrasena } = this.formularioLogin.value;

    if (this.autenticacionService.login(nombreUsuario!, contrasena!)) {
      const rol = this.autenticacionService.usuarioActual()?.rol;
      
      // Redirigir basado en el rol
      switch (rol) {
        case 'Administrador':
          this.router.navigate(['/panel']);
          break;
        case 'Socio':
          this.router.navigate(['/portal-socio']);
          break;
        case 'Cobrador':
          this.router.navigate(['/portal-cobrador']);
          break;
        default:
          this.router.navigate(['/invitado']);
      }
    } else {
      this.errorLogin.set('Nombre de usuario o contraseña incorrectos.');
    }
  }
}