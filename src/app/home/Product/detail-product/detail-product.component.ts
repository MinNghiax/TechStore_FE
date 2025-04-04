import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from '../../../Service/productService';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../Models/product';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../Service/order-service';
import { Order } from '../../../Models/order';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { ReviewService } from '../../../Service/review-service';
import { Reviews } from '../../../Models/reviews';
import { User } from '../../../Models/users';
import { userService } from '../../../Service/userService';
import { ShoppingCartService } from '../../../Service/shoppingCartService';

@Component({
  selector: 'app-detail-product',
  templateUrl: './detail-product.component.html',
  styleUrl: './detail-product.component.css'
})
export class DetailProductComponent {
  public product: Product;  // Khai báo là đối tượng duy nhất
  private routeSub: Subscription;
  dangThemSua:boolean= false;
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
  reviews: Reviews[] = [];
  newReview: string = '';
  rating: number = 0;
  customer_name:string;

  isPressedAddToCart:boolean = false;
  user_id:number;
  selectedReview: any= null;
  contenReview: string = '';
  ratingReview: number;

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private route: ActivatedRoute, private router:Router,
    private orderDetailService: OrderDetailService,
    private reviewService: ReviewService,
    public userService:userService,
    private shoppingcartService : ShoppingCartService
  ) {}

  ngOnInit() {
    const Id = Number(this.route.snapshot.paramMap.get('product_id'));
    this.product_id = Id;
    console.log(this.product_id);
    this.layDetailsSP(Id);
    this.loadReviews(Id);

    // Mặc định số lượng sản phẩm là 1
    this.number_of_products = 1;
    this.loadUser(this.customer_id);

    // Lấy thông tin người dùng và gán customer_id
    const currentUser = this.userService.getCurrentUser();  
    if (currentUser) {
      this.user_id = currentUser.user_id;  
      this.customer_name = currentUser.username;
    } else {
      console.log('Không có người dùng đăng nhập');
      
    }
  }


    // Load Reviews for the Product
    loadReviews(product_id) {
      this.reviewService.getReviewsByProduct(product_id).subscribe({
        next: (data) => {
          this.reviews = data;
          this.loadUser(this.user_id);
        },
        error: (err) => {
          console.error('Error loading reviews:', err);
        }
      });
    }

    // Submit a Review
    submitReview() {
      if (!this.newReview || this.rating === 0) {
        alert('Please provide a review and a rating.');
        return;
      }
  
      const reviewData = {
        product_id: this.product_id,
        user_id: this.customer_id,
        content: this.newReview,
        rating: this.rating,
        create_at: new Date()
      };
      console.log('dataa',reviewData);
  
      this.reviewService.addReview(reviewData).subscribe({
        next: (response) => {
          alert('Review submitted successfully!');
          this.loadReviews(this.product_id); // Reload reviews after adding the new one
          this.newReview = ''; // Clear the review input
          this.rating = 0; // Reset rating
        },
        error: (err) => {
          console.error('Error submitting review:', err);
          alert('Failed to submit review.');
        }
      });
    }

    deleteReview(reviewId: number): void {
    this.reviewService.deleteReview(reviewId).subscribe(
      () => {
        this.loadUser(this.user_id);
        this.loadReviews(this.product_id); 
      },
      (error) => {
        console.error('Error deleting review', error);
      }
    );
  }

    loadUser(id:number){
      this.userService.getUserById(id).subscribe({
        next: (u) => {

          this.customer_id = u.user_id;
          this.customer_name = u.username;
        },
        error: (err) => {
          console.error(`Lỗi khi lấy user với ID ${id}:`, err);
        }
      });
    }



  // Lấy chi tiết sản phẩm theo ID
  layDetailsSP(id: number) {
    this.productService.getProductDetails(id).subscribe({
      next: (data) => {
       this.product = data;
       console.log(id); 
        console.log('Sản phẩm chi tiết:', data); 
        data.PathAnh = this.productService.PhotosUrl + "/" + data.image_url ;

         // Gán thông tin chi tiết sản phẩm
        this.product_id = data.product_id; // ID sản phẩm
        this.price = data.price;          // Giá sản phẩm
        this.total_amount = data.price;   // Tổng tiền mặc định bằng giá sản phẩm
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
      }
    });
  }

  editReview(review: Reviews) {
    this.selectedReview = review;
    this.contenReview = review.content ;
    this.ratingReview = review.rating ;
  }

  suaReview() {
    if (!this.selectedReview || !this.selectedReview.id) {
      console.error('Danh mục chưa được chọn hoặc không hợp lệ.');
      return;
    }

    const val = { id: this.selectedReview.id, content: this.contenReview, rating: this.ratingReview };
    this.reviewService.updateReview(this.selectedReview.id, val).subscribe(
      response => {
        this.loadReviews(this.product_id); 
        console.log('Sửa thành công:', response);
        alert('Sửa  thành công!');
      },
      error => {
        console.error('Có lỗi khi sửa!', error);
        if (error.error) {
          console.error('Chi tiết lỗi:', error.error);
        }
      }
    );
  }



  themDon() {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const currentUser = this.userService.getCurrentUser();
    
    if (!currentUser) {
      // Nếu chưa đăng nhập, yêu cầu người dùng đăng nhập và điều hướng đến trang đăng nhập
      alert('Vui lòng đăng nhập để tiếp tục đặt hàng.');
      this.router.navigate(['/home/login']); // Điều hướng đến trang đăng nhập
      return; // Dừng lại và không hiển thị form đặt hàng
    } else{
      // Nếu đã đăng nhập, tiếp tục xử lý đặt hàng
      this.user_id = currentUser.user_id;  // Lấy user_id của người dùng đã đăng nhập
      this.customer_name = currentUser.username; // Lấy tên người dùng nếu cần
      
      // Khởi tạo đơn hàng mới
      this.order = {
        order_id: 0,
        customer_id: this.user_id, // Gán user_id cho đơn hàng
        order_status: 'Đang xử lý',  // Cập nhật trạng thái đơn hàng ban đầu
        create_at: new Date(),  // Thời gian tạo đơn hàng
        total_amount: 0  // Tổng tiền mặc định (sẽ tính toán sau)
    };
  
    this.dangThemSua = true;  // Thiết lập flag để mở form thêm đơn hàng
    }
  
    
  }

  muaNgay(paymentForm: any) {
    // Tính tổng tiền cho chi tiết đơn hàng
    this.total_money = this.price * this.number_of_products;
  
    // Dữ liệu đơn hàng
    const orderData = {
      customer_id: this.user_id,
      order_status: this.order_status,
      create_at: new Date(),
      total_amount: this.total_money,
    };
  
    // Gửi yêu cầu tạo đơn hàng
    this.orderService.postOrder(orderData).subscribe({
      next: (order: Order) => {
        // Sử dụng order_id từ phản hồi API
        const createdOrderId = order.order_id;
        console.log('Order created with ID:', createdOrderId);
        
        // Dữ liệu chi tiết đơn hàng
        const orderDetailData = {
          order_id: createdOrderId,
          product_id: this.product_id,
          price: this.price,
          number_of_products: this.number_of_products,
          total_money: this.total_money,
        };
  
        // Gửi yêu cầu tạo chi tiết đơn hàng
        this.orderDetailService.postOrderDetail(orderDetailData).subscribe({
          next: () => {
            alert('Đặt hàng thành công.');
            console.log('Dữ liệu gửi đến API:', orderDetailData);
          },
          error: (err) => {
            alert('Lỗi khi tạo chi tiết đơn hàng. ');
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
  }

  addToCart(): void {
    if (this.product) {
      // Lấy user_id từ userService
      const currentUser = this.userService.getCurrentUser();
      let user_id: number | null = null;

      if (currentUser) {
        user_id = currentUser.user_id;
      }

      if (user_id) {
        // Thêm sản phẩm vào giỏ hàng với user_id
        this.shoppingcartService.addToCart(this.product.product_id, 1, user_id);
        console.log("user_id",this.user_id);
        this.isPressedAddToCart = true;
        this.router.navigate(['/home/product/carts']);
        alert("Thêm sản phẩm vào giỏ hàng thành công.");
      } else {
        console.error('Không thể thêm sản phẩm vào giỏ hàng vì không có user_id.');
      }
    } else {
      console.error('Không thể thêm sản phẩm vào giỏ hàng vì product là null.');
    }
  }
}
