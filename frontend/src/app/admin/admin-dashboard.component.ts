import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../shared/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
    doctorForm: FormGroup;
    deptForm: FormGroup;
    doctors: any[] = [];
    departments: any[] = [];
    appointments: any[] = [];
    isLoading = false;
    showDepartments = false;

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private snackBar: MatSnackBar
    ) {
        this.doctorForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(4)]],
            fullName: ['', Validators.required],
            specialization: ['', Validators.required],
            departmentId: ['', Validators.required]
        });

        this.deptForm = this.fb.group({
            name: ['', Validators.required],
            description: ['']
        });
    }

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        this.http.get<any[]>('/api/admin/departments').subscribe({
            next: (data) => { this.departments = data; },
            error: () => this.showError('Failed to load departments')
        });
        this.http.get<any[]>('/api/patient/doctors').subscribe({
            next: (data) => { this.doctors = data; this.isLoading = false; },
            error: () => { this.isLoading = false; this.showError('Failed to load doctors'); }
        });
        this.http.get<any[]>('/api/admin/appointments').subscribe({
            next: (data) => { this.appointments = data; },
            error: () => this.showError('Failed to load appointments')
        });
    }

    addDoctor() {
        if (this.doctorForm.invalid) return;
        this.http.post('/api/admin/doctors', this.doctorForm.value).subscribe({
            next: () => {
                this.showSuccess('Doctor registered successfully');
                this.doctorForm.reset();
                this.loadData();
            },
            error: (err) => this.showError('Failed to add doctor: ' + (err.error?.message || err.message || 'Unknown error'))
        });
    }

    addDepartment() {
        if (this.deptForm.invalid) return;
        this.http.post('/api/admin/departments', this.deptForm.value).subscribe({
            next: () => {
                this.showSuccess('Department created successfully');
                this.deptForm.reset();
                this.loadData();
            },
            error: (err) => this.showError('Failed to add department: ' + (err.error?.message || err.message || 'Unknown error'))
        });
    }

    approveAppointment(id: number) {
        this.http.put(`/api/admin/appointments/${id}/approve`, {}).subscribe({
            next: () => {
                this.showSuccess('Appointment Approved Successfully!');
                this.loadData();
            },
            error: (error) => {
                this.showError('Failed to approve: ' + (error.error?.message || error.message));
            }
        });
    }

    rejectAppointment(id: number) {
        this.http.put(`/api/admin/appointments/${id}/reject`, {}).subscribe({
            next: () => {
                this.showSuccess('Appointment Rejected');
                this.loadData();
            },
            error: (error) => {
                this.showError('Failed to reject: ' + (error.error?.message || error.message));
            }
        });
    }

    deleteDoctor(id: number) {
        if (confirm('Are you sure you want to delete this doctor? This will also remove their appointments.')) {
            this.http.delete(`/api/admin/doctors/${id}`).subscribe({
                next: () => {
                    this.showSuccess('Doctor deleted successfully');
                    this.loadData();
                },
                error: (error) => {
                    this.showError('Failed to delete doctor: ' + (error.error?.message || error.message));
                }
            });
        }
    }

    deleteAppointment(id: number) {
        if (confirm('Are you sure you want to delete this appointment?')) {
            this.http.delete(`/api/admin/appointments/${id}`).subscribe({
                next: () => {
                    this.showSuccess('Appointment deleted successfully');
                    this.loadData();
                },
                error: (error) => {
                    this.showError('Failed to delete appointment: ' + (error.error?.message || error.message));
                }
            });
        }
    }

    toggleDepartments() {
        this.showDepartments = !this.showDepartments;
    }

    deleteDepartment(id: number) {
        if (confirm('Are you sure you want to delete this department? Doctors in this department will be affected.')) {
            this.http.delete(`/api/admin/departments/${id}`).subscribe({
                next: () => {
                    this.showSuccess('Department deleted successfully');
                    this.loadData();
                },
                error: (error) => {
                    this.showError('Failed to delete department: ' + (error.error?.message || 'Department may have associated doctors'));
                }
            });
        }
    }

    private showSuccess(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }

    private showError(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'center',
            verticalPosition: 'top'
        });
    }
}
