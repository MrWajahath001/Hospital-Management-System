import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../shared/material.module';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-forgot-password-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MaterialModule],
    template: `
        <h2 mat-dialog-title>Reset Password</h2>
        <mat-dialog-content>
            <form [formGroup]="resetForm" class="reset-form">
                <p class="dialog-description">Enter your username and new password to reset your account.</p>
                
                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Username</mat-label>
                    <input matInput formControlName="username" placeholder="Enter your username">
                    <mat-icon matPrefix>person</mat-icon>
                    <mat-error *ngIf="resetForm.get('username')?.hasError('required')">
                        Username is required
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>New Password</mat-label>
                    <input matInput [type]="hidePassword ? 'password' : 'text'" 
                           formControlName="newPassword" placeholder="Enter new password">
                    <mat-icon matPrefix>lock</mat-icon>
                    <button mat-icon-button matSuffix (click)="togglePassword()" type="button">
                        <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                    </button>
                    <mat-error *ngIf="resetForm.get('newPassword')?.hasError('required')">
                        Password is required
                    </mat-error>
                    <mat-error *ngIf="resetForm.get('newPassword')?.hasError('minlength')">
                        Password must be at least 6 characters
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Confirm Password</mat-label>
                    <input matInput [type]="hideConfirm ? 'password' : 'text'" 
                           formControlName="confirmPassword" placeholder="Confirm new password">
                    <mat-icon matPrefix>lock_outline</mat-icon>
                    <button mat-icon-button matSuffix (click)="toggleConfirm()" type="button">
                        <mat-icon>{{hideConfirm ? 'visibility_off' : 'visibility'}}</mat-icon>
                    </button>
                    <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">
                        Please confirm password
                    </mat-error>
                    <mat-error *ngIf="resetForm.hasError('passwordMismatch') && !resetForm.get('confirmPassword')?.hasError('required')">
                        Passwords do not match
                    </mat-error>
                </mat-form-field>
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancel</button>
            <button mat-raised-button color="primary" (click)="onReset()" 
                    [disabled]="resetForm.invalid || loading">
                <span *ngIf="!loading">Reset Password</span>
                <span *ngIf="loading">Resetting...</span>
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        .reset-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 400px;
            padding: 16px 0;
        }

        .dialog-description {
            color: #666;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .full-width {
            width: 100%;
        }

        mat-dialog-content {
            overflow: visible !important;
        }

        @media (max-width: 600px) {
            .reset-form {
                min-width: 280px;
            }
        }
    `]
})
export class ForgotPasswordDialogComponent {
    resetForm: FormGroup;
    hidePassword = true;
    hideConfirm = true;
    loading = false;

    constructor(
        private dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
        private fb: FormBuilder,
        private http: HttpClient,
        private snackBar: MatSnackBar
    ) {
        this.resetForm = this.fb.group({
            username: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(group: FormGroup) {
        const password = group.get('newPassword')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return password === confirm ? null : { passwordMismatch: true };
    }

    togglePassword() {
        this.hidePassword = !this.hidePassword;
    }

    toggleConfirm() {
        this.hideConfirm = !this.hideConfirm;
    }

    onCancel() {
        this.dialogRef.close();
    }

    onReset() {
        if (this.resetForm.invalid) return;

        this.loading = true;
        const { username, newPassword } = this.resetForm.value;

        console.log('=== RESET PASSWORD REQUEST ===');
        console.log('Username:', username);
        console.log('New Password Length:', newPassword?.length);
        console.log('Request payload:', { username, newPassword });

        this.http.post('/api/auth/reset-password', { username, newPassword }).subscribe({
            next: (response: any) => {
                console.log('✅ Reset successful:', response);
                this.loading = false;
                this.snackBar.open('Password reset successful! Please login with your new password.', 'Close', {
                    duration: 5000,
                    panelClass: ['success-snackbar']
                });
                this.dialogRef.close(true);
            },
            error: (error) => {
                console.error('❌ Reset failed:', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                console.error('Error body:', error.error);

                this.loading = false;
                let errorMsg = 'Failed to reset password. Please try again.';

                if (error.error?.message) {
                    errorMsg = error.error.message;
                } else if (error.status === 400) {
                    errorMsg = 'Invalid request. Please check username and try again.';
                } else if (error.status === 0) {
                    errorMsg = 'Cannot connect to server. Please check if backend is running.';
                }

                this.snackBar.open(errorMsg, 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }
}
