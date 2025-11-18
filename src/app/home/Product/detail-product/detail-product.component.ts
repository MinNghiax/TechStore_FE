import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../Service/productService';
import { ReviewService } from '../../../Service/review-service';
import { userService } from '../../../Service/userService';
import { CartService, CartItem } from '../../../Service/cart.service';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { Product } from '../../../Models/product';
import { Reviews } from '../../../Models/reviews';
import { Order } from '../../../Models/order';
import { NgForm } from '@angular/forms';
import { Location } from '@angular/common';

declare var bootstrap: any;

@Component({
  selector: 'app-detail-product',
  templateUrl: './detail-product.component.html',
  styleUrls: ['./detail-product.component.css'],
})
export class DetailProductComponent implements OnInit {
  product!: Product;
  reviews: Reviews[] = [];
  newReview: string = '';
  rating: number = 0;
  contenReview: string = '';
  ratingReview: number = 0;
  selectedReview: Reviews | null = null;
  product_id!: number;
  currentUserId: number | null = null;
  isAdmin: boolean = false;
  dangThemSua: boolean = false;
  selectedItem: any = null;
  number_of_products: number = 1;
  showSuccessMessage: boolean = false;
  isBanking: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  errorMessage: string | null = null;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private reviewService: ReviewService,
    public userService: userService,
    private cartService: CartService,
    private orderService: OrderService,
    private orderDetailService: OrderDetailService,
    private location: Location
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const id = Number(this.route.snapshot.paramMap.get('product_id'));
    this.product_id = id;
    this.loadProduct(id);
    this.loadReviews(id);

    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.currentUserId = currentUser.user_id;
      this.isAdmin = currentUser.role_id === 1;
    }

    this.userService.getCurrentUserObservable().subscribe((user) => {
      if (user) {
        this.currentUserId = user.user_id;
        this.isAdmin = user.role_id === 1;
      } else {
        this.currentUserId = null;
        this.isAdmin = false;
      }
    });
  }

  goBack() {
    this.location.back();
  }

  loadProduct(id: number) {
    this.productService.getProductDetails(id).subscribe({
      next: (data) => {
        this.product = data;
        this.product.PathAnh =
          this.productService.PhotosUrl + '/' + data.image_url;
      },
      error: () => console.error('Lỗi khi lấy sản phẩm.'),
    });
  }

  loadReviews(productId: number) {
    this.reviewService.getReviewsByProduct(productId).subscribe({
      next: (data) => {
        const reviewPromises = data.map(async (review) => {
          try {
            const user = await this.userService
              .getUserById(review.user_id)
              .toPromise();
            return { ...review, username: user?.username || 'Khách' };
          } catch {
            return { ...review, username: 'Khách' };
          }
        });

        Promise.all(reviewPromises).then((reviewsWithUser) => {
          this.reviews = reviewsWithUser;
        });
      },
      error: () => console.error('Lỗi khi tải đánh giá.'),
    });
  }

  submitReview() {
    if (!this.newReview.trim() || this.rating === 0) {
      alert('Vui lòng nhập nội dung và chọn số sao.');
      return;
    }

    if (!this.currentUserId) {
      alert('Vui lòng đăng nhập để đánh giá.');
      this.router.navigate(['/home/login']);
      return;
    }

    const review = {
      product_id: this.product_id,
      user_id: this.currentUserId,
      content: this.newReview.trim(),
      rating: this.rating,
      create_at: new Date(),
    };

    this.reviewService.addReview(review).subscribe({
      next: () => {
        alert('Đánh giá thành công!');
        this.newReview = '';
        this.rating = 0;
        this.loadReviews(this.product_id);
      },
      error: () => alert('Không gửi được đánh giá.'),
    });
  }

  editReview(review: Reviews) {
    this.selectedReview = review;
    this.contenReview = review.content;
    this.ratingReview = review.rating;
  }

  suaReview() {
    if (!this.selectedReview) {
      alert('Không có đánh giá để sửa.');
      return;
    }

    const update = {
      id: this.selectedReview.id,
      content: this.contenReview.trim(),
      rating: this.ratingReview,
    };

    this.reviewService.updateReview(this.selectedReview.id, update).subscribe({
      next: () => {
        alert('Đã cập nhật đánh giá!');
        this.loadReviews(this.product_id);
        this.selectedReview = null;
        this.contenReview = '';
        this.ratingReview = 0;
      },
      error: () => alert('Cập nhật đánh giá hỏng.'),
    });
  }

  deleteReview(reviewId: number) {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        alert('Đã xóa đánh giá!');
        this.loadReviews(this.product_id);
      },
      error: () => alert('Xóa thất bại.'),
    });
  }

  addToCart() {
    if (!this.currentUserId) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng.');
      this.router.navigate(['/home/login']);
      return;
    }

    if (!this.product?.product_id) {
      alert('Không tìm thấy sản phẩm.');
      return;
    }

    const cartItem: CartItem = {
      user_id: this.currentUserId,
      product_id: this.product.product_id,
      quantity: this.number_of_products,
      added_at: new Date().toISOString(),
    };

    this.cartService.addToCart(cartItem).subscribe({
      next: () => alert('🛒 Đã thêm vào giỏ hàng!'),
      error: () => alert('❌ Thêm vào giỏ hàng thất bại.'),
    });
  }

  themDon() {
    if (!this.currentUserId) {
      alert('Vui lòng đăng nhập để tiếp tục đặt hàng.');
      this.router.navigate(['/home/login']);
      return;
    }

    if (!this.product) {
      alert('Sản phẩm không tồn tại.');
      return;
    }

    this.selectedItem = {
      product: this.product,
      quantity: this.number_of_products,
      PathAnh: this.product.PathAnh,
      price: this.product.price,
      total_amount: this.product.price * this.number_of_products,
    };
    this.dangThemSua = true;
  }

  muaNgay(paymentForm: NgForm) {
    if (!paymentForm.valid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ!';
      return;
    }

    const formValue = paymentForm.value;
    this.isBanking = formValue.payment === 'Banking';
    const orderStatus = this.isBanking ? 'Chờ xác nhận' : 'Đang xử lý';

    const orderData = {
      user_id: this.currentUserId!,
      full_name: formValue.fullname,
      order_status: orderStatus,
      create_at: new Date(),
      total_amount: this.selectedItem.total_amount,
      address: formValue.address,
      phone: formValue.phone,
      payment_method: formValue.payment,
    };

    this.orderService.postOrder(orderData).subscribe({
      next: (order: Order) => {
        const createdOrderId = order.order_id;
        const orderDetailData = {
          order_id: createdOrderId,
          product_id: this.selectedItem.product.product_id,
          product_name: this.selectedItem.product.product_name,
          imagePath: this.selectedItem.product.image_url,
          price: this.selectedItem.product.price,
          number_of_products: this.selectedItem.quantity,
          total_money: this.selectedItem.total_amount,
        };

        this.orderDetailService.postOrderDetail(orderDetailData).subscribe({
          next: () => {
            this.showSuccessMessage = true;
            setTimeout(() => {
              if (this.isBanking) {
                this.bankInfo =
                  'Ngân hàng: MBbank\nSố tài khoản: 0337431736\nChủ tài khoản: Nguyễn Đặng Thành Huy';
                this.transferInstructions = `Vui lòng quét mã QR, nhập ${this.selectedItem.total_amount.toLocaleString(
                  'vi-VN'
                )} VNĐ, nội dung "DH${createdOrderId}" trong 24h.`;
                this.showSuccessMessage = false;
              } else {
                this.closeModal();
                this.router.navigate([
                  `/home/user/viewOH/${this.currentUserId}`,
                ]);
              }
            }, 2000);
          },
          error: () => {
            this.errorMessage = 'Lỗi khi tạo chi tiết đơn hàng!';
            this.dong();
          },
        });
      },
      error: (error) => {
        this.errorMessage =
          error.status === 400
            ? 'ID người dùng không hợp lệ!'
            : 'Lỗi khi tạo đơn hàng!';
        this.dong();
      },
    });
  }

  dong() {
    this.dangThemSua = false;
    this.selectedItem = null;
    this.number_of_products = 1;
    this.showSuccessMessage = false;
    this.isBanking = false;
    this.bankInfo = null;
    this.transferInstructions = null;
    this.errorMessage = null;
    this.closeModal();
  }

  closeModal() {
    const modal = document.getElementById('exampleModal');
    const bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (bootstrapModal) bootstrapModal.hide();
  }

  confirmTransfer() {
    this.closeModal();
    this.router.navigate([`/home/user/viewOH/${this.currentUserId}`]);
  }
}
