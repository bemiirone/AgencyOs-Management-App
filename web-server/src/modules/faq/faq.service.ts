import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq, FaqItem } from './schemas/faq.schema';

@Injectable()
export class FaqService {
  constructor(@InjectModel(Faq.name) private faqModel: Model<Faq>) {}

  async findAll() {
    return this.faqModel.find().sort({ order: 1 }).exec();
  }

  async create(data: { title: string; items: FaqItem[]; order: number }) {
    return this.faqModel.create(data);
  }

  async update(id: string, data: { title?: string; items?: FaqItem[]; order?: number }) {
    return this.faqModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    return this.faqModel.findByIdAndDelete(id).exec();
  }
}
