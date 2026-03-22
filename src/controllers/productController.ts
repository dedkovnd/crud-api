import { FastifyRequest, FastifyReply } from 'fastify';
import productService from '../services/productService.js';
import { productCreateSchema, productUpdateSchema, validateProductId } from '../schemas/productSchema.js';
import { ApiError } from '../types/product.js';

interface Params {
  productId: string;
}

interface CreateProductBody {
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface UpdateProductBody {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  inStock?: boolean;
}

class ProductController {
  async getAllProducts(request: FastifyRequest, reply: FastifyReply) {
    const products = productService.getAllProducts();
    return reply.code(200).send(products);
  }

  async getProductById(
    request: FastifyRequest<{ Params: Params }>,
    reply: FastifyReply
  ) {
    const { productId } = request.params;

    if (!validateProductId(productId)) {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Invalid product ID format. Expected UUID.'
      };
      return reply.code(400).send(error);
    }

    const product = productService.getProductById(productId);

    if (!product) {
      const error: ApiError = {
        error: 'Not Found',
        message: `Product with id ${productId} not found`
      };
      return reply.code(404).send(error);
    }

    return reply.code(200).send(product);
  }

  async createProduct(
    request: FastifyRequest<{ Body: CreateProductBody }>,
    reply: FastifyReply
  ) {
    try {
      const validationResult = productCreateSchema.safeParse(request.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const error: ApiError = {
          error: 'Bad Request',
          message: 'Invalid product data',
          details: errors
        };
        return reply.code(400).send(error);
      }

      const product = productService.createProduct(validationResult.data);
      return reply.code(201).send(product);
    } catch (error) {
      throw error;
    }
  }

  async updateProduct(
    request: FastifyRequest<{ Params: Params; Body: UpdateProductBody }>,
    reply: FastifyReply
  ) {
    const { productId } = request.params;

    if (!validateProductId(productId)) {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Invalid product ID format. Expected UUID.'
      };
      return reply.code(400).send(error);
    }

    const existingProduct = productService.getProductById(productId);
    if (!existingProduct) {
      const error: ApiError = {
        error: 'Not Found',
        message: `Product with id ${productId} not found`
      };
      return reply.code(404).send(error);
    }

    try {
      const validationResult = productUpdateSchema.safeParse(request.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const error: ApiError = {
          error: 'Bad Request',
          message: 'Invalid product data',
          details: errors
        };
        return reply.code(400).send(error);
      }

      const updatedProduct = productService.updateProduct(productId, validationResult.data);
      return reply.code(200).send(updatedProduct);
    } catch (error) {
      throw error;
    }
  }

  async deleteProduct(
    request: FastifyRequest<{ Params: Params }>,
    reply: FastifyReply
  ) {
    const { productId } = request.params;

    if (!validateProductId(productId)) {
      const error: ApiError = {
        error: 'Bad Request',
        message: 'Invalid product ID format. Expected UUID.'
      };
      return reply.code(400).send(error);
    }

    const product = productService.getProductById(productId);
    if (!product) {
      const error: ApiError = {
        error: 'Not Found',
        message: `Product with id ${productId} not found`
      };
      return reply.code(404).send(error);
    }

    productService.deleteProduct(productId);
    return reply.code(204).send();
  }
}

export default new ProductController();
