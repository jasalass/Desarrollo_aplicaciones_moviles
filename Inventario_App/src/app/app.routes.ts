import { Routes } from '@angular/router';
import {authGuard} from './guards/auth/auth-guard'

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'recuperar-password',
    loadComponent: () => import('./recuperar-password/recuperar-password.page').then( m => m.RecuperarPasswordPage)
  },
];
