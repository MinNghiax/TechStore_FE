import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router'; 
import { OrderDetailService } from '../../../Service/order-detail-service';
import { OrderDetails } from '../../../Models/order-details';
import { Product } from '../../../Models/product';
import { ProductService } from '../../../Service/productService';
import { userService } from '../../../Service/userService'; 
import { OrderService } from '../../../Service/order-service';
import { Order } from '../../../Models/order';



@Component({
  selector: 'app-detail-order',
  templateUrl: './detail-order.component.html',
  styleUrl: './detail-order.component.css'
})
export class DetailOrderComponent {

  customer_name: string;
  PathAnh: string;
  product_name:string;
  product: Product;
  orderDetails: OrderDetails;
  order_status: string;
  id_customer: number;
  customer_phone: string;
  customer_address; string;

  constructor(
    private order_detailService: OrderDetailService, 
    private productService :ProductService ,
    private orderService: OrderService,
    private router: Router, 
    private route: ActivatedRoute,
    private _userService: userService
  ) {}

  ngOnInit() {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    console.log("orrderId", orderId);
    if (orderId) {
      this.loadOrderDetails(orderId);

    } else {
      console.error("Lỗi! ID is invalid or not found.");
    }
  }

  

  loadOrderDetails(id: number): void {
    // console.log('hiện dữ liệu',id);
    this.order_detailService.getOrderDetailById(id).subscribe({
      next: (data) => {
        this.orderDetails= data;

        this.loadProducts(this.orderDetails.product_id);
        this.loadOrder(this.orderDetails.order_id);
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
      }
    });
  }
  

  loadUser(id:number){
    this._userService.getUserById(id).subscribe({
      next: (user) => {
        this.loadOrder(this.id_customer);
        this.customer_name = user.username;
        this.id_customer = user.user_id;
        this.customer_address = user.address;
        this.customer_phone = user.phone;
  
        console.log("Customer Details:", {
          name: this.customer_name,
          id: this.id_customer,
          address: this.customer_address,
          phone: this.customer_phone
        });
      },
      error: (err) => {
        console.error(`Lỗi khi lấy user với ID ${id}:`, err);
      }
    });
  }
  
  loadProducts(id: number): void {
    this.productService.getProductDetails(id).subscribe({
      next: (product) => {
        console.log('Product Data:', product);
       this.PathAnh = this.productService.PhotosUrl + "/" + product.image_url;
        this.product_name = product.product_name;
        console.log('pro', this.product_name);
      },
      error: (err) => {
        console.error(`Lỗi khi lấy sản phẩm với ID ${id}:`, err);
      }
    });
  }


  loadOrder(id:number):void{
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order_status = order.order_status;
        this.id_customer = order.customer_id;
        this.loadUser(this.id_customer);
        
      },
      error: (err) => {
        console.error(`Lỗi khi lấy order với ID ${id}:`, err);
      }
    });

  }
  

  huyOrderDetail(order: OrderDetails) {
    // Gọi API để lấy thông tin chi tiết của đơn hàng từ backend
    this.orderService.getOrderById(order.order_id).subscribe(
      (orderDetails: Order) => {
        // Kiểm tra trạng thái đơn hàng
        if (orderDetails.order_status === "Đang vận chuyển") {
          alert('Đơn hàng đang vận chuyển, không thể hủy!');
          return; // Dừng thực hiện nếu trạng thái không hợp lệ
        }
  
        // Nếu trạng thái hợp lệ, tiếp tục gọi API hủy đơn
        this.orderService.deleteOrder(orderDetails.order_id).subscribe(
          (data) => {
            alert('Đơn hàng đã được hủy thành công.');
            // Điều hướng lại trang danh sách đơn hàng
            this.router.navigate(['home/user/viewOH', this.id_customer]);
          },
          (error) => {
            console.error('Lỗi khi hủy đơn hàng:', error);
            alert('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
          }
        );
      },
      (error) => {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
        alert('Không thể kiểm tra trạng thái đơn hàng. Vui lòng thử lại sau.');
      }
    );
  }
  
  



  // Navigate back to the order list page
  goBackToOrderList( ): void {
    this.router.navigate(['home/user/viewOH', this.id_customer]); // Assuming the route for order list is '/order-list'
  }
}
