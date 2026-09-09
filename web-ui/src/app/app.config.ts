import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiUrlInterceptor } from './core/interceptors/api-url.interceptor';
import { ContentStore } from './stores/content.store';

export function preloadContent(store: ContentStore) {
  return () => store.loadAll().toPromise();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: preloadContent,
      deps: [ContentStore],
      multi: true,
    },
  ],
};
