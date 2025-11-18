import { Component, OnInit } from '@angular/core';
import { userService } from '../../../Service/userService';
import { User } from '../../../Models/users';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  username = '';
  password = '';
  message = '';
  user: User | null = null;

  constructor(
    private userService: userService,
    private router: Router,

  ) { }

  ngOnInit(): void {
    const middle = window.innerHeight / 2;
    window.scrollTo({ top: middle, behavior: 'smooth' });
  }


  Login() {
    const loginRequest = {
      Username: this.username,
      Password: this.password
    };

    this.userService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login Response:', response);

        if (!response.Success) {
          this.message = response.message || 'Đăng nhập thất bại.';
          return;
        }

        const user = response.User;
        if (!user || typeof user !== 'object') {
          this.message = 'Dữ liệu người dùng không hợp lệ';
          return;
        }

        // ✅ Lưu thông tin user
        this.user = user;
        this.userService.setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));

        const roleId = Number(user.role_id);
        switch (roleId) {
          case 1:
            this.message = 'Đăng nhập thành công với quyền Admin';
            this.router.navigate(['/admin/index']);
            break;
          case 2:
            this.message = 'Đăng nhập thành công với quyền User';
            this.router.navigate(['/home/list']);
            break;
          default:
            this.message = 'Lỗi: role_id không hợp lệ';
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.message = 'Đăng nhập thất bại. Vui lòng thử lại.';
        alert('Tên người dùng hoặc mật khẩu sai, vui lòng nhập lại!');
      }
    });
  }


  logout() {
    this.userService.logout().subscribe(
      response => {
        if (response.success) {
          this.message = response.message || 'Đăng xuất thành công.';
          localStorage.removeItem('user');
          this.user = null;
          this.router.navigate(['/login']);
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
