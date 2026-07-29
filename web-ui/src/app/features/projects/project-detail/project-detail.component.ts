import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faCalendar, faUser, faDollarSign, faClock, faSpinner, faEdit, faTasks, faCheckCircle, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { Project } from '../../../shared/models/project.model';
import { ProjectStore } from '../../../stores/project.store';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss'],
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectStore = inject(ProjectStore);

  project = signal<Project | null>(null);
  loading = signal(false);

  faArrowLeft = faArrowLeft;
  faCalendar = faCalendar;
  faUser = faUser;
  faDollarSign = faDollarSign;
  faClock = faClock;
  faSpinner = faSpinner;
  faEdit = faEdit;
  faTasks = faTasks;
  faCheckCircle = faCheckCircle;
  faHourglassHalf = faHourglassHalf;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProject(id);
    }
  }

  loadProject(id: string): void {
    this.loading.set(true);
    this.projectStore.loadProject(id).subscribe({
      next: (project: Project) => {
        this.project.set(project);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '$0';
    return `$${amount.toLocaleString()}`;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-success',
      draft: 'badge-ghost',
      on_hold: 'badge-warning',
      completed: 'badge-info',
      archived: 'badge-neutral',
    };
    return classes[status] || 'badge-ghost';
  }
}
