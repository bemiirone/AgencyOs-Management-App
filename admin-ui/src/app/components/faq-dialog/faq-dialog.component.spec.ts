import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FaqDialogComponent } from './faq-dialog.component';
import { Faq } from '../../models/faq.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FaqDialogComponent', () => {
  let component: FaqDialogComponent;
  let fixture: ComponentFixture<FaqDialogComponent>;
  let dialogRefMock: any;

  describe('Create Mode', () => {
    beforeEach(async () => {
      dialogRefMock = { close: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [FaqDialogComponent, MatDialogModule, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(FaqDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with empty values in create mode', () => {
      expect(component.title).toBe('');
      expect(component.order).toBe(0);
      expect(component.items).toEqual([]);
    });

    it('should add a new item', () => {
      component.addItem();
      expect(component.items.length).toBe(1);
      expect(component.items[0]).toEqual({ question: '', answer: '', order: 0 });
    });

    it('should add multiple items with correct order', () => {
      component.addItem();
      component.addItem();
      expect(component.items[0].order).toBe(0);
      expect(component.items[1].order).toBe(1);
    });

    it('should remove an item', () => {
      component.addItem();
      component.addItem();
      component.removeItem(0);
      expect(component.items.length).toBe(1);
      expect(component.items[0].order).toBe(0);
    });

    it('should move item up', () => {
      component.addItem();
      component.addItem();
      component.items[0].question = 'First';
      component.items[1].question = 'Second';
      component.moveItemUp(1);
      expect(component.items[0].question).toBe('Second');
      expect(component.items[1].question).toBe('First');
    });

    it('should not move item up when at index 0', () => {
      component.addItem();
      component.addItem();
      component.moveItemUp(0);
      expect(component.items.length).toBe(2);
    });

    it('should move item down', () => {
      component.addItem();
      component.addItem();
      component.items[0].question = 'First';
      component.items[1].question = 'Second';
      component.moveItemDown(0);
      expect(component.items[0].question).toBe('Second');
      expect(component.items[1].question).toBe('First');
    });

    it('should not move item down when at last index', () => {
      component.addItem();
      component.moveItemDown(0);
      expect(component.items.length).toBe(1);
    });

    it('should save when title and items exist', () => {
      component.title = 'General FAQ';
      component.items = [{ question: 'Q?', answer: 'A.', order: 0 }];
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith({
        title: 'General FAQ',
        items: [{ question: 'Q?', answer: 'A.', order: 0 }],
        order: 0,
      });
    });

    it('should not save when title is empty', () => {
      component.items = [{ question: 'Q?', answer: 'A.', order: 0 }];
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should not save when no items', () => {
      component.title = 'General FAQ';
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should filter out items with empty questions', () => {
      component.title = 'FAQ';
      component.items = [
        { question: 'Valid Q?', answer: 'A.', order: 0 },
        { question: '', answer: 'Empty Q', order: 1 },
      ];
      component.save();
      expect(dialogRefMock.close).toHaveBeenCalledWith({
        title: 'FAQ',
        items: [{ question: 'Valid Q?', answer: 'A.', order: 0 }],
        order: 0,
      });
    });

    it('should not save when all items have empty questions', () => {
      component.title = 'FAQ';
      component.items = [
        { question: '', answer: 'A.', order: 0 },
        { question: '', answer: 'B.', order: 1 },
      ];
      component.save();
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should close without data on cancel', () => {
      component.cancel();
      expect(dialogRefMock.close).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    const existingFaq: Faq = {
      _id: '1',
      title: 'Existing FAQ',
      items: [
        { question: 'Q1?', answer: 'A1.', order: 0 },
        { question: 'Q2?', answer: 'A2.', order: 1 },
      ],
      order: 3,
      createdAt: '',
      updatedAt: '',
    };

    beforeEach(async () => {
      dialogRefMock = { close: vi.fn() };

      await TestBed.configureTestingModule({
        imports: [FaqDialogComponent, MatDialogModule, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: dialogRefMock },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', faq: existingFaq } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(FaqDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should populate with existing FAQ data', () => {
      expect(component.title).toBe('Existing FAQ');
      expect(component.order).toBe(3);
      expect(component.items.length).toBe(2);
    });

    it('should create a deep copy of items', () => {
      component.items[0].question = 'Modified';
      expect(existingFaq.items[0].question).toBe('Q1?');
    });
  });
});
