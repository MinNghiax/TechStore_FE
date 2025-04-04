import { Component, OnInit, Input } from '@angular/core';
import { ProductService } from '../../../Service/productService'; 
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Brand } from '../../../Models/brand'; 
import { Product } from '../../../Models/product';
import { categoryService } from '../../../Service/categoryService';
import { Subscription } from 'rxjs'; 
import { BrandService } from '../../../Service/brand-service';

@Component({
  selector: 'app-filter-by-category',
  templateUrl: './filter-by-category.component.html',
  styleUrl: './filter-by-category.component.css'
})
export class FilterByCategoryComponent {
  constructor(private productService: ProductService, private route: ActivatedRoute,
    private categoryService: categoryService, private brandService: BrandService, private router: Router
  ) {}

  noProductsMessage: string = '';
  DsSP:Product[] = [];
  product:Product;
  DsTH: Brand[] = [];
  brand: Brand;
  categoryId: number | null = null;
  private routeSub: Subscription;
  priceCategory : string;

  paginatedProducts: Product[] = [];
  currentPage: number = 1;
  pageSize: number = 8; // Number of products per page
  totalPages: number = 0;

  ngOnInit() {
    // Lắng nghe các thay đổi từ paramMap để lấy category_id
    this.route.paramMap.subscribe(params => {
      const categoryIdParam = params.get('category_id'); // Lấy category_id từ URL
      const categoryId = categoryIdParam ? Number(categoryIdParam) : null; // Chuyển đổi thành số nếu có
  
      if (categoryId !== null && !isNaN(categoryId)) {
        this.categoryId = categoryId; // Gán giá trị cho biến toàn cục
        console.log('Category ID:', this.categoryId);
  
        // Lấy dữ liệu sản phẩm theo category_id
        this.laySPByDM(this.categoryId);
        this.laySP_idDM(this.categoryId);
      } else {
        console.error('Invalid category ID:', categoryIdParam);
      }
  
      // Lắng nghe các thay đổi từ queryParams để lấy priceCategory
      this.route.queryParams.subscribe(queryParams => {
        const priceCategory = queryParams['priceCategory'] || null; // Lấy giá trị priceCategory từ queryParams
        this.priceCategory = priceCategory;
        console.log('Price Category:', this.priceCategory);
  
        if (this.priceCategory && this.categoryId !== null) {
          // Lọc sản phẩm theo categoryId và priceCategory
          this.searchProducts(this.categoryId, this.priceCategory);
        }
      });
    });
  }
  
  
  

    // Update pagination based on the filtered products
    updatePagination(): void {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      this.paginatedProducts = this.DsSP.slice(start, end);
    }
  
    // Next page navigation
    nextPage(): void {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.updatePagination();
      }
    }
  
    // Previous page navigation
    previousPage(): void {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.updatePagination();
      }
    }
    
  laySPByDM(id:number){
    this.productService.getByIdDM(id)
      .subscribe({
        next: (products) => {
          this.DsSP = products;
          this.DsSP.forEach(product => {
            product.PathAnh = this.productService.PhotosUrl + "/" + product.image_url ;
          });
        //   this.categoryService.getCategoryDetails(id).subscribe(dm => {
        //     this.product.category_id = dm.category_name;
        // });
        this.totalPages = Math.ceil(this.DsSP.length / this.pageSize);
        this.updatePagination();
        },
        error: (err) => {
          console.error('Error:', err);
        }
      });
  }

  //Lấy thương hiệu theo id danh mục
  laySP_idDM(id: number) {
    this.brandService.getBrand_idDM(id)
      .subscribe({
        next: (brands) => {
          this.DsTH = brands; 
        },
        error: (err) => {
          console.error('Error:', err);
        }
      });
  }

 // Hàm lọc sản phẩm theo category_id và priceCategory
 searchProducts(categoryId: number, priceCategory: string): void {
  this.productService.getProductsByPriceCategory(categoryId, priceCategory).subscribe({
    next: (products) => {
      if (products.length === 0) {
        this.noProductsMessage = "No products found."; // Inform the user if no products match
      } else {
        this.DsSP = products;
        this.DsSP.forEach(product => {
          product.PathAnh = this.productService.PhotosUrl + "/" + product.image_url;
        });
        this.noProductsMessage = ''; // Clear the message if products are found
      }
    },
    error: (err) => {
      console.error('Error when filtering products:', err);
      if (err.status === 404) {
        // this.noProductsMessage = 'No products found for this price category.';
        this.DsSP = []; // Ensure the list is cleared on error
      } else {
        // this.noProductsMessage = 'An error occurred while filtering products.';
        this.DsSP = []; // Ensure the list is cleared on error
      }
    },
  });
}
  


onFilterChange(event: any): void {
  const priceCategory = event.target.value;

  if (this.categoryId !== null) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { priceCategory: priceCategory || null },
      queryParamsHandling: 'merge', // Đảm bảo các params khác không bị thay đổi
    });

    if (priceCategory) {
      // Kiểm tra lại logic để gọi đúng phương thức lọc với categoryId và priceCategory
      this.searchProducts(this.categoryId, priceCategory);
    } else {
      this.DsSP = []; // Xóa dữ liệu nếu không có giá trị lọc
    }
  } else {
    console.error('Category ID is not defined.');
  }
}

}
