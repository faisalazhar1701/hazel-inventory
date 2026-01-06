import { InventoryItemType } from '../enums/InventoryItemType';
export interface InventoryDto {
    id: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    itemType: InventoryItemType;
}
