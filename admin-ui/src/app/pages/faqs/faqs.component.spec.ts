import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { FaqsComponent } from './faqs.component';
import { AdminApiService } from '../../services/admin-api.service';
import { FaqDialogComponent } from '../../components/faq-dialog/faq-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { Faq, FaqItem } from '../../models/faq.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FaqsComponent', () => {
  let component: FaqsComponent;
  let fixture: ComponentFixture<FaqsComponent>;
  let adminApiMock: any;
  let dialogMock: any;
  let snackBarMock: any;

  const mockItems: FaqItem[] = [{ question: 'Q1?', answer: 'A1.', order: 0 }];
  const mockFaqs: Faq[] = [
    { _id: '1', title: 'General', items: mockItems, order: 1, createdAt: '', updatedAt: '' },
    { _id: '2', title: 'Billing', items: [], order: 2, createdAt: '', updatedAt: '' },
  ];

  beforeEach(async () => {
    adminApiMock = {
      getFaqs: vi.fn(),
      createFaq: vi.fn(),
      updateFaq: vi.fn(),
      deleteFaq: vi.fn(),
    };
    dialogMock = {
      open: vi.fn(),
    };
    snackBarMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [FaqsComponent, MatDialogModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: AdminApiService, useValue: adminApiMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .overrideComponent(FaqsComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: dialogMock },
          { provide: MatSnackBar, useValue: snackBarMock },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaqsComponent);
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

  describe('loadFaqs()', () => {
    it('should load FAQs successfully', () => {
      adminApiMock.getFaqs.mockImplementation(() => of(mockFaqs));
      component.loadFaqs();
      expect(component.dataSource.data).toEqual(mockFaqs);
      expect(component.isLoading).toBe(false);
    });

    it('should show error on failure', () => {
      adminApiMock.getFaqs.mockImplementation(() => throwError(() => new Error()));
      component.loadFaqs();
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to load FAQs', 'Close', { duration: 3000 });
    });
  });

  describe('openCreateDialog()', () => {
    it('should open FaqDialog with create mode', () => {
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.openCreateDialog();
      expect(dialogMock.open).toHaveBeenCalledWith(FaqDialogComponent, {
        width: '700px',
        maxWidth: '90vw',
        data: { mode: 'create' },
      });
    });

    it('should create FAQ when dialog returns data', () => {
      const faqData = { title: 'New FAQ', items: [], order: 3 };
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(faqData); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.createFaq.mockImplementation(() => of({}));
      adminApiMock.getFaqs.mockImplementation(() => of([]));
      component.openCreateDialog();
      expect(adminApiMock.createFaq).toHaveBeenCalledWith(faqData);
    });

    it('should show success message on create', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb({ title: 'New', items: [], order: 1 }); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.createFaq.mockImplementation(() => of({}));
      adminApiMock.getFaqs.mockImplementation(() => of([]));
      component.openCreateDialog();
      expect(snackBarMock.open).toHaveBeenCalledWith('FAQ group created', 'Close', { duration: 3000 });
    });
  });

  describe('openEditDialog()', () => {
    it('should open FaqDialog with edit mode', () => {
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.openEditDialog(mockFaqs[0]);
      expect(dialogMock.open).toHaveBeenCalledWith(FaqDialogComponent, {
        width: '700px',
        maxWidth: '90vw',
        data: { mode: 'edit', faq: mockFaqs[0] },
      });
    });

    it('should update FAQ when dialog returns data', () => {
      const updateData = { title: 'Updated FAQ', items: [], order: 1 };
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(updateData); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.updateFaq.mockImplementation(() => of({}));
      adminApiMock.getFaqs.mockImplementation(() => of([]));
      component.openEditDialog(mockFaqs[0]);
      expect(adminApiMock.updateFaq).toHaveBeenCalledWith('1', updateData);
    });
  });

  describe('deleteFaq()', () => {
    it('should open confirm dialog', () => {
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.deleteFaq(mockFaqs[0]);
      expect(dialogMock.open).toHaveBeenCalledWith(ConfirmDialogComponent, {
        data: {
          title: 'Delete FAQ Group',
          message: 'Are you sure you want to delete "General"? This will remove all Q&A items within it.',
        },
      });
    });

    it('should delete FAQ when confirmed', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deleteFaq.mockImplementation(() => of({ success: true }));
      adminApiMock.getFaqs.mockImplementation(() => of([]));
      component.deleteFaq(mockFaqs[0]);
      expect(adminApiMock.deleteFaq).toHaveBeenCalledWith('1');
    });

    it('should show success message on delete', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deleteFaq.mockImplementation(() => of({ success: true }));
      adminApiMock.getFaqs.mockImplementation(() => of([]));
      component.deleteFaq(mockFaqs[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('FAQ group deleted', 'Close', { duration: 3000 });
    });

    it('should show error message on delete failure', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(true); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.deleteFaq.mockImplementation(() => throwError(() => new Error()));
      component.deleteFaq(mockFaqs[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to delete FAQ group', 'Close', { duration: 3000 });
    });
  });
});
