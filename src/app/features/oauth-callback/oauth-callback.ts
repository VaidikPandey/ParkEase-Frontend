import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center gap-4"
         style="background:var(--bg-primary);">
      <div class="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
           style="border-color:var(--accent);border-top-color:transparent;"></div>
      <p style="font-size:15px;color:var(--text-secondary);">{{ status }}</p>
      @if (errMsg) {
        <p style="font-size:13px;color:#f4212e;max-width:320px;text-align:center;">{{ errMsg }}</p>
        <a href="/login" style="font-size:13px;color:var(--accent);text-decoration:none;">← Back to login</a>
      }
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private auth  = inject(AuthService);

  status = 'Completing sign in…';
  errMsg = '';

  ngOnInit() {
    const params        = this.route.snapshot.queryParamMap;
    const isNewUser     = params.get('isNewUser') === 'true';
    const refreshToken  = params.get('refreshToken');

    if (!refreshToken) {
      this.status = 'Sign in failed.';
      this.errMsg = 'Incomplete response from server. Please try again.';
      return;
    }

    const pendingRole = sessionStorage.getItem('pending_oauth_role') as 'DRIVER' | 'MANAGER' | null;
    sessionStorage.removeItem('pending_oauth_role');

    // Exchange the refresh token via gateway — this sets HttpOnly cookies on the gateway domain
    this.auth.refresh(refreshToken).subscribe({
      next: () => {
        if (isNewUser && pendingRole && (pendingRole === 'DRIVER' || pendingRole === 'MANAGER')) {
          this.status = 'Setting up your account…';
          this.auth.selectRole(pendingRole).subscribe({
            next:  () => { window.location.href = '/dashboard'; },
            error: () => { window.location.href = '/dashboard'; },
          });
        } else {
          window.location.href = '/dashboard';
        }
      },
      error: () => {
        this.status = 'Sign in failed.';
        this.errMsg = 'Could not establish session. Please try again.';
      }
    });
  }
}
