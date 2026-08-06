import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLinkedin, faTwitter, faGithub } from '@fortawesome/free-brands-svg-icons';
import { PageService } from '../../shared/services/page.service';
import { Page } from '../../shared/models/page.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit {
  readonly pages = signal<Page[]>([]);
  readonly currentYear = new Date().getFullYear();
  readonly faLinkedin = faLinkedin;
  readonly faTwitter = faTwitter;
  readonly faGithub = faGithub;

  private readonly pageService = inject(PageService);

  ngOnInit(): void {
    this.pageService.getPages().subscribe({
      next: (data) => this.pages.set(data),
      error: () => this.pages.set([]),
    });
  }

  trackBySlug(_index: number, page: Page): string {
    return page.slug;
  }
}
