// src/app/registro/registro.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  LoadingController,
  IonContent,
  IonButton,
  IonInput,
  IonText,
  IonToast
} from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabaseService/supabase';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [
    IonToast,
    IonContent,
    CommonModule,
    IonButton,
    IonInput,
    IonText,
    ReactiveFormsModule,
    RouterModule
  ]
})
export class RegistroPage {
  registerForm: FormGroup;
  isToastOpen = false;
  toastMessage = '';
  toastDuration = 2200;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sb: SupabaseService,
    private loadingCtrl: LoadingController
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.minLength(2)]],
      last_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]],
    });
  }

  get firstNameCtrl() { return this.registerForm.get('first_name'); }
  get lastNameCtrl() { return this.registerForm.get('last_name'); }
  get emailCtrl() { return this.registerForm.get('email'); }
  get passwordCtrl() { return this.registerForm.get('password'); }

  private openToast(msg: string, duration = 2200) {
    this.toastMessage = msg;
    this.toastDuration = duration;
    this.isToastOpen = true;
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { first_name, last_name, email, password } =
      this.registerForm.getRawValue() as {
        first_name: string;
        last_name: string;
        email: string;
        password: string;
      };

    try {
      const loading = await this.loadingCtrl.create({
        message: 'Creando cuenta...',
        spinner: 'lines'
      });
      await loading.present();

      const { error } = await this.sb.signUp(email, password, first_name, last_name);

      await loading.dismiss();

      if (error) {
        this.openToast(error.message || 'Error en registro');
        return;
      }

      this.openToast('Cuenta creada. Revisa tu correo si se requiere confirmación.', 2600);

      this.router.navigateByUrl('/login', {
        replaceUrl: true,
        state: { email }
      });
    } catch (e: any) {
      try { await this.loadingCtrl.dismiss(); } catch {}
      this.openToast(e?.message ?? 'No se pudo registrar');
    }
  }
}
