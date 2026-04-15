import {
  CmsPage,
  CreatePageRequestDto,
  ListPagesRequestDto,
  ListPagesResponseDto,
  PageDto,
  UpdatePageRequestDto
} from '../../types/dashboard/pages';
import { DashboardListResponse } from '../../types/dashboard/query';
import { delay } from './async';
import { mapPageDtoToUi, mapPageUiToDto } from './mappers/pages.mapper';

let pageStore: PageDto[] = [
  {
    id: 'page-1',
    title: 'Home Landing',
    slug: '/home',
    status: 'published',
    updated_by: 'Sarah Weston',
    updated_at: '2026-04-10',
    locale: 'EN',
    views: 58214
  },
  {
    id: 'page-2',
    title: 'Visa Pricing',
    slug: '/visa-pricing',
    status: 'published',
    updated_by: 'Mike T.',
    updated_at: '2026-04-11',
    locale: 'EN',
    views: 22120
  },
  {
    id: 'page-3',
    title: 'Corporate Intake Form',
    slug: '/corporate-intake',
    status: 'draft',
    updated_by: 'Admin Team',
    updated_at: '2026-04-07',
    locale: 'EN',
    views: 294
  },
  {
    id: 'page-4',
    title: 'Refund Policy Legacy',
    slug: '/refund-policy-legacy',
    status: 'archived',
    updated_by: 'Nina K.',
    updated_at: '2026-03-28',
    locale: 'EN',
    views: 780
  }
];

const toResponse = (items: PageDto[], page: number, pageSize: number): ListPagesResponseDto => ({
  items,
  meta: { total: items.length, page, pageSize }
});

export const pagesService = {
  async list(request: ListPagesRequestDto): Promise<DashboardListResponse<CmsPage>> {
    await delay();
    const search = request.search?.trim().toLowerCase() ?? '';
    const filtered = pageStore.filter((page) => {
      const matchSearch =
        !search ||
        page.title.toLowerCase().includes(search) ||
        page.slug.toLowerCase().includes(search) ||
        page.updated_by.toLowerCase().includes(search);
      const matchStatus = !request.status || request.status === 'All' || page.status === request.status.toLowerCase();
      const matchLocale = !request.locale || request.locale === 'All' || page.locale === request.locale;
      return matchSearch && matchStatus && matchLocale;
    });

    const dto = toResponse(filtered, request.page, request.page_size);
    return { ...dto, items: dto.items.map(mapPageDtoToUi) };
  },

  async create(payload: CreatePageRequestDto): Promise<CmsPage> {
    await delay();
    const slug = `/${payload.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const next: PageDto = {
      id: `page-${Date.now()}`,
      title: payload.title.trim(),
      slug,
      status: 'draft',
      updated_by: 'Admin Team',
      updated_at: '2026-04-12',
      locale: payload.locale,
      views: 0
    };
    pageStore = [next, ...pageStore];
    return mapPageDtoToUi(next);
  },

  async update(id: string, payload: UpdatePageRequestDto): Promise<CmsPage> {
    await delay();
    const existing = pageStore.find((page) => page.id === id);
    if (!existing) {
      throw new Error('Page not found');
    }

    const updatedDto: PageDto = {
      ...existing,
      title: payload.title?.trim() || existing.title,
      slug: payload.title ? `/${payload.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : existing.slug,
      status: payload.status ?? existing.status,
      updated_at: '2026-04-12'
    };

    pageStore = pageStore.map((page) => (page.id === id ? updatedDto : page));
    return mapPageDtoToUi(updatedDto);
  },

  async remove(id: string): Promise<void> {
    await delay();
    if (!pageStore.some((page) => page.id === id)) {
      throw new Error('Page not found');
    }
    pageStore = pageStore.filter((page) => page.id !== id);
  },

  toDto(page: CmsPage): PageDto {
    return mapPageUiToDto(page);
  }
};
