import { TestBed } from '@angular/core/testing';
import { ToastService } from '../toast.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.useFakeTimers();

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.clearAllTimers();
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show', () => {
    it('should add a toast to the list', () => {
      service.show('Test message', 'success');

      const toasts = service.toasts();
      expect(toasts.length).toBe(1);
      expect(toasts[0].message).toBe('Test message');
      expect(toasts[0].type).toBe('success');
    });

    it('should use default type of success', () => {
      service.show('Default type test');

      const toasts = service.toasts();
      expect(toasts[0].type).toBe('success');
    });

    it('should use custom duration', () => {
      service.show('Custom duration', 'info', 5000);

      const toasts = service.toasts();
      expect(toasts[0].duration).toBe(5000);
    });
  });

  describe('convenience methods', () => {
    it('success should create success toast', () => {
      service.success('Success!');
      expect(service.toasts()[0].type).toBe('success');
    });

    it('error should create error toast with 5s duration', () => {
      service.error('Error!');
      const toast = service.toasts()[0];
      expect(toast.type).toBe('error');
      expect(toast.duration).toBe(5000);
    });

    it('info should create info toast', () => {
      service.info('Info');
      expect(service.toasts()[0].type).toBe('info');
    });

    it('warning should create warning toast with 5s duration', () => {
      service.warning('Warning');
      const toast = service.toasts()[0];
      expect(toast.type).toBe('warning');
      expect(toast.duration).toBe(5000);
    });
  });

  describe('remove', () => {
    it('should remove a toast by id', () => {
      service.show('Toast 1', 'success', 999999);
      
      const allToasts = service.toasts();
      expect(allToasts.length).toBeGreaterThanOrEqual(1);

      const firstId = allToasts[0].id;
      service.remove(firstId);

      const remaining = service.toasts();
      expect(remaining.some((t) => t.id === firstId)).toBe(false);
    });
  });

  describe('auto-dismiss', () => {
    it('should auto-remove toast after duration', () => {
      service.show('Auto dismiss', 'success', 1000);

      expect(service.toasts().length).toBe(1);

      vi.advanceTimersByTime(1001);

      expect(service.toasts().length).toBe(0);
    });
  });
});
