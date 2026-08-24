import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { TenantsComponent } from './tenants.component';
import { AdminApiService } from '../../services/admin-api.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Tenant } from '../../models/tenant.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TenantsComponent', () => {
  let component: TenantsComponent;
  let fixture: ComponentFixture<TenantsComponent>;
  let adminApiMock: any;
  let dialogMock: any;
  let snackBarMock: any;

  const mockTenants: Tenant[] = [
    { _id: '1', name: 'Tenant A', slug: 'tenant-a', ownerId: 'o1', memberIds: [], isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { _id: '2', name: 'Tenant B', slug: 'tenant-b', ownerId: 'o2', memberIds: [], isActive: false, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  ];

  beforeEach(async () => {
    adminApiMock = {
      getTenants: vi.fn().mockImplementation(() => of([])),
      toggleTenantStatus: vi.fn().mockImplementation(() => of({})),
      deleteTenant: vi.fn().mockImplementation(() => of({ success: true })),
    };
    dialogMock = {
      open: vi.fn(),
    };
    snackBarMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TenantsComponent, MatDialogModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: AdminApiService, useValue: adminApiMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .overrideComponent(TenantsComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: dialogMock },
          { provide: MatSnackBar, useValue: snackBarMock },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenantsComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty data source and loading state', () => {
      expect(component.dataSource.data).toEqual([]);
      expect(component.isLoading).toBe(true);
      expect(component.displayedColumns).toEqual(['name', 'slug', 'status', 'createdAt', 'actions']);
    });
  });

  describe('loadTenants()', () => {
    it('should load tenants successfully', () => {
      adminApiMock.getTenants.mockImplementation(() => of(mockTenants));
      component.loadTenants();
      expect(component.dataSource.data).toEqual(mockTenants);
      expect(component.isLoading).toBe(false);
    });

    it('should show error snackbar on failure', () => {
      adminApiMock.getTenants.mockImplementation(() => throwError(() => new Error('Network error')));
      component.loadTenants();
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to load tenants', 'Close', { duration: 3000 });
      expect(component.isLoading).toBe(false);
    });
  });

  describe('toggleStatus()', () => {
    it('should toggle tenant to inactive when currently active', () => {
      const tenant = mockTenants[0];
      adminApiMock.toggleTenantStatus.mockImplementation(() => of({}));
      component.toggleStatus(tenant);
      expect(adminApiMock.toggleTenantStatus).toHaveBeenCalledWith('1', false);
    });

    it('should toggle tenant to active when currently inactive', () => {
      const tenant = mockTenants[1];
      adminApiMock.toggleTenantStatus.mockImplementation(() => of({}));
      component.toggleStatus(tenant);
      expect(adminApiMock.toggleTenantStatus).toHaveBeenCalledWith('2', true);
    });

    it('should show success message and reload on success', () => {
      adminApiMock.getTenants.mockImplementation(() => of(mockTenants));
      adminApiMock.toggleTenantStatus.mockImplementation(() => of({}));
      component.toggleStatus(mockTenants[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Tenant deactivated', 'Close', { duration: 3000 });
    });

    it('should show error message on failure', () => {
      adminApiMock.toggleTenantStatus.mockImplementation(() => throwError(() => new Error()));
      component.toggleStatus(mockTenants[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to update tenant status', 'Close', { duration: 3000 });
    });
  });

  describe('deleteTenant()', () => {
    it('should open confirmation dialog', () => {
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.deleteTenant(mockTenants[0]);
      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
        data: {
          title: 'Delete Tenant',
          message: 'Are you sure you want to delete "Tenant A"? This action cannot be undone.',
        },
      });
    });

    it('should delete tenant when confirmed', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deleteTenant.mockImplementation(() => of({ success: true }));
      adminApiMock.getTenants.mockImplementation(() => of([]));
      component.deleteTenant(mockTenants[0]);
      expect(adminApiMock.deleteTenant).toHaveBeenCalledWith('1');
    });

    it('should not delete when dialog is cancelled', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(false); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.deleteTenant(mockTenants[0]);
      expect(adminApiMock.deleteTenant).not.toHaveBeenCalled();
    });

    it('should show success message on delete', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deleteTenant.mockImplementation(() => of({ success: true }));
      adminApiMock.getTenants.mockImplementation(() => of([]));
      component.deleteTenant(mockTenants[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Tenant deleted', 'Close', { duration: 3000 });
    });

    it('should show error message on delete failure', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deleteTenant.mockImplementation(() => throwError(() => new Error()));
      component.deleteTenant(mockTenants[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to delete tenant', 'Close', { duration: 3000 });
    });
  });
});
