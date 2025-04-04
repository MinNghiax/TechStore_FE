import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs'; // Sử dụng BehaviorSubject

@Injectable({
  providedIn: 'root'  // Cung cấp dịch vụ toàn cục
})
export class ShoppingCartService {
  private cart: Map<number, number> = new Map(); // Dùng Map để lưu trữ giỏ hàng, key là id sản phẩm, value là số lượng
  private isBrowser: boolean;
  private cartSubject = new BehaviorSubject<Map<number, number>>(this.cart); // Subject để phát giỏ hàng

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.refreshCart(null); // Không có user_id lúc khởi tạo, giỏ hàng cho khách
    }
  }

  // Thêm sản phẩm vào giỏ hàng
  addToCart(productId: number, quantity: number = 1, user_id: number | null = null): void {
    console.log('Thêm vào giỏ hàng:', productId, quantity);

    // Xác định cartKey theo user_id hoặc guest
    const cartKey = this.getCartKey(user_id);

    // Kiểm tra nếu sản phẩm đã có trong giỏ
    if (this.cart.has(productId)) {
      // Nếu sản phẩm đã có trong giỏ, tăng số lượng
      this.cart.set(productId, this.cart.get(productId)! + quantity);
    } else {
      // Nếu sản phẩm chưa có, thêm mới với số lượng
      this.cart.set(productId, quantity);
    }

    // Lưu giỏ hàng vào LocalStorage
    this.saveCartToLocalStorage(cartKey);  
    this.cartSubject.next(this.cart);  // Cập nhật giỏ hàng trong subject
    console.log('Giỏ hàng sau khi thêm:', Array.from(this.cart.entries()));
  }

  // Trả về giỏ hàng dưới dạng Observable
  // Trả về giỏ hàng dưới dạng Observable cho user_id hiện tại
  getCart(user_id: number | null) {
    const cartKey = this.getCartKey(user_id);  // Lấy cartKey cho user_id hoặc guest
    const storedCart = localStorage.getItem(cartKey);
    
    if (storedCart) {
      this.cart = new Map(JSON.parse(storedCart));  // Tải giỏ hàng từ localStorage
    } else {
      this.cart = new Map<number, number>();  // Nếu không có giỏ hàng, tạo mới giỏ hàng rỗng
    }

    this.cartSubject.next(this.cart);  // Cập nhật giỏ hàng trong subject
    return this.cartSubject.asObservable();  // Trả về Observable giỏ hàng
  }


  // Đặt lại giỏ hàng và lưu vào LocalStorage
  setCart(cart: Map<number, number>, user_id: number | null = null): void {
    this.cart = cart ?? new Map<number, number>();
    const cartKey = this.getCartKey(user_id);
    this.saveCartToLocalStorage(cartKey);
    this.cartSubject.next(this.cart); // Cập nhật giá trị mới cho cartSubject
  }

  // Lưu giỏ hàng vào LocalStorage
  private saveCartToLocalStorage(cartKey: string): void {
    if (this.isBrowser) {
      localStorage.setItem(cartKey, JSON.stringify(Array.from(this.cart.entries())));
    }
  }

  // Hàm xóa dữ liệu giỏ hàng và cập nhật Local Storage
  clearCart(user_id: number | null = null): void {
    this.cart.clear(); // Xóa toàn bộ dữ liệu trong giỏ hàng
    const cartKey = this.getCartKey(user_id);  // Lấy cartKey cho user_id hoặc khách
    this.saveCartToLocalStorage(cartKey); // Lưu giỏ hàng mới vào Local Storage (trống)
    this.cartSubject.next(this.cart); // Cập nhật giỏ hàng rỗng
  }

  // Lấy key giỏ hàng cho người dùng hiện tại (dựa vào id người dùng)
  private getCartKey(user_id: number | null): string {
    // Nếu có user_id thì dùng nó làm key, nếu không có thì trả về cart:guest
    return user_id ? `cart:${user_id}` : 'cart:guest';
  }

  // Cập nhật giỏ hàng từ localStorage
  public refreshCart(user_id: number | null): void {
    const cartKey = this.getCartKey(user_id);  // Lấy cartKey cho user_id hoặc khách
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      this.cart = new Map(JSON.parse(storedCart));
    } else {
      this.cart = new Map<number, number>();
    }
    this.cartSubject.next(this.cart); // Cập nhật giá trị mới cho cartSubject
  }

  // Kiểm tra xem giỏ hàng có trống không
  isCartEmpty(): boolean {
    return this.cart.size === 0;
  }
}
