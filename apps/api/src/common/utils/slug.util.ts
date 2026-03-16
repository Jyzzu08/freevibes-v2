import slugify from 'slugify';

export function createSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true });
}

export function createIncrementedSlug(baseSlug: string, index: number) {
  return index <= 0 ? baseSlug : `${baseSlug}-${index + 1}`;
}
