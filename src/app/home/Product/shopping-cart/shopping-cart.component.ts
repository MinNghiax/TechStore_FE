import { Component, OnInit } from '@angular/core';
import { Product } from '../../../Models/product';
import { ProductService } from '../../../Service/productService';
import { userService } from '../../../Service/userService';
import { Order } from '../../../Models/order';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { CartService, CartItem } from '../../../Service/cart.service';
import { forkJoin, map, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.css'],
})
export class ShoppingCartComponent implements OnInit {
  cartItems: any[] = [];
  totalAmount: number = 0;
  user_id: number | null = null;
  selectedItems: any[] = [];
  dangThemSua: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  showSuccessMessage: boolean = false;
  errorMessage: string | null = null;
  isBanking: boolean = false;

  constructor(
    private productService: ProductService,
    private userService: userService,
    private cartService: CartService,
    private orderService: OrderService,
    private orderDetailService: OrderDetailService,
    private router: Router
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const userIdString = this.userService.getUserId();
    this.user_id = userIdString ? +userIdString : null;
    if (!this.user_id) {
      this.errorMessage = 'Vui lòng đăng nhập!';
      this.router.navigate(['/home/login']);
      return;
    }
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCartsByUserId(this.user_id!).subscribe({
      next: (carts) => {
        const productRequests = carts.map((cartItem) =>
          this.productService.getProductDetails(cartItem.product_id).pipe(
            map((product) => ({
              cart_id: cartItem.cart_id,
              product: product,
              quantity: cartItem.quantity,
              PathAnh: product.image_url
                ? this.productService.PhotosUrl + '/' + product.image_url
                : 'assets/images/default-image.jpg',
              product_id: product.product_id,
              price: product.price,
              total_amount: product.price * cartItem.quantity,
              selected: false,
            }))
          )
        );
        forkJoin(productRequests).subscribe({
          next: (results) => {
            this.cartItems = results;
            this.calculateTotal();
          },
          error: () => (this.errorMessage = 'Không thể tải giỏ hàng!'),
        });
      },
      error: () => (this.errorMessage = 'Không thể tải giỏ hàng!'),
    });
  }

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.updateQuantity(this.cartItems[index]);
    }
  }

  increaseQuantity(index: number): void {
    this.cartItems[index].quantity++;
    this.updateQuantity(this.cartItems[index]);
  }

  updateQuantity(item: any): void {
    const updatedItem: CartItem = {
      cart_id: item.cart_id,
      user_id: this.user_id!,
      product_id: item.product.product_id,
      quantity: item.quantity,
    };
    this.cartService.updateCart(item.cart_id, updatedItem).subscribe({
      next: () => this.loadCart(),
      error: () => (this.errorMessage = 'Cập nhật số lượng thất bại!'),
    });
  }

  calculateTotal(): void {
    this.selectedItems = this.cartItems.filter((item) => item.selected);
    this.totalAmount = this.selectedItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  confirmDelete(index: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa?')) {
      this.cartService.deleteCart(this.cartItems[index].cart_id).subscribe({
        next: () => this.loadCart(),
        error: () => (this.errorMessage = 'Xóa sản phẩm thất bại!'),
      });
    }
  }

  toggleSelectAll(event: any): void {
    this.cartItems.forEach((item) => (item.selected = event.target.checked));
    this.calculateTotal();
  }

  themDon(): void {
    this.calculateTotal();
    if (this.selectedItems.length === 0) {
      this.errorMessage = 'Vui lòng chọn sản phẩm!';
      return;
    }
    this.dangThemSua = true;
    this.bankInfo = null;
    this.transferInstructions = null;
    this.showSuccessMessage = false;
    this.errorMessage = null;
    this.isBanking = false;
  }

  muaNgay(paymentForm: any): void {
    if (!paymentForm.valid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin!';
      return;
    }
    const formValue = paymentForm.value;
    this.isBanking = formValue.payment === 'Banking';
    const orderData = {
      user_id: this.user_id!,
      full_name: formValue.fullname,
      order_status: this.isBanking ? 'Chờ xác nhận' : 'Đang xử lý',
      create_at: new Date(),
      total_amount: this.totalAmount,
      address: formValue.address,
      phone: formValue.phone,
      payment_method: formValue.payment,
    };
    this.orderService.postOrder(orderData).subscribe({
      next: (order: Order) => {
        const createdOrderId = order.order_id;
        const orderDetailsRequests = this.selectedItems.map((item) => {
          const orderDetailData = {
            order_id: createdOrderId,
            product_id: item.product.product_id,
            product_name: item.product.product_name,
            imagePath: item.product.image_url,
            price: item.product.price,
            number_of_products: item.quantity,
            total_money: item.product.price * item.quantity,
          };
          return this.orderDetailService
            .postOrderDetail(orderDetailData)
            .pipe(catchError(() => of(null)));
        });
        forkJoin(orderDetailsRequests).subscribe({
          next: (results) => {
            if (results.includes(null)) {
              this.errorMessage = 'Lỗi tạo chi tiết đơn hàng!';
              return;
            }
            const deleteRequests = this.selectedItems.map((item) =>
              this.cartService
                .deleteCart(item.cart_id)
                .pipe(catchError(() => of(null)))
            );
            forkJoin(deleteRequests).subscribe({
              next: () => {
                this.showSuccessMessage = true;
                setTimeout(() => {
                  if (this.isBanking) {
                    this.bankInfo =
                      'Ngân hàng: MBbank\nSố tài khoản: 0337431736\nChủ tài khoản: Nguyễn Đặng Thành Huy';
                    this.transferInstructions = `Vui lòng quét mã QR, nhập ${this.totalAmount.toLocaleString(
                      'vi-VN'
                    )} VNĐ, nội dung "DH${createdOrderId}" trong 24h.`;
                    this.showSuccessMessage = false;
                  } else {
                    this.closeModal();
                    this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
                  }
                }, 2000);
              },
              error: () => (this.errorMessage = 'Lỗi xóa giỏ hàng!'),
            });
          },
          error: () => (this.errorMessage = 'Lỗi tạo chi tiết đơn hàng!'),
        });
      },
      error: (error) => {
        this.errorMessage =
          error.status === 400
            ? 'ID người dùng không hợp lệ!'
            : 'Lỗi tạo đơn hàng!';
        this.closeModal();
      },
    });
  }

  dong(): void {
    this.dangThemSua = false;
    this.bankInfo = null;
    this.transferInstructions = null;
    this.showSuccessMessage = false;
    this.errorMessage = null;
    this.isBanking = false;
    this.closeModal();
  }

  onCheckboxChange(): void {
    this.calculateTotal();
  }

  closeModal(): void {
    const modal = document.getElementById('exampleModal');
    const bootstrapModal = bootstrap.Modal.getInstance(modal);
    if (bootstrapModal) {
      bootstrapModal.hide();
      setTimeout(() => this.loadCart(), 300);
    }
  }

  confirmTransfer(): void {
    this.closeModal();
    this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
  }
}
