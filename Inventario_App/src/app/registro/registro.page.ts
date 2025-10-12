import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonButton, IonInput, IonText, IonToast } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../services/supabase'; // <-- fija el path

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonToast, IonContent, CommonModule, IonButton, IonInput, IonText, ReactiveFormsModule, RouterModule]
})
export class RegistroPage {
  registerForm: FormGroup;
  toastMessage = '';
  isToastOpen = false;
  toastDuration = 2000;          // <- controla duración
  nextRouteAfterToast: string | null = null; // <- a dónde navegar tras el toast

  constructor(private fb: FormBuilder, private router: Router, private sb: SupabaseService) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]],
    });
  }

  get emailCtrl() { return this.registerForm.get('email'); }
  get passwordCtrl() { return this.registerForm.get('password'); }

  showToast(msg: string, duration = 2000) {
    this.toastMessage = msg;
    this.toastDuration = duration;
    this.isToastOpen = true;
  }

  // se llama desde el template en (didDismiss)
  onToastDismiss() {
    if (this.nextRouteAfterToast) {
      this.router.navigate([this.nextRouteAfterToast]);
      this.nextRouteAfterToast = null;
    }
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.registerForm.getRawValue() as { email: string; password: string; };

    try {
      const { data, error } = await this.sb.signUp(email, password);

      if (error) {
        this.showToast("Error en registro, intenta mas tarde", 2500); 
        return;
      }

      this.showToast(`Registro correcto, redirigiendo a login`, 2000);
      this.nextRouteAfterToast = '/login'; // navega cuando el toast se cierre

    } catch (e: any) {
      this.showToast(e?.message ?? 'No se pudo registrar', 2500);
    }
  }
}
