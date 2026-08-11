import { Component, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faEye, faEdit, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Project } from '../../../shared/models/project.model';
import { ProjectStore } from '../../../stores/project.store';
import { AuthService } from '../../../core/services/auth.service';
import { SearchCardComponent } from '../../../shared/components/search-card/search-card.component';
import { ContentCardComponent } from '../../../shared/components/content-card/content-card.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule, SearchCardComponent, ContentCardComponent],
  templateUrl: './project-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./project-list.component.scss'],
})
export class ProjectListComponent implements OnInit {
  private readonly projectStore = inject(ProjectStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly Math = Math;
  
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly isAdmin = signal(this.authService.isAdmin());
  readonly pageSize = 10;

  readonly faPlus = faPlus;
  readonly faEye = faEye;
  readonly faEdit = faEdit;
  readonly faTrash = faTrash;
  readonly faSpinner = faSpinner;

  ngOnInit(): void {
    const search = this.route.snapshot.queryParams['search'] || '';
    const page = parseInt(this.route.snapshot.queryParams['page'], 10) || 1;

    this.searchQuery.set(search);
    this.currentPage.set(page);

    if (this.projects().length === 0) {
      this.loadProjects();
    }
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectStore.loadAllProjects().subscribe({
      next: (response) => {
        this.projects.set(response.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.updateQueryParams();
  }

  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    this.onFilterChange();
  }

  onClearSearch(): void {
    this.searchQuery.set('');
    this.onFilterChange();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.filteredTotalPages) {
      this.currentPage.set(page);
      this.updateQueryParams();
    }
  }

  private updateQueryParams(): void {
    const params: Record<string, string> = {};
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.currentPage() > 1) params.page = this.currentPage().toString();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      replaceUrl: true,
    });
  }

  get filteredProjects(): Project[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.projects();
    return this.projects().filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }

  get filteredTotalPages(): number {
    return Math.ceil(this.filteredProjects.length / this.pageSize);
  }

  get paginatedProjects(): Project[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProjects.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    const current = this.currentPage();
    const total = this.filteredTotalPages;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, current - 2);
      const end = Math.min(total, start + maxVisible - 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount) return '£0';
    return `£${amount.toLocaleString()}`;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'badge-success',
      draft: 'badge-ghost',
      on_hold: 'badge-warning',
      completed: 'badge-info',
      archived: 'badge-neutral',
    };
    return colors[status] || 'badge-ghost';
  }

  getStatusClass(status: string): string {
    return this.getStatusColor(status);
  }

  getProjectStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      active: 'Active',
      on_hold: 'On Hold',
      completed: 'Completed',
      archived: 'Archived',
    };
    return labels[status] || status;
  }

  deleteProject(id: string): void {
    if (confirm('Are you sure you want to delete this project?')) {
      this.projectStore.deleteProject(id).subscribe({
        next: () => {
          this.projects.update((projects) => projects.filter((p) => p._id !== id));
        },
        error: (err) => console.error('Failed to delete project:', err),
      });
    }
  }
}
