import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { QuillModule } from 'ngx-quill';
import { Page, CreatePageRequest } from '../../models/page.model';

@Component({
  selector: 'admin-page-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    QuillModule,
  ],
  templateUrl: './page-dialog.component.html',
  styleUrl: './page-dialog.component.scss'
})
export class PageDialogComponent {
  dialogRef = inject(MatDialogRef<PageDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  title = this.data.mode === 'edit' ? (this.data.page as Page).title : '';
  slug = this.data.mode === 'edit' ? (this.data.page as Page).slug : '';
  content = this.data.mode === 'edit' ? (this.data.page as Page).content : '';
  isPublished = this.data.mode === 'edit' ? (this.data.page as Page).isPublished : false;
  order = this.data.mode === 'edit' ? (this.data.page as Page).order : 0;

  editorModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
  };

  save(): void {
    if (!this.title || !this.slug) {
      return;
    }

    const pageData: CreatePageRequest = {
      title: this.title,
      slug: this.slug,
      content: this.content,
      isPublished: this.isPublished,
      order: this.order,
    };

    this.dialogRef.close(pageData);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
