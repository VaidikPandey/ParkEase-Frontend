import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const mockUser = { userId: 1, fullName: 'Vaidik', email: 'v@test.com', role: 'DRIVER' as const };
  const mockRes  = { tokenType: 'Bearer', expiresIn: 3600, user: mockUser };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { http.verify(); sessionStorage.clear(); });

  it('should start with no logged-in user', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('login() should POST credentials and set the user signal', () => {
    service.login('v@test.com', 'pass').subscribe();

    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'v@test.com', password: 'pass' });
    req.flush(mockRes);

    expect(service.currentUser()).toEqual(mockUser);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('login() should persist user to sessionStorage', () => {
    service.login('v@test.com', 'pass').subscribe();
    http.expectOne('/api/v1/auth/login').flush(mockRes);

    expect(JSON.parse(sessionStorage.getItem('user')!)).toEqual(mockUser);
  });

  it('selectRole() should PATCH the role and update the signal', () => {
    service.selectRole('MANAGER').subscribe();

    const req = http.expectOne('/api/v1/auth/role');
    expect(req.request.method).toBe('PATCH');
    req.flush({ ...mockRes, user: { ...mockUser, role: 'MANAGER' } });

    expect(service.currentUser()?.role).toBe('MANAGER');
  });
});
