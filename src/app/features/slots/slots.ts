import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { DriverSlotsComponent } from './driver/driver-slots';
import { ManagerSlotsComponent } from './manager/manager-slots';
import { AdminSlotsComponent } from './admin/admin-slots';

@Component({
  selector: 'app-slots',
  standalone: true,
  imports: [DriverSlotsComponent, ManagerSlotsComponent, AdminSlotsComponent],
  template: `
    @if (role === 'DRIVER') {
      <app-driver-slots />
    } @else if (role === 'MANAGER') {
      <app-manager-slots />
    } @else if (role === 'ADMIN') {
      <app-admin-slots />
    }
  `
})
export class SlotsComponent {
  private auth = inject(AuthService);
  role = this.auth.currentUser()?.role ?? 'DRIVER';
}
