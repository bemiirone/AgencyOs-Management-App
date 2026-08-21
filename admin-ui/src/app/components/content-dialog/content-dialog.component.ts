import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface ContentDialogData {
  mode: 'create' | 'edit';
  entry?: {
    key: string;
    value: string;
    category: string;
    locale: string;
    description: string;
  };
  categories: string[];
}

@Component({
  selector: 'admin-content-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './content-dialog.component.html',
  styleUrl: './content-dialog.component.scss',
})
export class ContentDialogComponent {
  dialogRef = inject(MatDialogRef<ContentDialogComponent>);
  data = inject<ContentDialogData>(MAT_DIALOG_DATA);

  key = this.data.entry?.key ?? '';
  value = this.data.entry?.value ?? '';
  category = this.data.entry?.category ?? '';
  locale = this.data.entry?.locale ?? 'en';
  description = this.data.entry?.description ?? '';

  addNewCategory = false;
  newCategoryName = '';

  save(): void {
    if (!this.key.trim() || !this.value.trim()) {
      return;
    }

    const finalCategory = this.addNewCategory ? this.newCategoryName.trim() : this.category;
    if (!finalCategory) {
      return;
    }

    this.dialogRef.close({
      key: this.key.trim(),
      value: this.value.trim(),
      category: finalCategory,
      locale: this.locale || 'en',
      description: this.description.trim(),
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
