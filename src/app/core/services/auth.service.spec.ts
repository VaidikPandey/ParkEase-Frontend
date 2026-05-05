import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const mockUser = { userId: 1, fullName: 'Test User', email: 'test@test.com', role: 'DRIVER' as const };
  const mockResponse = { tokenType: 'Bearer', expiresIn: 3600, user: mockUser };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('should start with null user when session is empty', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should load user from sessionStorage on init', () => {
    sessionStorage.setItem('user', JSON.stringify(mockUser));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.currentUser()).toEqual(mockUser);
  });

  it('isLoggedIn() should return false when no user', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('isLoggedIn() should return true after login', () => {
    service.login('test@test.com', 'pass').subscribe();
    http.expectOne('/api/v1/auth/login').flush(mockResponse);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('login() should store user in sessionStorage and update signal', () => {
    service.login('test@test.com', 'pass').subscribe();
    http.expectOne('/api/v1/auth/login').flush(mockResponse);

    expect(service.currentUser()).toEqual(mockUser);
    expect(JSON.parse(sessionStorage.getItem('user')!)).toEqual(mockUser);
  });

  it('login() should POST to /api/v1/auth/login', () => {
    service.login('a@b.com', 'secret').subscribe();
    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'secret' });
    req.flush(mockResponse);
  });

  it('selectRole() should update user signal with response', () => {
    service.selectRole('MANAGER').subscribe();
    const req = http.expectOne('/api/v1/auth/role');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockResponse, user: { ...mockUser, role: 'MANAGER' } });
    expect(service.currentUser()?.role).toBe('MANAGER');
  });
});
