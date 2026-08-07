import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminApiService } from '../../services/admin-api.service';
import { Page } from '../../models/page.model';
import { PageDialogComponent } from '../../components/page-dialog/page-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'admin-pages',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss'
})
export class PagesComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Page>([]);
  displayedColumns: string[] = ['title', 'slug', 'status', 'order', 'actions'];
  isLoading = true;

  ngOnInit(): void {
    this.loadPages();
  }

  loadPages(): void {
    this.isLoading = true;
    this.adminApi.getPages().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load pages', 'Close', { duration: 3000 });
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(PageDialogComponent, {
      width: '600px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.createPage(result).subscribe({
          next: () => {
            this.snackBar.open('Page created', 'Close', { duration: 3000 });
            this.loadPages();
          },
          error: () => this.snackBar.open('Failed to create page', 'Close', { duration: 3000 })
        });
      }
    });
  }

  openEditDialog(page: Page): void {
    const dialogRef = this.dialog.open(PageDialogComponent, {
      width: '600px',
      data: { mode: 'edit', page }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.updatePage(page._id, result).subscribe({
          next: () => {
            this.snackBar.open('Page updated', 'Close', { duration: 3000 });
            this.loadPages();
          },
          error: () => this.snackBar.open('Failed to update page', 'Close', { duration: 3000 })
        });
      }
    });
  }

  deletePage(page: Page): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Page',
        message: `Are you sure you want to delete "${page.title}"? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.deletePage(page._id).subscribe({
          next: () => {
            this.snackBar.open('Page deleted', 'Close', { duration: 3000 });
            this.loadPages();
          },
          error: () => this.snackBar.open('Failed to delete page', 'Close', { duration: 3000 })
        });
      }
    });
  }
}
