import { Component, signal, input, output, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch, faTimes, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface SearchResult {
  tenantId: string;
  tenantName: string;
  slug: string;
}

@Component({
  selector: 'app-join-workspace-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './join-workspace-modal.component.html',
  styleUrl: './join-workspace-modal.component.css',
})
export class JoinWorkspaceModalComponent implements OnDestroy {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  visible = input.required<boolean>();
  close = output<void>();
  joined = output<void>();

  faSearch = faSearch;
  faTimes = faTimes;
  faBuilding = faBuilding;

  form = new FormGroup({
    searchQuery: new FormControl('', { nonNullable: true }),
    inviteCode: new FormControl('AGENCY-2026', { nonNullable: true, validators: [Validators.required] }),
  });

  searchResults = signal<SearchResult[]>([]);
  searching = signal(false);
  selectedWorkspace = signal<SearchResult | null>(null);
  joining = signal(false);
  searchDebounceTimer: any = null;

  get searchQueryControl() {
    return this.form.controls.searchQuery;
  }

  get inviteCodeControl() {
    return this.form.controls.inviteCode;
  }

  onSearchInput() {
    const query = this.searchQueryControl.value;
    this.selectedWorkspace.set(null);

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    if (!query || query.trim().length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.searchDebounceTimer = setTimeout(async () => {
      this.searching.set(true);
      try {
        const results = await this.authService.searchWorkspaces(query);
        this.searchResults.set(results);
      } catch {
        this.searchResults.set([]);
      } finally {
        this.searching.set(false);
      }
    }, 300);
  }

  selectWorkspace(workspace: SearchResult) {
    this.selectedWorkspace.set(workspace);
    this.searchResults.set([]);
    this.searchQueryControl.setValue(workspace.tenantName);
  }

  async joinWorkspace() {
    if (!this.selectedWorkspace()) {
      this.toast.error('Please select a workspace');
      return;
    }

    if (this.form.invalid) {
      this.toast.error('Please enter an invite code');
      return;
    }

    this.joining.set(true);
    try {
      await this.authService.joinWorkspace(this.selectedWorkspace()!.tenantId, this.inviteCodeControl.value);
      this.toast.success('Joined workspace successfully');
      this.onClose();
      this.joined.emit();
    } catch (err: any) {
      this.toast.error(err.error?.message || 'Failed to join workspace');
    } finally {
      this.joining.set(false);
    }
  }

  onClose() {
    this.form.reset({ searchQuery: '', inviteCode: 'AGENCY-2026' });
    this.searchResults.set([]);
    this.selectedWorkspace.set(null);
    this.close.emit();
  }

  ngOnDestroy() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }
}
