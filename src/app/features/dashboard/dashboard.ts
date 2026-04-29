import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { DriverDashboardComponent } from './driver/driver-dashboard';
import { ManagerDashboardComponent } from './manager/manager-dashboard';
import { AdminDashboardComponent } from './admin/admin-dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DriverDashboardComponent, ManagerDashboardComponent, AdminDashboardComponent],
  template: `
    @if (role === 'DRIVER')  { <app-driver-dashboard /> }
    @else if (role === 'MANAGER') { <app-manager-dashboard /> }
    @else if (role === 'ADMIN')   { <app-admin-dashboard /> }
  `
})
export class DashboardComponent {
  private auth = inject(AuthService);
  role = this.auth.currentUser()?.role ?? 'DRIVER';
}
