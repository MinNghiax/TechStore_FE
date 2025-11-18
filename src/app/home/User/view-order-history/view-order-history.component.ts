import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../../Models/order';
import { OrderDetails } from '../../../Models/order-details';
import { Product } from '../../../Models/product';
import { userService } from '../../../Service/userService';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';
import { ProductService } from '../../../Service/productService';

interface OrderWithDetails {
  order: Order;
  details: {
    orderDetail: OrderDetails;
    product: Product;
  }[];
}

@Component({
  selector: 'app-view-order-history',
  templateUrl: './view-order-history.component.html',
  styleUrls: ['./view-order-history.component.css']
})
export class ViewOrderHistoryComponent implements OnInit {
  user_id!: number;
  user_name!: string;
  phone!: string;
  PhotosUrl: string = '';
  ordersWithDetails: OrderWithDetails[] = [];

  constructor(
    private userService: userService,
    private orderService: OrderService,
    private orderDetailService: OrderDetailService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.PhotosUrl = this.productService.PhotosUrl;

    const current = this.userService.getCurrentUser();
    if (!current) {
      alert('Vui lòng đăng nhập!');
      this.router.navigate(['/home/login']);
      return;
    }

    this.user_id = current.user_id;
    this.user_name = current.username;
    this.phone = current.phone;

    this.loadOrders(this.user_id);
  }

  private loadOrders(userId: number): void {
    this.orderService.getOrderByCustomerId(userId).subscribe(orders => {
      const requests = orders.map(order =>
        this.orderDetailService.getOrderDetailByOrderId(order.order_id).toPromise()
          .then(details => Promise.all(
            details.map(detail =>
              this.productService.getProductDetails(detail.product_id).toPromise()
                .then(product => ({ orderDetail: detail, product }))
                .catch(err => {
                  console.warn(`Không tìm thấy sản phẩm ${detail.product_id}:`, err);
                  return null;
                })
            )
          ).then(pairs => ({
            order,
            details: pairs.filter(p => p !== null)
          })))
          .catch(err => {
            console.warn(`Không tìm thấy chi tiết đơn hàng ${order.order_id}:`, err);
            return { order, details: [] };
          })
      );

      Promise.all(requests).then(results => {
        this.ordersWithDetails = results;
        this.cdr.detectChanges();
      });
    });
  }

  viewOrderDetails(orderId: number, customerId: number): void {
    this.router.navigate(['/home/order/detailOrder', orderId, customerId]);
  }

  cancelOrder(orderId: number): void {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn này?')) return;

    const orderWithDetails = this.ordersWithDetails.find(o => o.order.order_id === orderId);
    if (!orderWithDetails) return alert('Không tìm thấy đơn hàng.');

    const status = orderWithDetails.order.order_status;
    if (status === 'Chờ xác nhận')
      return alert('Vui lòng liên hệ Zalo số 0337431736 để được hỗ trợ hoàn tiền.');
    if (status !== 'Đang xử lý')
      return alert(`Không thể hủy đơn vì đơn hàng đang ở trạng thái: "${status}".`);

    this.orderService.deleteOrder(orderId).subscribe({
      next: () => {
        alert('Đã hủy đơn thành công.');
        this.ordersWithDetails = this.ordersWithDetails.filter(o => o.order.order_id !== orderId);
      },
      error: err => {
        console.error('Lỗi khi xóa đơn hàng:', err);
        alert('Lỗi khi xóa đơn hàng.');
      }
    });
  }

  logout(): void {
    this.userService.logout().subscribe({
      next: () => {
        alert('Đăng xuất thành công!');
        this.router.navigate(['/home/login']);
      },
      error: err => {
        console.error('Lỗi khi đăng xuất:', err);
        alert('Đăng xuất thất bại!');
      }
    });
  }
}
