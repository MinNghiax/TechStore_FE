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
  selector: 'app-detail-products',
  templateUrl: './detail-products.component.html',
  styleUrl: './detail-products.component.css'
})
export class DetailProductsComponent {

  public product: Product;  // Khai báo là đối tượng duy nhất

  total_amount: number;
  order: Order;
  product_id : number;
  price: number;


  constructor(
    private productService: ProductService,
    private route: ActivatedRoute, private router:Router,
  ) {}
  ngOnInit() {
    const Id = Number(this.route.snapshot.paramMap.get('id'));
    this.product_id = Id;
    console.log(this.product_id);
    this.layDetailsSP(Id);


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

  goBack() {
    this.router.navigate([`/admin/products/list/`, 0]); // Điều hướng về danh sách với ID   
  }

  goBack2() {
    this.router.navigate([`/admin/index`]); 
  }
}
