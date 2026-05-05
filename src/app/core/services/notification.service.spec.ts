import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  const mockUser = { userId: 1, fullName: 'Test', email: 't@t.com', role: 'DRIVER' as const };
  const mockAuth = { currentUser: signal(mockUser) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuth },
      ],
    });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should initialise with unreadCount 0', () => {
    expect(service.unreadCount()).toBe(0);
  });

  it('getMyNotifications() should GET notifications for current user', () => {
    service.getMyNotifications().subscribe();
    http.expectOne('/api/v1/notifications/recipient/1').flush({ content: [], totalElements: 0, totalPages: 0 });
  });

  it('getUnreadCount() should map unreadCount from response', () => {
    service.getUnreadCount().subscribe(n => expect(n).toBe(3));
    http.expectOne('/api/v1/notifications/recipient/1/unread-count').flush({ unreadCount: 3 });
  });

  it('markRead() should PATCH the notification', () => {
    service.markRead(5).subscribe();
    const req = http.expectOne('/api/v1/notifications/5/read');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('markAllRead() should PATCH read-all for user', () => {
    service.markAllRead().subscribe();
    const req = http.expectOne('/api/v1/notifications/recipient/1/read-all');
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('delete() should DELETE the notification', () => {
    service.delete(7).subscribe();
    const req = http.expectOne('/api/v1/notifications/7');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('getAllNotifications() should GET admin/all', () => {
    service.getAllNotifications().subscribe();
    http.expectOne('/api/v1/notifications/admin/all').flush([]);
  });

  it('pollUnread() should do nothing when user is null', () => {
    mockAuth.currentUser.set(null as any);
    service.pollUnread();
    http.expectNone('/api/v1/notifications/recipient/1/unread-count');
  });
});
