import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { buildServer } from '../server';
import { FastifyInstance } from 'fastify';
import { config } from 'dotenv';

config();

describe('Product Catalog API Tests', () => {
  let fastify: FastifyInstance;
  let createdProductId: string;

  before(async () => {
    fastify = buildServer();
    await fastify.ready();
  });

  after(async () => {
    await fastify.close();
  });

  it('GET /api/products should return empty array initially', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/products'
    });
    
    assert.strictEqual(response.statusCode, 200);
    const products = JSON.parse(response.payload);
    assert.ok(Array.isArray(products));
    assert.strictEqual(products.length, 0);
  });

  it('POST /api/products should create a new product', async () => {
    const newProduct = {
      name: 'Laptop',
      description: 'High-performance laptop',
      price: 999.99,
      category: 'electronics',
      inStock: true
    };
    
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/products',
      payload: newProduct
    });
    
    assert.strictEqual(response.statusCode, 201);
    const product = JSON.parse(response.payload);
    assert.ok(product.id);
    assert.strictEqual(product.name, newProduct.name);
    assert.strictEqual(product.price, newProduct.price);
    assert.strictEqual(product.category, newProduct.category);
    assert.strictEqual(product.inStock, newProduct.inStock);
    
    createdProductId = product.id;
  });

  it('GET /api/products/:id should return created product', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: `/api/products/${createdProductId}`
    });
    
    assert.strictEqual(response.statusCode, 200);
    const product = JSON.parse(response.payload);
    assert.strictEqual(product.id, createdProductId);
    assert.strictEqual(product.name, 'Laptop');
  });

  it('PUT /api/products/:id should update product', async () => {
    const updates = {
      name: 'Gaming Laptop',
      price: 1299.99,
      inStock: false
    };
    
    const response = await fastify.inject({
      method: 'PUT',
      url: `/api/products/${createdProductId}`,
      payload: updates
    });
    
    assert.strictEqual(response.statusCode, 200);
    const product = JSON.parse(response.payload);
    assert.strictEqual(product.id, createdProductId);
    assert.strictEqual(product.name, 'Gaming Laptop');
    assert.strictEqual(product.price, 1299.99);
    assert.strictEqual(product.inStock, false);
    assert.strictEqual(product.description, 'High-performance laptop');
  });

  it('DELETE /api/products/:id should delete product', async () => {
    const response = await fastify.inject({
      method: 'DELETE',
      url: `/api/products/${createdProductId}`
    });
    
    assert.strictEqual(response.statusCode, 204);
  });

  it('GET /api/products/:id should return 404 after deletion', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: `/api/products/${createdProductId}`
    });
    
    assert.strictEqual(response.statusCode, 404);
    const error = JSON.parse(response.payload);
    assert.ok(error.message.includes('not found'));
  });

  it('POST /api/products should validate required fields', async () => {
    const invalidProduct = {
      name: 'Test',
      price: -10
    };
    
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/products',
      payload: invalidProduct
    });
    
    assert.strictEqual(response.statusCode, 400);
    const error = JSON.parse(response.payload);
    assert.ok(error.message.includes('Invalid product data'));
  });

  it('POST /api/products should validate price > 0', async () => {
    const invalidProduct = {
      name: 'Test',
      description: 'Test description',
      price: -50,
      category: 'electronics',
      inStock: true
    };
    
    const response = await fastify.inject({
      method: 'POST',
      url: '/api/products',
      payload: invalidProduct
    });
    
    assert.strictEqual(response.statusCode, 400);
  });

  it('GET /api/products/:id should validate UUID format', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/products/invalid-id'
    });
    
    assert.strictEqual(response.statusCode, 400);
    const error = JSON.parse(response.payload);
    assert.ok(error.message.includes('Invalid product ID format'));
  });

  it('GET /nonexistent should return 404', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/api/nonexistent'
    });
    
    assert.strictEqual(response.statusCode, 404);
  });
});
