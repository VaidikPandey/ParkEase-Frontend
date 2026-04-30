import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../shared/components/sidebar/sidebar';
import { TopbarComponent } from '../shared/components/topbar/topbar';
import { ToastComponent } from '../shared/components/toast/toast';
import { NotificationService } from '../core/services/notification.service';
import { interval, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent],
  template: `
    <div class="flex h-[100dvh] overflow-hidden bg-bg relative">
      <!-- Ambient Cinematic Glows -->
      <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/5 blur-[120px] pointer-events-none"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[100px] pointer-events-none"></div>
      
      <app-sidebar class="relative z-20" />
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <app-topbar />
        <main class="flex-1 overflow-y-auto bg-transparent main-scroll relative">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast />
  `
})
export class ShellComponent implements OnInit, OnDestroy {
  private notif    = inject(NotificationService);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.notif.pollUnread();
    interval(30_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.notif.pollUnread());
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }
}
