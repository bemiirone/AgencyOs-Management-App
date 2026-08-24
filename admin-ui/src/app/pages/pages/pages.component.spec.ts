import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PagesComponent } from './pages.component';
import { AdminApiService } from '../../services/admin-api.service';
import { PageDialogComponent } from '../../components/page-dialog/page-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Page } from '../../models/page.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PagesComponent', () => {
  let component: PagesComponent;
  let fixture: ComponentFixture<PagesComponent>;
  let adminApiMock: any;
  let dialogMock: any;
  let snackBarMock: any;

  const mockPages: Page[] = [
    { _id: '1', title: 'Home', slug: 'home', content: 'Welcome', isPublished: true, order: 1, createdAt: '', updatedAt: '' },
    { _id: '2', title: 'About', slug: 'about', content: 'About us', isPublished: false, order: 2, createdAt: '', updatedAt: '' },
  ];

  beforeEach(async () => {
    adminApiMock = {
      getPages: vi.fn(),
      createPage: vi.fn(),
      updatePage: vi.fn(),
      deletePage: vi.fn(),
    };
    dialogMock = {
      open: vi.fn(),
    };
    snackBarMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PagesComponent, MatDialogModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: AdminApiService, useValue: adminApiMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .overrideComponent(PagesComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: dialogMock },
          { provide: MatSnackBar, useValue: snackBarMock },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagesComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty data source', () => {
      expect(component.dataSource.data).toEqual([]);
      expect(component.isLoading).toBe(true);
    });
  });

  describe('loadPages()', () => {
    it('should load pages successfully', () => {
      adminApiMock.getPages.mockImplementation(() => of(mockPages));
      component.loadPages();
      expect(component.dataSource.data).toEqual(mockPages);
      expect(component.isLoading).toBe(false);
    });

    it('should show error on failure', () => {
      adminApiMock.getPages.mockImplementation(() => throwError(() => new Error()));
      component.loadPages();
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to load pages', 'Close', { duration: 3000 });
    });
  });

  describe('openCreateDialog()', () => {
    it('should open PageDialog with create mode', () => {
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.openCreateDialog();
      expect(dialogMock.open).toHaveBeenCalledWith(PageDialogComponent, {
        width: '600px',
        data: { mode: 'create' },
      });
    });

    it('should create page when dialog returns data', () => {
      const pageData = { title: 'New Page', slug: 'new-page', content: '', isPublished: false, order: 3 };
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(pageData); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.createPage.mockImplementation(() => of({}));
      adminApiMock.getPages.mockImplementation(() => of([]));
      component.openCreateDialog();
      expect(adminApiMock.createPage).toHaveBeenCalledWith(pageData);
    });

    it('should not create page when dialog is cancelled', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(undefined); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.openCreateDialog();
      expect(adminApiMock.createPage).not.toHaveBeenCalled();
    });

    it('should show success message on create', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb({ title: 'New', slug: 'new', content: '' }); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.createPage.mockImplementation(() => of({}));
      adminApiMock.getPages.mockImplementation(() => of([]));
      component.openCreateDialog();
      expect(snackBarMock.open).toHaveBeenCalledWith('Page created', 'Close', { duration: 3000 });
    });
  });

  describe('openEditDialog()', () => {
    it('should open PageDialog with edit mode', () => {
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.openEditDialog(mockPages[0]);
      expect(dialogMock.open).toHaveBeenCalledWith(PageDialogComponent, {
        width: '600px',
        data: { mode: 'edit', page: mockPages[0] },
      });
    });

    it('should update page when dialog returns data', () => {
      const updateData = { title: 'Updated' };
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(updateData); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.updatePage.mockImplementation(() => of({}));
      adminApiMock.getPages.mockImplementation(() => of([]));
      component.openEditDialog(mockPages[0]);
      expect(adminApiMock.updatePage).toHaveBeenCalledWith('1', updateData);
    });
  });

  describe('deletePage()', () => {
    it('should open confirm dialog', () => {
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.deletePage(mockPages[0]);
      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
        data: {
          title: 'Delete Page',
          message: 'Are you sure you want to delete "Home"? This action cannot be undone.',
        },
      });
    });

    it('should delete page when confirmed', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deletePage.mockImplementation(() => of({ success: true }));
      adminApiMock.getPages.mockImplementation(() => of([]));
      component.deletePage(mockPages[0]);
      expect(adminApiMock.deletePage).toHaveBeenCalledWith('1');
    });

    it('should show success message on delete', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deletePage.mockImplementation(() => of({ success: true }));
      adminApiMock.getPages.mockImplementation(() => of([]));
      component.deletePage(mockPages[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Page deleted', 'Close', { duration: 3000 });
    });
  });
});
