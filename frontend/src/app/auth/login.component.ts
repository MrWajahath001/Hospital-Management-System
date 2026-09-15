import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { MaterialModule } from '../shared/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ForgotPasswordDialogComponent } from './forgot-password-dialog.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    loginForm: FormGroup;
    error = '';
    loading = false;
    hidePassword = true;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {
        this.loginForm = this.formBuilder.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    togglePasswordVisibility() {
        this.hidePassword = !this.hidePassword;
    }

    onForgotPassword() {
        this.dialog.open(ForgotPasswordDialogComponent, {
            width: '500px',
            disableClose: false
        });
    }

    onSubmit() {
        if (this.loginForm.invalid) {
            this.snackBar.open('Please enter username and password', 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
            });
            return;
        }

        console.log('=== LOGIN ATTEMPT ===');
        console.log('Username:', this.loginForm.value.username);

        this.loading = true;
        this.error = '';

        this.authService.login(this.loginForm.value).subscribe({
            next: (user) => {
                console.log('✅ Login successful:', user);
                this.loading = false;

                this.snackBar.open(`Welcome ${user.fullName || user.username}!`, 'Close', {
                    duration: 2000,
                    panelClass: ['success-snackbar']
                });

                // Navigate to appropriate dashboard based on role
                const role = user.role.toLowerCase();
                if (role === 'admin') this.router.navigate(['/dashboard/admin']);
                else if (role === 'doctor') this.router.navigate(['/dashboard/doctor']);
                else if (role === 'patient') this.router.navigate(['/dashboard/patient']);
                else this.router.navigate(['/']);
            },
            error: error => {
                console.error('❌ Login failed:', error);
                console.error('Error status:', error.status);
                console.error('Error statusText:', error.statusText);
                console.error('Error message:', error.message);
                console.error('Error body:', error.error);
                console.error('Full error object:', JSON.stringify(error, null, 2));

                this.loading = false;

                let errorMessage = 'Login failed';
                if (error.status === 401 || error.status === 403) {
                    errorMessage = 'Invalid username or password';
                } else if (error.status === 0) {
                    errorMessage = 'Server is starting up (free tier cold start). Please wait 30 seconds and try again.';
                } else if (error.status === 500) {
                    errorMessage = 'Server error. Please try again or contact administrator.';
                } else if (error.error?.message) {
                    errorMessage = error.error.message;
                } else {
                    errorMessage = 'Login failed. Please try again.';
                }

                this.error = errorMessage;

                // Show popup notification
                this.snackBar.open(`❌ ${errorMessage}`, 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar'],
                    verticalPosition: 'top',
                    horizontalPosition: 'center'
                });
            }
        });
    }
}
