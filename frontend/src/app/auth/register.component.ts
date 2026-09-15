import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MaterialModule } from '../shared/material.module';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    registerForm: FormGroup;
    loading = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private http: HttpClient,
        private snackBar: MatSnackBar
    ) {
        this.registerForm = this.formBuilder.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            fullName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            contactNumber: ['']
        });
    }

    onSubmit() {
        if (this.registerForm.invalid) {
            this.snackBar.open('Please fill in all required fields correctly', 'Close', { duration: 3000 });
            return;
        }

        this.loading = true;
        const formData = {
            ...this.registerForm.value,
            role: 'PATIENT'
        };

        this.http.post<any>('/api/auth/register/patient', formData).subscribe({
            next: (response) => {
                this.loading = false;

                if (response.token && response.id && response.role) {
                    localStorage.setItem('currentUser', JSON.stringify(response));
                    this.snackBar.open(`Welcome ${response.fullName}! Registration successful!`, 'Close', { duration: 3000 });
                    this.router.navigate(['/dashboard/patient']);
                } else {
                    this.snackBar.open('Registration Successful! Please log in.', 'Close', { duration: 5000 });
                    this.router.navigate(['/login']);
                }
            },
            error: (error) => {
                this.loading = false;
                const errorMsg = error.error?.message || error.message || 'Registration failed';
                this.snackBar.open('Error: ' + errorMsg, 'Close', { duration: 5000 });
            }
        });
    }
}
