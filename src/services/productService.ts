import db from '../db/inMemoryDB.js';
import { Product, ProductCreateInput, ProductUpdateInput } from '../types/product.js';

class ProductService {
  getAllProducts(): Product[] {
    return db.findAll();
  }

  getProductById(id: string): Product | undefined {
    return db.findById(id);
  }

  createProduct(productData: ProductCreateInput): Product {
    return db.create(productData);
  }

  updateProduct(id: string, productData: ProductUpdateInput): Product | null {
    return db.update(id, productData);
  }

  deleteProduct(id: string): boolean {
    return db.delete(id);
  }
}

export default new ProductService();
