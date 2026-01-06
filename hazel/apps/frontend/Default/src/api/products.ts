import { apiClient } from './client';

export interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  sku: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Map backend product to UI format
const mapProductToUI = (product: ProductResponse): any => {
  return {
    _id: product.id,
    id: product.id,
    productCode: product.sku,
    productName: product.name,
    name: product.name,
    sku: product.sku,
    status: product.status,
    // Default values for UI compatibility
    category: 'General',
    price: 0,
    stock: 0,
    rating: 0,
    orders: 0,
    published: product.status === 'active',
    publishedDate: product.status === 'active' ? product.createdAt : null,
    image: '',
    date: product.createdAt,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

export interface ProductVariantResponse {
  id: string;
  productId: string;
  color: string | null;
  size: string | null;
  sku: string;
  cost: number;
  price: number;
}

export const productsApi = {
  getProducts: async (): Promise<any[]> => {
    const products = await apiClient.get<ProductResponse[]>('/products');
    return products.map(mapProductToUI);
  },

  getProductById: async (productId: string): Promise<ProductResponse> => {
    return apiClient.get<ProductResponse>(`/products/${productId}`);
  },

  getProductVariants: async (productId: string): Promise<ProductVariantResponse[]> => {
    return apiClient.get<ProductVariantResponse[]>(`/products/${productId}/variants`);
  },
};

