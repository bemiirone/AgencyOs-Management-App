import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ContentDialogComponent } from './content-dialog.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ContentDialogComponent', () => {
  let component: ContentDialogComponent;
  let fixture: ComponentFixture<ContentDialogComponent>;
  let dialogRefMock: any;

  describe('Create Mode', () => {
    beforeEach(async () => {
      dialogRefMock = { close: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [ContentDialogComponent, MatDialogModule, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'create', categories: ['general', 'footer'] } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ContentDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty values', () => {
      expect(component.key).toBe('');
      expect(component.value).toBe('');
      expect(component.category).toBe('');
      expect(component.locale).toBe('en');
      expect(component.description).toBe('');
      expect(component.addNewCategory).toBe(false);
    });

    it('should save when key and value are provided', () => {
      component.key = 'site.title';
      component.value = 'My Site';
      component.category = 'general';
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith({
        key: 'site.title',
        value: 'My Site',
        category: 'general',
        locale: 'en',
        description: '',
      });
    });

    it('should trim key and value on save', () => {
      component.key = '  site.title  ';
      component.value = '  My Site  ';
      component.category = 'general';
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith({
        key: 'site.title',
        value: 'My Site',
        category: 'general',
        locale: 'en',
        description: '',
      });
    });

    it('should not save when key is empty', () => {
      component.key = '';
      component.value = 'Value';
      component.category = 'general';
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should not save when value is empty', () => {
      component.key = 'site.title';
      component.value = '';
      component.category = 'general';
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should not save when category is missing', () => {
      component.key = 'site.title';
      component.value = 'Value';
      component.category = '';
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should use new category name when addNewCategory is true', () => {
      component.key = 'site.title';
      component.value = 'Value';
      component.addNewCategory = true;
      component.newCategoryName = 'marketing';
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'marketing' })
      );
    });

    it('should not save when new category name is empty', () => {
      component.key = 'site.title';
      component.value = 'Value';
      component.addNewCategory = true;
      component.newCategoryName = '';
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should default locale to en when empty', () => {
      component.key = 'k';
      component.value = 'v';
      component.category = 'general';
      component.locale = '';
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith(
        expect.objectContaining({ locale: 'en' })
      );
    });

    it('should close without data on cancel', () => {
      component.cancel();
      expect(dialogRefMock.close).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const existingEntry = {
      key: 'site.title',
      value: 'Existing Title',
      category: 'general',
      locale: 'fr',
      description: 'Site title in French',
    };

    beforeEach(async () => {
      dialogRefMock = { close: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [ContentDialogComponent, MatDialogModule, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', entry: existingEntry, categories: ['general'] } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(ContentDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should populate with existing entry data', () => {
      expect(component.key).toBe('site.title');
      expect(component.value).toBe('Existing Title');
      expect(component.category).toBe('general');
      expect(component.locale).toBe('fr');
      expect(component.description).toBe('Site title in French');
    });
  });
});
