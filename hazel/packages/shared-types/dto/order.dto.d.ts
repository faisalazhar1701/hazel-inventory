import { OrderChannel } from '../enums/OrderChannel';
import { OrderStatus } from '../enums/OrderStatus';
export interface OrderDto {
    id: string;
    orderNumber: string;
    channel: OrderChannel;
    status: OrderStatus;
    totalAmount: number;
    currency: string;
    createdAt: Date | string;
}
