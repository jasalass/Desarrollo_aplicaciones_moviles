import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoadingController, IonContent, IonButton, IonInput, IonText, IonToast } from '@ionic/angular/standalone';
import { SupabaseService } from '../services/supabaseService/supabase';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonToast, IonContent, CommonModule, IonButton, IonInput, IonText, ReactiveFormsModule, RouterModule]
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
      email: ['', [Validators.required, Validators.email]] ,
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]],
    });
  }

  // 👇 TAMBIÉN AQUÍ
  get emailCtrl() { return this.registerForm.get('email'); }
  get passwordCtrl() { return this.registerForm.get('password'); }

  private showErrorToast(msg: string, duration = 2200) {
    this.toastMessage = msg;
    this.toastDuration = duration;
    this.isToastOpen = true;
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.registerForm.getRawValue() as { email: string; password: string; };

    try {
      const { error } = await this.sb.signUp(email, password);
      if (error) {
        this.showErrorToast(error.message || 'Error en registro');
        return;
      }

      const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...', spinner: 'lines', duration: 1400 });
      await loading.present();
      await loading.onDidDismiss();

      this.router.navigateByUrl('/login', { replaceUrl: true, state: { email } });
    } catch (e: any) {
      this.showErrorToast(e?.message ?? 'No se pudo registrar');
    }
  }
}
