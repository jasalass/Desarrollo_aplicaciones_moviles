// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'scan',
    loadComponent: () => import('./scan/scan.page').then(m => m.ScanPage),
    canActivate: [AuthGuard], 
  },
  { path: 'login', loadComponent: () => import('./login/login.page').then(m => m.LoginPage) },
  { path: 'registro', loadComponent: () => import('./registro/registro.page').then(m => m.RegistroPage) },
  { path: 'recuperar-password', loadComponent: () => import('./recuperar-password/recuperar-password.page').then(m => m.RecuperarPasswordPage) },
];
