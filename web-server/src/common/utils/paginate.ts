import { Model } from 'mongoose';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function paginate<T>(
  model: Model<T>,
  query: Record<string, unknown>,
  page: number,
  limit: number,
  sort: Record<string, 1 | -1> = { createdAt: -1 },
): Promise<PaginatedResult<T>> {
  const total = await model.countDocuments(query);
  const data = await model.find(query).sort(sort).skip((page - 1) * limit).limit(limit).exec();
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
