import { FastifyInstance } from 'fastify';
import productController from '../controllers/productController';

async function productRoutes(fastify: FastifyInstance) {
  fastify.get('/products', productController.getAllProducts.bind(productController));
  fastify.get('/products/:productId', productController.getProductById.bind(productController));
  fastify.post('/products', productController.createProduct.bind(productController));
  fastify.put('/products/:productId', productController.updateProduct.bind(productController));
  fastify.delete('/products/:productId', productController.deleteProduct.bind(productController));
}

export default productRoutes;
