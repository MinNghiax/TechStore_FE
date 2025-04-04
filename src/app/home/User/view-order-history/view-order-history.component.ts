import { Component , Input} from '@angular/core';
import { Order } from '../../../Models/order';
import { ActivatedRoute } from '@angular/router';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { OrderDetails } from '../../../Models/order-details';
import { User } from '../../../Models/users';
import { ProductService } from '../../../Service/productService';
import { Product } from '../../../Models/product';


@Component({
  selector: 'app-view-order-history',
  templateUrl: './view-order-history.component.html',
  styleUrl: './view-order-history.component.css'
})
export class ViewOrderHistoryComponent {

  order_id : number;
  order : Order = new Order();
  orderDetails: OrderDetails[] = []; 
  user_name: string;
  phone: string;
  create_at: Date;
  number: number;
  PathAnh:string;
  product_name:string;
  status:string;
  total_money: number;
  message = '';
  //user: User | null = null; 
  user_id: number;

  orderDetail : OrderDetails;
  product : Product;

    username: string;
    orders: Order[] = [];
    //order_details: OrderDetails[] = [];
    order_custommer: User[] = [];
    @Input() user: User[] = [];
    DSproduct: Product[] = [];
    
  constructor(
    private route: ActivatedRoute,
    private userServices: userService,
    private router: Router,
    private orderService: OrderService,
    private orderDetailService: OrderDetailService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(+idParam)) {
      console.error('Invalid or missing ID:', idParam);
      alert('Invalid or missing ID. Please check the URL.');
      return;
    }
  
    const id = +idParam; // Chuyển đổi sang số sau khi kiểm tra hợp lệ
    this.layOrder(id);

    const currentUser = this.userServices.getCurrentUser();
    if (currentUser) {
      this.user_id = currentUser.user_id;
    } else {
      this.user_id = null; // Đặt null để dễ kiểm tra
    }
    this.layUser(this.user_id);
  }

  layOrder(id: number) {
    this.orderService.getOrderByCustomerId(id).subscribe(
      (data: Order[]) => { // Giả sử data là một mảng các đơn hàng
        this.orders = data;
        console.log("Danh sách orders:", this.orders); // Kiểm tra dữ liệu trả về
  
        if (this.orders.length > 0) {
          // Duyệt qua tất cả các đơn hàng và gọi fetchUserAndOrderDetails cho từng đơn hàng
          this.orders.forEach(order => {
            // Cập nhật các thuộc tính của đơn hàng
            this.create_at = order.create_at;
            this.order_id = order.order_id;
            this.status = order.order_status;
            this.total_money = order.total_amount;
  
            this.orderDetailService.getOrderDetailById(this.order_id).subscribe(
              (details: OrderDetails) => {
                this.orderDetail = details; // Lưu tất cả các chi tiết đơn hàng vào mảng
  
                this.number = this.orderDetail.number_of_products;
                console.log("Product ID: ", this.orderDetail.product_id);
  
                // Lấy thông tin sản phẩm cho mỗi orderDetail
                this.productService.getProductDetails(this.orderDetail.product_id).subscribe(
                  (product: Product) => {  // Thay đổi kiểu trả về từ Product[] sang Product
                    console.log(product);

                    this.product = product
  
                    this.PathAnh = this.productService.PhotosUrl + '/'; 
                    this.product_name = product.product_name;
  
                    // Xử lý các thông tin sản phẩm tại đây
                    console.log("Sản phẩm:", product.product_name);
                  },
                  (error) => {
                    console.error('Error fetching product details:', error);
                    alert('Unable to fetch product details. Please try again later.');
                  }
                );
  
              },
              (error) => {
                console.error('Error fetching order details:', error);
                alert('Unable to fetch order details. Please try again later.');
              }
            );
  
          });
        }
      },
      (error) => {
        console.error('Error fetching orders:', error);
        alert('Chưa có đơn hàng nào!!!');
      }
    );
  }
  
  
  
  fetchOrderDetails(order: Order): void {
        // Lấy chi tiết đơn hàng
        this.order_id = order.order_id;
        this.create_at = order.create_at;
        this.status = order.order_status;
        this.total_money = order.total_amount;
  
        this.orderDetailService.getOrderDetailByOrderId(this.order_id).subscribe(
          (details: OrderDetails[]) => {
            if (details.length > 0) {
              this.orderDetails = details; // Lưu tất cả các chi tiết đơn hàng vào mảng
              details.forEach(orderDetail => {
                this.number = orderDetail.number_of_products;
                console.log("Product ID: ", orderDetail.product_id);
  
                // Lấy thông tin sản phẩm tương ứng
                this.productService.getProductDetails(orderDetail.product_id).subscribe(
                  (product: Product) => {
                    this.PathAnh = this.productService.PhotosUrl + '/' + product.image_url;
                    this.product_name = product.product_name;
  
                    // Có thể xử lý các thông tin sản phẩm ở đây
                    console.log("Sản phẩm:", product.product_name);
                  },
                  (error) => {
                    console.error('Error fetching product details:', error);
                    alert('Unable to fetch product details for some items. Please try again later.');
                  }
                );
              });
            } else {
              console.log('No order details found.');
              alert('No order details found.');
            }
          },
          (error) => {
            console.error('Error fetching order details:', error);
            alert('Unable to fetch order details. Please try again later.');
          }
        );
  }
  
  
  
  layUser(id:number){
    this.userServices.getUserById(id).subscribe(
      (user: User) => {
        this.user_name = user.username;
        this.phone = user.phone;
        this.user_id = user.user_id;
      }),
      (error) => {
        console.error('Error fetching user data:', error);
        alert('Unable to fetch user data. Please try again later.');
      }
  }

  logout() {
    this.userServices.logout().subscribe(
      response => {
        if (response.Success) {
          // Reset thông tin người dùng trong service
          this.userServices.setCurrentUser(null); // Xóa user trong service
  
          // Xóa thông tin trong localStorage
          localStorage.removeItem('user');
          
          // Đặt lại đối tượng người dùng trong component
          this.user = null;
          this.user_id = null;
  
          // Điều hướng về trang đăng nhập
          this.router.navigate(['/home/login']);
        } else {
          this.message = response.message || 'Đăng xuất thất bại.';
        }
      },
      error => {
        console.error('Logout error', error);
        this.message = 'Đăng xuất thất bại. Vui lòng thử lại.';
      }
    );
  }
  

  viewOrderDetails(Id: number): void {
    this.router.navigate(['home/order/detailOrder/', Id]);
  }

}