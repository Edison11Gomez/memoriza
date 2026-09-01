import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules
} from '@angular/router';

import { provideIonicAngular } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular(),

    importProvidersFrom(
      IonicStorageModule.forRoot()
    ),

    provideRouter(
      routes,
      withPreloading(PreloadAllModules)
    )
  ]
};