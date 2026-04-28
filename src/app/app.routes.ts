import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

const authGuard = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'slots',     loadComponent: () => import('./features/slots/slots').then(m => m.SlotsComponent) },
      { path: 'vehicle',   loadComponent: () => import('./features/vehicle-panel/vehicle-panel').then(m => m.VehiclePanelComponent) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics').then(m => m.AnalyticsComponent) },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
