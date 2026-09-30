import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Project } from '../../../../shared/models/project.model';
import { Task } from '../../../../shared/models/task.model';
import { ContentStore } from '../../../../stores/content.store';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-invoice-basic-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './invoice-basic-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceBasicInfoComponent {
  readonly content = inject(ContentStore);

  form = input.required<FormGroup>();
  projects = input<Project[]>([]);
  tasks = input<Task[]>([]);
}
