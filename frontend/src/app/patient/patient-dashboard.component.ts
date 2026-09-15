import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../shared/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-patient-dashboard',
    standalone: true,
    imports: [CommonModule, MaterialModule, ReactiveFormsModule],
    templateUrl: './patient-dashboard.component.html',
    styleUrls: ['./patient-dashboard.component.scss']
})
export class PatientDashboardComponent implements OnInit {
    doctors: any[] = [];
    appointments: any[] = [];
    medicalRecords: any[] = [];
    bookingForm: FormGroup;

    minDate: string;

    constructor(
        private http: HttpClient,
        private fb: FormBuilder,
        private snackBar: MatSnackBar
    ) {
        // Initialize minDate to current datetime string (YYYY-MM-DDTHH:mm)
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        this.minDate = now.toISOString().slice(0, 16);

        this.bookingForm = this.fb.group({
            doctorId: ['', Validators.required],
            appointmentTime: ['', [Validators.required, this.futureOrPresentValidator]],
            notes: ['']
        });
    }

    ngOnInit() {
        this.loadDoctors();
        this.loadAppointments();
        this.loadMedicalRecords();
    }

    loadDoctors() {
        console.log('Loading doctors...');
        this.http.get<any[]>('/api/patient/doctors').subscribe({
            next: (data) => {
                console.log('Doctors loaded:', data);
                this.doctors = data;
            },
            error: (error) => {
                console.error('Error loading doctors:', error);
                this.showError('Failed to load doctors: ' + (error.error?.message || error.message));
            }
        });
    }

    loadAppointments() {
        console.log('Loading appointments...');
        this.http.get<any[]>('/api/patient/appointments').subscribe({
            next: (data) => {
                console.log('Appointments loaded:', data);
                this.appointments = data;
            },
            error: (error) => {
                console.error('Error loading appointments:', error);
                this.showError('Failed to load appointments');
            }
        });
    }

    bookAppointment() {
        if (this.bookingForm.invalid) {
            this.showError('Please fill in all required fields');
            return;
        }

        const formValue = this.bookingForm.value;
        const localDateTime = formValue.appointmentTime;
        const appointmentDateTime = localDateTime + ':00';

        const bookingData = {
            doctor: { id: Number(formValue.doctorId) },
            appointmentTime: appointmentDateTime,
            notes: formValue.notes || ''
        };

        this.http.post('/api/patient/appointments', bookingData).subscribe({
            next: (response) => {
                this.showSuccess('Appointment Booked Successfully!');

                this.bookingForm.reset({ doctorId: '', appointmentTime: '', notes: '' });
                Object.keys(this.bookingForm.controls).forEach(key => {
                    this.bookingForm.get(key)?.setErrors(null);
                    this.bookingForm.get(key)?.markAsUntouched();
                    this.bookingForm.get(key)?.markAsPristine();
                });

                this.loadAppointments();
            },
            error: (error) => {
                let errorMessage = 'Booking Failed';
                if (error.status === 403) errorMessage = 'Access Denied';
                else if (error.status === 400) errorMessage = error.error?.message || 'Invalid booking data';
                else errorMessage = error.error?.message || error.message || 'Unknown error';

                this.showError(errorMessage);
            }
        });
    }

    cancelAppointment(id: number) {
        if (confirm('Are you sure you want to cancel this appointment?')) {
            this.http.delete(`/api/patient/appointments/${id}`).subscribe({
                next: () => {
                    this.showSuccess('Appointment Cancelled Successfully');
                    this.loadAppointments();
                },
                error: (error) => {
                    this.showError('Failed to cancel appointment: ' + (error.error?.message || error.message));
                }
            });
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear your entire appointment history? This cannot be undone.')) {
            // In a real app, this might be a bulk delete endpoint. 
            // Here, we'll simulate it by deleting them one by one or using a bulk endpoint if available.
            // Since we don't have a bulk delete, we'll iterate. 
            // ideally we should add a DELETE /api/patient/appointments/clear endpoint.

            // Checking if we should implement a bulk delete on backend first.
            // For now, let's implement the backend endpoint to be efficient.
            this.http.delete('/api/patient/appointments/clear').subscribe({
                next: () => {
                    this.showSuccess('History Cleared Successfully');
                    this.loadAppointments();
                },
                error: (error) => {
                    // Fallback or error
                    this.showError('Failed to clear history');
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

    // Custom validator to ensure appointment time is not in the past
    // ... (rest of the file)

    // Custom validator to ensure appointment time is not in the past
    // Allows appointments for today and future dates
    futureOrPresentValidator(control: AbstractControl): ValidationErrors | null {
        if (!control.value) {
            return null; // Don't validate empty values (handled by required validator)
        }

        const selectedDate = new Date(control.value);
        const now = new Date();

        // Only reject if the selected time is clearly in the past (more than 1 minute ago)
        // This allows for minor timing differences while still preventing past bookings
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

        if (selectedDate < oneMinuteAgo) {
            return { futureOrPresent: true };
        }

        return null;
    }

    loadMedicalRecords() {
        console.log('Loading medical records...');
        this.http.get<any[]>('/api/patient/medical-records').subscribe({
            next: (data) => {
                console.log('Medical records loaded:', data);
                this.medicalRecords = data;
            },
            error: (error) => {
                console.error('Error loading medical records:', error);
                this.snackBar.open('Failed to load medical records', 'Close', { duration: 3000 });
            }
        });
    }
}
