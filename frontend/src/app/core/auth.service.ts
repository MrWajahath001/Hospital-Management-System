import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api/auth'; // Proxy will handle /api
    private currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    public currentUser = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) { }

    public get currentUserValue(): any {
        return this.currentUserSubject.value;
    }

    login(credentials: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials)
            .pipe(tap(user => {
                localStorage.setItem('currentUser', JSON.stringify(user));
                this.currentUserSubject.next(user);
            }));
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        this.router.navigate(['/']);
    }

    getToken(): string {
        return this.currentUserValue?.token;
    }

    getRole(): string {
        return this.currentUserValue?.role;
    }
}
