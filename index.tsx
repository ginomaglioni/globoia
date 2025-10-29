
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { AplicacionComponent } from './src/aplicacion.component';
import { APP_ROUTES } from './src/app.routes';

bootstrapApplication(AplicacionComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(APP_ROUTES, withHashLocation()),
    importProvidersFrom(ReactiveFormsModule),
  ],
}).catch((err) => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.