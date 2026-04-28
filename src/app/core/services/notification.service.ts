import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Notification } from '../models/parking.models';
import { AuthService } from './auth.service';

interface Page<T> { content: T[]; totalElements: number; totalPages: number; }
interface UnreadCountResponse { unreadCount: number; }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API = '/api/v1/notifications';
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  unreadCount  = signal(0);
  notifications = signal<Notification[]>([]);

  private get uid() { return this.auth.currentUser()?.userId; }

  getMyNotifications(): Observable<Notification[]> {
    return this.http.get<Page<Notification>>(`${this.API}/recipient/${this.uid}`).pipe(
      map(page => page.content ?? [])
    );
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<UnreadCountResponse>(`${this.API}/recipient/${this.uid}/unread-count`).pipe(
      map(r => r.unreadCount ?? 0)
    );
  }

  markRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.API}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.API}/recipient/${this.uid}/read-all`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  getAllNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.API}/admin/all`);
  }

  sendBulk(body: {
    recipientIds: number[];
    title: string;
    message: string;
    type: string;
    channel: string;
  }): Observable<void> {
    return this.http.post<void>(`${this.API}/bulk`, body);
  }

  pollUnread() {
    if (!this.uid) return;
    this.getUnreadCount().subscribe({ next: n => this.unreadCount.set(n), error: () => {} });
  }
}
