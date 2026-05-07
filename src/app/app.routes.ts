import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // Use in-memory signal (set synchronously by storeSession) with sessionStorage as fallback
  const isLoggedIn = auth.isLoggedIn() || !!sessionStorage.getItem('access_token');
  return isLoggedIn ? true : router.createUrlTree(['/home']);
};

export const routes: Routes = [
  { path: 'home',          loadComponent: () => import('./features/landing/landing').then(m => m.LandingComponent) },
  { path: 'login',         loadComponent: () => import('./features/login/login').then(m => m.LoginComponent) },
  { path: 'oauth-callback',  loadComponent: () => import('./features/oauth-callback/oauth-callback').then(m => m.OAuthCallbackComponent) },
  { path: 'oauth2/success',  loadComponent: () => import('./features/oauth-callback/oauth-callback').then(m => m.OAuthCallbackComponent) },
  { path: 'choose-role',   loadComponent: () => import('./features/choose-role/choose-role').then(m => m.ChooseRoleComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '',                  redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',         loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'slots',             loadComponent: () => import('./features/slots/slots').then(m => m.SlotsComponent) },
      { path: 'vehicle',           loadComponent: () => import('./features/vehicle-panel/vehicle-panel').then(m => m.VehiclePanelComponent) },
      { path: 'analytics',         loadComponent: () => import('./features/analytics/analytics').then(m => m.AnalyticsComponent) },
      { path: 'bookings',          loadComponent: () => import('./features/bookings/bookings').then(m => m.BookingsComponent) },
      { path: 'notifications',     loadComponent: () => import('./features/notifications/notifications').then(m => m.NotificationsComponent) },
      { path: 'profile',           loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent) },
      { path: 'users',             loadComponent: () => import('./features/users/users').then(m => m.UsersComponent) },
      { path: 'send-notification', loadComponent: () => import('./features/send-notification/send-notification').then(m => m.SendNotificationComponent) },
    ]
  },
  { path: '**', redirectTo: 'home' }
];
