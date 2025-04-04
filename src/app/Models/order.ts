import { Product } from '../Models/product';
export class Order {
    order_id: number;
    customer_id: number;
    order_status: string;
    create_at: Date; 
    total_amount: number;
   
    product?: Product; 
}
