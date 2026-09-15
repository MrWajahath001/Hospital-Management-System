import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';
import { DoctorDashboardComponent } from './doctor/doctor-dashboard.component';
import { PatientDashboardComponent } from './patient/patient-dashboard.component';
import { HomeComponent } from './home/home';
import { MainLayout } from './layout/main-layout/main-layout';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'dashboard',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            {
                path: 'admin',
                component: AdminDashboardComponent,
                canActivate: [authGuard],
                data: { roles: ['ADMIN'] }
            },
            {
                path: 'doctor',
                component: DoctorDashboardComponent,
                canActivate: [authGuard],
                data: { roles: ['DOCTOR'] }
            },
            {
                path: 'patient',
                component: PatientDashboardComponent,
                canActivate: [authGuard],
                data: { roles: ['PATIENT'] }
            }
        ]
    },
    // Legacy routes for backward compatibility
    { path: 'admin', redirectTo: 'dashboard/admin', pathMatch: 'full' },
    { path: 'doctor', redirectTo: 'dashboard/doctor', pathMatch: 'full' },
    { path: 'patient', redirectTo: 'dashboard/patient', pathMatch: 'full' },
    { path: '**', redirectTo: '' }
];
