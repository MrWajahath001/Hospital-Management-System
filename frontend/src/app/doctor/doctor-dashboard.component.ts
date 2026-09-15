import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../shared/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-doctor-dashboard',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule, MatProgressSpinnerModule],
    templateUrl: './doctor-dashboard.component.html',
    styleUrls: ['./doctor-dashboard.component.scss']
})
export class DoctorDashboardComponent implements OnInit {
    appointments: any[] = [];
    patientHistory: any[] = [];
    recordForm: FormGroup;
    selectedAppointment: any = null;
    isLoading = false;
    isSubmitting = false;
    loadError = '';

    constructor(
        private http: HttpClient,
        private fb: FormBuilder,
        private snackBar: MatSnackBar
    ) {
        this.recordForm = this.fb.group({
            diagnosis: ['', Validators.required],
            prescription: ['', Validators.required],
            reportFilePath: ['']
        });
    }

    ngOnInit() {
        this.loadAppointments();
    }

    loadAppointments() {
        this.isLoading = true;
        this.loadError = '';
        this.http.get<any[]>('/api/doctor/appointments').subscribe({
            next: (data) => {
                this.appointments = data;
                this.isLoading = false;
            },
            error: (err) => {
                this.isLoading = false;
                this.loadError = 'Failed to load appointments. Please refresh the page.';
                this.showError(this.loadError);
            }
        });
    }

    selectAppointment(appt: any) {
        this.selectedAppointment = appt;
        this.patientHistory = [];
        this.recordForm.reset({ diagnosis: '', prescription: '' });

        if (appt.patient && appt.patient.id) {
            this.loadPatientHistory(appt.patient.id);
        }
    }

    loadPatientHistory(patientId: number) {
        this.http.get<any[]>(`/api/doctor/patients/${patientId}/history`).subscribe({
            next: (data) => {
                this.patientHistory = data;
            },
            error: (err) => {
                this.showError('Failed to load patient history.');
            }
        });
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear your entire appointment list? This cannot be undone.')) {
            this.http.delete('/api/doctor/appointments/clear').subscribe({
                next: () => {
                    this.showSuccess('Appointment History Cleared');
                    this.loadAppointments();
                    this.selectedAppointment = null;
                },
                error: (error) => {
                    this.showError('Failed to clear history: ' + (error.error?.message || 'Unknown error'));
                }
            });
        }
    }

    completeAppointment() {
        if (!this.selectedAppointment || this.recordForm.invalid) return;

        if (this.selectedAppointment.status !== 'APPROVED') {
            this.showError('Only APPROVED appointments can be completed. Ask the admin to approve this appointment first.');
            return;
        }

        this.isSubmitting = true;
        const recordData = {
            diagnosis: this.recordForm.value.diagnosis,
            prescription: this.recordForm.value.prescription,
            reportFilePath: this.recordForm.value.reportFilePath || ''
        };

        this.http.post(`/api/doctor/appointments/${this.selectedAppointment.id}/complete`, recordData)
            .subscribe({
                next: (res) => {
                    this.isSubmitting = false;
                    this.showSuccess('Consultation Completed and Medical Record Saved!');
                    this.recordForm.reset();
                    this.selectedAppointment = null;
                    this.loadAppointments();
                },
                error: (err) => {
                    this.isSubmitting = false;
                    this.showError('Failed to complete consultation: ' + (err.error?.message || err.message || 'Unknown error'));
                }
            });
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

