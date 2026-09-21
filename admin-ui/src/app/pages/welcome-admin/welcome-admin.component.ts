import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdminApiService } from '../../services/admin-api.service';
import { LandingSection, SectionType } from '../../models/landing-section.model';
import { LandingSectionDialogComponent } from '../../components/landing-section-dialog/landing-section-dialog.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

const SECTION_TYPES: SectionType[] = ['painPoints', 'valueProps', 'steps', 'features', 'testimonials', 'faqs'];
const SECTION_TAB_KEYS: Record<SectionType, string> = {
  painPoints: 'landing.admin.tab.painPoints',
  valueProps: 'landing.admin.tab.valueProps',
  steps: 'landing.admin.tab.steps',
  features: 'landing.admin.tab.features',
  testimonials: 'landing.admin.tab.testimonials',
  faqs: 'landing.admin.tab.faqs',
};
const SECTION_FALLBACK_LABELS: Record<SectionType, string> = {
  painPoints: 'Pain Points',
  valueProps: 'Value Props',
  steps: 'How It Works',
  features: 'Features',
  testimonials: 'Testimonials',
  faqs: 'FAQs',
};

@Component({
  selector: 'admin-welcome',
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
    MatTooltipModule,
    MatTabsModule,
    MatChipsModule,
    MatSlideToggleModule,
  ],
  templateUrl: './welcome-admin.component.html',
  styleUrl: './welcome-admin.component.scss',
})
export class WelcomeAdminComponent implements OnInit {
  private adminApi = inject(AdminApiService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  allSections: LandingSection[] = [];
  selectedTab = 0;
  isLoading = true;
  tabLabels: Record<SectionType, string> = {} as Record<SectionType, string>;

  get sectionTypes(): SectionType[] {
    return SECTION_TYPES;
  }

  getTabLabel(sectionType: SectionType): string {
    return this.tabLabels[sectionType] || SECTION_FALLBACK_LABELS[sectionType];
  }

  getItemsForTab(sectionType: SectionType): LandingSection[] {
    return this.allSections
      .filter(s => s.section === sectionType)
      .sort((a, b) => a.order - b.order);
  }

  ngOnInit(): void {
    this.loadTabLabels();
    this.loadSections();
  }

  loadTabLabels(): void {
    const tabValues = Object.values(SECTION_TAB_KEYS);
    this.adminApi.getContent().subscribe({
      next: (entries) => {
        for (const entry of entries) {
          if (tabValues.includes(entry.key)) {
            const key = entry.key as SectionType;
            this.tabLabels[key] = entry.value;
          }
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      error: () => {},
    });
  }

  loadSections(): void {
    this.isLoading = true;
    this.adminApi.getLandingSections().subscribe({
      next: (data) => {
        this.allSections = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Failed to load landing sections', 'Close', { duration: 3000 });
      },
    });
  }

  openCreateDialog(sectionType: SectionType): void {
    const items = this.getItemsForTab(sectionType);
    const dialogRef = this.dialog.open(LandingSectionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { mode: 'create', sectionType, item: { order: items.length } },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.createLandingSection(result).subscribe({
          next: () => {
            this.snackBar.open(`${this.getTabLabel(sectionType)} item created`, 'Close', { duration: 2000 });
            this.loadSections();
          },
          error: () => this.snackBar.open('Failed to create item', 'Close', { duration: 3000 }),
        });
      }
    });
  }

  openEditDialog(item: LandingSection): void {
    const dialogRef = this.dialog.open(LandingSectionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { mode: 'edit', sectionType: item.section as SectionType, item },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.updateLandingSection(item._id, result).subscribe({
          next: () => {
            this.snackBar.open('Item updated', 'Close', { duration: 2000 });
            this.loadSections();
          },
          error: () => this.snackBar.open('Failed to update item', 'Close', { duration: 3000 }),
        });
      }
    });
  }

  deleteItem(item: LandingSection): void {
    const label = item.title || item.question || 'Item';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Delete ${this.getTabLabel(item.section as SectionType)} Item`,
        message: `Are you sure you want to delete "${label}"? This action cannot be undone.`,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminApi.deleteLandingSection(item._id).subscribe({
          next: () => {
            this.snackBar.open('Item deleted', 'Close', { duration: 2000 });
            this.loadSections();
          },
          error: () => this.snackBar.open('Failed to delete item', 'Close', { duration: 3000 }),
        });
      }
    });
  }

  toggleActive(item: LandingSection): void {
    this.adminApi.updateLandingSection(item._id, { isActive: !item.isActive }).subscribe({
      next: () => {
        this.snackBar.open(`Item ${item.isActive ? 'disabled' : 'enabled'}`, 'Close', { duration: 2000 });
        this.loadSections();
      },
      error: () => this.snackBar.open('Failed to update item', 'Close', { duration: 3000 }),
    });
  }

  moveItemUp(item: LandingSection): void {
    this.adminApi.reorderLandingSection(item._id, 'up').subscribe({
      next: () => this.loadSections(),
      error: () => this.snackBar.open('Failed to reorder', 'Close', { duration: 3000 }),
    });
  }

  moveItemDown(item: LandingSection): void {
    this.adminApi.reorderLandingSection(item._id, 'down').subscribe({
      next: () => this.loadSections(),
      error: () => this.snackBar.open('Failed to reorder', 'Close', { duration: 3000 }),
    });
  }

  getDisplayTitle(item: LandingSection): string {
    if (item.section === 'faqs') return item.question || 'Untitled FAQ';
    return item.title || 'Untitled';
  }

  getDisplayDescription(item: LandingSection): string {
    if (item.section === 'faqs') return this.stripHtml(item.answer || '');
    if (item.section === 'testimonials') return `${item.name || ''}${item.role ? ` — ${item.role}` : ''}`;
    return this.stripHtml(item.description || '');
  }

  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').substring(0, 80);
  }

  getSectionIcon(item: LandingSection): string {
    return item.icon || 'label';
  }
}
