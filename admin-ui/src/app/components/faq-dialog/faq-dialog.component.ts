import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { QuillModule } from 'ngx-quill';
import { Faq, FaqItem, CreateFaqRequest } from '../../models/faq.model';

@Component({
  selector: 'admin-faq-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    QuillModule,
  ],
  templateUrl: './faq-dialog.component.html',
  styleUrl: './faq-dialog.component.scss'
})
export class FaqDialogComponent {
  dialogRef = inject(MatDialogRef<FaqDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  title = this.data.mode === 'edit' ? (this.data.faq as Faq).title : '';
  order = this.data.mode === 'edit' ? (this.data.faq as Faq).order : 0;
  items: FaqItem[] = this.data.mode === 'edit'
    ? JSON.parse(JSON.stringify((this.data.faq as Faq).items))
    : [];

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  addItem(): void {
    this.items.push({ question: '', answer: '', order: this.items.length });
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.items.forEach((item, i) => item.order = i);
  }

  moveItemUp(index: number): void {
    if (index > 0) {
      [this.items[index], this.items[index - 1]] = [this.items[index - 1], this.items[index]];
      this.items.forEach((item, i) => item.order = i);
    }
  }

  moveItemDown(index: number): void {
    if (index < this.items.length - 1) {
      [this.items[index], this.items[index + 1]] = [this.items[index + 1], this.items[index]];
      this.items.forEach((item, i) => item.order = i);
    }
  }

  save(): void {
    if (!this.title || this.items.length === 0) {
      return;
    }

    const validItems = this.items.filter(item => item.question.trim());
    if (validItems.length === 0) {
      return;
    }

    const faqData: CreateFaqRequest = {
      title: this.title,
      items: validItems,
      order: this.order,
    };

    this.dialogRef.close(faqData);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
