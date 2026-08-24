import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminApiService, ContentEntry, ContentUpdateRequest, BulkContentRequest } from './admin-api.service';
import { Tenant } from '../models/tenant.model';
import { Page, CreatePageRequest, UpdatePageRequest } from '../models/page.model';
import { Faq, CreateFaqRequest, UpdateFaqRequest, FaqItem } from '../models/faq.model';
import { NotificationSettings } from '../models/notification-settings.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AdminApiService', () => {
  let service: AdminApiService;
  let httpTesting: HttpTestingController;
  const baseUrl = 'http://localhost:3000/api/admin';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AdminApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('Tenants', () => {
    it('getTenants() should return tenants', () => {
      const mockTenants: Tenant[] = [
        { _id: '1', name: 'Tenant A', slug: 'tenant-a', ownerId: 'o1', memberIds: [], isActive: true, createdAt: '', updatedAt: '' },
      ];

      service.getTenants().subscribe((tenants) => {
        expect(tenants).toEqual(mockTenants);
      });

      const req = httpTesting.expectOne(`${baseUrl}/tenants`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTenants);
    });

    it('toggleTenantStatus() should PATCH tenant status', () => {
      const mockTenant: Tenant = { _id: '1', name: 'Tenant A', slug: 'tenant-a', ownerId: 'o1', memberIds: [], isActive: false, createdAt: '', updatedAt: '' };

      service.toggleTenantStatus('1', false).subscribe((tenant) => {
        expect(tenant).toEqual(mockTenant);
      });

      const req = httpTesting.expectOne(`${baseUrl}/tenants/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ isActive: false });
      req.flush(mockTenant);
    });

    it('deleteTenant() should DELETE tenant', () => {
      service.deleteTenant('1').subscribe((result) => {
        expect(result).toEqual({ success: true });
      });

      const req = httpTesting.expectOne(`${baseUrl}/tenants/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('Pages', () => {
    it('getPages() should return pages', () => {
      const mockPages: Page[] = [
        { _id: '1', title: 'Home', slug: 'home', content: '', isPublished: true, order: 1, createdAt: '', updatedAt: '' },
      ];

      service.getPages().subscribe((pages) => {
        expect(pages).toEqual(mockPages);
      });

      const req = httpTesting.expectOne(`${baseUrl}/pages`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPages);
    });

    it('createPage() should POST new page', () => {
      const createData: CreatePageRequest = { title: 'About', slug: 'about', content: 'Content', isPublished: false, order: 2 };
      const mockPage: Page = { _id: '2', title: 'About', slug: 'about', content: 'Content', isPublished: false, order: 2, createdAt: '', updatedAt: '' };

      service.createPage(createData).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpTesting.expectOne(`${baseUrl}/pages`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush(mockPage);
    });

    it('updatePage() should PATCH page', () => {
      const updateData: UpdatePageRequest = { title: 'Updated Title' };
      const mockPage: Page = { _id: '1', title: 'Updated Title', slug: 'home', content: '', isPublished: true, order: 1, createdAt: '', updatedAt: '' };

      service.updatePage('1', updateData).subscribe((page) => {
        expect(page).toEqual(mockPage);
      });

      const req = httpTesting.expectOne(`${baseUrl}/pages/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockPage);
    });

    it('deletePage() should DELETE page', () => {
      service.deletePage('1').subscribe((result) => {
        expect(result).toEqual({ success: true });
      });

      const req = httpTesting.expectOne(`${baseUrl}/pages/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('FAQs', () => {
    it('getFaqs() should return FAQs', () => {
      const mockFaqs: Faq[] = [
        { _id: '1', title: 'General', items: [], order: 1, createdAt: '', updatedAt: '' },
      ];

      service.getFaqs().subscribe((faqs) => {
        expect(faqs).toEqual(mockFaqs);
      });

      const req = httpTesting.expectOne(`${baseUrl}/faqs`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFaqs);
    });

    it('createFaq() should POST new FAQ', () => {
      const items: FaqItem[] = [{ question: 'Q?', answer: 'A.', order: 0 }];
      const createData: CreateFaqRequest = { title: 'New FAQ', items, order: 1 };
      const mockFaq: Faq = { _id: '2', ...createData, createdAt: '', updatedAt: '' };

      service.createFaq(createData).subscribe((faq) => {
        expect(faq).toEqual(mockFaq);
      });

      const req = httpTesting.expectOne(`${baseUrl}/faqs`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createData);
      req.flush(mockFaq);
    });

    it('updateFaq() should PATCH FAQ', () => {
      const updateData: UpdateFaqRequest = { title: 'Updated' };
      const mockFaq: Faq = { _id: '1', title: 'Updated', items: [], order: 1, createdAt: '', updatedAt: '' };

      service.updateFaq('1', updateData).subscribe((faq) => {
        expect(faq).toEqual(mockFaq);
      });

      const req = httpTesting.expectOne(`${baseUrl}/faqs/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockFaq);
    });

    it('deleteFaq() should DELETE FAQ', () => {
      service.deleteFaq('1').subscribe((result) => {
        expect(result).toEqual({ success: true });
      });

      const req = httpTesting.expectOne(`${baseUrl}/faqs/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('Notification Settings', () => {
    it('getNotificationSettings() should return settings', () => {
      const mockSettings: NotificationSettings = {
        _id: '1', enabled: true, projectDueSoon: { enabled: true, titleTemplate: '', messageTemplate: '' }, projectOverdue: { enabled: true, titleTemplate: '', messageTemplate: '' }, taskDueSoon: { enabled: true, titleTemplate: '', messageTemplate: '' }, taskOverdue: { enabled: true, titleTemplate: '', messageTemplate: '' }, invoiceDueSoon: { enabled: true, titleTemplate: '', messageTemplate: '' }, invoiceOverdue: { enabled: true, titleTemplate: '', messageTemplate: '' }, lastRunCount: 0, createdAt: '', updatedAt: '',
      };

      service.getNotificationSettings().subscribe((settings) => {
        expect(settings).toEqual(mockSettings);
      });

      const req = httpTesting.expectOne(`${baseUrl}/notification-settings`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSettings);
    });

    it('updateNotificationSettings() should PUT settings', () => {
      const updateData: Partial<NotificationSettings> = { enabled: false };
      const mockSettings: NotificationSettings = {
        _id: '1', enabled: false, projectDueSoon: { enabled: true, titleTemplate: '', messageTemplate: '' }, projectOverdue: { enabled: true, titleTemplate: '', messageTemplate: '' }, taskDueSoon: { enabled: true, titleTemplate: '', messageTemplate: '' }, taskOverdue: { enabled: true, titleTemplate: '', messageTemplate: '' }, invoiceDueSoon: { enabled: true, titleTemplate: '', messageTemplate: '' }, invoiceOverdue: { enabled: true, titleTemplate: '', messageTemplate: '' }, lastRunCount: 0, createdAt: '', updatedAt: '',
      };

      service.updateNotificationSettings(updateData).subscribe((settings) => {
        expect(settings).toEqual(mockSettings);
      });

      const req = httpTesting.expectOne(`${baseUrl}/notification-settings`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockSettings);
    });
  });

  describe('Content', () => {
    it('getContent() should return content entries', () => {
      const mockContent: ContentEntry[] = [
        { _id: '1', key: 'site.title', value: 'My Site', category: 'general', locale: 'en', description: 'Site title' },
      ];

      service.getContent().subscribe((content) => {
        expect(content).toEqual(mockContent);
      });

      const req = httpTesting.expectOne(`${baseUrl}/content`);
      expect(req.request.method).toBe('GET');
      req.flush(mockContent);
    });

    it('updateContent() should PATCH content', () => {
      const updateData: ContentUpdateRequest = { value: 'New Value' };
      const mockEntry: ContentEntry = { _id: '1', key: 'site.title', value: 'New Value', category: 'general', locale: 'en', description: 'Site title' };

      service.updateContent('site.title', updateData).subscribe((entry) => {
        expect(entry).toEqual(mockEntry);
      });

      const req = httpTesting.expectOne(`${baseUrl}/content/site.title`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockEntry);
    });

    it('bulkUpdateContent() should POST bulk content', () => {
      const entries: BulkContentRequest['entries'] = [
        { key: 'site.title', value: 'New Title', category: 'general' },
      ];
      const mockResult: ContentEntry[] = [
        { _id: '1', key: 'site.title', value: 'New Title', category: 'general', locale: 'en', description: '' },
      ];

      service.bulkUpdateContent(entries).subscribe((result) => {
        expect(result).toEqual(mockResult);
      });

      const req = httpTesting.expectOne(`${baseUrl}/content/bulk`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ entries });
      req.flush(mockResult);
    });

    it('createContent() should POST new content', () => {
      const newEntry: ContentEntry = { _id: '2', key: 'footer.text', value: 'Copyright', category: 'footer', locale: 'en', description: 'Footer text' };

      service.createContent(newEntry).subscribe((entry) => {
        expect(entry).toEqual(newEntry);
      });

      const req = httpTesting.expectOne(`${baseUrl}/content`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newEntry);
      req.flush(newEntry);
    });
  });
});
