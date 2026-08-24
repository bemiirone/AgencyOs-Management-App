import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ContentComponent } from './content.component';
import { AdminApiService, ContentEntry } from '../../services/admin-api.service';
import { ContentDialogComponent } from '../../components/content-dialog/content-dialog.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ContentComponent', () => {
  let component: ContentComponent;
  let fixture: ComponentFixture<ContentComponent>;
  let adminApiMock: any;
  let snackBarMock: any;
  let dialogMock: any;

  const mockContent: ContentEntry[] = [
    { _id: '1', key: 'site.title', value: 'My Site', category: 'general', locale: 'en', description: 'Site title' },
    { _id: '2', key: 'footer.text', value: 'Copyright 2024', category: 'footer', locale: 'en', description: 'Footer text' },
    { _id: '3', key: 'site.tagline', value: 'Best Agency', category: 'general', locale: 'en', description: 'Tagline' },
  ];

  beforeEach(async () => {
    adminApiMock = {
      getContent: vi.fn(),
      updateContent: vi.fn(),
      createContent: vi.fn(),
    };
    snackBarMock = {
      open: vi.fn(),
    };
    dialogMock = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ContentComponent, MatDialogModule, MatSnackBarModule, NoopAnimationsModule],
      providers: [
        { provide: AdminApiService, useValue: adminApiMock },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
    .overrideComponent(ContentComponent, {
      set: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: MatDialog, useValue: dialogMock },
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContentComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty data source and loading state', () => {
      expect(component.dataSource.data).toEqual([]);
      expect(component.isLoading).toBe(true);
      expect(component.selectedCategory).toBe('all');
      expect(component.searchQuery).toBe('');
    });
  });

  describe('loadContent()', () => {
    it('should load content successfully', () => {
      adminApiMock.getContent.mockImplementation(() => of(mockContent));
      component.loadContent();
      expect(component.dataSource.data).toEqual(mockContent);
      expect(component.isLoading).toBe(false);
    });

    it('should extract unique categories', () => {
      adminApiMock.getContent.mockImplementation(() => of(mockContent));
      component.loadContent();
      expect(component.categories).toEqual(['footer', 'general']);
    });

    it('should show error on failure', () => {
      adminApiMock.getContent.mockImplementation(() => throwError(() => new Error()));
      component.loadContent();
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to load content', 'Close', { duration: 3000 });
    });
  });

  describe('filteredData', () => {
    beforeEach(() => {
      component.dataSource.data = mockContent;
    });

    it('should return all data when no filters applied', () => {
      component.selectedCategory = 'all';
      component.searchQuery = '';
      expect(component.filteredData).toEqual(mockContent);
    });

    it('should filter by category', () => {
      component.selectedCategory = 'general';
      component.searchQuery = '';
      const filtered = component.filteredData;
      expect(filtered.length).toBe(2);
      expect(filtered.every((e) => e.category === 'general')).toBe(true);
    });

    it('should filter by search query on key', () => {
      component.selectedCategory = 'all';
      component.searchQuery = 'site';
      const filtered = component.filteredData;
      expect(filtered.length).toBe(2);
    });

    it('should filter by search query on value', () => {
      component.selectedCategory = 'all';
      component.searchQuery = 'copyright';
      const filtered = component.filteredData;
      expect(filtered.length).toBe(1);
      expect(filtered[0].key).toBe('footer.text');
    });

    it('should filter by search query on description', () => {
      component.selectedCategory = 'all';
      component.searchQuery = 'tagline';
      const filtered = component.filteredData;
      expect(filtered.length).toBe(1);
    });

    it('should combine category and search filters', () => {
      component.selectedCategory = 'general';
      component.searchQuery = 'tagline';
      const filtered = component.filteredData;
      expect(filtered.length).toBe(1);
      expect(filtered[0].key).toBe('site.tagline');
    });
  });

  describe('startEdit()', () => {
    it('should set editing row and value', () => {
      const entry = mockContent[0];
      component.startEdit(entry);
      expect(component.editingRow).toBe('1');
      expect(component.editValue).toBe('My Site');
    });
  });

  describe('cancelEdit()', () => {
    it('should clear editing state', () => {
      component.editingRow = '1';
      component.editValue = 'Some value';
      component.cancelEdit();
      expect(component.editingRow).toBeNull();
      expect(component.editValue).toBe('');
    });
  });

  describe('saveEdit()', () => {
    it('should show error when value is empty', () => {
      component.editValue = '   ';
      component.saveEdit(mockContent[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Value cannot be empty', 'Close', { duration: 3000 });
    });

    it('should update content when valid', () => {
      component.editingRow = '1';
      component.editValue = 'Updated Value';
      adminApiMock.updateContent.mockImplementation(() => of({}));
      adminApiMock.getContent.mockImplementation(() => of(mockContent));
      component.saveEdit(mockContent[0]);
      expect(adminApiMock.updateContent).toHaveBeenCalledWith('site.title', { value: 'Updated Value' });
    });

    it('should show success message on save', () => {
      component.editingRow = '1';
      component.editValue = 'Updated Value';
      adminApiMock.updateContent.mockImplementation(() => of({}));
      adminApiMock.getContent.mockImplementation(() => of(mockContent));
      component.saveEdit(mockContent[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Content updated', 'Close', { duration: 2000 });
    });

    it('should show error message on failure', () => {
      component.editingRow = '1';
      component.editValue = 'Updated Value';
      adminApiMock.updateContent.mockImplementation(() => throwError(() => new Error()));
      component.saveEdit(mockContent[0]);
      expect(snackBarMock.open).toHaveBeenCalledWith('Failed to update content', 'Close', { duration: 3000 });
    });

    it('should clear editing state on success', () => {
      component.editingRow = '1';
      component.editValue = 'Updated Value';
      adminApiMock.updateContent.mockImplementation(() => of({}));
      adminApiMock.getContent.mockImplementation(() => of(mockContent));
      component.saveEdit(mockContent[0]);
      expect(component.editingRow).toBeNull();
    });
  });

  describe('openCreateDialog()', () => {
    it('should open ContentDialog with create mode', () => {
      component.categories = ['general', 'footer'];
      const afterClosedMock = { subscribe: vi.fn() };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      component.openCreateDialog();
      expect(dialogMock.open).toHaveBeenCalledWith(ContentDialogComponent, {
        width: '500px',
        data: { mode: 'create', categories: ['general', 'footer'] },
      });
    });

    it('should create content when dialog returns data', () => {
      const newEntry = { key: 'new.key', value: 'New Value', category: 'general', locale: 'en', description: '' };
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(newEntry); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.createContent.mockImplementation(() => of({}));
      adminApiMock.getContent.mockImplementation(() => of([]));
      component.openCreateDialog();
      expect(adminApiMock.createContent).toHaveBeenCalledWith(newEntry);
    });

    it('should add new category if not existing', () => {
      component.categories = ['general'];
      const newEntry = { key: 'new.key', value: 'Value', category: 'marketing', locale: 'en', description: '' };
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb(newEntry); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.createContent.mockImplementation(() => of({}));
      adminApiMock.getContent.mockImplementation(() => of([{ _id: '1', key: 'new.key', value: 'Value', category: 'marketing', locale: 'en', description: '' }]));
      component.openCreateDialog();
      expect(component.categories).toContain('marketing');
    });

    it('should show success message on create', () => {
      const afterClosedMock = { subscribe: vi.fn((cb: any) => { cb({ key: 'k', value: 'v', category: 'general' }); return { unsubscribe: vi.fn() }; }) };
      dialogMock.open.mockReturnValue({ afterClosed: () => afterClosedMock });
      adminApiMock.createContent.mockImplementation(() => of({}));
      adminApiMock.getContent.mockImplementation(() => of([]));
      component.openCreateDialog();
      expect(snackBarMock.open).toHaveBeenCalledWith('Content added', 'Close', { duration: 2000 });
    });
  });
});
