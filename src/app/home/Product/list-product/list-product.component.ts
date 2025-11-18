import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Product } from '../../../Models/product';
import { Brand } from '../../../Models/brand';
import { Categories } from '../../../Models/categories';
import { Order } from '../../../Models/order';
import { ProductService } from '../../../Service/productService';
import { categoryService } from '../../../Service/categoryService';
import { BrandService } from '../../../Service/brand-service';
import { CartService, CartItem } from '../../../Service/cart.service';
import { userService } from '../../../Service/userService';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';

declare var bootstrap: any;

export interface GroupedProduct {
  category_id: number;
  category_name: string;
  products: Product[];
  brands: Brand[];
  visibleProducts: Product[];
  currentIndex: number;
  productsPerView: number;
}

@Component({
  selector: 'app-list-product',
  templateUrl: './list-product.component.html',
  styleUrls: ['./list-product.component.css'],
})
export class ListProductComponent implements OnInit {
  productGroups: GroupedProduct[] = [];
  user_id: number | null = null;
  dangThemSua: boolean = false;
  selectedItem: any = null;
  showSuccessMessage: boolean = false;
  isBanking: boolean = false;
  bankInfo: string | null = null;
  transferInstructions: string | null = null;
  qrCodeUrl: string = 'assets/img/maQR2.jpg';
  errorMessage: string | null = null;

  constructor(
    private productService: ProductService,
    private categoryService: categoryService,
    private brandService: BrandService,
    private router: Router,
    public userService: userService,
    private orderService: OrderService,
    private orderDetailService: OrderDetailService,
    private cartService: CartService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.user_id = currentUser.user_id;
    }
    this.route.queryParams.subscribe((params) => {
      const keyword = params['search'] || '';
      this.loadAllProductsGroupedByCategory(keyword);
    });
  }

  loadAllProductsGroupedByCategory(key: string = '') {
  this.categoryService.getCategory().subscribe((categories) => {
    if (!categories?.length) return;

    const groupRequests = categories.map((category) =>
      forkJoin({
        category: of(category),
        products: this.productService.getByIdDM(category.category_id),
        brands: this.brandService.getBrand_idDM(category.category_id)
      })
    );

    forkJoin(groupRequests).subscribe((results: {
      category: Categories;
      products: Product[];
      brands: Brand[];
    }[]) => {
      this.productGroups = results
        .map(({ category, products, brands }) => {
          if (key.trim()) {
            const lowerKey = key.toLowerCase();
            products = products.filter(p =>
              p.product_name.toLowerCase().includes(lowerKey)
            );
          }

          products.forEach(p => p.PathAnh = `${this.productService.PhotosUrl}/${p.image_url}`);
          const productsPerView = 5;

          return {
            category_id: category.category_id,
            category_name: category.category_name,
            products,
            brands,
            productsPerView,
            currentIndex: 0,
            visibleProducts: products.slice(0, productsPerView),
          };
        })
        .filter(group => group.products.length > 0);
    });
  });
}

  navigateCarousel(group: GroupedProduct, direction: 'next' | 'prev') {
    if (direction === 'next') {
      group.currentIndex += group.productsPerView;
    } else if (direction === 'prev') {
      group.currentIndex -= group.productsPerView;
    }
    const start = group.currentIndex;
    const end = start + group.productsPerView;
    group.visibleProducts = group.products.slice(start, end);
  }

  addToCart(product: Product): void {
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
      user_id: currentUser.user_id,
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
      quantity: 1,
      PathAnh: product.PathAnh || 'assets/images/default-image.jpg',
      price: product.price,
      total_amount: product.price * 1,
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
