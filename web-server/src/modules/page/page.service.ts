import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page } from './schemas/page.schema';

@Injectable()
export class PageService {
  constructor(@InjectModel(Page.name) private pageModel: Model<Page>) {}

  async findPublished() {
    return this.pageModel
      .find({ isPublished: true })
      .sort({ order: 1, title: 1 })
      .exec();
  }

  async findBySlug(slug: string) {
    return this.pageModel.findOne({ slug, isPublished: true }).exec();
  }

  async findAll() {
    return this.pageModel.find().sort({ order: 1, title: 1 }).exec();
  }

  async create(data: { slug: string; title: string; content: string; isPublished?: boolean; order?: number }) {
    return this.pageModel.create(data);
  }

  async update(id: string, data: Partial<{ slug: string; title: string; content: string; isPublished: boolean; order: number }>) {
    return this.pageModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    return this.pageModel.findByIdAndDelete(id).exec();
  }
}
