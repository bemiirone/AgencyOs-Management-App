import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { switchMap } from 'rxjs/operators';
import { HeaderComponent } from '../../../layout/header/header.component';
import { SidebarComponent } from '../../../layout/sidebar/sidebar.component';
import { FooterComponent } from '../../../layout/footer/footer.component';
import { PageService } from '../../../shared/services/page.service';
import { Page } from '../../../shared/models/page.model';

@Component({
  selector: 'app-page-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule, HeaderComponent, SidebarComponent, FooterComponent],
  templateUrl: './page-detail.component.html',
  styleUrl: './page-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageDetailComponent implements OnInit {
  readonly page = signal<Page | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly faArrowLeft = faArrowLeft;

  private readonly route = inject(ActivatedRoute);
  private readonly pageService = inject(PageService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const subscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          const slug = params.get('slug');
          if (!slug) {
            this.error.set('Page not found');
            this.loading.set(false);
            return [];
          }

          this.loading.set(true);
          this.error.set(null);
          return this.pageService.getPageBySlug(slug);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.page.set(data);
            this.loading.set(false);
          } else {
            this.error.set('Page not found');
            this.loading.set(false);
          }
        },
        error: () => {
          this.error.set('Failed to load page');
          this.loading.set(false);
        },
      });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }
}
