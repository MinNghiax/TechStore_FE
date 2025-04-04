import { Component } from '@angular/core';
import { ProductService } from '../../../Service/productService';
import { Router } from '@angular/router';
import { categoryService } from '../../../Service/categoryService';
import { BrandService } from '../../../Service/brand-service';
import { Categories } from '../../../Models/categories';
import { Brand } from '../../../Models/brand';

@Component({
  selector: 'app-create-product',
  templateUrl: './create-product.component.html',
  styleUrls: ['./create-product.component.css']
})
export class CreateProductComponent {
  list_brand: Brand[] = [];
  list_category: Categories[] = [];
  product_name: string;
  brand_id: number;
  category_id: number;
  price: number;
  quantity: number;
  image_url: string = "com.jpg";  // Default image
  product: any = {};  // Assuming product is an object for simplicity

  constructor(
    private productService: ProductService,
    private router: Router,
    private categoryService: categoryService,
    private brandService: BrandService
  ) {}

  ngOnInit(): void {
    this.DsBrand();
    this.DsDanhMuc();
  }

  get photosUrl(): string {
    return this.productService.PhotosUrl;
  }

  DsDanhMuc() {
    this.categoryService.getCategory().subscribe(data => {
      this.list_category = data;
      console.log("Categories:", data);
    });
  }

  DsBrand() {
    this.brandService.getBrand().subscribe(data => {
      this.list_brand = data;
      console.log("Brands:", data);
    });
  }

  createProduct() {
    const val = {
      product_name: this.product_name,
      brand_id: this.brand_id,
      category_id: this.category_id,
      price: this.price,
      quantity: this.quantity,
      image_url: this.image_url, 
    };

    console.log(val);

    this.productService.postProduct(val).subscribe(res => {
      alert('Thêm thành công!');
      this.router.navigate(['/admin/products/list/', 0]);
    }, err => {
      console.error('Error:', err);
      alert('Đã xảy ra lỗi trong khi tạo sản phẩm');
    });
  }

  
  uploadPhoto(event: any) {
    var file = event.target.files[0];
    if (!file) {
      alert('Vui lòng chọn một tệp!');
      return;
    }
  
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
  
    this.productService.taiAnh(formData).subscribe((data: any) => {
      // Assuming 'data' is the image name or URL returned from the backend
      if (data) {
        this.image_url = data.toString();  // Store the image URL returned by the backend
        console.log('Response data:', data);
        // Make sure the photosUrl is also correctly set
        this.product.PathAnh = this.productService.PhotosUrl + "/" + this.image_url;
      } else {
        alert('Lỗi tải ảnh');
      }
    }, error => {
      console.error('Lỗi upload ảnh:', error);
      alert('Không thể tải ảnh lên');
    });
  }

  
}
