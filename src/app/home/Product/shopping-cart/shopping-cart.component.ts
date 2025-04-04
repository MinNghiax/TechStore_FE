import { Component, OnInit } from '@angular/core';
import { ShoppingCartService } from '../../../Service/shoppingCartService'; 
import { Product } from '../../../Models/product';
import { ProductService } from '../../../Service/productService';
import { userService } from '../../../Service/userService'; 
import { map, forkJoin } from 'rxjs';
import { User } from '../../../Models/users';
import { Order } from '../../../Models/order';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css'] 
})

export class ShoppingCartComponent implements OnInit {
  cartItems: any[] = [];  // Dùng kiểu any[] thay vì một kiểu cụ thể
  couponCode: string = ''; // Mã giảm giá
  totalAmount: number = 0; // Tổng tiền
  cart: Map<number, number> = new Map();
  user_id: number;

  order_id: number;
    customer_id: number;
    order_status: string = "Đang xử lý";
    create_at: Date;
    total_amount: number;
    order: Order;
    product_id : number;
    price: number;
    number_of_products: number =1;
    total_money: number;
    user:User;
    customer_name:string;
    dangThemSua:boolean= false;

    product : Product;

  constructor(
    private productService: ProductService,
    private userService: userService, 
    private shoppingCartService: ShoppingCartService ,
    private orderService : OrderService,
    private orderDetailService : OrderDetailService
  ) {}

  ngOnInit(): void {
    const currentUser = this.userService.getCurrentUser();
    
    if (currentUser) {
      this.user_id = currentUser.user_id;
    } else {
      console.error('Người dùng chưa đăng nhập!');
      alert("Vui lòng đăng nhập!!!");
      return;
    }

    // Lấy danh sách sản phẩm từ giỏ hàng của người dùng
    this.shoppingCartService.getCart(this.user_id).subscribe({
      next: (cart) => {
        const productIds: number[] = Array.from(cart.keys());

        if (productIds.length === 0) {
          return; // Không có sản phẩm trong giỏ hàng
        }

        

        // Tạo danh sách các observable để gọi các API sản phẩm
        const productRequests = productIds.map((productId) =>
          this.productService.getProductDetails(productId).pipe(
            map(product => ({
              product: product,
              quantity: cart.get(productId)!,
              PathAnh: this.productService.PhotosUrl + "/" + product.image_url, // Gán đường dẫn ảnh vào mỗi sản phẩm
               // Gán thông tin chi tiết sản phẩm
              product_id : product.product_id, // ID sản phẩm
              price : product.price,          // Giá sản phẩm
              total_amount : product.price   // Tổng tiền mặc định bằng giá sản phẩm 
            }))
          )
        );

        // Dùng forkJoin để chờ tất cả các yêu cầu hoàn thành
        forkJoin(productRequests).subscribe({
          next: (results) => {
            // Cập nhật cartItems sau khi lấy được thông tin sản phẩm
            this.cartItems = results;
            this.calculateTotal(); // Tính tổng sau khi tất cả yêu cầu hoàn thành
          },
          error: (error) => {
            console.error('Lỗi khi lấy thông tin sản phẩm:', error);
          }
        });
      },
      error: (error) => {
        console.error('Lỗi khi lấy giỏ hàng:', error);
      }
    });

    
  }

   

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.updateCartFromCartItems();
      this.calculateTotal();
    }
  }

  increaseQuantity(index: number): void {
    this.cartItems[index].quantity++;
    this.updateCartFromCartItems();
    this.calculateTotal();
  }

  // Hàm tính tổng tiền
  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  applyCoupon(): void {
      // Viết mã xử lý áp dụng mã giảm giá ở đây
  }

  confirmDelete(index: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.cartItems.splice(index, 1);
      this.updateCartFromCartItems();
      this.calculateTotal();
    }

    // Cập nhật lại giỏ hàng trong localStorage
    this.shoppingCartService.setCart(this.cart, this.user_id);
  }

  private updateCartFromCartItems(): void {
    this.cart.clear();
    this.cartItems.forEach((item) => {
      this.cart.set(item.product.product_id, item.quantity);
    });
    this.shoppingCartService.setCart(this.cart);
  }

  themDon(){
    this.order={
      order_id:0,
      customer_id:0,
      order_status: "",
      create_at: null,
      total_amount: 0
    }
    this.dangThemSua=true;
    // this.tieude="Thêm Tour";
  }

  muaNgay(paymentForm: any) {
    // Kiểm tra nếu form không hợp lệ thì không làm gì
    if (!paymentForm.valid) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return; // Dừng lại nếu form không hợp lệ
    }
  
    let totalMoney = 0;
  
    // Duyệt qua tất cả các sản phẩm trong giỏ hàng và tính tổng tiền
    this.cartItems.forEach(item => {
      totalMoney += item.product.price * item.quantity;
    });
  
    // Dữ liệu đơn hàng
    const orderData = {
      customer_id: this.user_id,
      order_status: this.order_status,
      create_at: new Date(),
      total_amount: totalMoney,  // Sử dụng tổng tiền đã tính
    };
  
    console.log(orderData);
  
    // Gửi yêu cầu tạo đơn hàng
    this.orderService.postOrder(orderData).subscribe({
      next: (order: Order) => {
        const createdOrderId = order.order_id;
        console.log('Order created with ID:', createdOrderId);
  
        // Tạo chi tiết đơn hàng cho mỗi sản phẩm trong giỏ hàng
        const orderDetailsRequests = this.cartItems.map(item => {
          const orderDetailData = {
            order_id: createdOrderId,
            product_id: item.product.product_id,
            price: item.product.price,
            number_of_products: item.quantity,
            total_money: item.product.price * item.quantity,
          };
          return this.orderDetailService.postOrderDetail(orderDetailData);
        });
  
        // Dùng forkJoin để gửi tất cả các yêu cầu chi tiết đơn hàng
        forkJoin(orderDetailsRequests).subscribe({
          next: () => {
            alert('Đặt hàng thành công.');
            console.log('Dữ liệu gửi đến API:', orderDetailsRequests);
          },
          error: (err) => {
            alert('Lỗi khi tạo chi tiết đơn hàng.');
          },
        });
      },
      error: (err) => {
        alert('Lỗi khi tạo đơn hàng.');
      },
    });
  }
  
  dong(){
    this.dangThemSua=false;
    // this.layDSTour();
  }
}
