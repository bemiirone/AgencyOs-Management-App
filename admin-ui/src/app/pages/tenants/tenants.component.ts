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
import { Tenant } from '../../models/tenant.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'admin-tenants',
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
  templateUrl: './tenants.component.html',
  styleUrl: './tenants.component.scss'
})
export class TenantsComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<Tenant>([]);
  displayedColumns: string[] = ['name', 'slug', 'status', 'createdAt', 'actions'];
  isLoading = true;

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.isLoading = true;
    this.adminApi.getTenants().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load tenants', 'Close', { duration: 3000 });
      }
    });
  }

  toggleStatus(tenant: Tenant): void {
    const newStatus = !tenant.isActive;
    this.adminApi.toggleTenantStatus(tenant._id, newStatus).subscribe({
      next: () => {
        this.snackBar.open(`Tenant ${newStatus ? 'activated' : 'deactivated'}`, 'Close', { duration: 3000 });
        this.loadTenants();
      },
      error: () => this.snackBar.open('Failed to update tenant status', 'Close', { duration: 3000 })
    });
  }

  deleteTenant(tenant: Tenant): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Tenant',
        message: `Are you sure you want to delete "${tenant.name}"? This action cannot be undone.`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.deleteTenant(tenant._id).subscribe({
          next: () => {
            this.snackBar.open('Tenant deleted', 'Close', { duration: 3000 });
            this.loadTenants();
          },
          error: () => this.snackBar.open('Failed to delete tenant', 'Close', { duration: 3000 })
        });
      }
    });
  }
}
