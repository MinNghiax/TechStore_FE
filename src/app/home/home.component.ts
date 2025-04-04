import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService } from '../Service/productService';
import { ActivatedRoute } from '@angular/router';
import { categoryService } from '../Service/categoryService';
import { Product } from '../Models/product';
import { Categories } from '../Models/categories';
import { userService } from '../Service/userService';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private router : Router, private productService: ProductService, private route: ActivatedRoute,
    private categoryService: categoryService, private userService : userService
  ) {}

  searchText: string = '';
  products:Product[] = [];
  product:Product;
  DsDM : Categories[] = [];
  user_id: number;

  ngOnInit(){
    //const Id = Number(this.route.snapshot.paramMap.get('id'));
    this.DsDanhMucSp();
    //this.layTourByDM(Id);
    //this.layTourByTH(Id);
  }

  DsDanhMucSp() {
    this.categoryService.getCategory().subscribe(data => {
      this.DsDM = data;
    });
  }


  timkiem() {
   if (this.searchText) {
     // Chỉ thực hiện tìm kiếm nếu searchText không rỗng
     this.router.navigate(['Products/search/'], { queryParams: { search: this.searchText } });
   } else {
     // Thông báo nếu searchText rỗng
     console.log("Vui lòng nhập từ khóa tìm kiếm.");
   }
 }
}



//  goBack() {
//   this.router.navigate([`/home/list`]);   
// }

// goBack2() {
//   this.router.navigate([`/admin/index`]); 
// }