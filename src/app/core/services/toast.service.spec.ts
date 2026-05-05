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

  it('success() should add a success toast', () => {
    service.success('Saved!');
    expect(service.toasts()[0]).toMatchObject({ type: 'success', message: 'Saved!' });
  });

  it('error() should add an error toast', () => {
    service.error('Something went wrong');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('dismiss() should remove the toast by id', () => {
    service.success('Hi');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts()).toHaveLength(0);
  });

  it('should auto-dismiss after the set duration', () => {
    service.show('Temp', 'info', 3000);
    expect(service.toasts()).toHaveLength(1);
    jest.advanceTimersByTime(3000);
    expect(service.toasts()).toHaveLength(0);
  });
});
