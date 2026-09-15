import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const currentUser = this.authService.currentUserValue;
        const token = currentUser?.token;

        let newUrl = request.url;
        if (environment.apiUrl && newUrl.startsWith('/api')) {
            newUrl = `${environment.apiUrl}${newUrl}`;
        }

        const headers: { [key: string]: string } = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        request = request.clone({
            url: newUrl,
            setHeaders: headers
        });

        return next.handle(request);
    }
}
