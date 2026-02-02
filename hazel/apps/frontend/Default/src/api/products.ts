import { apiClient } from './client';

export type ProductLifecycleStatus = 'DRAFT' | 'ACTIVE' | 'DISCONTINUED';

export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  lifecycleStatus: ProductLifecycleStatus;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
  collection?: {
    id: string;
    name: string;
    season?: string;
    year?: number;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string;
  size?: string;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillOfMaterial {
  id: string;
  variantId: string;
  componentName: string;
  category: string;
  quantity: number;
  unit: string;
  variant?: ProductVariant;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  imageUrl?: string;
  lifecycleStatus?: ProductLifecycleStatus;
  collectionId?: string;
}

export interface CreateProductVariantDto {
  color: string;
  size?: string;
  price: number;
  status?: string;
}

export interface CreateBomDto {
  variantId: string;
  componentName: string;
  category: string;
  quantity: number;
  unit: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  collectionId?: string;
}

export interface UpdateLifecycleStatusDto {
  lifecycleStatus: ProductLifecycleStatus;
}

export interface ProductWithVariants extends Product {
  collection?: {
    id: string;
    name: string;
    season?: string;
    year?: number;
  };
  style?: {
    id: string;
    name: string;
    code?: string;
  };
  variants: (ProductVariant & {
    bomComponents: BillOfMaterial[];
  })[];
}

class ProductsAPI {
  private basePath = '/products';

  async listProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>(this.basePath);
  }

  // Backward compatibility alias
  async getProducts(): Promise<Product[]> {
    return this.listProducts();
  }

  async getProductById(id: string): Promise<ProductWithVariants> {
    return apiClient.get<ProductWithVariants>(`${this.basePath}/${id}`);
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    return apiClient.post<Product>(this.basePath, data);
  }

  async createVariant(productId: string, data: CreateProductVariantDto): Promise<ProductVariant> {
    return apiClient.post<ProductVariant>(`${this.basePath}/${productId}/variants`, data);
  }

  async listVariants(productId: string): Promise<ProductVariant[]> {
    return apiClient.get<ProductVariant[]>(`${this.basePath}/${productId}/variants`);
  }

  // Backward compatibility alias
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return this.listVariants(productId);
  }

  async createBom(variantId: string, data: CreateBomDto): Promise<BillOfMaterial> {
    return apiClient.post<BillOfMaterial>(`${this.basePath}/${variantId}/bom`, data);
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    return apiClient.patch<Product>(`${this.basePath}/${id}`, data);
  }

  async updateLifecycleStatus(id: string, data: UpdateLifecycleStatusDto): Promise<Product> {
    return apiClient.patch<Product>(`${this.basePath}/${id}/lifecycle`, data);
  }

  async assignRelations(id: string, data: AssignProductRelationsDto): Promise<Product> {
    return apiClient.patch<Product>(`${this.basePath}/${id}/assign`, data);
  }
}

export interface AssignProductRelationsDto {
  collectionId?: string;
  styleId?: string;
}

export const productsAPI = new ProductsAPI();

// Backward compatibility
export const productsApi = productsAPI;

// Legacy type for backward compatibility
export interface ProductVariantResponse {
  id: string;
  productId: string;
  sku: string;
  attributes?: string;
  createdAt: string;
  updatedAt: string;
}
