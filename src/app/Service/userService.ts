import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '../Models/users';
import { Observable, BehaviorSubject  } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class userService {
  private apiUrl = 'http://localhost:5038/api/Users';

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": 'application/json'
    }),
    withCredentials: true // Ensures cookies are sent with the request if necessary
  }
  private isAuthenticatedFlag: boolean = false;
  private authenticatedSubject = new BehaviorSubject<boolean>(false); // BehaviorSubject to emit authentication state

  private currentUser: User | null = null;
  message: any;
  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    const apiUrlWithRole = `${this.apiUrl}`; 
    return this.http.get<any>(apiUrlWithRole);
  }
  
  getUsersRole2(): Observable<any[]>{
    const apiUrl = `${this.apiUrl}`;
    return this.http.get<any[]>(apiUrl);
  }

  //Register
  register(body: any){
    const url = `${this.apiUrl}`;
    return this.http.post(url, body);
  }

  // Cập nhật mật khẩu
  updatePassword(id: number, body: any): Observable<any> {
    const url = `${this.apiUrl}/${id}/password`;  // Chú ý sửa lại URL
    return this.http.patch<any>(url, body, this.httpOptions);
  }
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  updateUser(id: number, data: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  // getUserByID(id: number): Observable<any>{
  //   const url = `${this.apiUrl}/Users/${id}`;
  //   return this.http.get<any>(url);
  // }

   // Login function using JSON body
   get authenticated$(): Observable<boolean> {
    return this.authenticatedSubject.asObservable();
  }

  // login(username: string, password: string): Observable<any> {
  //   const formData: FormData = new FormData();
  //   formData.append('username', username);
  //   formData.append('password', password);

  //   return this.http.post(`${this.apiUrl}/login`, formData, { withCredentials: true })
  //     .pipe(
  //       tap(res => {
  //         if (res.success) {
  //           this.setAuthenticated(true);
  //           localStorage.setItem('userId', res.user.user_id);
  //           localStorage.setItem('username', res.user.username);

  //           console.log('UserId:', localStorage.getItem('userId'));
  //           console.log('Username:', localStorage.getItem('username'));
  //         }
  //       })
  //     );
  // }


  // login(username: string, password: string): Observable<any> {
  //   const loginRequest = { username, password };
  
  //   return this.http.post(`${this.apiUrl}/login`, loginRequest, { headers: { 'Content-Type': 'application/json' }, withCredentials: true })
  //     .pipe(
  //       tap(res => {
  //         if (res.success) {
  //           this.setAuthenticated(true);
  //           localStorage.setItem('userId', res.user.user_id);
  //           localStorage.setItem('username', res.user.username);
  
  //           console.log('UserId:', localStorage.getItem('userId'));
  //           console.log('Username:', localStorage.getItem('username'));
  //         }
  //       })
  //     );
  // }
  login(loginRequest: { Username: string; Password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, loginRequest, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    }).pipe(
      tap(response => {
        // Handle the response (optional additional logic can go here)
        //console.log(response);
        if (response.Success) {
          this.setAuthenticated(true);
          localStorage.setItem('userId', response.User.user_id);
          localStorage.setItem('username', response.User.username);

          console.log('UserId:', localStorage.getItem('userId'));
          console.log('Username:', localStorage.getItem('username'));
          }
      })
    );
  }

  getUserRole(): string {
    // This method should return the role of the logged-in user, e.g., 'admin' or 'user'.
    return localStorage.getItem('userRole'); // or use another logic based on how you store roles
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, this.httpOptions)
      .pipe(
        tap(() => {
          this.setAuthenticated(false);
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
        })
      );
  }

  setAuthenticated(flag: boolean) {
    this.isAuthenticatedFlag = flag;
    this.authenticatedSubject.next(flag); // Emit the new authentication state
  }

  // isAuthenticated(): boolean {
  //   return !!localStorage.getItem('userId');
  // }
  
  getUserId(){
  return localStorage.getItem('userId'); 
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  // Get the current user, either from service or localStorage
  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    } else {
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUser = JSON.parse(user);
        return this.currentUser;
      }
      return null;
    }
  }

  deleteUser(id:number){
    const url = `${this.apiUrl}/deleteUser/${id}`;
    return this.http.delete<any>(url, this.httpOptions)

  }

  // updateUsers(id: number,data: any): Observable<any> {
  //   const url = `${this.apiUrl}/${id}`;
  //   return this.http.put<any>(url, data, this.httpOptions)
  // }

 addUser(data:any){
    const url = `${this.apiUrl}`;
    return this.http.post<any>(url, data)
   
  }
}
