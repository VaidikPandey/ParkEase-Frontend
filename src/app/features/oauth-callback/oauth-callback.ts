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
    const params       = this.route.snapshot.queryParamMap;
    const isNewUser    = params.get('isNewUser') === 'true';
    const userId       = params.get('userId');
    const email        = params.get('email');
    const fullName     = params.get('fullName');
    const role         = params.get('role') as 'DRIVER' | 'MANAGER' | 'ADMIN' | null;
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!userId || !email || !role || !accessToken) {
      this.status = 'Sign in failed.';
      this.errMsg = 'Incomplete response from server. Please try again.';
      return;
    }

    sessionStorage.setItem('access_token', accessToken);
    if (refreshToken) sessionStorage.setItem('refresh_token', refreshToken);
    const user = { userId: +userId, fullName: fullName ?? email, email, role };
    sessionStorage.setItem('user', JSON.stringify(user));
    this.auth.currentUser.set(user);

    const pendingRole = sessionStorage.getItem('pending_oauth_role') as 'DRIVER' | 'MANAGER' | null;
    sessionStorage.removeItem('pending_oauth_role');

    if (isNewUser && pendingRole && (pendingRole === 'DRIVER' || pendingRole === 'MANAGER')) {
      this.status = 'Setting up your account…';
      this.auth.selectRole(pendingRole).subscribe({
        next:  () => { window.location.href = '/dashboard'; },
        error: () => { window.location.href = '/dashboard'; },
      });
    } else {
      window.location.href = '/dashboard';
    }
  }
}
