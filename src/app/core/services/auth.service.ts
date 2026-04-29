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
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = '/api/v1/auth';

  currentUser = signal<AuthUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, { email, password }, { withCredentials: true }).pipe(
      tap(res => {
        sessionStorage.setItem('user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.API}/logout`, {}, { withCredentials: true }).subscribe();
    sessionStorage.clear();
    this.currentUser.set(null);
    window.location.href = '/login';
  }

  selectRole(role: 'DRIVER' | 'MANAGER'): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(`${this.API}/role`, { role }, { withCredentials: true }).pipe(
      tap(res => {
        sessionStorage.setItem('user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }

  private loadUser(): AuthUser | null {
    const raw = sessionStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}
