import { v4 as uuidv4 } from 'uuid';
import { Product, ProductCreateInput, ProductUpdateInput } from '../types/product';

class InMemoryDB {
  private products: Map<string, Product>;

  constructor() {
    this.products = new Map<string, Product>();
  }

  findAll(): Product[] {
    return Array.from(this.products.values());
  }

  findById(id: string): Product | undefined {
    return this.products.get(id);
  }

  create(productData: ProductCreateInput): Product {
    const id = uuidv4();
    const product: Product = {
      id,
      ...productData,
      price: Number(productData.price)
    };
    this.products.set(id, product);
    return product;
  }

  update(id: string, productData: ProductUpdateInput): Product | null {
    const existingProduct = this.products.get(id);
    if (!existingProduct) {
      return null;
    }

    const updatedProduct: Product = {
      ...existingProduct,
      ...productData,
      id: existingProduct.id,
      price: productData.price !== undefined ? Number(productData.price) : existingProduct.price
    };

    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  delete(id: string): boolean {
    return this.products.delete(id);
  }

  clear(): void {
    this.products.clear();
  }
}

const db = new InMemoryDB();
export default db;
