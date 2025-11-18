import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from '../../../Service/productService';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../Models/product';
import { Subscription } from 'rxjs';
import { CartService, CartItem } from '../../../Service/cart.service';
import { userService } from '../../../Service/userService';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { Order } from '../../../Models/order';
import { Brand } from '../../../Models/brand';

declare var bootstrap: any;

@Component({
  selector: 'app-filter-by-brand',
  templateUrl: './filter-by-brand.component.html',
  styleUrls: ['./filter-by-brand.component.css'],
})
export class FilterByBrandComponent implements OnInit, OnDestroy {
  DsSP: Product[] = [];
  private routeSub: Subscription;
  user_id: number | null = null;
  dangThemSua: boolean = false;
  selectedItem: any = null;
  number_of_products: number = 1;
  categoryId: number | null = null;
  brandId: number | null = null;
  DsTH: Brand[] = [];
  priceCategory: string = '';
  showSuccessMessage: boolean = false;
  isBanking: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  errorMessage: string | null = null;
  brandName: string | null = null;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    public userService: userService,
    private orderService: OrderService,
    private orderDetailService: OrderDetailService
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.user_id = currentUser.user_id;
    }
    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.categoryId = Number(params.get('category_id'));
      this.brandId = Number(params.get('brand_id'));
      if (this.categoryId && this.brandId) {
        this.getBrandsByCategory(this.categoryId);
        this.getProducts(this.categoryId, this.brandId);
      }
    });
    this.route.queryParams.subscribe((queryParams) => {
      this.priceCategory = queryParams['priceCategory'] || '';
      if (this.priceCategory && this.categoryId && this.brandId) {
        this.filterByPrice(this.categoryId, this.brandId, this.priceCategory);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  getProducts(category_id: number, brand_id: number) {
    this.productService
      .getProductsByCategoryAndBrand(category_id, brand_id)
      .subscribe({
        next: (products) => {
          this.DsSP = products;
          this.DsSP.forEach((product) => {
            product.PathAnh =
              this.productService.PhotosUrl + '/' + product.image_url;
          });
        },
        error: () => console.error('Lỗi khi lấy sản phẩm.'),
      });
  }

  getBrandsByCategory(categoryId: number) {
    this.productService.getBrandsByCategory(categoryId).subscribe({
      next: (brands) => {
        this.DsTH = brands;
        const selectedBrand = brands.find((b) => b.brand_id === this.brandId);
        this.brandName = selectedBrand ? selectedBrand.brand_name : null;
      },
      error: () => console.error('Lỗi khi lấy thương hiệu.'),
    });
  }

  filterByPrice(
    categoryId: number,
    brandId: number,
    priceCategory: string
  ): void {
    this.productService
      .getProductsByCategoryBrandAndPrice(categoryId, brandId, priceCategory)
      .subscribe({
        next: (products) => {
          this.DsSP = products;
          this.DsSP.forEach((product) => {
            product.PathAnh =
              this.productService.PhotosUrl + '/' + product.image_url;
          });
        },
        error: () => (this.DsSP = []),
      });
  }

  onFilterChange(event: any): void {
    const selectedPrice = event.target.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { priceCategory: selectedPrice || null },
      queryParamsHandling: 'merge',
    });
  }

  addToCart(product: Product) {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'Vui lòng đăng nhập!';
      this.router.navigate(['/home/login']);
      return;
    }
    if (!product || !product.product_id) {
      console.error('Sản phẩm không hợp lệ:', product);
      return;
    }
    const cartItem: CartItem = {
      user_id: this.user_id!,
      product_id: product.product_id,
      quantity: 1,
    };
    this.cartService.addToCart(cartItem).subscribe({
      next: () => alert(`Đã thêm "${product.product_name}" vào giỏ hàng.`),
      error: () => (this.errorMessage = 'Thêm vào giỏ hàng thất bại!'),
    });
  }

  themDon(product: Product) {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.errorMessage = 'Vui lòng đăng nhập để đặt hàng!';
      this.router.navigate(['/home/login']);
      return;
    }
    this.user_id = currentUser.user_id;
    this.selectedItem = {
      product: product,
      quantity: this.number_of_products,
      PathAnh: product.PathAnh || 'assets/images/default-image.jpg',
      price: product.price,
      total_amount: product.price * this.number_of_products,
    };
    this.dangThemSua = true;
    this.errorMessage = null;
  }

  muaNgay(paymentForm: any) {
    if (!paymentForm.valid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ!';
      return;
    }
    const formValue = paymentForm.value;
    this.isBanking = formValue.payment === 'Banking';
    const orderStatus = this.isBanking ? 'Chờ xác nhận' : 'Đang xử lý';
    const orderData = {
      user_id: this.user_id!,
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
                this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
              }
            }, 2000);
          },
          error: () => (this.errorMessage = 'Lỗi khi tạo chi tiết đơn hàng!'),
        });
      },
      error: (error) => {
        this.errorMessage =
          error.status === 400
            ? 'ID người dùng không hợp lệ!'
            : 'Lỗi khi tạo đơn hàng!';
        this.closeModal();
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
    this.router.navigate([`/home/user/viewOH/${this.user_id}`]);
  }
}
