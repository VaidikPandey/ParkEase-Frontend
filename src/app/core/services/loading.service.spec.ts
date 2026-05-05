import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoadingService);
  });

  it('should start as inactive', () => {
    expect(service.active()).toBe(false);
  });

  it('should become active after start()', () => {
    service.start();
    expect(service.active()).toBe(true);
  });

  it('should remain active if start called multiple times before stop', () => {
    service.start();
    service.start();
    service.stop();
    expect(service.active()).toBe(true);
  });

  it('should become inactive after matching stops', () => {
    service.start();
    service.start();
    service.stop();
    service.stop();
    expect(service.active()).toBe(false);
  });

  it('should not go below 0 on extra stop', () => {
    service.stop();
    expect(service.active()).toBe(false);
  });
});
