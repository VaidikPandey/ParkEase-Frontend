import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  private http  = inject(HttpClient);
  private auth  = inject(AuthService);

  status = 'Completing sign in…';
  errMsg = '';

  ngOnInit() {
    const params      = this.route.snapshot.queryParamMap;
    const isNewUser   = params.get('isNewUser') === 'true';
    const pendingRole = sessionStorage.getItem('pending_oauth_role');
    sessionStorage.removeItem('pending_oauth_role');

    // Cookie is already set by backend — fetch profile to get user object
    this.status = 'Fetching your profile…';
    this.http.get<any>('/api/v1/auth/profile', { withCredentials: true }).subscribe({
      next: profile => {
        const user = {
          userId:   profile.userId,
          fullName: profile.fullName,
          email:    profile.email,
          role:     profile.role as 'DRIVER' | 'MANAGER' | 'ADMIN',
        };
        sessionStorage.setItem('user', JSON.stringify(user));
        this.auth.currentUser.set(user);

        if (isNewUser && pendingRole && (pendingRole === 'DRIVER' || pendingRole === 'MANAGER')) {
          this.status = 'Setting up your account…';
          this.auth.selectRole(pendingRole as 'DRIVER' | 'MANAGER').subscribe({
            next:  () => { window.location.href = '/dashboard'; },
            error: () => { window.location.href = '/dashboard'; },
          });
        } else {
          window.location.href = '/dashboard';
        }
      },
      error: () => {
        this.errMsg = 'Could not fetch your profile. Please try logging in again.';
        this.status = 'Sign in failed.';
      }
    });
  }
}
