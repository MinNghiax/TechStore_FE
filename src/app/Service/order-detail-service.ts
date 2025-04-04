import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../Models/users';

@Injectable({
  providedIn: 'root'
})
export class OrderDetailService {
  private apiUrl = 'http://localhost:5038/api';

  private httpOptions = {
    headers: new HttpHeaders({
      "Content-Type": 'application/json'
    })
  }

  constructor(private http: HttpClient) {}

    getOrderTails():Observable<any> {
        return this.http.get<any>(this.apiUrl+'/Order_Details');
    }

    // getOrderDetailById(id: number): Observable<any> {
    //     const url = `${this.apiUrl}/Order_Details/order_id/${id}`;
    //     return this.http.get<any>(url, this.httpOptions);
    // }

    getOrderDetailById(id: number): Observable<any> {
      const url = `${this.apiUrl}/Order_Details/order_id/${id}`;
      return this.http.get<any>(url, this.httpOptions);
    }

    getOrderDetailByOrderId(id: number): Observable<any> {
      const url = `${this.apiUrl}/Order_Details/orderID/${id}`;
      return this.http.get<any>(url, this.httpOptions);
    }

    getOrderDetailId(id: number): Observable<any> {
      const url = `${this.apiUrl}/Order_Details/${id}`;
      return this.http.get<any>(url, this.httpOptions);
    }

    postOrderDetail(body: any){
      const url = `${this.apiUrl}/Order_Details`;
      return this.http.post(url, body);
    }
}
