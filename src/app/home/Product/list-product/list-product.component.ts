import { Component } from '@angular/core';
import { Product } from '../../../Models/product';
import { ProductService } from '../../../Service/productService';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Order } from '../../../Models/order';
import { User } from '../../../Models/users';
import { userService } from '../../../Service/userService';
import { OrderDetails } from '../../../Models/order-details';
import { OrderService } from '../../../Service/order-service';
import { OrderDetailService } from '../../../Service/order-detail-service';

@Component({
  selector: 'app-list-product',
  templateUrl: './list-product.component.html',
  styleUrl: './list-product.component.css'
})
export class ListProductComponent {
  DSProduct: Product[] = [];
  products: Product[] = [];
  productSearch: Product[] = [];
  product:Product;
  searchText:string;

  paginatedProducts: Product[] = [];
  currentPage: number = 1;
  pageSize: number = 8; // Number of products per page
  totalPages: number = 0;

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
  user_id : number;
  
  constructor(
    private productService: ProductService, 
    private router: Router, 
    private route: ActivatedRoute,
    public userService : userService,
    private orderService : OrderService,
    private orderDetailService : OrderDetailService
  ) {}

  // Hàm được gọi khi component được khởi tạo
  ngOnInit() {
    this.layDSProduct(); // Gọi hàm tải sản phẩm khi component khởi tạo
    this.route.queryParams.subscribe(params => {
      this.searchText = params['searchText'] || '';
      this.timkiem();
      console.log(this.searchText);
    });

    const currentUser = this.userService.getCurrentUser();  
    if (currentUser) {
      this.user_id = currentUser.user_id;  
      this.customer_name = currentUser.username;
    } else {
      console.log('Không có người dùng đăng nhập');
      
    }
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedProducts = this.products.slice(start, end); // Pagination should be on 'products'
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  // Lấy danh sách sản phẩm từ ProductService
  layDSProduct() {
    this.productService.getProducts().subscribe(data => {
      this.DSProduct = data; // Gán dữ liệu lấy được vào DSProduct
      this.products = this.DSProduct.map(product => {
        product.PathAnh = this.productService.PhotosUrl + "/" + product.image_url; // Gán ảnh cho mỗi sản phẩm
        this.layDetailsSP(product.product_id);
        return product; // Trả về mỗi sản phẩm đã được cập nhật ảnh
      });
      this.totalPages = Math.ceil(this.products.length / this.pageSize); // Pagination based on 'products'
      this.updatePagination(); // Update pagination based on 'products'
    });
  }

  timkiem() {
    this.productService.timkiem(this.searchText).subscribe({
      next: (productSearch) => {
        this.productSearch = productSearch.map(product => {
          product.PathAnh = this.productService.PhotosUrl + "/" + product.image_url;
          return product;
        });
        this.totalPages = Math.ceil(this.productSearch.length / this.pageSize); // Recalculate total pages after search
        this.currentPage = 1; // Reset to the first page after search
        this.updatePagination();
      },
      error: (err) => {
        console.error('Đã xảy ra lỗi khi tìm kiếm sản phẩm:', err);
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
      // Kiểm tra nếu form không hợp lệ thì không làm gì
      if (!paymentForm.valid) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return; // Dừng lại nếu form không hợp lệ
      }

      // Tính tổng tiền cho chi tiết đơn hàng
      this.total_money = this.price * this.number_of_products;
      
      // Dữ liệu đơn hàng
      const orderData = {
        customer_id: this.user_id,
        order_status: this.order_status,
        create_at: new Date(),
        total_amount: this.total_money,
      };
    
      console.log(orderData);
      
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
