import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: 'DRIVER' | 'MANAGER' | 'ADMIN';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = '/api/v1/auth';

  currentUser = signal<AuthUser | null>(this.loadUser());
  token = signal<string | null>(localStorage.getItem('access_token'));

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.token.set(res.accessToken);
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    const token = this.token();
    if (token) {
      this.http.post(`${this.API}/logout`, {}).subscribe();
    }
    localStorage.clear();
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  selectRole(role: 'DRIVER' | 'MANAGER'): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(`${this.API}/role`, { role }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.token.set(res.accessToken);
        this.currentUser.set(res.user);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.token();
  }

  getAuthHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.token()}` };
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
