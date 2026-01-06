export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  variantAttributes: {
    color?: string;
    size?: string;
  };
  cost: number;
  price: number;
  status: string;
}

