import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonButton, IonInput, IonText, IonToast } from '@ionic/angular/standalone';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, IonButton, IonInput, IonText, ReactiveFormsModule, RouterModule, IonToast]
})
export class LoginPage {
  loginForm: FormGroup;
  isToastOpen = false;
  toastMessage = '';
  toastDuration = 2200;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private sb: SupabaseService,
    private loadingCtrl: LoadingController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(12)]],
    });
  }

  get emailCtrl() { return this.loginForm.get('email'); }
  get passwordCtrl() { return this.loginForm.get('password'); }

  private showErrorToast(msg: string, duration = 2200) {
    this.toastMessage = msg;
    this.toastDuration = duration;
    this.isToastOpen = true;
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue() as { email: string; password: string; };

    try {
      const { data, error } = await this.sb.signIn(email, password);

      if (error) {
        this.showErrorToast(error.message || 'Error al iniciar sesión');
        return;
      }

      // éxito → loading + navegación
      localStorage.setItem('sesion', 'true');
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';

      const loading = await this.loadingCtrl.create({
        message: 'Iniciando sesión...',
        spinner: 'lines',
        duration: 1200
      });
      await loading.present();

      // Navega cuando aparezca el loading (no dependemos del toast)
      await loading.onDidDismiss();
      this.router.navigateByUrl(returnUrl, { replaceUrl: true, state: { email: data.user?.email ?? email } });

    } catch (e: any) {
      this.showErrorToast(e?.message ?? 'No se pudo iniciar sesión');
    }
  }
}
