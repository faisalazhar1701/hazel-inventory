import { ProductionStatus } from '../enums/ProductionStatus';

export interface ProductionOrderDto {
  id: string;
  productId: string;
  quantity: number;
  status: ProductionStatus;
}

