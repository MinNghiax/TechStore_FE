import { Product } from '../Models/product';
export class OrderDetails {
    id: number;
    order_id: number;
    product_id: number;
    price: number;
    number_of_products: number;
    total_money: number;
    imagePath : string;
    product_name : string;

    product?: Product; 
}
