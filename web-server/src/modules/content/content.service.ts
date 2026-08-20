import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Content } from './schemas/content.schema';

export interface ContentEntry {
  key: string;
  value: string;
  category: string;
  locale?: string;
  description?: string;
}

@Injectable()
export class ContentService {
  constructor(@InjectModel(Content.name) private contentModel: Model<Content>) {}

  async findAll(locale = 'en') {
    return this.contentModel.find({ locale }).sort({ category: 1, key: 1 }).exec();
  }

  async findByCategory(category: string, locale = 'en') {
    return this.contentModel.find({ category, locale }).sort({ key: 1 }).exec();
  }

  async findByKey(key: string, locale = 'en') {
    return this.contentModel.findOne({ key, locale }).exec();
  }

  async upsert(entry: ContentEntry) {
    const { key, value, category, locale = 'en', description } = entry;
    return this.contentModel.findOneAndUpdate(
      { key, locale },
      { key, value, category, locale, description },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }

  async bulkUpsert(entries: ContentEntry[]) {
    const results = [];
    for (const entry of entries) {
      const result = await this.upsert(entry);
      results.push(result);
    }
    return results;
  }

  async update(key: string, value: string, locale = 'en') {
    return this.contentModel.findOneAndUpdate(
      { key, locale },
      { value },
      { new: true },
    ).exec();
  }

  async delete(key: string, locale = 'en') {
    return this.contentModel.findOneAndDelete({ key, locale }).exec();
  }
}
