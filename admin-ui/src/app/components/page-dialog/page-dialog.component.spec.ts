import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PageDialogComponent } from './page-dialog.component';
import { Page } from '../../models/page.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('PageDialogComponent', () => {
  let component: PageDialogComponent;
  let fixture: ComponentFixture<PageDialogComponent>;
  let dialogRefMock: any;

  describe('Create Mode', () => {
    beforeEach(async () => {
      dialogRefMock = { close: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [PageDialogComponent, MatDialogModule, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(PageDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty values in create mode', () => {
      expect(component.title).toBe('');
      expect(component.slug).toBe('');
      expect(component.content).toBe('');
      expect(component.isPublished).toBe(false);
      expect(component.order).toBe(0);
    });

    it('should close with page data on save when valid', () => {
      component.title = 'New Page';
      component.slug = 'new-page';
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith({
        title: 'New Page',
        slug: 'new-page',
        content: '',
        isPublished: false,
        order: 0,
      });
    });

    it('should not save when title is empty', () => {
      component.title = '';
      component.slug = 'new-page';
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should not save when slug is empty', () => {
      component.title = 'New Page';
      component.slug = '';
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should close without data on cancel', () => {
      component.cancel();
      expect(dialogRefMock.close).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const existingPage: Page = {
      _id: '1',
      title: 'Existing Page',
      slug: 'existing-page',
      content: '<p>Content here</p>',
      isPublished: true,
      order: 5,
      createdAt: '',
      updatedAt: '',
    };

    beforeEach(async () => {
      dialogRefMock = { close: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [PageDialogComponent, MatDialogModule, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', page: existingPage } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(PageDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should populate form with existing page data', () => {
      expect(component.title).toBe('Existing Page');
      expect(component.slug).toBe('existing-page');
      expect(component.content).toBe('<p>Content here</p>');
      expect(component.isPublished).toBe(true);
      expect(component.order).toBe(5);
    });

    it('should save updated data', () => {
      component.title = 'Updated Title';
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith({
        title: 'Updated Title',
        slug: 'existing-page',
        content: '<p>Content here</p>',
        isPublished: true,
        order: 5,
      });
    });
  });
});
