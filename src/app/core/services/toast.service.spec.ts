import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    jest.useFakeTimers();
  });

  afterEach(() => jest.useRealTimers());

  it('should start with no toasts', () => {
    expect(service.toasts()).toHaveLength(0);
  });

  it('should add a toast via show()', () => {
    service.show('Hello', 'info');
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].message).toBe('Hello');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('should add a success toast', () => {
    service.success('Done!');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should add an error toast', () => {
    service.error('Oops!');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add a warning toast', () => {
    service.warning('Watch out');
    expect(service.toasts()[0].type).toBe('warning');
  });

  it('should dismiss a toast by id', () => {
    service.show('Test', 'info');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should auto-dismiss after default duration', () => {
    service.show('Auto', 'info', 3500);
    expect(service.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(3500);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should assign unique ids to multiple toasts', () => {
    service.show('First', 'info');
    service.show('Second', 'success');
    const ids = service.toasts().map(t => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
