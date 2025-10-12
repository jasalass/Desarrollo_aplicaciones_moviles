import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// ReactiveFormsModule nos permite usar formularios reactivos en Angular
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// Ionic Standalone Components
import { IonContent, IonButton, IonInput, IonText, IonToast, IonLoading } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../services/supabase';
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonButton, IonInput, IonText, ReactiveFormsModule, RouterModule, IonToast, IonLoading] // Módulos que usaremos en el template
})
export class LoginPage {
  // referencia al formulario reactivo
  loginForm: FormGroup;
  isToastOpen = false;
  toastMessage: string = "";
  toastDuration = 2000;          // <- controla duración
  nextRouteAfterToast: string | null = null; // <- a dónde navegar tras el toast

  // función para mostrar un toast con mensaje personalizado
  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }

  constructor(private fb: FormBuilder, private router: Router, private sb: SupabaseService) {
    // Construcción del formulario con validaciones integradas de Angular
    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,   // El campo no puede quedar vacío
          Validators.email       // Valida formato usuario@dominio
        ]
      ],
      password: [
        '',
        [
          Validators.required,   // La contraseña no puede estar vacía
          Validators.minLength(6), // Mínimo 6 caracteres
          Validators.maxLength(12)  // Máximo 12 caracteres
        ]
      ]
    });
  }

  // Getters para acceder fácilmente a los controles desde el template
  get emailCtrl() { return this.loginForm.get('email'); }
  get passwordCtrl() { return this.loginForm.get('password'); }

  ngOnInit() {
  
    
  }

  async onSubmit() {
    // Si el formulario es inválido, marcamos todos los campos como "tocados"
    // Esto hace que se muestren los mensajes de error
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Extraemos email y password del formulario
    const { email, password } = this.loginForm.value;

      const { data, error } = await this.sb.signIn(email, password);

      if (error) {
        console.log(error)
        this.showToast(error.message)
      }

     // Éxito: Supabase guardó la sesión/token automáticamente (persistSession: true)
      this.showToast(`Bienvenido: ${data.user?.email ?? email}`);
      this.nextRouteAfterToast = '/home'; // navega cuando el toast se cierre
     
  }
}

