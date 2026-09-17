import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingSection } from './schemas/landing-section.schema';
import { CreateLandingSectionDto } from './dto/create-landing-section.dto';
import { UpdateLandingSectionDto } from './dto/update-landing-section.dto';

@Injectable()
export class LandingService {
  constructor(
    @InjectModel(LandingSection.name)
    private landingSectionModel: Model<LandingSection>,
  ) {}

  async findAll(): Promise<LandingSection[]> {
    return this.landingSectionModel.find().sort({ section: 1, order: 1 }).exec();
  }

  async findActive(section?: string): Promise<LandingSection[]> {
    const filter: any = { isActive: true };
    if (section) {
      filter.section = section;
    }
    return this.landingSectionModel.find(filter).sort({ order: 1 }).exec();
  }

  async create(data: CreateLandingSectionDto): Promise<LandingSection> {
    return this.landingSectionModel.create(data);
  }

  async update(id: string, data: UpdateLandingSectionDto): Promise<LandingSection | null> {
    return this.landingSectionModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<LandingSection | null> {
    return this.landingSectionModel.findByIdAndDelete(id).exec();
  }

  async reorder(id: string, direction: 'up' | 'down'): Promise<void> {
    const item = await this.landingSectionModel.findById(id).exec();
    if (!item) return;

    const sibling = await this.landingSectionModel.findOne({
      section: item.section,
      order: direction === 'up' ? item.order - 1 : item.order + 1,
    }).exec();

    if (sibling) {
      await Promise.all([
        this.landingSectionModel.findByIdAndUpdate(id, { order: sibling.order }),
        this.landingSectionModel.findByIdAndUpdate(sibling._id, { order: item.order }),
      ]);
    }
  }
}
