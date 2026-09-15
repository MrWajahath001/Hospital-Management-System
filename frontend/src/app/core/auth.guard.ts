import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUserValue;

    // Check if user is logged in (has id and role)
    if (currentUser && currentUser.id && currentUser.role) {
        // Check if route has role requirements
        const requiredRoles = route.data['roles'] as Array<string>;

        if (requiredRoles && requiredRoles.length > 0) {
            // Check if user has required role
            if (requiredRoles.includes(currentUser.role)) {
                return true;
            } else {
                // Redirect to appropriate dashboard based on user's role
                router.navigate([`/${currentUser.role.toLowerCase()}`]);
                return false;
            }
        }

        return true;
    }

    // Not logged in, redirect to login
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};
