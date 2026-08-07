import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminApiService } from '../../services/admin-api.service';
import { Faq } from '../../models/faq.model';
import { FaqDialogComponent } from '../../components/faq-dialog/faq-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'admin-faqs',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './faqs.component.html',
  styleUrl: './faqs.component.scss'
})
export class FaqsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Faq>([]);
  displayedColumns: string[] = ['title', 'items', 'order', 'actions'];
  isLoading = true;

  ngOnInit(): void {
    this.loadFaqs();
  }

  loadFaqs(): void {
    this.isLoading = true;
    this.adminApi.getFaqs().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load FAQs', 'Close', { duration: 3000 });
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(FaqDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.createFaq(result).subscribe({
          next: () => {
            this.snackBar.open('FAQ group created', 'Close', { duration: 3000 });
            this.loadFaqs();
          },
          error: () => this.snackBar.open('Failed to create FAQ group', 'Close', { duration: 3000 })
        });
      }
    });
  }

  openEditDialog(faq: Faq): void {
    const dialogRef = this.dialog.open(FaqDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { mode: 'edit', faq }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.updateFaq(faq._id, result).subscribe({
          next: () => {
            this.snackBar.open('FAQ group updated', 'Close', { duration: 3000 });
            this.loadFaqs();
          },
          error: () => this.snackBar.open('Failed to update FAQ group', 'Close', { duration: 3000 })
        });
      }
    });
  }

  deleteFaq(faq: Faq): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete FAQ Group',
        message: `Are you sure you want to delete "${faq.title}"? This will remove all Q&A items within it.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.deleteFaq(faq._id).subscribe({
          next: () => {
            this.snackBar.open('FAQ group deleted', 'Close', { duration: 3000 });
            this.loadFaqs();
          },
          error: () => this.snackBar.open('Failed to delete FAQ group', 'Close', { duration: 3000 })
        });
      }
    });
  }
}
