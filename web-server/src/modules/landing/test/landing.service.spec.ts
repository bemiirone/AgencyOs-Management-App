import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Model } from 'mongoose';
import { LandingService } from '../landing.service';

vi.mock('../schemas/landing-section.schema', () => ({
  LandingSection: 'LandingSection',
  LandingSectionSchema: { index: vi.fn() },
}));

vi.mock('@nestjs/mongoose', () => ({
  InjectModel: () => () => {},
  getModelToken: (name: string) => `${name}Model`,
}));

vi.mock('@nestjs/common', () => ({
  Injectable: () => () => {},
}));

const mockModel = {
  find: vi.fn(),
  findById: vi.fn(),
  findOne: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
};

const createChainableMock = (result: any) => ({
  sort: vi.fn().mockReturnValue({
    exec: vi.fn().mockResolvedValue(result),
  }),
  exec: vi.fn().mockResolvedValue(result),
});

describe('LandingService', () => {
  let service: LandingService;

  const mockSections = [
    { _id: '1', section: 'painPoints', order: 0, isActive: true, title: 'Point 1' },
    { _id: '2', section: 'painPoints', order: 1, isActive: true, title: 'Point 2' },
    { _id: '3', section: 'painPoints', order: 2, isActive: false, title: 'Point 3' },
    { _id: '4', section: 'features', order: 0, isActive: true, title: 'Feature 1' },
    { _id: '5', section: 'features', order: 1, isActive: true, title: 'Feature 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LandingService(mockModel as unknown as Model<LandingSection>);
  });

  describe('findAll', () => {
    it('returns all sections sorted by section and order', async () => {
      mockModel.find.mockReturnValue(createChainableMock(mockSections));

      const result = await service.findAll();

      expect(mockModel.find).toHaveBeenCalled();
      expect(result).toEqual(mockSections);
    });
  });

  describe('findActive', () => {
    it('returns only active sections', async () => {
      const activeSections = mockSections.filter(s => s.isActive);
      mockModel.find.mockReturnValue(createChainableMock(activeSections));

      const result = await service.findActive();

      expect(mockModel.find).toHaveBeenCalledWith({ isActive: true });
      expect(result).toEqual(activeSections);
    });

    it('filters by section type when provided', async () => {
      const painPoints = mockSections.filter(s => s.section === 'painPoints' && s.isActive);
      mockModel.find.mockReturnValue(createChainableMock(painPoints));

      const result = await service.findActive('painPoints');

      expect(mockModel.find).toHaveBeenCalledWith({ isActive: true, section: 'painPoints' });
      expect(result).toEqual(painPoints);
    });

    it('returns empty array when no active sections exist', async () => {
      mockModel.find.mockReturnValue(createChainableMock([]));

      const result = await service.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates a new landing section', async () => {
      const dto = { section: 'faqs', order: 0, question: 'Test?', answer: 'Test.' };
      mockModel.create.mockResolvedValue({ _id: '6', ...dto });

      const result = await service.create(dto);

      expect(mockModel.create).toHaveBeenCalledWith(dto);
      expect(result.section).toBe('faqs');
    });
  });

  describe('update', () => {
    it('updates an existing section', async () => {
      const updated = { _id: '1', section: 'painPoints', order: 0, title: 'Updated' };
      mockModel.findByIdAndUpdate.mockReturnValue(createChainableMock(updated));

      const result = await service.update('1', { title: 'Updated' });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { title: 'Updated' }, { new: true });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes a section', async () => {
      mockModel.findByIdAndDelete.mockReturnValue(createChainableMock({ _id: '1' }));

      const result = await service.delete('1');

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(result).toBeDefined();
    });
  });

  describe('reorder', () => {
    it('swaps order when moving item up', async () => {
      mockModel.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(mockSections[1]) });
      mockModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(mockSections[0]) });
      mockModel.findByIdAndUpdate.mockResolvedValue(undefined);

      await service.reorder('2', 'up');

      expect(mockModel.findById).toHaveBeenCalledWith('2');
      expect(mockModel.findOne).toHaveBeenCalledWith({ section: 'painPoints', order: 0 });
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('swaps order when moving item down', async () => {
      mockModel.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(mockSections[0]) });
      mockModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(mockSections[1]) });
      mockModel.findByIdAndUpdate.mockResolvedValue(undefined);

      await service.reorder('1', 'down');

      expect(mockModel.findOne).toHaveBeenCalledWith({ section: 'painPoints', order: 1 });
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no sibling exists (boundary)', async () => {
      mockModel.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(mockSections[0]) });
      mockModel.findOne.mockReturnValue({ exec: vi.fn().mockResolvedValue(null) });
      mockModel.findByIdAndUpdate.mockResolvedValue(undefined);

      await service.reorder('1', 'up');

      expect(mockModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('does nothing when item does not exist', async () => {
      mockModel.findById.mockReturnValue({ exec: vi.fn().mockResolvedValue(null) });

      await service.reorder('nonexistent', 'up');

      expect(mockModel.findOne).not.toHaveBeenCalled();
    });
  });
});
