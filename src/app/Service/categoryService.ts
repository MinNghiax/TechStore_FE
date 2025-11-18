import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
  })

export class categoryService {
    private apiUrl = 'https://localhost:7139/api';
    readonly PhotosUrl = 'https://localhost:7139';

    private httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": 'application/json'
      })
    }
  
    constructor(private http: HttpClient) {}

    getCategory(): Observable<any> {
      return this.http.get<any>(this.apiUrl+'/Categories');
    }
  
    getCategoryDetails(id: number): Observable<any> {
      const url = `${this.apiUrl}/Categories/${id}`;
      return this.http.get<any>(url);
    }
    
    deleteCategory(id:number){
      const url = `${this.apiUrl}/Categories/${id}`;
      return this.http.delete<any>(url, this.httpOptions)
  
    }

    public updateCategory(id: number,data: any): Observable<any> {
      const url = `${this.apiUrl}/Categories/${id}`;
      return this.http.put<any>(url, data, this.httpOptions)
    }

    public addCategory(data:any){
      const url = `${this.apiUrl}/Categories`;
      console.log(data);
      return this.http.post<any>(url, data)
     
    }

}
