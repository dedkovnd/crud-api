import { z } from 'zod';
import { ProductCreateInput, ProductUpdateInput } from '../types/product.js';

export const productCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be a positive number"),
  category: z.string().min(1, "Category is required"),
  inStock: z.boolean()
}) satisfies z.ZodSchema<ProductCreateInput>;

export const productUpdateSchema = productCreateSchema.partial() satisfies z.ZodSchema<ProductUpdateInput>;

export type ProductCreateValidation = z.infer<typeof productCreateSchema>;
export type ProductUpdateValidation = z.infer<typeof productUpdateSchema>;

export const validateProductId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
