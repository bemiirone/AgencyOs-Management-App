import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { QuillModule } from 'ngx-quill';
import { LandingSectionDialogData, SectionType, CreateLandingSectionRequest } from '../../models/landing-section.model';

@Component({
  selector: 'admin-landing-section-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSliderModule,
    QuillModule,
  ],
  templateUrl: './landing-section-dialog.component.html',
  styleUrl: './landing-section-dialog.component.scss',
})
export class LandingSectionDialogComponent {
  dialogRef = inject(MatDialogRef<LandingSectionDialogComponent>);
  data = inject<LandingSectionDialogData>(MAT_DIALOG_DATA);

  readonly sectionType = this.data.sectionType;
  readonly isEdit = this.data.mode === 'edit';

  title = this.data.item?.title ?? '';
  description = this.data.item?.description ?? '';
  question = this.data.item?.question ?? '';
  answer = this.data.item?.answer ?? '';
  icon = this.data.item?.icon ?? '';
  name = this.data.item?.name ?? '';
  role = this.data.item?.role ?? '';
  rating = this.data.item?.rating ?? 5;
  isActive = this.data.item?.isActive ?? true;
  order = this.data.item?.order ?? 0;

  get isPainPointOrPropOrFeature(): boolean {
    return ['painPoints', 'valueProps', 'features'].includes(this.sectionType);
  }

  get isStep(): boolean {
    return this.sectionType === 'steps';
  }

  get isTestimonial(): boolean {
    return this.sectionType === 'testimonials';
  }

  get isFaq(): boolean {
    return this.sectionType === 'faqs';
  }

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  getDialogLabel(): string {
    const labels: Record<SectionType, string> = {
      painPoints: 'Pain Point',
      valueProps: 'Value Proposition',
      steps: 'Step',
      features: 'Feature',
      testimonials: 'Testimonial',
      faqs: 'FAQ',
    };
    return labels[this.sectionType];
  }

  save(): void {
    const result: CreateLandingSectionRequest = {
      section: this.sectionType,
      order: this.order,
      isActive: this.isActive,
    };

    if (this.isFaq) {
      if (!this.question.trim()) return;
      result.question = this.question.trim();
      result.answer = this.answer;
    } else if (this.isTestimonial) {
      if (!this.title.trim()) return;
      result.title = this.title.trim();
      result.name = this.name.trim();
      result.role = this.role.trim();
      result.rating = this.rating;
    } else {
      if (!this.title.trim()) return;
      result.title = this.title.trim();
      result.description = this.description;
      if (this.isPainPointOrPropOrFeature) {
        result.icon = this.icon.trim();
      }
    }

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
