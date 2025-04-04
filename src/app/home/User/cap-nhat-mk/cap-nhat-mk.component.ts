import { Component, OnInit, Input } from '@angular/core';
import { userService } from '../../../Service/userService';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../../Models/users';

@Component({
  selector: 'app-cap-nhat-mk',
  templateUrl: './cap-nhat-mk.component.html',
  styleUrls: ['./cap-nhat-mk.component.css']
})
export class CapNhatMKComponent implements OnInit {
  userId: number;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  @Input() user: User;

  constructor(
    private userservice: userService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = +params['id'];  // Lấy userId từ URL
    });
    this.loadUserData();

    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    //this.updatePassword();
  }

  loadUserData(): void {
    const currentUser = this.userservice.getCurrentUser();  
    if (currentUser) {
      this.user = currentUser;

    } else {
      console.log('Không có người dùng đăng nhập');
      
    }
  }

  isPasswordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  updatePassword(): void {
  
    // Kiểm tra xem người dùng đã nhập đầy đủ các trường không
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      alert('Vui lòng nhập các trường.');
      return;
    }
  
    // Kiểm tra mật khẩu mới và mật khẩu xác nhận có khớp không
    if (!this.isPasswordsMatch()) {
      alert('Mật khẩu mới không hợp lệ.');
      return;
    }
  
    // Kiểm tra xem mật khẩu mới có giống mật khẩu cũ không
    if (this.oldPassword === this.newPassword) {
      alert('Mật khẩu không đúng! Vui lòng nhập lại.');
      return;
    }
  
    // Gửi request update mật khẩu
    const updatePasswordRequest = {
      CurrentPassword: this.oldPassword,
      NewPassword: this.newPassword
    };
  
    // Sử dụng API để cập nhật mật khẩu
    this.userservice.updatePassword(this.userId, updatePasswordRequest).subscribe(
      (response) => {
        alert('Cập nhật mật khẩu thành công.');

        this.loadUserData();

       // Kiểm tra nếu this.user có giá trị trước khi truy cập role_id
       if (this.user && this.user.role_id !== undefined) {
        const roleId = Number(this.user.role_id); // Ensure role_id is a number

        // Differentiate based on user role (role_id)
        if (roleId === 1) {
          console.log(roleId);
          this.router.navigate(['/admin/index']); // Navigate to admin page
        } else if (roleId === 2) {
          this.router.navigate(['/home/list']); // Navigate to user page
        }
      } else {
        console.error('User or role_id is undefined');
        alert('Lỗi: Không tìm thấy thông tin người dùng hoặc vai trò không hợp lệ.');
      }
      },
      (error) => {
        alert('Error: ' + error.error);
      }
    );
  }
  
}
