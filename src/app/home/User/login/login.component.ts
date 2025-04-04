import { Component } from '@angular/core';
import { userService } from '../../../Service/userService';
import { User } from '../../../Models/users'; 
import { Router } from '@angular/router';
import { ShoppingCartService } from '../../../Service/shoppingCartService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  username = '';
  password = '';
  message = '';
  user: User | null = null;  // Initialize user as null

  constructor(private userService: userService, private router: Router, private shoppingCartService : ShoppingCartService) {}

  Login() {
    // Tạo đối tượng yêu cầu đăng nhập tương ứng với cấu trúc backend
    const loginRequest = { 
      Username: this.username, 
      Password: this.password 
    };
  
    // Gọi login service để gửi yêu cầu POST
    this.userService.login(loginRequest).subscribe(
      response => {
        console.log('Login Response:', response);  // Kiểm tra phản hồi để đảm bảo dữ liệu hợp lệ
        if (response.Success) {
          // Kiểm tra nếu response.user tồn tại và là một đối tượng hợp lệ
          if (response.User && typeof response.User === 'object') {
            this.user = response.User;  // Gán đối tượng user
            console.log("Login successful");
            console.log('User Data:', this.user);  // Kiểm tra dữ liệu người dùng
  
            // Đảm bảo role_id là một số (chuyển đổi nếu nó là chuỗi)
            const roleId = Number(this.user.role_id);  // Đảm bảo role_id là một số
            this.userService.setCurrentUser(this.user);  // Lưu thông tin người dùng
  
            // Phân biệt theo roleId
            if (roleId === 1) {
              this.message = 'Đăng nhập thành công với quyền Admin';
              this.router.navigate(['/admin/index']); // Điều hướng đến trang admin
            } else if (roleId === 2) {
              this.message = 'Đăng nhập thành công với quyền User';
              this.router.navigate(['/home/list']); // Điều hướng đến trang user
            } else {
              this.message = 'Lỗi: role_id không hợp lệ';
            }
  
            // Lưu thông tin người dùng trong localStorage
            localStorage.setItem('user', JSON.stringify(this.user)); // Lưu thông tin người dùng
  
            
  
          } else {
            this.message = 'Dữ liệu người dùng không hợp lệ';
          }
        } else {
          this.message = response.message || 'Đăng nhập thất bại.';
        }
      },
      error => {
        console.error('Login error', error);
        this.message = 'Đăng nhập thất bại. Vui lòng thử lại.';
        alert('Tên người dùng hoặc mật khẩu sai, vui lòng nhập lại!');
      }
    );
  }
  
  
  

  logout() {
    this.userService.logout().subscribe(
      response => {
        if (response.success) {
          this.message = response.message || 'Đăng xuất thành công.';
          // Clear user data from localStorage or sessionStorage
          localStorage.removeItem('user');
          this.user = null; // Clear user state in component
          this.router.navigate(['/login']); // Redirect to login page
        } else {
          this.message = response.message || 'Đăng xuất thất bại.';
        }
      },
      error => {
        console.error('Logout error', error);
        this.message = 'Đăng xuất thất bại. Vui lòng thử lại.';
      }
    );
  }
}
