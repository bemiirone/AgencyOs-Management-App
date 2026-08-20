import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { AdminApiService, ContentEntry } from '../../services/admin-api.service';

@Component({
  selector: 'admin-content',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    FormsModule,
  ],
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss',
})
export class ContentComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<ContentEntry>([]);
  displayedColumns: string[] = ['key', 'value', 'category', 'description', 'actions'];
  isLoading = true;
  isSaving = false;

  categories: string[] = [];
  selectedCategory = 'all';
  searchQuery = '';

  editingRow: string | null = null;
  editValue = '';

  ngOnInit(): void {
    this.loadContent();
  }

  loadContent(): void {
    this.isLoading = true;
    this.adminApi.getContent().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.categories = [...new Set(data.map((e) => e.category))].sort();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load content', 'Close', { duration: 3000 });
      },
    });
  }

  get filteredData(): ContentEntry[] {
    let data = this.dataSource.data;

    if (this.selectedCategory !== 'all') {
      data = data.filter((e) => e.category === this.selectedCategory);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter(
        (e) =>
          e.key.toLowerCase().includes(q) ||
          e.value.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q),
      );
    }

    return data;
  }

  startEdit(entry: ContentEntry): void {
    this.editingRow = entry._id;
    this.editValue = entry.value;
  }

  cancelEdit(): void {
    this.editingRow = null;
    this.editValue = '';
  }

  saveEdit(entry: ContentEntry): void {
    if (!this.editValue.trim()) {
      this.snackBar.open('Value cannot be empty', 'Close', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    this.adminApi.updateContent(entry.key, { value: this.editValue }).subscribe({
      next: () => {
        this.snackBar.open('Content updated', 'Close', { duration: 2000 });
        this.cancelEdit();
        this.loadContent();
        this.isSaving = false;
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Failed to update content', 'Close', { duration: 3000 });
      },
    });
  }
}
